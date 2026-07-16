import type { Affirmation, Goal, HumanDesignProfile } from "../types";
import { todayKey } from "./prompts";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable day seed so “random” picks stay put until tomorrow. */
export function daySeed(extra = ""): number {
  return hash(`${todayKey()}:${extra}`);
}

/**
 * One soft HD practice line for today — strategy + authority, day-varied.
 */
export function hdTodayOneLiner(hd: HumanDesignProfile | null | undefined): {
  line: string;
  meta: string;
} | null {
  if (!hd?.type) return null;
  const type = hd.type;
  const strategy = hd.strategy || "";
  const authority = hd.authority || "";
  const seed = daySeed(`hd:${type}:${strategy}`);

  const byType: Record<string, string[]> = {
    Generator: [
      "Wait for the yes in your body before you push — then pour energy into that only.",
      "Today’s power is response, not chase. Notice what lights you up and answer it.",
      "If it’s a ‘meh,’ let it pass. Save your life force for a full-body yes.",
    ],
    "Manifesting Generator": [
      "Respond, then move fast — but skip what doesn’t spark. Multi-passion is allowed.",
      "Pivot without guilt. Efficiency is your gift when the yes is real.",
      "Don’t force a linear path. Sample, respond, refine.",
    ],
    Manifestor: [
      "Inform before you act — then initiate. You don’t need permission, just clarity.",
      "Protect a pocket of alone time so your urge can land cleanly.",
      "Start one thing only. Inform the people it touches, then go.",
    ],
    Projector: [
      "Wait for the invitation (or recognition). Rest is strategy, not failure.",
      "Share wisdom where it’s asked for. Today: less proving, more seeing.",
      "Guide energy; don’t match hustle. Your clarity is the gift.",
    ],
    Reflector: [
      "Sample the room slowly. You mirror the environment — choose soft spaces.",
      "No big decisions in a rush. Notice how people and places feel on your body.",
      "Your clarity comes in waves. Protect open space to feel the truth.",
    ],
  };

  // Match even if stored as "MG" / lowercase variants
  const typeKey =
    Object.keys(byType).find(
      (k) =>
        k.toLowerCase() === type.toLowerCase() ||
        (type.toLowerCase().includes("manifesting") &&
          k === "Manifesting Generator") ||
        (type.toLowerCase() === "mg" && k === "Manifesting Generator"),
    ) || type;

  const pool =
    byType[typeKey] ||
    [
      `Lean on your strategy: ${strategy || "trust your design"}.`,
      `Let ${authority || "your authority"} lead the next small choice.`,
      "Move with your design, not against the clock.",
    ];

  const line = pool[seed % pool.length]!;
  const meta = [type, strategy && `strategy · ${strategy}`, authority && `authority · ${authority}`]
    .filter(Boolean)
    .join(" · ");

  return { line, meta };
}

/** Favorite affirmation for the day (stable); falls back to any affirmation. */
export function affirmationForDay(
  list: Affirmation[],
  salt = 0,
): Affirmation | null {
  if (!list.length) return null;
  const favs = list.filter((a) => a.favorite);
  const pool = favs.length ? favs : list;
  const i = (daySeed("aff") + salt) % pool.length;
  return pool[i] ?? null;
}

/** “Top” open goal: oldest open first (commitment), else newest. */
export function topOpenGoal(goals: Goal[]): Goal | null {
  const open = goals.filter((g) => !g.done);
  if (!open.length) return null;
  return [...open].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )[0]!;
}

export const EVENING_MARKER = "—— Evening ——";

export function parseEveningLines(body: string): string[] {
  if (!body.includes(EVENING_MARKER)) return ["", "", ""];
  const part = body.split(EVENING_MARKER)[1] || "";
  const lines = part
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  return [lines[0] || "", lines[1] || "", lines[2] || ""];
}

export function mergeEveningBody(existing: string, lines: string[]): string {
  const cleaned = lines.map((l) => l.trim()).filter(Boolean);
  if (!cleaned.length) {
    // strip evening block if emptying
    if (!existing.includes(EVENING_MARKER)) return existing;
    return existing.split(EVENING_MARKER)[0]!.trim();
  }
  const evening = `${EVENING_MARKER}\n${cleaned
    .map((l, i) => `${i + 1}. ${l}`)
    .join("\n")}`;
  if (!existing.trim()) return evening;
  if (existing.includes(EVENING_MARKER)) {
    return `${existing.split(EVENING_MARKER)[0]!.trim()}\n\n${evening}`;
  }
  return `${existing.trim()}\n\n${evening}`;
}

export const MUSE_10_MIN_PROMPT =
  "Help me start the next 10 minutes. Give me one tiny first step based on my top open goal, Human Design strategy if I have one, and today's energy. Keep it under 5 short sentences. Warm, practical, no fluff.";

export function formatTodayDate(d = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Evening block more prominent after 5pm local. */
export function isEveningHours(d = new Date()): boolean {
  return d.getHours() >= 17;
}
