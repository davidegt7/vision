/**
 * Resolve pasted links (esp. Pinterest) to a displayable image.
 * Prefer downloading via muse-bridge so the board stores a data URL
 * (works offline + avoids hotlink / referrer blocks).
 */

import { resolveBridgeUrl } from "./muse";

const PIN_PAGE =
  /pinterest\.[a-z.]+\/pin\//i;
const PINIMG = /pinimg\.com/i;

/** Upgrade pinimg size path to a larger variant when possible. */
export function upgradePinimgUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!PINIMG.test(u.hostname)) return url;
    // /236x/ /474x/ /564x/ /736x/ → originals when path looks like sized
    u.pathname = u.pathname.replace(
      /\/(\d+x|originals)\//,
      "/originals/",
    );
    return u.toString();
  } catch {
    return url;
  }
}

export function isPinterestPinPage(url: string): boolean {
  try {
    return PIN_PAGE.test(url);
  } catch {
    return false;
  }
}

export function looksLikeDirectImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(u.pathname)) return true;
    if (PINIMG.test(u.hostname)) return true;
    if (/i\.pinimg\.com|s\.pinimg\.com|media-cache/i.test(u.hostname))
      return true;
    return false;
  } catch {
    return false;
  }
}

function bridgeUnfurlBase(): string {
  try {
    const muse = resolveBridgeUrl("");
    const u = new URL(muse);
    u.pathname = "/v1/unfurl";
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return "http://127.0.0.1:5199/v1/unfurl";
  }
}

/**
 * Resolve any user-pasted URL to a board-ready src (prefer data URL).
 */
export async function resolveBoardImageUrl(
  raw: string,
): Promise<{ src: string; label: string }> {
  const input = raw.trim();
  if (!input) throw new Error("Paste a link first");

  // 1) Try muse-bridge unfurl (handles pin pages + downloads image)
  try {
    const res = await fetch(bridgeUnfurlBase(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: input }),
    });
    const data = (await res.json()) as {
      dataUrl?: string;
      imageUrl?: string;
      title?: string;
      error?: string;
    };
    if (res.ok && data.dataUrl) {
      return {
        src: data.dataUrl,
        label: data.title || "From Pinterest",
      };
    }
    if (res.ok && data.imageUrl) {
      return {
        src: upgradePinimgUrl(data.imageUrl),
        label: data.title || "From link",
      };
    }
    // fall through with server message if useful
    if (!res.ok && data.error && isPinterestPinPage(input)) {
      throw new Error(data.error);
    }
  } catch (e) {
    // Bridge down — continue with client-side heuristics
    if (e instanceof Error && isPinterestPinPage(input) && e.message.includes("Pinterest")) {
      throw e;
    }
  }

  // 2) Direct image / pinimg URL
  if (looksLikeDirectImageUrl(input)) {
    const src = upgradePinimgUrl(input);
    // Try fetch as blob in browser (may fail CORS) → data URL
    try {
      const r = await fetch(src, { mode: "cors", referrerPolicy: "no-referrer" });
      if (r.ok) {
        const blob = await r.blob();
        if (blob.type.startsWith("image/") || blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          return { src: dataUrl, label: "From link" };
        }
      }
    } catch {
      /* use remote URL with no-referrer on <img> */
    }
    return { src, label: "From link" };
  }

  // 3) Pin page without bridge
  if (isPinterestPinPage(input)) {
    throw new Error(
      "Pinterest pin links need the Muse bridge to load (npm run muse-bridge), or right‑click the pin image → Copy image address, then paste that pinimg.com link.",
    );
  }

  // 4) Generic URL — try as image anyway
  return { src: input, label: "From link" };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
