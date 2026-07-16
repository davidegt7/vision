import { useVision } from "../store";
import {
  ACCENTS,
  normalizeAccent,
  type AccentId,
  type AppMode,
} from "../lib/appearance";

/** Day/night + pastel palette — compact or full card. */
export function AppearancePicker({
  compact = false,
}: {
  compact?: boolean;
}) {
  const appearance = useVision(
    (s) =>
      s.profile.appearance || {
        mode: "night" as const,
        accent: "mist" as const,
      },
  );
  const setAppearance = useVision((s) => s.setAppearance);

  const mode = appearance.mode || "night";
  const accent = normalizeAccent(appearance.accent);

  if (compact) {
    return (
      <div className="appear-compact" role="group" aria-label="Appearance">
        <button
          type="button"
          className={`appear-mode-btn ${mode === "day" ? "on" : ""}`}
          title="Day mode"
          onClick={() => setAppearance({ mode: "day" })}
        >
          ☀
        </button>
        <button
          type="button"
          className={`appear-mode-btn ${mode === "night" ? "on" : ""}`}
          title="Night mode"
          onClick={() => setAppearance({ mode: "night" })}
        >
          ☾
        </button>
      </div>
    );
  }

  return (
    <section className="card form-card appear-card">
      <p className="card-label">Look & feel</p>

      <p className="muted tiny" style={{ margin: "0 0 0.5rem" }}>
        Mode
      </p>
      <div className="appear-mode-row">
        <button
          type="button"
          className={`appear-mode-pill ${mode === "day" ? "on" : ""}`}
          onClick={() => setAppearance({ mode: "day" as AppMode })}
        >
          ☀ Day
        </button>
        <button
          type="button"
          className={`appear-mode-pill ${mode === "night" ? "on" : ""}`}
          onClick={() => setAppearance({ mode: "night" as AppMode })}
        >
          ☾ Night
        </button>
      </div>

      <p className="muted tiny" style={{ margin: "0.85rem 0 0.5rem" }}>
        Color theme
      </p>
      <div className="appear-accent-grid">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`appear-theme-btn ${accent === a.id ? "on" : ""}`}
            title={a.label}
            onClick={() => setAppearance({ accent: a.id as AccentId })}
          >
            <span
              className="appear-theme-swatch"
              style={{
                background: `linear-gradient(135deg, ${a.swatch} 0%, ${a.swatch2} 100%)`,
              }}
            />
            <span className="appear-theme-name">{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
