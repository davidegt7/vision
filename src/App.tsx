import { useEffect } from "react";
import { useVision } from "./store";
import type { TabId } from "./types";
import { Home } from "./components/Home";
import { Board } from "./components/Board";
import { Manifest } from "./components/Manifest";
import { Affirmations } from "./components/Affirmations";
import { Journal } from "./components/Journal";
import { Stars } from "./components/Stars";
import { Muse } from "./components/Muse";
import { Settings } from "./components/Settings";
import { useI18n } from "./lib/useI18n";
import {
  DEFAULT_APPEARANCE,
  applyAppearance,
  normalizeAccent,
} from "./lib/appearance";
import "./App.css";

const TAB_DEFS: { id: TabId; labelKey: string; icon: string }[] = [
  { id: "home", labelKey: "nav.today", icon: "✧" },
  { id: "board", labelKey: "nav.board", icon: "✨" },
  { id: "manifest", labelKey: "nav.goals", icon: "✓" },
  { id: "affirm", labelKey: "nav.affirm", icon: "🌙" },
  { id: "journal", labelKey: "nav.journal", icon: "✎" },
  { id: "stars", labelKey: "nav.stars", icon: "♈" },
  { id: "muse", labelKey: "nav.muse", icon: "♡" },
  { id: "settings", labelKey: "nav.settings", icon: "⚙" },
];

export default function App() {
  const tab = useVision((s) => s.tab);
  const setTab = useVision((s) => s.setTab);
  const sleepMode = useVision((s) => s.sleepMode);
  const appearance = useVision((s) => s.profile.appearance);
  const { t } = useI18n();

  useEffect(() => {
    applyAppearance({
      ...DEFAULT_APPEARANCE,
      ...appearance,
      accent: normalizeAccent(appearance?.accent || DEFAULT_APPEARANCE.accent),
      mode: appearance?.mode === "day" ? "day" : "night",
    });
  }, [appearance]);

  const mode = appearance?.mode || "night";

  return (
    <div
      className={`app ${sleepMode ? "sleep-app" : ""} mode-${mode}`}
    >
      <div className="app-shell">
        <main className="main">
          {tab === "home" && <Home />}
          {tab === "board" && <Board />}
          {tab === "manifest" && <Manifest />}
          {tab === "affirm" && <Affirmations />}
          {tab === "journal" && <Journal />}
          {tab === "stars" && <Stars />}
          {tab === "muse" && <Muse />}
          {tab === "settings" && <Settings />}
        </main>

        <nav className="bottom-nav nav-8" aria-label="Main">
          {TAB_DEFS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "on" : ""}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
