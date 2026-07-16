#!/usr/bin/env node
/**
 * Muse local bridge — same idea as Caspian Studio's CLI brains.
 *
 * Primary (for now): Codex CLI via `codex login` (ChatGPT paid plan).
 * Still accepts claude / grok-cli if you ever flip the app back to multi-provider.
 *
 * Usage:
 *   npm run muse-bridge
 *   # → http://127.0.0.1:5199
 *
 * In vision → Muse:
 *   Bridge URL: http://127.0.0.1:5199/v1/muse
 *   Phone (same Wi‑Fi): http://YOUR_LAN_IP:5199/v1/muse
 *
 * No API key required — uses the CLI login you already have.
 * If Codex errors about model / "newer version", run: codex update
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

const PORT = Number(process.env.MUSE_BRIDGE_PORT || 5199);
const HOST = process.env.MUSE_BRIDGE_HOST || "0.0.0.0";
const TIMEOUT_MS = Number(process.env.MUSE_BRIDGE_TIMEOUT_MS || 180_000);

const EXTRA_PATH = [
  path.join(homedir(), ".local", "bin"),
  path.join(homedir(), ".grok", "bin"),
  "/usr/local/bin",
  "/opt/homebrew/bin",
].join(path.delimiter);

function spawnEnv() {
  return {
    ...process.env,
    PATH: `${EXTRA_PATH}${path.delimiter}${process.env.PATH || ""}`,
  };
}

async function commandExists(bin) {
  if (bin.includes(path.sep)) {
    try {
      await access(bin, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  return new Promise((resolve) => {
    const child = spawn("bash", ["-lc", `command -v ${JSON.stringify(bin)}`], {
      env: spawnEnv(),
      stdio: ["ignore", "pipe", "ignore"],
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", (code) => resolve(code === 0 && out.trim().length > 0));
    child.on("error", () => resolve(false));
  });
}

function runCli(bin, args, stdin, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      env: spawnEnv(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${bin} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `${bin} exited ${code}: ${(err || out).slice(-1200) || "no output"}`,
          ),
        );
      } else {
        resolve(out.trim() || err.trim());
      }
    });
    if (stdin != null) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}

function flattenMessages(messages) {
  const system = [];
  const turns = [];
  for (const m of messages || []) {
    const role = m.role || "user";
    const content = String(m.content || "").trim();
    if (!content) continue;
    if (role === "system") system.push(content);
    else turns.push(`${role === "assistant" ? "Muse" : "User"}: ${content}`);
  }
  const sys = system.join("\n\n");
  const convo = turns.join("\n\n");
  return { sys, convo, full: sys ? `${sys}\n\n---\n\n${convo}` : convo };
}

function friendlyCodexError(raw) {
  const msg = String(raw || "");
  // Usage / rate limit (ChatGPT plan)
  if (/usage limit|rate limit|quota/i.test(msg)) {
    const when =
      msg.match(/try again at\s+([0-9]{1,2}:[0-9]{2}\s*[AP]M)/i)?.[1]?.trim() ||
      msg.match(/try again at\s+([^.!\n]+)/i)?.[1]?.trim();
    return when
      ? `Codex usage limit hit — try Muse again after ${when}. Or check https://chatgpt.com/codex/settings/usage`
      : `Codex usage limit hit. Check https://chatgpt.com/codex/settings/usage or try again later.`;
  }
  if (/not logged in|login|auth/i.test(msg) && /codex/i.test(msg)) {
    return "Codex isn’t logged in. On your Mac run: codex login";
  }
  if (
    msg.includes("newer version") ||
    msg.includes("requires a newer") ||
    msg.includes("model metadata")
  ) {
    return `${msg}\n\nFix: run \`codex update\` (or set MUSE_CODEX_MODEL).`;
  }
  // Trim noisy CLI header if present
  const errLine = msg
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /^ERROR:/i.test(l));
  if (errLine) return errLine.replace(/^ERROR:\s*/i, "");
  return msg.slice(-800);
}

async function callCodex(prompt) {
  // Prefer sandbox read-only — Muse is chat, not a code agent with full tools.
  // --ephemeral avoids cluttering session history when possible.
  // Optional: MUSE_CODEX_MODEL overrides ~/.codex/config.toml model.
  const model = (process.env.MUSE_CODEX_MODEL || "").trim();
  const base = ["exec", "--sandbox", "read-only", "--ephemeral"];
  if (model) base.push("-m", model);
  base.push("-");
  try {
    return await runCli("codex", base, prompt, TIMEOUT_MS);
  } catch (e) {
    // Older CLIs may not support --ephemeral
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("ephemeral") || msg.includes("unexpected")) {
      try {
        const fallback = ["exec", "--sandbox", "read-only"];
        if (model) fallback.push("-m", model);
        fallback.push("-");
        return await runCli("codex", fallback, prompt, TIMEOUT_MS);
      } catch (e2) {
        throw new Error(
          friendlyCodexError(e2 instanceof Error ? e2.message : String(e2)),
        );
      }
    }
    throw new Error(friendlyCodexError(msg));
  }
}

async function callClaude(systemPrompt, userPrompt) {
  const args = [
    "-p",
    "--output-format",
    "json",
    "--append-system-prompt",
    systemPrompt || "You are Muse, a warm companion in the vision app.",
  ];
  const raw = await runCli("claude", args, userPrompt, TIMEOUT_MS);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.is_error) throw new Error(parsed.result || "claude error");
    return String(parsed.result ?? raw);
  } catch {
    return raw;
  }
}

async function callGrok(systemPrompt, userPrompt) {
  const grokBin = path.join(homedir(), ".grok", "bin", "grok");
  const bin = (await commandExists(grokBin))
    ? grokBin
    : (await commandExists("grok"))
      ? "grok"
      : grokBin;
  // Grok CLI patterns vary; try a simple prompt mode
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  try {
    return await runCli(bin, ["--print", "-"], prompt, TIMEOUT_MS);
  } catch {
    return runCli(bin, ["-p", "-"], prompt, TIMEOUT_MS);
  }
}

/** OpenAI Chat Completions — uses key from request body or OPENAI_API_KEY env. */
async function callOpenAI(messages, { apiKey, model, baseUrl }) {
  const key =
    (apiKey || "").trim() ||
    (process.env.OPENAI_API_KEY || process.env.MUSE_API_KEY || "").trim();
  if (!key) {
    throw new Error(
      "Missing OpenAI API key. Add it in vision Settings, or set OPENAI_API_KEY.",
    );
  }
  const base = (baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: (messages || []).map((m) => ({
        role: m.role || "user",
        content: String(m.content || ""),
      })),
      temperature: 0.85,
    }),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.ok
        ? "OpenAI returned invalid JSON"
        : `OpenAI HTTP ${res.status}: ${text.slice(0, 200)}`,
    );
  }
  if (!res.ok) {
    const err =
      data?.error?.message || data?.error || text.slice(0, 300) || res.status;
    throw new Error(String(err));
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error("OpenAI returned an empty reply");
  return String(content).trim();
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

const MAX_IMAGE_BYTES = 4_500_000;

function upgradePinimg(u) {
  try {
    const url = new URL(u);
    if (!/pinimg\.com/i.test(url.hostname)) return u;
    url.pathname = url.pathname.replace(/\/(\d+x|originals)\//, "/originals/");
    return url.toString();
  } catch {
    return u;
  }
}

function extractOgImage(html) {
  const patterns = [
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
    /"image_url"\s*:\s*"([^"]+pinimg[^"]+)"/i,
    /"url"\s*:\s*"(https:\\\/\\\/i\.pinimg\.com[^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      return m[1]
        .replace(/\\u002F/g, "/")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&");
    }
  }
  return null;
}

function extractTitle(html) {
  const m =
    html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim().slice(0, 80) || "";
}

async function fetchBuffer(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      referer: "https://www.pinterest.com/",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Image fetch HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) {
    throw new Error("Image too large (max ~4.5MB for board storage)");
  }
  const ct = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!ct.startsWith("image/") && !/\.(jpe?g|png|gif|webp)/i.test(imageUrl)) {
    // might still be image without header
  }
  const mime = ct.startsWith("image/") ? ct : "image/jpeg";
  return { dataUrl: `data:${mime};base64,${buf.toString("base64")}`, bytes: buf.length };
}

async function unfurlImage(targetUrl) {
  let imageUrl = targetUrl;
  let title = "";

  const isPinPage = /pinterest\.[a-z.]+\/pin\//i.test(targetUrl);
  const isPinimg = /pinimg\.com/i.test(targetUrl);

  if (isPinPage) {
    const pageRes = await fetch(targetUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!pageRes.ok) {
      throw new Error(
        `Couldn’t open Pinterest pin (HTTP ${pageRes.status}). Try Copy image address instead.`,
      );
    }
    const html = await pageRes.text();
    title = extractTitle(html);
    const og = extractOgImage(html);
    if (!og) {
      throw new Error(
        "Couldn’t find image on that Pinterest pin. Right‑click the image → Copy image address, paste that pinimg.com link.",
      );
    }
    imageUrl = upgradePinimg(og);
  } else if (isPinimg) {
    imageUrl = upgradePinimg(targetUrl);
  } else if (!/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(targetUrl)) {
    // Generic page — try og:image
    try {
      const pageRes = await fetch(targetUrl, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; vision-board/1.0)",
          accept: "text/html",
        },
        redirect: "follow",
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const ct = pageRes.headers.get("content-type") || "";
        if (ct.includes("text/html")) {
          title = extractTitle(html);
          const og = extractOgImage(html);
          if (og) imageUrl = og;
        }
      }
    } catch {
      /* use original */
    }
  }

  const { dataUrl } = await fetchBuffer(imageUrl);
  return {
    dataUrl,
    imageUrl,
    title: title || undefined,
  };
}

async function statusPayload() {
  const [codex, claude, grok] = await Promise.all([
    commandExists("codex"),
    commandExists("claude"),
    commandExists(path.join(homedir(), ".grok", "bin", "grok")).then(
      (ok) => ok || commandExists("grok"),
    ),
  ]);
  return {
    ok: true,
    service: "vision-muse-bridge",
    port: PORT,
    providers: {
      codex: {
        id: "codex",
        label: "Codex (ChatGPT login)",
        ready: codex,
        detail: codex
          ? "Ready — uses `codex login` / paid ChatGPT plan"
          : "Install + `codex login`",
      },
      claude: {
        id: "claude",
        label: "Claude Code CLI",
        ready: claude,
        detail: claude ? "Ready" : "Install claude CLI + login",
      },
      "grok-cli": {
        id: "grok-cli",
        label: "Grok CLI",
        ready: grok,
        detail: grok ? "Ready" : "Install grok CLI + login",
      },
    },
  };
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && (url.pathname === "/v1/health" || url.pathname === "/")) {
    json(res, 200, await statusPayload());
    return;
  }

  if (req.method === "GET" && url.pathname === "/v1/providers") {
    json(res, 200, await statusPayload());
    return;
  }

  /**
   * Resolve a page/image URL to a board-ready data URL.
   * Handles Pinterest pin pages (og:image) + pinimg hotlink issues.
   */
  if (req.method === "POST" && url.pathname === "/v1/unfurl") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let parsed;
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      json(res, 400, { error: "Invalid JSON" });
      return;
    }
    const target = String(parsed.url || "").trim();
    if (!target || !/^https?:\/\//i.test(target)) {
      json(res, 400, { error: "url must be http(s)" });
      return;
    }
    try {
      const result = await unfurlImage(target);
      json(res, 200, result);
    } catch (e) {
      json(res, 500, {
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/muse") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let parsed;
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      json(res, 400, { error: "Invalid JSON" });
      return;
    }

    const provider = String(parsed.provider || "codex").toLowerCase();
    const { sys, convo, full } = flattenMessages(parsed.messages);

    try {
      let content = "";
      if (provider === "codex" || provider === "chatgpt" || provider === "openai-cli") {
        content = await callCodex(full);
      } else if (
        provider === "openai" ||
        provider === "openrouter" ||
        provider === "api"
      ) {
        content = await callOpenAI(parsed.messages, {
          apiKey: parsed.apiKey,
          model: parsed.model,
          baseUrl: parsed.baseUrl,
        });
      } else if (provider === "claude" || provider === "claude-cli") {
        content = await callClaude(sys, convo || full);
      } else if (provider === "grok" || provider === "grok-cli") {
        content = await callGrok(sys, convo || full);
      } else {
        json(res, 400, {
          error: `Unknown provider "${provider}". Use codex | openai | claude | grok-cli`,
        });
        return;
      }

      // Strip common CLI noise if any
      content = content
        .replace(/^[\s\S]*?\nuser\n/i, "")
        .replace(/^--------\n[\s\S]*?\n--------\n/m, "")
        .trim();

      json(res, 200, {
        content,
        provider,
        // OpenAI-shaped convenience
        choices: [{ message: { role: "assistant", content } }],
      });
    } catch (e) {
      json(res, 500, {
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, async () => {
  const st = await statusPayload();
  console.log(`[muse-bridge] http://127.0.0.1:${PORT}`);
  console.log(`[muse-bridge] health → http://127.0.0.1:${PORT}/v1/health`);
  console.log(`[muse-bridge] muse   → POST http://127.0.0.1:${PORT}/v1/muse`);
  for (const p of Object.values(st.providers)) {
    console.log(`  ${p.ready ? "✓" : "·"} ${p.label}: ${p.detail}`);
  }
  console.log(
    `[muse-bridge] Phone on same Wi‑Fi: set Muse Proxy URL to http://<this-mac-ip>:${PORT}/v1/muse`,
  );
});
