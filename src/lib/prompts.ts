/** Gentle daily prompts — ADHD-friendly, short, no guilt. */

const PROMPTS = [
  "What makes you happy today?",
  "Name one thing you're proud of this week.",
  "What would 'enough' look like for you?",
  "Where do you feel most like yourself?",
  "What are you craving more of?",
  "Describe a tiny win from yesterday.",
  "Who makes you feel safe — and why?",
  "What would you do if you knew you couldn't fail?",
  "What does rest look like for you right now?",
  "What are you ready to release?",
  "Where do you want your energy to go this week?",
  "What does your dream morning feel like?",
  "What are you grateful for in your body today?",
  "If your future self texted you, what would they say?",
  "What boundary would make your life softer?",
  "What are you excited to learn?",
  "Describe a place that feels like peace.",
  "What does abundance mean to you — not just money?",
  "What would you tell your younger self tonight?",
  "What is one kind thing you can do for yourself today?",
  "What dream keeps whispering to you?",
  "How do you want to feel at the end of this month?",
  "What are you celebrating — even if it's small?",
  "What would make tonight feel intentional?",
  "Where did you feel joy this week, even for a second?",
  "What are you building that only you can see yet?",
  "What does your dream home feel like when you walk in?",
  "What relationship do you want to nourish?",
  "What would freer look like for you?",
  "What are you calling in this season?",
];

/** Stable daily prompt from date string YYYY-MM-DD */
export function promptForDate(dateKey: string): string {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return PROMPTS[h % PROMPTS.length]!;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
