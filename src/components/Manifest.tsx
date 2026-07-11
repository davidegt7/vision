import { useState } from "react";
import { useVision } from "../store";

const CATS = ["dream", "money", "love", "body", "home", "work", "board", "other"];

export function Manifest() {
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

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Manifestation</p>
          <h1>Make it real</h1>
        </div>
      </header>
      <p className="lede tight">
        Check dreams off as they land. Your board is the vision — this is the
        receipt.
      </p>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">
          {done.length} of {goals.length} manifested · {pct}%
        </p>
      </div>

      <div className="add-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="I am calling in…"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" onClick={submit}>
          Add
        </button>
      </div>

      <section className="list-section">
        <h2>In motion</h2>
        {open.length === 0 && (
          <p className="empty">Nothing open — add a dream or pull one from your board.</p>
        )}
        <ul className="goal-list">
          {open.map((g) => (
            <li key={g.id} className="goal-row">
              <button
                type="button"
                className="check"
                aria-label="Mark done"
                onClick={() => toggleGoal(g.id)}
              />
              <div className="goal-body">
                <span className="goal-title">{g.title}</span>
                <span className="goal-cat">{g.category}</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Delete"
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
          <h2>Manifested ({done.length})</h2>
          <span>{showDone ? "hide" : "show"}</span>
        </button>
        {showDone && (
          <ul className="goal-list done">
            {done.map((g) => (
              <li key={g.id} className="goal-row">
                <button
                  type="button"
                  className="check on"
                  aria-label="Undo"
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
