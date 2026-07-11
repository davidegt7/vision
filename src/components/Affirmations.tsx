import { useEffect, useRef, useState } from "react";
import { useVision } from "../store";

export function Affirmations() {
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
    // Prefer a soft English voice if available
    const voices = window.speechSynthesis.getVoices();
    const soft =
      voices.find((v) => /samantha|karen|moira|female|soft/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (soft) u.voice = soft;
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
      alert("Text-to-speech isn’t available in this browser.");
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
          <p className="eyebrow">Affirmations</p>
          <h1>Words that land</h1>
        </div>
      </header>
      <p className="lede tight">
        Loop them as you fall asleep. Favorites play first. Dim the screen and let
        the night work.
      </p>

      <div className="sleep-controls card">
        <div className="sleep-row">
          <button
            type="button"
            className={`btn primary big ${playing ? "on" : ""}`}
            onClick={() => (playing ? stop() : startSleep())}
          >
            {playing ? "Pause sleep loop" : "▶ Play as I sleep"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setSleepMode(!sleepMode)}
          >
            {sleepMode ? "Exit night mode" : "Night mode"}
          </button>
        </div>
        <label className="inline">
          Pace
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
          placeholder="Write your own affirmation…"
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
          Add
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
