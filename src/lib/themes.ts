import type { BoardThemeId } from "../types";

export const BOARD_THEMES: Record<
  BoardThemeId,
  { label: string; bg: string; accent: string }
> = {
  midnight: {
    label: "Midnight",
    bg: "linear-gradient(160deg, #0f0a1a 0%, #1a1030 45%, #2a1848 100%)",
    accent: "#c4a0ff",
  },
  blush: {
    label: "Blush",
    bg: "linear-gradient(160deg, #2a1520 0%, #3d1f2e 50%, #4a2838 100%)",
    accent: "#ffb3c7",
  },
  forest: {
    label: "Forest",
    bg: "linear-gradient(160deg, #0c1612 0%, #142820 50%, #1a3328 100%)",
    accent: "#8fd4a8",
  },
  sand: {
    label: "Sand",
    bg: "linear-gradient(160deg, #1c1812 0%, #2a2418 50%, #3a3020 100%)",
    accent: "#e8c99a",
  },
  aurora: {
    label: "Aurora",
    bg: "linear-gradient(145deg, #0a1220 0%, #122838 40%, #1a2040 70%, #241830 100%)",
    accent: "#7ee0d0",
  },
  paper: {
    label: "Paper",
    bg: "linear-gradient(160deg, #1a1816 0%, #24201c 100%)",
    accent: "#f0e6d8",
  },
};
