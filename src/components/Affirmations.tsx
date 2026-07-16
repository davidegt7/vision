import { useEffect, useRef, useState } from "react";
import { useVision } from "../store";
import { useI18n } from "../lib/useI18n";

export function Affirmations() {
  const { t, bcp47 } = useI18n();
  const affirmations = useVision((s) => s.affirmations);
  const addAffirmation = useVision((s) => s.addAffirmation);
  const toggleFavorite = useVision((s) => s.toggleFavorite);
  const removeAffirmation = useVision((s) => s.removeAffirmation);
  const sleepMode = useVision((s) => s.sleepMode);
  const setSleepMode = useVision((s) => s.setSleepMode);

  const [draft, setDraft] = useState("");
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rate, setRate] = useState(0.85);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const loopRef = useRef(false);

  const list =
    affirmations.filter((a) => a.favorite).length > 0
      ? affirmations.filter((a) => a.favorite)
      : affirmations;

  const stop = () => {
    loopRef.current = false;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };

  const speakOne = (i: number) => {
    if (!window.speechSynthesis || list.length === 0) return;
    const text = list[i % list.length]?.text;
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 0.95;
    u.volume = 0.9;
    // Prefer a voice matching app language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = bcp47.split("-")[0] || "en";
    const soft =
      voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
      voices.find((v) => /samantha|karen|moira|female|soft/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (soft) u.voice = soft;
    u.lang = soft?.lang || bcp47;
    u.onend = () => {
      if (!loopRef.current) {
        setPlaying(false);
        return;
      }
      // Pause between lines for sleep
      window.setTimeout(() => {
        if (!loopRef.current) return;
        const next = (i + 1) % list.length;
        setIdx(next);
        speakOne(next);
      }, 2200);
    };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const startSleep = () => {
    if (!window.speechSynthesis) {
      alert(t("affirm.ttsMissing"));
      return;
    }
    // Warm voices on some browsers
    window.speechSynthesis.getVoices();
    loopRef.current = true;
    setSleepMode(true);
    setPlaying(true);
    speakOne(idx);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className={`page affirm-page ${sleepMode ? "sleep" : ""}`}>
      <header className="page-head">
        <div>
          <p className="eyebrow">{t("affirm.eyebrow")}</p>
          <h1>{t("affirm.title")}</h1>
        </div>
      </header>
      <p className="lede tight">{t("affirm.lede")}</p>

      <div className="sleep-controls card">
        <div className="sleep-row">
          <button
            type="button"
            className={`btn primary big ${playing ? "on" : ""}`}
            onClick={() => (playing ? stop() : startSleep())}
          >
            {playing ? t("affirm.sleepStop") : `▶ ${t("affirm.sleepStart")}`}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setSleepMode(!sleepMode)}
          >
            {sleepMode ? t("affirm.nightOn") : t("affirm.nightOff")}
          </button>
        </div>
        <label className="inline">
          {t("affirm.rate")}
          <input
            type="range"
            min={0.6}
            max={1.1}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        {playing && list[idx] && (
          <p className="now-playing">“{list[idx]!.text}”</p>
        )}
      </div>

      <div className="add-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("affirm.placeholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              addAffirmation(draft);
              setDraft("");
            }
          }}
        />
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (!draft.trim()) return;
            addAffirmation(draft);
            setDraft("");
          }}
        >
          {t("common.add")}
        </button>
      </div>

      <ul className="affirm-list">
        {affirmations.map((a) => (
          <li key={a.id} className={a.favorite ? "fav" : ""}>
            <button
              type="button"
              className="star"
              aria-label="Favorite"
              onClick={() => toggleFavorite(a.id)}
            >
              {a.favorite ? "★" : "☆"}
            </button>
            <p>{a.text}</p>
            <button
              type="button"
              className="icon-btn"
              onClick={() => removeAffirmation(a.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
