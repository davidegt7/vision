import { useVision } from "./store";
import type { TabId } from "./types";
import { Home } from "./components/Home";
import { Board } from "./components/Board";
import { Manifest } from "./components/Manifest";
import { Affirmations } from "./components/Affirmations";
import { Journal } from "./components/Journal";
import { Stars } from "./components/Stars";
import { Muse } from "./components/Muse";
import "./App.css";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "✧" },
  { id: "board", label: "Board", icon: "✨" },
  { id: "manifest", label: "Goals", icon: "✓" },
  { id: "affirm", label: "Affirm", icon: "🌙" },
  { id: "journal", label: "Write", icon: "✎" },
  { id: "stars", label: "Stars", icon: "♈" },
  { id: "muse", label: "Muse", icon: "♡" },
];

export default function App() {
  const tab = useVision((s) => s.tab);
  const setTab = useVision((s) => s.setTab);
  const sleepMode = useVision((s) => s.sleepMode);

  return (
    <div className={`app ${sleepMode ? "sleep-app" : ""}`}>
      <div className="app-shell">
        <main className="main">
          {tab === "home" && <Home />}
          {tab === "board" && <Board />}
          {tab === "manifest" && <Manifest />}
          {tab === "affirm" && <Affirmations />}
          {tab === "journal" && <Journal />}
          {tab === "stars" && <Stars />}
          {tab === "muse" && <Muse />}
        </main>

        <nav className="bottom-nav nav-7" aria-label="Main">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? "on" : ""}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
