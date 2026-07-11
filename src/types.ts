export type TabId = "home" | "board" | "manifest" | "affirm" | "journal" | "stars";

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

export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  /** Override auto sign if set */
  sign?: ZodiacSign;
  notifications: boolean;
  notifHour: number; // 0-23 local
}
