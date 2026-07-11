import type { BoardAspectId, BoardFontId } from "../types";

export const BOARD_FONTS: Record<
  BoardFontId,
  { label: string; stack: string }
> = {
  serif: {
    label: "Serif",
    stack: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  },
  sans: {
    label: "Sans",
    stack: '"DM Sans", system-ui, -apple-system, sans-serif',
  },
  script: {
    label: "Script",
    stack: '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
  },
  display: {
    label: "Display",
    stack: "Impact, Haettenschweiler, 'Arial Black', sans-serif",
  },
  mono: {
    label: "Mono",
    stack: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
};

/** Width/height % on a 9:16 board */
export const ASPECT_PRESETS: Record<
  BoardAspectId,
  { label: string; w: number; h: number }
> = {
  wide: { label: "Wide", w: 48, h: 16 },
  square: { label: "Square", w: 32, h: 18 },
  tall: { label: "Tall", w: 24, h: 30 },
  banner: { label: "Banner", w: 72, h: 12 },
  free: { label: "Free", w: 40, h: 18 },
};

export const TEXT_COLORS = [
  "#ffffff",
  "#f4eef8",
  "#e8c99a",
  "#c4a0ff",
  "#ffb3c7",
  "#8fd4a8",
  "#7ee0d0",
  "#1a1028",
  "#000000",
];

export const TEXT_BG_COLORS = [
  "transparent",
  "rgba(0,0,0,0.45)",
  "rgba(255,255,255,0.9)",
  "rgba(26,16,40,0.75)",
  "rgba(196,160,255,0.25)",
  "rgba(232,201,154,0.3)",
];
