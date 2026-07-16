import { useState } from "react";
import { useVision } from "../store";
import { useI18n } from "../lib/useI18n";

const CAT_KEYS = [
  "dream",
  "money",
  "love",
  "body",
  "home",
  "work",
  "board",
  "other",
] as const;

export function Manifest() {
  const { t } = useI18n();
  const goals = useVision((s) => s.goals);
  const addGoal = useVision((s) => s.addGoal);
  const toggleGoal = useVision((s) => s.toggleGoal);
  const removeGoal = useVision((s) => s.removeGoal);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("dream");
  const [showDone, setShowDone] = useState(true);

  const open = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);
  const pct =
    goals.length === 0 ? 0 : Math.round((done.length / goals.length) * 100);

  const submit = () => {
    if (!title.trim()) return;
    addGoal(title, cat);
    setTitle("");
  };

  const catLabel = (c: string) => {
    const key = `goals.cat.${c}`;
    const translated = t(key);
    return translated === key ? c : translated;
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{t("goals.eyebrow")}</p>
          <h1>{t("goals.title")}</h1>
        </div>
      </header>
      <p className="lede tight">{t("goals.lede")}</p>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">
          {t("goals.progress", {
            done: done.length,
            total: goals.length,
            pct,
          })}
        </p>
      </div>

      <div className="add-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("goals.placeholder")}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {CAT_KEYS.map((c) => (
            <option key={c} value={c}>
              {catLabel(c)}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" onClick={submit}>
          {t("common.add")}
        </button>
      </div>

      <section className="list-section">
        <h2>{t("goals.inMotion")}</h2>
        {open.length === 0 && <p className="empty">{t("goals.empty")}</p>}
        <ul className="goal-list">
          {open.map((g) => (
            <li key={g.id} className="goal-row">
              <button
                type="button"
                className="check"
                aria-label={t("goals.markDone")}
                onClick={() => toggleGoal(g.id)}
              />
              <div className="goal-body">
                <span className="goal-title">{g.title}</span>
                <span className="goal-cat">{catLabel(g.category)}</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={t("common.delete")}
                onClick={() => removeGoal(g.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="list-section">
        <button
          type="button"
          className="section-toggle"
          onClick={() => setShowDone(!showDone)}
        >
          <h2>{t("goals.manifested", { count: done.length })}</h2>
          <span>{showDone ? t("common.hide") : t("common.show")}</span>
        </button>
        {showDone && (
          <ul className="goal-list done">
            {done.map((g) => (
              <li key={g.id} className="goal-row">
                <button
                  type="button"
                  className="check on"
                  aria-label={t("goals.undo")}
                  onClick={() => toggleGoal(g.id)}
                >
                  ✓
                </button>
                <div className="goal-body">
                  <span className="goal-title">{g.title}</span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeGoal(g.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
