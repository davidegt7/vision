import type { MuseSettings, UserProfile } from "../types";
import type { VisionBoard, Goal, Affirmation, JournalEntry } from "../types";
import type { HumanDesignProfile } from "../types";
import { languageNameForPrompt } from "./i18n";

/** Default bridge on the Mac (same pattern as Caspian Studio CLI brains). */
export const DEFAULT_BRIDGE = "http://127.0.0.1:5199/v1/muse";
export const DEFAULT_BRIDGE_HEALTH = "http://127.0.0.1:5199/v1/health";
export const BRIDGE_PORT = 5199;

export const DEFAULT_MUSE: MuseSettings = {
  apiKey: "",
  provider: "codex",
  model: "codex",
  baseUrl: "",
  /** Empty = auto (localhost on laptop, Mac LAN IP on phone). */
  proxyUrl: "",
};

function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
}

/** Private LAN / mDNS hosts where the Mac may also run muse-bridge. */
export function isLanHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (isLoopbackHost(h)) return false;
  // RFC1918 + link-local + common home
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // Bonjour / local hostname (MacBook.local)
  if (h.endsWith(".local")) return true;
  return false;
}

/**
 * Pick the right default Muse bridge for this browser.
 * - Laptop on localhost → 127.0.0.1:5199
 * - Phone/tablet opening the Mac's Network URL (e.g. 192.168.x.x:5188)
 *   → same host, port 5199 (phone cannot use 127.0.0.1 — that is the phone itself)
 * - GitHub Pages / public hosts → still 127.0.0.1 (won't work on phone; use LAN URL)
 */
export function suggestedBridgeUrl(): string {
  if (typeof window === "undefined") return DEFAULT_BRIDGE;
  const host = window.location.hostname;
  if (!host || isLoopbackHost(host)) return DEFAULT_BRIDGE;
  if (isLanHost(host)) {
    return `http://${host}:${BRIDGE_PORT}/v1/muse`;
  }
  return DEFAULT_BRIDGE;
}

/** True if URL points at loopback (won't work from a phone). */
export function isLoopbackBridgeUrl(url: string): boolean {
  try {
    return isLoopbackHost(new URL(url || DEFAULT_BRIDGE).hostname);
  } catch {
    return true;
  }
}

/**
 * Resolve which bridge URL to use.
 * On a phone/LAN host, loopback (127.0.0.1) is never valid — always rewrite
 * to the Mac host that served the page (e.g. 192.168.1.10:5199).
 */
export function resolveBridgeUrl(saved?: string): string {
  const suggested = suggestedBridgeUrl();
  const raw = (saved || "").trim();
  if (!raw) return suggested;
  // Phone / LAN: never call 127.0.0.1 (that is the phone itself)
  if (!isLoopbackBridgeUrl(suggested) && isLoopbackBridgeUrl(raw)) {
    return suggested;
  }
  // On LAN page, if saved URL is a different loopback form or empty path quirks
  if (
    typeof window !== "undefined" &&
    isLanHost(window.location.hostname) &&
    isLoopbackBridgeUrl(raw)
  ) {
    return suggested;
  }
  return raw;
}

/** Persist-friendly: rewrite loopback → LAN when the page is on the Mac Network URL. */
export function normalizeMuseSettings(
  settings: Partial<MuseSettings> | undefined,
): MuseSettings {
  const provider =
    settings?.provider === "openai" ? ("openai" as const) : ("codex" as const);
  const base = {
    ...DEFAULT_MUSE,
    ...settings,
    provider,
    // Keep API key when using OpenAI; clear for Codex
    apiKey: provider === "openai" ? settings?.apiKey || "" : "",
  };
  return {
    ...base,
    proxyUrl:
      provider === "codex"
        ? resolveBridgeUrl(base.proxyUrl)
        : (base.proxyUrl || "").trim() || resolveBridgeUrl(""),
  };
}

/** Opened via public HTTPS (Pages etc.) — browser blocks local HTTP bridge. */
export function isHttpsPublicPage(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "https:" &&
    !isLanHost(window.location.hostname) &&
    !isLoopbackHost(window.location.hostname)
  );
}

export function bridgeHealthUrl(museUrl: string): string {
  try {
    const u = new URL(museUrl || DEFAULT_BRIDGE);
    u.pathname = "/v1/health";
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return DEFAULT_BRIDGE_HEALTH;
  }
}

export function buildMuseSystemPrompt(ctx: {
  name: string;
  profile: UserProfile;
  board: VisionBoard;
  goals: Goal[];
  affirmations: Affirmation[];
  journal: JournalEntry[];
  hd?: HumanDesignProfile | null;
}): string {
  const openGoals = ctx.goals.filter((g) => !g.done).slice(0, 12);
  const doneGoals = ctx.goals.filter((g) => g.done).slice(0, 6);
  const favAff = ctx.affirmations.filter((a) => a.favorite).slice(0, 8);
  const recentJournal = ctx.journal.slice(0, 3);
  const boardLabels = ctx.board.items
    .map((i) => i.label)
    .filter(Boolean)
    .slice(0, 20);

  const hd = ctx.hd;
  const replyLang = languageNameForPrompt(ctx.profile.language);
  const definedCenters = hd?.centers
    ? Object.entries(hd.centers)
        .filter(([, on]) => on)
        .map(([id]) => id)
        .join(", ")
    : "";
  const hdBlock = hd
    ? [
        `Human Design chart (use this — they already calculated it in-app):`,
        `- Type: ${hd.type}`,
        `- Strategy: ${hd.strategy}`,
        `- Authority: ${hd.authority}`,
        `- Profile: ${hd.profile}`,
        `- Definition: ${hd.definition || "—"}`,
        `- Signature: ${hd.signature || "—"}`,
        `- Not-self: ${hd.notSelf || "—"}`,
        `- Conscious sun: ${hd.consciousSun || "—"} / Design sun: ${hd.unconsciousSun || "—"}`,
        `- Defined channels: ${(hd.definedChannels || []).join(", ") || "none listed"}`,
        `- Defined centers: ${definedCenters || "none listed"}`,
        hd.approximate ? `- Note: chart is approximate (time/zone uncertainty)` : "",
        `When they ask about their chart or "HD for daily life", ground advice in THIS chart — do not invent a different type/profile.`,
      ]
        .filter(Boolean)
        .join("\n")
    : `Human Design: not set yet in the app. If they ask about HD, gently suggest calculating their chart under Stars → Human Design (city + birth time).`;

  return [
    `You are Muse — a warm, grounded companion inside the app "vision".`,
    `You help with dream boards, manifestation, affirmations, journaling, soft astrology vibes, and Human Design.`,
    `Tone: gentle, clear, encouraging, a little magical but practical. Short paragraphs. No corporate speak. Never say "as an AI".`,
    `Always reply in ${replyLang} unless the user clearly writes in another language and asks you to match it.`,
    `You're talking to ${ctx.name || "a dreamer"}.`,
    ``,
    `## Their world in vision (use this)`,
    `Board "${ctx.board.name}" labels: ${boardLabels.join("; ") || "(empty board)"}`,
    `Open goals: ${openGoals.map((g) => g.title).join("; ") || "(none)"}`,
    `Recently manifested: ${doneGoals.map((g) => g.title).join("; ") || "(none)"}`,
    `Favorite affirmations: ${favAff.map((a) => a.text).join(" | ") || "(defaults)"}`,
    hdBlock,
    `Recent journal: ${
      recentJournal
        .map((j) => `[${j.date}] ${j.prompt} → ${j.body.slice(0, 120)}`)
        .join(" || ") || "(none)"
    }`,
    ``,
    `When they ask for affirmations, offer 3–5 they can copy.`,
    `Be specific to their list when talking about goals or the board.`,
    `Never claim medical, legal, or financial authority.`,
  ].join("\n");
}

export interface MuseChatRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  settings: MuseSettings;
}

export type BridgeStatus = {
  ok: boolean;
  codexReady?: boolean;
  detail?: string;
  error?: string;
};

/** Ping the local muse-bridge. */
export async function checkMuseBridge(
  museUrl?: string,
): Promise<BridgeStatus> {
  const health = bridgeHealthUrl(resolveBridgeUrl(museUrl));
  try {
    const res = await fetch(health, { method: "GET" });
    if (!res.ok) {
      return { ok: false, error: `Bridge HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      providers?: { codex?: { ready?: boolean; detail?: string } };
    };
    const codexReady = Boolean(data.providers?.codex?.ready);
    return {
      ok: Boolean(data.ok) && codexReady,
      codexReady,
      detail: data.providers?.codex?.detail,
      error: codexReady
        ? undefined
        : data.providers?.codex?.detail || "Codex CLI not ready",
    };
  } catch {
    return {
      ok: false,
      error:
        "Can't reach Muse bridge. On your Mac run: npm run muse-bridge",
    };
  }
}

/**
 * Muse chat:
 * - codex → local muse-bridge → Codex CLI (ChatGPT plan)
 * - openai → bridge (or /api/muse) with user's API key
 */
export async function callMuse(req: MuseChatRequest): Promise<string> {
  const { settings, messages } = req;
  const provider = settings.provider || "codex";
  const proxy =
    provider === "openai" && settings.proxyUrl.trim()
      ? settings.proxyUrl.trim()
      : resolveBridgeUrl(settings.proxyUrl);

  // Prefer local bridge; for openai also try same-origin /api/muse if bridge fails
  const endpoints =
    provider === "openai"
      ? [proxy, "/api/muse"].filter(
          (u, i, a) => u && a.indexOf(u) === i,
        )
      : [proxy];

  let lastErr = "Muse request failed";
  for (const url of endpoints) {
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (provider === "openai" && settings.apiKey.trim()) {
        headers.authorization = `Bearer ${settings.apiKey.trim()}`;
      }
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: provider === "openai" ? "openai" : "codex",
          messages,
          model: settings.model || undefined,
          baseUrl: settings.baseUrl || undefined,
          apiKey:
            provider === "openai" ? settings.apiKey.trim() || undefined : undefined,
        }),
      });
      const text = await res.text();
      let data: {
        content?: string;
        error?: string;
        choices?: Array<{ message?: { content?: string } }>;
      } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        lastErr = res.ok
          ? "Muse returned invalid JSON"
          : `Error (${res.status}): ${text.slice(0, 200)}`;
        continue;
      }
      if (!res.ok) {
        lastErr =
          data.error ||
          (provider === "codex"
            ? `Bridge HTTP ${res.status}. Is Codex logged in? Try: codex login`
            : `API HTTP ${res.status}`);
        continue;
      }
      const content =
        data.content || data.choices?.[0]?.message?.content || "";
      if (!content.trim()) {
        lastErr = "Muse returned an empty reply";
        continue;
      }
      return content.trim();
    } catch {
      lastErr =
        provider === "codex"
          ? "Can't reach Muse bridge. On your Mac: cd vision && npm run muse-bridge"
          : "Can't reach Muse (bridge or /api/muse). Start muse-bridge or deploy the API proxy.";
    }
  }
  throw new Error(lastErr);
}

export const MUSE_QUICK: Array<{ label: string; prompt: string }> = [
  {
    label: "Soften my goals",
    prompt:
      "Look at my open goals and rewrite 3 of them as kinder, more magnetic intentions I can feel in my body — keep them short.",
  },
  {
    label: "New affirmations",
    prompt:
      "Write 5 fresh affirmations tailored to my board, goals, and Human Design if I have one. Warm, modern, not cringe.",
  },
  {
    label: "Journal with me",
    prompt:
      "Give me one gentle journaling prompt for tonight based on what I'm working on, then ask me one follow-up question.",
  },
  {
    label: "Read my board",
    prompt:
      "From the labels and themes on my vision board, what story am I telling about my future? Reflect like a wise friend.",
  },
  {
    label: "HD for daily life",
    prompt:
      "Using my Human Design (if set), give me 3 tiny practices for today that match my strategy and authority.",
  },
];
