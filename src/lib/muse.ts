import type { MuseProviderId, MuseSettings, UserProfile } from "../types";
import type { VisionBoard, Goal, Affirmation, JournalEntry } from "../types";
import type { HumanDesignProfile } from "../types";

export const MUSE_PROVIDERS: Record<
  MuseProviderId,
  {
    label: string;
    defaultBase: string;
    defaultModel: string;
    hint: string;
    /** Local CLI via muse-bridge — no API key */
    localCli?: boolean;
    defaultProxy?: string;
  }
> = {
  codex: {
    label: "Codex (ChatGPT plan)",
    defaultBase: "",
    defaultModel: "codex",
    hint: "Uses Codex CLI on your Mac — same login as ChatGPT paid / codex login. Run: npm run muse-bridge",
    localCli: true,
    defaultProxy: "http://127.0.0.1:5199/v1/muse",
  },
  "claude-cli": {
    label: "Claude Code (local)",
    defaultBase: "",
    defaultModel: "claude",
    hint: "Uses `claude` CLI on your Mac. Run: npm run muse-bridge",
    localCli: true,
    defaultProxy: "http://127.0.0.1:5199/v1/muse",
  },
  "grok-cli": {
    label: "Grok CLI (local)",
    defaultBase: "",
    defaultModel: "grok",
    hint: "Uses Grok CLI OAuth on your Mac. Run: npm run muse-bridge",
    localCli: true,
    defaultProxy: "http://127.0.0.1:5199/v1/muse",
  },
  openai: {
    label: "ChatGPT API key",
    defaultBase: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    hint: "Paste an API key from platform.openai.com (separate from ChatGPT Plus)",
  },
  openrouter: {
    label: "OpenRouter",
    defaultBase: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    hint: "One key, many models — openrouter.ai",
  },
  grok: {
    label: "Grok API key",
    defaultBase: "https://api.x.ai/v1",
    defaultModel: "grok-3-mini",
    hint: "API key from console.x.ai",
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    defaultBase: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    hint: "Any host that speaks the Chat Completions API",
  },
};

export const DEFAULT_MUSE: MuseSettings = {
  apiKey: "",
  provider: "codex",
  model: "codex",
  baseUrl: "",
  proxyUrl: "http://127.0.0.1:5199/v1/muse",
};

export function isLocalCliProvider(id: MuseProviderId): boolean {
  return Boolean(MUSE_PROVIDERS[id]?.localCli);
}

export function resolveBaseUrl(s: MuseSettings): string {
  if (s.baseUrl.trim()) return s.baseUrl.trim().replace(/\/$/, "");
  return MUSE_PROVIDERS[s.provider].defaultBase;
}

export function resolveModel(s: MuseSettings): string {
  return s.model.trim() || MUSE_PROVIDERS[s.provider].defaultModel;
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
  return [
    `You are Muse — a warm, grounded AI companion inside the app "vision".`,
    `You help with dream boards, manifestation, affirmations, journaling, astrology vibes, and Human Design — gently, never preachy.`,
    `Tone: soft, clear, encouraging, a little magical but practical. Short paragraphs. No corporate speak. No "as an AI language model".`,
    `You're talking to ${ctx.name || "a dreamer"}.`,
    ``,
    `## Their world in vision (use this context)`,
    `Board "${ctx.board.name}" themes/labels: ${boardLabels.join("; ") || "(empty board)"}`,
    `Open goals: ${openGoals.map((g) => g.title).join("; ") || "(none)"}`,
    `Recently manifested: ${doneGoals.map((g) => g.title).join("; ") || "(none)"}`,
    `Favorite affirmations: ${favAff.map((a) => a.text).join(" | ") || "(defaults)"}`,
    hd
      ? `Human Design: ${hd.type}, profile ${hd.profile}, authority: ${hd.authority}, strategy: ${hd.strategy}`
      : `Human Design: not set yet`,
    `Recent journal snippets: ${
      recentJournal
        .map((j) => `[${j.date}] ${j.prompt} → ${j.body.slice(0, 120)}`)
        .join(" || ") || "(none)"
    }`,
    ``,
    `When they ask for affirmations, offer 3–5 they can copy.`,
    `When they ask about goals or the board, be specific to their list.`,
    `Never claim medical, legal, or financial authority.`,
  ].join("\n");
}

export interface MuseChatRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  settings: MuseSettings;
}

function parseMuseResponse(data: {
  content?: string;
  error?: string;
  choices?: Array<{ message?: { content?: string } }>;
}): string {
  if (data.error) throw new Error(data.error);
  const text =
    data.content || data.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new Error("Muse returned an empty reply");
  return text.trim();
}

export async function callMuse(req: MuseChatRequest): Promise<string> {
  const { settings, messages } = req;
  const local = isLocalCliProvider(settings.provider);

  if (!local && !settings.apiKey.trim()) {
    throw new Error(
      "Add your API key in Muse settings — or pick Codex / Claude / Grok CLI (local).",
    );
  }

  // Local CLIs always go through muse-bridge
  const proxy = local
    ? settings.proxyUrl.trim() ||
      MUSE_PROVIDERS[settings.provider].defaultProxy ||
      "http://127.0.0.1:5199/v1/muse"
    : settings.proxyUrl.trim() ||
      (typeof location !== "undefined"
        ? `${location.origin}/api/muse`
        : "/api/muse");

  const body = local
    ? {
        provider: settings.provider,
        messages,
      }
    : {
        model: resolveModel(settings),
        messages,
        temperature: 0.85,
        baseUrl: resolveBaseUrl(settings),
      };

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (!local && settings.apiKey.trim()) {
    headers.authorization = `Bearer ${settings.apiKey.trim()}`;
  }

  // 1) Proxy / muse-bridge
  try {
    const res = await fetch(proxy, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const errText = await res.text();
    let data: {
      content?: string;
      error?: string;
      choices?: Array<{ message?: { content?: string } }>;
    } = {};
    try {
      data = errText ? JSON.parse(errText) : {};
    } catch {
      if (!res.ok) {
        throw new Error(
          local
            ? `Muse bridge error (${res.status}). Is it running? npm run muse-bridge`
            : `Muse error (${res.status}): ${errText.slice(0, 200)}`,
        );
      }
    }

    if (!res.ok) {
      throw new Error(
        data.error ||
          (local
            ? `Bridge HTTP ${res.status}. Run: npm run muse-bridge`
            : `Muse error (${res.status})`),
      );
    }
    return parseMuseResponse(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isFetchFail =
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("Load failed") ||
      msg.includes("fetch");

    if (local) {
      throw new Error(
        isFetchFail
          ? "Can't reach Muse bridge. On your Mac run: cd vision && npm run muse-bridge — then set Proxy URL to http://127.0.0.1:5199/v1/muse (or your Mac's LAN IP on phone)."
          : msg,
      );
    }

    if (!isFetchFail) throw e;
    // fall through to direct cloud call
  }

  // 2) Direct OpenAI-compatible call (cloud only; needs CORS)
  const base = resolveBaseUrl(settings);
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: resolveModel(settings),
      messages,
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Provider error (${res.status})`;
    try {
      const j = JSON.parse(errText) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      if (errText) msg = errText.slice(0, 200);
    }
    throw new Error(
      msg.includes("CORS") || res.type === "opaque"
        ? "This provider blocks browser calls. Use Codex (local bridge) or deploy on Vercel."
        : msg,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseMuseResponse(data);
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
