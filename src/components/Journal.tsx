import { useEffect, useState } from "react";
import { useVision } from "../store";
import { useI18n } from "../lib/useI18n";

export function Journal() {
  const { t } = useI18n();
  const todayPrompt = useVision((s) => s.todayPrompt);
  const todayEntry = useVision((s) => s.todayEntry);
  const saveJournal = useVision((s) => s.saveJournal);
  const journal = useVision((s) => s.journal);

  const prompt = todayPrompt();
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBody(todayEntry()?.body || "");
  }, [todayEntry]);

  const save = () => {
    saveJournal(body, prompt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{t("journal.eyebrow")}</p>
          <h1>{t("journal.title")}</h1>
        </div>
      </header>
      <p className="lede tight">{t("journal.lede")}</p>

      <section className="card prompt-card solid">
        <p className="card-label">{t("journal.today")}</p>
        <p className="prompt-text">“{prompt}”</p>
      </section>

      <textarea
        className="journal-area"
        rows={8}
        placeholder={t("journal.placeholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="add-row">
        <button type="button" className="btn primary" onClick={save}>
          {saved ? t("common.saved") : t("common.save")}
        </button>
      </div>

      {journal.length > 1 && (
        <section className="list-section">
          <h2>{t("journal.earlier")}</h2>
          <ul className="journal-list">
            {journal
              .filter((j) => j.body.trim())
              .slice(0, 12)
              .map((j) => (
                <li key={j.id}>
                  <span className="jr-date">{j.date}</span>
                  <span className="jr-prompt">{j.prompt}</span>
                  <p>
                    {j.body.slice(0, 160)}
                    {j.body.length > 160 ? "…" : ""}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
