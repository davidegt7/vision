#!/usr/bin/env node
/**
 * Muse local bridge — same idea as Caspian Studio's CLI brains.
 *
 * Runs on your Mac and lets the vision web app call:
 *   - Codex CLI  (ChatGPT / OpenAI login via `codex login`)
 *   - Claude Code CLI
 *   - Grok CLI
 *
 * Usage:
 *   node server/muse-bridge.mjs
 *   # → http://127.0.0.1:5199
 *
 * In vision Muse settings:
 *   Provider: Codex (local) / Claude (local) / Grok (local)
 *   Proxy URL: http://127.0.0.1:5199/v1/muse   (phone: http://YOUR_LAN_IP:5199/v1/muse)
 *
 * No API key required — uses the CLI login you already have.
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

async function callCodex(prompt) {
  // Prefer sandbox read-only — Muse is chat, not a code agent with full tools.
  // --ephemeral avoids cluttering session history when possible.
  const args = ["exec", "--sandbox", "read-only", "--ephemeral", "-"];
  try {
    return await runCli("codex", args, prompt, TIMEOUT_MS);
  } catch (e) {
    // Older CLIs may not support --ephemeral
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("ephemeral") || msg.includes("unexpected")) {
      return runCli(
        "codex",
        ["exec", "--sandbox", "read-only", "-"],
        prompt,
        TIMEOUT_MS,
      );
    }
    throw e;
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
      } else if (provider === "claude" || provider === "claude-cli") {
        content = await callClaude(sys, convo || full);
      } else if (provider === "grok" || provider === "grok-cli") {
        content = await callGrok(sys, convo || full);
      } else {
        json(res, 400, {
          error: `Unknown local provider "${provider}". Use codex | claude | grok-cli`,
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
