export type TabId =
  | "home"
  | "board"
  | "manifest"
  | "affirm"
  | "journal"
  | "stars"
  | "muse";

/** AI companion provider (OpenAI-compatible). */
export type MuseProviderId = "openai" | "openrouter" | "grok" | "custom";

export interface MuseSettings {
  /** Prefer user's own key — stored only on this device */
  apiKey: string;
  provider: MuseProviderId;
  /** e.g. gpt-4o-mini, grok-3-mini, openai/gpt-4o-mini */
  model: string;
  /**
   * Custom OpenAI-compatible base, e.g. https://api.openai.com/v1
   * Leave empty to use the provider default (via /api/muse proxy when available).
   */
  baseUrl: string;
  /**
   * Optional full URL to a chat proxy (for GitHub Pages).
   * If empty, app tries same-origin /api/muse (Vercel).
   */
  proxyUrl: string;
}

export interface MuseMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
}

export type BoardThemeId =
  | "midnight"
  | "blush"
  | "forest"
  | "sand"
  | "aurora"
  | "paper";

export type BoardItemKind = "image" | "text";

/** Named font stacks available on the board */
export type BoardFontId =
  | "serif"
  | "sans"
  | "script"
  | "display"
  | "mono";

/** Quick aspect presets for text (and resize) */
export type BoardAspectId = "wide" | "square" | "tall" | "banner" | "free";

export interface BoardItem {
  id: string;
  kind: BoardItemKind;
  /** Image data URL / remote URL (image items) */
  src: string;
  /** Visible text for text items (also used as caption for images) */
  label: string;
  x: number; // % of board
  y: number;
  w: number; // %
  h: number;
  rotation: number;
  z: number;
  /** Optional linked manifestation goal id */
  goalId?: string;
  // ── text styling ─────────────────────────────────
  fontFamily?: BoardFontId;
  /** Relative size 0.6 – 2.4 */
  fontSize?: number;
  fontWeight?: 400 | 600 | 700;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  color?: string;
  bgColor?: string;
  aspect?: BoardAspectId;
}

export interface VisionBoard {
  id: string;
  name: string;
  theme: BoardThemeId;
  items: BoardItem[];
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  notes: string;
  category: string;
  done: boolean;
  createdAt: string;
  doneAt?: string;
}

export interface Affirmation {
  id: string;
  text: string;
  favorite: boolean;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  prompt: string;
  body: string;
}

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

/** Saved Human Design chart (computed or manual). */
export interface HumanDesignProfile {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  definition: string;
  notSelf: string;
  signature: string;
  consciousSun: string;
  unconsciousSun: string;
  definedChannels: string[];
  centers: Record<string, boolean>;
  approximate: boolean;
  notes: string[];
  birthLocal: string;
  computedAt: string;
  /** How the chart was created */
  source: "computed" | "manual";
}

export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  /** HH:mm local — important for Human Design */
  birthTime?: string;
  /** Minutes east of UTC at birth (e.g. -300 for US Eastern standard) */
  birthTzOffsetMinutes?: number;
  /** City / place label for display only */
  birthPlace?: string;
  /** Override auto sign if set */
  sign?: ZodiacSign;
  notifications: boolean;
  notifHour: number; // 0-23 local
  /** Full Human Design chart when set */
  humanDesign?: HumanDesignProfile | null;
}
