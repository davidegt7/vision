/** App-wide appearance: day/night + distinctive color palettes. */

export type AppMode = "day" | "night";

export type AccentId =
  | "mist"
  | "blush"
  | "sage"
  | "sand"
  | "sky"
  | "clay";

export interface AppearanceSettings {
  mode: AppMode;
  accent: AccentId;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  mode: "night",
  accent: "mist",
};

const LEGACY: Record<string, AccentId> = {
  violet: "mist",
  rose: "blush",
  forest: "sage",
  gold: "sand",
  ocean: "sky",
  coral: "clay",
};

export function normalizeAccent(id: string | undefined): AccentId {
  if (!id) return "mist";
  if (
    id === "mist" ||
    id === "blush" ||
    id === "sage" ||
    id === "sand" ||
    id === "sky" ||
    id === "clay"
  ) {
    return id;
  }
  return LEGACY[id] || "mist";
}

type Surface = {
  bg: string;
  bgElev: string;
  panel: string;
  panel2: string;
  border: string;
  text: string;
  muted: string;
  ok: string;
  danger: string;
  accent: string;
  accent2: string;
  gold: string;
  glow1: string;
  glow2: string;
  tintSoft: string;
  tintMed: string;
  tintStrong: string;
  cardBoard: string;
  cardStars: string;
  cardHd: string;
  cardAffirm: string;
  cardMuse: string;
  cardEvening: string;
  edge: string;
  label: string;
  line: string;
};

function S(p: Surface): Surface {
  return p;
}

/**
 * Six clearly different families (hue shifts in bg + accent).
 * Soft enough for a dream app, not all the same grey-lavender.
 */
export const ACCENTS: {
  id: AccentId;
  label: string;
  /** Big swatch for picker */
  swatch: string;
  /** Secondary ring color on swatch */
  swatch2: string;
  night: Surface;
  day: Surface;
}[] = [
  {
    id: "mist",
    label: "Violet",
    swatch: "#9b6dff",
    swatch2: "#d4b8ff",
    night: S({
      bg: "#0c0818",
      bgElev: "#16102a",
      panel: "#1e1535",
      panel2: "#2a1c48",
      border: "rgba(170, 130, 255, 0.22)",
      text: "#f3ecff",
      muted: "#a894c4",
      ok: "#7dcea0",
      danger: "#f08090",
      accent: "#a878ff",
      accent2: "#e0a0ff",
      gold: "#e0c070",
      glow1: "rgba(140, 90, 255, 0.28)",
      glow2: "rgba(200, 120, 255, 0.12)",
      tintSoft: "rgba(160, 110, 255, 0.14)",
      tintMed: "rgba(160, 110, 255, 0.24)",
      tintStrong: "rgba(160, 110, 255, 0.4)",
      cardBoard:
        "linear-gradient(145deg, #1a1030 0%, #2e1850 55%, #241440 100%)",
      cardStars:
        "linear-gradient(145deg, #12102a 0%, #1c1848 55%, #18143a 100%)",
      cardHd:
        "linear-gradient(145deg, #160e30 0%, #281850 55%, #1e1240 100%)",
      cardAffirm:
        "linear-gradient(145deg, #1c1030 0%, #301a48 55%, #241238 100%)",
      cardMuse:
        "linear-gradient(155deg, #201030 0%, #381848 55%, #281438 100%)",
      cardEvening:
        "linear-gradient(160deg, #0a0614 0%, #140e28 55%, #100a20 100%)",
      edge: "#a878ff",
      label: "#c9a8ff",
      line: "#f5eeff",
    }),
    day: S({
      bg: "#f3eefc",
      bgElev: "#ffffff",
      panel: "#ffffff",
      panel2: "#e8def8",
      border: "rgba(90, 50, 160, 0.16)",
      text: "#1e1235",
      muted: "#6a5888",
      ok: "#2d8a54",
      danger: "#c04050",
      accent: "#6b3fd4",
      accent2: "#9b5ce0",
      gold: "#b8860b",
      glow1: "rgba(120, 70, 220, 0.14)",
      glow2: "rgba(180, 100, 220, 0.1)",
      tintSoft: "rgba(107, 63, 212, 0.1)",
      tintMed: "rgba(107, 63, 212, 0.18)",
      tintStrong: "rgba(107, 63, 212, 0.3)",
      cardBoard: "linear-gradient(145deg, #ebe0fc 0%, #ddd0f5 100%)",
      cardStars: "linear-gradient(145deg, #e4e0fa 0%, #d4d0f0 100%)",
      cardHd: "linear-gradient(145deg, #e8def8 0%, #d8cef0 100%)",
      cardAffirm: "linear-gradient(145deg, #f0e4f8 0%, #e4d4f0 100%)",
      cardMuse: "linear-gradient(155deg, #f2e0f5 0%, #e6d0ec 100%)",
      cardEvening: "linear-gradient(160deg, #e6def2 0%, #d8d0e8 100%)",
      edge: "#6b3fd4",
      label: "#5a30b0",
      line: "#1e1235",
    }),
  },
  {
    id: "blush",
    label: "Rose",
    swatch: "#f07098",
    swatch2: "#ffb0c8",
    night: S({
      bg: "#14080e",
      bgElev: "#221018",
      panel: "#2c1520",
      panel2: "#3a1c2a",
      border: "rgba(255, 130, 170, 0.22)",
      text: "#ffecf2",
      muted: "#c498a8",
      ok: "#7dcea0",
      danger: "#ff7a8a",
      accent: "#f07098",
      accent2: "#ffb0c0",
      gold: "#e8b878",
      glow1: "rgba(240, 80, 140, 0.26)",
      glow2: "rgba(255, 140, 170, 0.12)",
      tintSoft: "rgba(240, 100, 150, 0.14)",
      tintMed: "rgba(240, 100, 150, 0.24)",
      tintStrong: "rgba(240, 100, 150, 0.4)",
      cardBoard:
        "linear-gradient(145deg, #2a101c 0%, #4a1830 55%, #381424 100%)",
      cardStars:
        "linear-gradient(145deg, #201018 0%, #381828 55%, #2c1420 100%)",
      cardHd:
        "linear-gradient(145deg, #241018 0%, #401c30 55%, #301420 100%)",
      cardAffirm:
        "linear-gradient(145deg, #2c101c 0%, #4a1c30 55%, #381424 100%)",
      cardMuse:
        "linear-gradient(155deg, #301018 0%, #501c30 55%, #3c1424 100%)",
      cardEvening:
        "linear-gradient(160deg, #10060a 0%, #1c0c14 55%, #160a10 100%)",
      edge: "#f07098",
      label: "#ffb0c8",
      line: "#fff0f5",
    }),
    day: S({
      bg: "#fdf0f4",
      bgElev: "#ffffff",
      panel: "#ffffff",
      panel2: "#f8e0e8",
      border: "rgba(160, 40, 80, 0.14)",
      text: "#3a1524",
      muted: "#8a5068",
      ok: "#2d8a54",
      danger: "#c03040",
      accent: "#c04070",
      accent2: "#e06090",
      gold: "#b07030",
      glow1: "rgba(220, 60, 110, 0.12)",
      glow2: "rgba(240, 120, 150, 0.1)",
      tintSoft: "rgba(192, 64, 112, 0.1)",
      tintMed: "rgba(192, 64, 112, 0.18)",
      tintStrong: "rgba(192, 64, 112, 0.28)",
      cardBoard: "linear-gradient(145deg, #fce4ec 0%, #f5d0dc 100%)",
      cardStars: "linear-gradient(145deg, #f8e0e8 0%, #f0d0dc 100%)",
      cardHd: "linear-gradient(145deg, #fae2ea 0%, #f2d0dc 100%)",
      cardAffirm: "linear-gradient(145deg, #fde8ee 0%, #f5d4e0 100%)",
      cardMuse: "linear-gradient(155deg, #fce4ea 0%, #f4d0da 100%)",
      cardEvening: "linear-gradient(160deg, #f5e0e6 0%, #ecd0da 100%)",
      edge: "#c04070",
      label: "#a02858",
      line: "#3a1524",
    }),
  },
  {
    id: "sage",
    label: "Forest",
    swatch: "#3cb878",
    swatch2: "#8fd4a8",
    night: S({
      bg: "#06140c",
      bgElev: "#0e1e14",
      panel: "#14281c",
      panel2: "#1c3828",
      border: "rgba(80, 200, 130, 0.22)",
      text: "#e8f8ee",
      muted: "#88b098",
      ok: "#5ed490",
      danger: "#e08080",
      accent: "#3cb878",
      accent2: "#70d4a0",
      gold: "#c8c060",
      glow1: "rgba(40, 180, 100, 0.24)",
      glow2: "rgba(80, 200, 140, 0.1)",
      tintSoft: "rgba(60, 184, 120, 0.14)",
      tintMed: "rgba(60, 184, 120, 0.24)",
      tintStrong: "rgba(60, 184, 120, 0.4)",
      cardBoard:
        "linear-gradient(145deg, #0e2418 0%, #1a3c28 55%, #142e20 100%)",
      cardStars:
        "linear-gradient(145deg, #0c2018 0%, #183428 55%, #122820 100%)",
      cardHd:
        "linear-gradient(145deg, #0e2216 0%, #1a3824 55%, #142c1c 100%)",
      cardAffirm:
        "linear-gradient(145deg, #102418 0%, #1c3a28 55%, #162e20 100%)",
      cardMuse:
        "linear-gradient(155deg, #122618 0%, #1e3c28 55%, #183020 100%)",
      cardEvening:
        "linear-gradient(160deg, #040e08 0%, #0c1a12 55%, #08140c 100%)",
      edge: "#3cb878",
      label: "#8fd4a8",
      line: "#eefaf2",
    }),
    day: S({
      bg: "#eef8f2",
      bgElev: "#ffffff",
      panel: "#ffffff",
      panel2: "#d8f0e0",
      border: "rgba(20, 100, 50, 0.16)",
      text: "#0e2818",
      muted: "#4a7860",
      ok: "#1a8040",
      danger: "#c04040",
      accent: "#1a8a48",
      accent2: "#30a860",
      gold: "#8a8020",
      glow1: "rgba(30, 140, 70, 0.12)",
      glow2: "rgba(60, 180, 100, 0.08)",
      tintSoft: "rgba(26, 138, 72, 0.1)",
      tintMed: "rgba(26, 138, 72, 0.18)",
      tintStrong: "rgba(26, 138, 72, 0.28)",
      cardBoard: "linear-gradient(145deg, #dcf0e4 0%, #c8e8d4 100%)",
      cardStars: "linear-gradient(145deg, #d8eee0 0%, #c4e4d0 100%)",
      cardHd: "linear-gradient(145deg, #daf0e2 0%, #c6e8d2 100%)",
      cardAffirm: "linear-gradient(145deg, #e0f4e8 0%, #ccead8 100%)",
      cardMuse: "linear-gradient(155deg, #def2e6 0%, #cae8d4 100%)",
      cardEvening: "linear-gradient(160deg, #d4eadc 0%, #c0e0d0 100%)",
      edge: "#1a8a48",
      label: "#146838",
      line: "#0e2818",
    }),
  },
  {
    id: "sand",
    label: "Amber",
    swatch: "#e0a030",
    swatch2: "#f0d080",
    night: S({
      bg: "#120e06",
      bgElev: "#1e180c",
      panel: "#2a2010",
      panel2: "#3a2c14",
      border: "rgba(230, 170, 50, 0.24)",
      text: "#fff6e4",
      muted: "#b8a078",
      ok: "#80c070",
      danger: "#e88870",
      accent: "#e0a030",
      accent2: "#f0c060",
      gold: "#f0d070",
      glow1: "rgba(220, 150, 30, 0.26)",
      glow2: "rgba(240, 180, 60, 0.12)",
      tintSoft: "rgba(224, 160, 48, 0.14)",
      tintMed: "rgba(224, 160, 48, 0.24)",
      tintStrong: "rgba(224, 160, 48, 0.4)",
      cardBoard:
        "linear-gradient(145deg, #2a1c08 0%, #4a3010 55%, #382408 100%)",
      cardStars:
        "linear-gradient(145deg, #221808 0%, #3a2c10 55%, #2e200c 100%)",
      cardHd:
        "linear-gradient(145deg, #261a08 0%, #422e10 55%, #34240c 100%)",
      cardAffirm:
        "linear-gradient(145deg, #2c1e0a 0%, #4a3210 55%, #3a280c 100%)",
      cardMuse:
        "linear-gradient(155deg, #30200a 0%, #503812 55%, #3e2a0c 100%)",
      cardEvening:
        "linear-gradient(160deg, #0e0a04 0%, #1a1408 55%, #141008 100%)",
      edge: "#e0a030",
      label: "#f0d080",
      line: "#fff8e8",
    }),
    day: S({
      bg: "#fbf6ea",
      bgElev: "#ffffff",
      panel: "#ffffff",
      panel2: "#f5e8c8",
      border: "rgba(140, 90, 10, 0.16)",
      text: "#2a2008",
      muted: "#8a7040",
      ok: "#2d8a40",
      danger: "#c04030",
      accent: "#b07810",
      accent2: "#d09820",
      gold: "#c09018",
      glow1: "rgba(200, 130, 20, 0.12)",
      glow2: "rgba(220, 160, 40, 0.1)",
      tintSoft: "rgba(176, 120, 16, 0.1)",
      tintMed: "rgba(176, 120, 16, 0.18)",
      tintStrong: "rgba(176, 120, 16, 0.28)",
      cardBoard: "linear-gradient(145deg, #f8ecc8 0%, #f0dcA8 100%)".replace(
        "A",
        "a",
      ),
      cardStars: "linear-gradient(145deg, #f5e8c8 0%, #ecdcb0 100%)",
      cardHd: "linear-gradient(145deg, #f6eac8 0%, #eedeb0 100%)",
      cardAffirm: "linear-gradient(145deg, #faeec8 0%, #f2e0b0 100%)",
      cardMuse: "linear-gradient(155deg, #f8ecc4 0%, #f0dca8 100%)",
      cardEvening: "linear-gradient(160deg, #f0e4c0 0%, #e8d8a8 100%)",
      edge: "#b07810",
      label: "#8a5c08",
      line: "#2a2008",
    }),
  },
  {
    id: "sky",
    label: "Ocean",
    swatch: "#2a9fd4",
    swatch2: "#70d0f0",
    night: S({
      bg: "#060e18",
      bgElev: "#0c1828",
      panel: "#122030",
      panel2: "#1a3048",
      border: "rgba(50, 170, 230, 0.24)",
      text: "#e8f6ff",
      muted: "#80a8c0",
      ok: "#60c0a0",
      danger: "#f08090",
      accent: "#2a9fd4",
      accent2: "#50c8e8",
      gold: "#d0c070",
      glow1: "rgba(30, 140, 220, 0.28)",
      glow2: "rgba(60, 190, 240, 0.12)",
      tintSoft: "rgba(42, 159, 212, 0.14)",
      tintMed: "rgba(42, 159, 212, 0.24)",
      tintStrong: "rgba(42, 159, 212, 0.4)",
      cardBoard:
        "linear-gradient(145deg, #0c2030 0%, #143850 55%, #102c40 100%)",
      cardStars:
        "linear-gradient(145deg, #0a1c30 0%, #123448 55%, #0e2840 100%)",
      cardHd:
        "linear-gradient(145deg, #0c1e30 0%, #143650 55%, #102c40 100%)",
      cardAffirm:
        "linear-gradient(145deg, #0e2232 0%, #163a50 55%, #122e42 100%)",
      cardMuse:
        "linear-gradient(155deg, #102434 0%, #183e54 55%, #143244 100%)",
      cardEvening:
        "linear-gradient(160deg, #040a12 0%, #0c1824 55%, #08141c 100%)",
      edge: "#2a9fd4",
      label: "#70d0f0",
      line: "#eef8ff",
    }),
    day: S({
      bg: "#eef6fc",
      bgElev: "#ffffff",
      panel: "#ffffff",
      panel2: "#d4eaf8",
      border: "rgba(10, 80, 130, 0.16)",
      text: "#0c2030",
      muted: "#4a7090",
      ok: "#1a8060",
      danger: "#c03040",
      accent: "#1878b0",
      accent2: "#2098d0",
      gold: "#a08020",
      glow1: "rgba(20, 120, 180, 0.12)",
      glow2: "rgba(40, 160, 220, 0.1)",
      tintSoft: "rgba(24, 120, 176, 0.1)",
      tintMed: "rgba(24, 120, 176, 0.18)",
      tintStrong: "rgba(24, 120, 176, 0.28)",
      cardBoard: "linear-gradient(145deg, #d8ecf8 0%, #c0e0f4 100%)",
      cardStars: "linear-gradient(145deg, #d0e8f8 0%, #b8dcf4 100%)",
      cardHd: "linear-gradient(145deg, #d4eaf8 0%, #bcdff4 100%)",
      cardAffirm: "linear-gradient(145deg, #dceef8 0%, #c4e4f4 100%)",
      cardMuse: "linear-gradient(155deg, #daeef8 0%, #c2e4f4 100%)",
      cardEvening: "linear-gradient(160deg, #d0e6f4 0%, #b8daf0 100%)",
      edge: "#1878b0",
      label: "#0e5c90",
      line: "#0c2030",
    }),
  },
  {
    id: "clay",
    label: "Clay",
    swatch: "#e06840",
    swatch2: "#f0a080",
    night: S({
      bg: "#140a06",
      bgElev: "#22140e",
      panel: "#2c1a12",
      panel2: "#3c2418",
      border: "rgba(230, 110, 60, 0.24)",
      text: "#fff0e8",
      muted: "#c09880",
      ok: "#80c070",
      danger: "#f07060",
      accent: "#e06840",
      accent2: "#f09060",
      gold: "#e0b050",
      glow1: "rgba(220, 90, 40, 0.26)",
      glow2: "rgba(240, 130, 70, 0.12)",
      tintSoft: "rgba(224, 104, 64, 0.14)",
      tintMed: "rgba(224, 104, 64, 0.24)",
      tintStrong: "rgba(224, 104, 64, 0.4)",
      cardBoard:
        "linear-gradient(145deg, #2c140c 0%, #4a2014 55%, #3a1a10 100%)",
      cardStars:
        "linear-gradient(145deg, #24120c 0%, #3c1c14 55%, #301610 100%)",
      cardHd:
        "linear-gradient(145deg, #28140c 0%, #442014 55%, #361a10 100%)",
      cardAffirm:
        "linear-gradient(145deg, #2e160e 0%, #4c2216 55%, #3c1c12 100%)",
      cardMuse:
        "linear-gradient(155deg, #32180e 0%, #502618 55%, #401e12 100%)",
      cardEvening:
        "linear-gradient(160deg, #100804 0%, #1c100a 55%, #160c08 100%)",
      edge: "#e06840",
      label: "#f0a080",
      line: "#fff4ec",
    }),
    day: S({
      bg: "#fdf2ec",
      bgElev: "#ffffff",
      panel: "#ffffff",
      panel2: "#f8e0d4",
      border: "rgba(140, 50, 20, 0.16)",
      text: "#30180c",
      muted: "#8a5840",
      ok: "#2d8a40",
      danger: "#c02820",
      accent: "#c04820",
      accent2: "#e06030",
      gold: "#b07020",
      glow1: "rgba(200, 70, 30, 0.12)",
      glow2: "rgba(230, 100, 50, 0.1)",
      tintSoft: "rgba(192, 72, 32, 0.1)",
      tintMed: "rgba(192, 72, 32, 0.18)",
      tintStrong: "rgba(192, 72, 32, 0.28)",
      cardBoard: "linear-gradient(145deg, #fce4d4 0%, #f4d0b8 100%)",
      cardStars: "linear-gradient(145deg, #f8e0d0 0%, #f0ccb4 100%)",
      cardHd: "linear-gradient(145deg, #fae2d2 0%, #f2ceb6 100%)",
      cardAffirm: "linear-gradient(145deg, #fde6d8 0%, #f5d2bc 100%)",
      cardMuse: "linear-gradient(155deg, #fce4d4 0%, #f4d0b8 100%)",
      cardEvening: "linear-gradient(160deg, #f5dcc8 0%, #edc8b0 100%)",
      edge: "#c04820",
      label: "#9a3818",
      line: "#30180c",
    }),
  },
];

export function applyAppearance(settings: AppearanceSettings) {
  const root = document.documentElement;
  const accentId = normalizeAccent(settings.accent);
  const pack = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0]!;
  const s = settings.mode === "day" ? pack.day : pack.night;

  root.dataset.mode = settings.mode;
  root.dataset.accent = accentId;
  root.style.colorScheme = settings.mode === "day" ? "light" : "dark";

  const set = (k: string, v: string) => root.style.setProperty(k, v);

  set("--bg", s.bg);
  set("--bg-elev", s.bgElev);
  set("--panel", s.panel);
  set("--panel-2", s.panel2);
  set("--border", s.border);
  set("--text", s.text);
  set("--muted", s.muted);
  set("--ok", s.ok);
  set("--danger", s.danger);
  set("--accent", s.accent);
  set("--accent-2", s.accent2);
  set("--gold", s.gold);
  set("--glow-1", s.glow1);
  set("--glow-2", s.glow2);
  set("--tint-soft", s.tintSoft);
  set("--tint-med", s.tintMed);
  set("--tint-strong", s.tintStrong);
  set("--card-board", s.cardBoard);
  set("--card-stars", s.cardStars);
  set("--card-hd", s.cardHd);
  set("--card-affirm", s.cardAffirm);
  set("--card-muse", s.cardMuse);
  set("--card-evening", s.cardEvening);
  set("--edge", s.edge);
  set("--label", s.label);
  set("--line", s.line);
  set(
    "--nav-bg",
    settings.mode === "day"
      ? "rgba(255,255,255,0.94)"
      : "rgba(8, 6, 14, 0.94)",
  );
  set("--btn-primary-fg", settings.mode === "day" ? "#ffffff" : s.bg);
}
