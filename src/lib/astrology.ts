import type { ZodiacSign } from "../types";

export const SIGNS: { id: ZodiacSign; label: string; emoji: string; dates: string }[] = [
  { id: "aries", label: "Aries", emoji: "♈", dates: "Mar 21 – Apr 19" },
  { id: "taurus", label: "Taurus", emoji: "♉", dates: "Apr 20 – May 20" },
  { id: "gemini", label: "Gemini", emoji: "♊", dates: "May 21 – Jun 20" },
  { id: "cancer", label: "Cancer", emoji: "♋", dates: "Jun 21 – Jul 22" },
  { id: "leo", label: "Leo", emoji: "♌", dates: "Jul 23 – Aug 22" },
  { id: "virgo", label: "Virgo", emoji: "♍", dates: "Aug 23 – Sep 22" },
  { id: "libra", label: "Libra", emoji: "♎", dates: "Sep 23 – Oct 22" },
  { id: "scorpio", label: "Scorpio", emoji: "♏", dates: "Oct 23 – Nov 21" },
  { id: "sagittarius", label: "Sagittarius", emoji: "♐", dates: "Nov 22 – Dec 21" },
  { id: "capricorn", label: "Capricorn", emoji: "♑", dates: "Dec 22 – Jan 19" },
  { id: "aquarius", label: "Aquarius", emoji: "♒", dates: "Jan 20 – Feb 18" },
  { id: "pisces", label: "Pisces", emoji: "♓", dates: "Feb 19 – Mar 20" },
];

export function signFromBirthDate(iso: string): ZodiacSign | null {
  if (!iso || iso.length < 10) return null;
  const [, m, d] = iso.split("-").map(Number);
  if (!m || !d) return null;
  const md = m * 100 + d;
  if (md >= 321 && md <= 419) return "aries";
  if (md >= 420 && md <= 520) return "taurus";
  if (md >= 521 && md <= 620) return "gemini";
  if (md >= 621 && md <= 722) return "cancer";
  if (md >= 723 && md <= 822) return "leo";
  if (md >= 823 && md <= 922) return "virgo";
  if (md >= 923 && md <= 1022) return "libra";
  if (md >= 1023 && md <= 1121) return "scorpio";
  if (md >= 1122 && md <= 1221) return "sagittarius";
  if (md >= 1222 || md <= 119) return "capricorn";
  if (md >= 120 && md <= 218) return "aquarius";
  return "pisces";
}

const THEMES: Record<ZodiacSign, string[]> = {
  aries: ["spark", "courage", "begin", "move", "lead"],
  taurus: ["ground", "beauty", "comfort", "build", "savor"],
  gemini: ["curious", "connect", "learn", "play", "speak"],
  cancer: ["nurture", "home", "feel", "protect", "belong"],
  leo: ["shine", "create", "heart", "celebrate", "radiate"],
  virgo: ["refine", "serve", "order", "heal", "craft"],
  libra: ["balance", "harmony", "beauty", "partner", "choose"],
  scorpio: ["transform", "depth", "truth", "power", "release"],
  sagittarius: ["expand", "explore", "truth", "joy", "freedom"],
  capricorn: ["commit", "structure", "climb", "legacy", "master"],
  aquarius: ["innovate", "vision", "community", "future", "free"],
  pisces: ["dream", "flow", "imagine", "compassion", "dissolve"],
};

const OPENERS = [
  "Today softens for you when you",
  "The sky invites you to",
  "A quiet window opens to",
  "Your energy favors",
  "Notice where you can",
  "This is a good day to",
  "Something gentle wants you to",
];

const CLOSERS = [
  "Trust the small step.",
  "You don't have to rush.",
  "Keep your vision board close.",
  "Write it down — make it real.",
  "Your future self is watching kindly.",
  "Celebrate one tiny win tonight.",
  "Rest is part of the plan.",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailyHoroscope(sign: ZodiacSign, dateKey: string): {
  title: string;
  body: string;
  focus: string;
  lucky: string;
} {
  const h = hash(`${sign}-${dateKey}`);
  const themes = THEMES[sign];
  const t1 = themes[h % themes.length]!;
  const t2 = themes[(h >> 3) % themes.length]!;
  const opener = OPENERS[h % OPENERS.length]!;
  const closer = CLOSERS[(h >> 5) % CLOSERS.length]!;
  const meta = SIGNS.find((s) => s.id === sign)!;

  const body = `${opener} ${t1} without forcing the outcome. ${
    t1 !== t2 ? `Lean into ${t2} where it feels natural. ` : ""
  }${closer}`;

  const focuses = ["career", "love", "body", "money", "creativity", "home", "friendship"];
  const luckyColors = ["soft gold", "lavender", "sage", "rose", "sky blue", "cream", "midnight"];

  return {
    title: `${meta.emoji} ${meta.label} · daily`,
    body,
    focus: focuses[h % focuses.length]!,
    lucky: luckyColors[(h >> 8) % luckyColors.length]!,
  };
}
