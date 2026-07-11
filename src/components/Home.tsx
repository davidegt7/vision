import { useVision } from "../store";
import { dailyHoroscope } from "../lib/astrology";
import { todayKey } from "../lib/prompts";
import { SIGNS } from "../lib/astrology";

export function Home() {
  const setTab = useVision((s) => s.setTab);
  const profile = useVision((s) => s.profile);
  const goals = useVision((s) => s.goals);
  const board = useVision((s) => s.activeBoard());
  const todayPrompt = useVision((s) => s.todayPrompt);
  const todayEntry = useVision((s) => s.todayEntry);
  const sign = useVision((s) => s.resolvedSign)();

  const done = goals.filter((g) => g.done).length;
  const open = goals.filter((g) => !g.done).length;
  const horoscope = sign ? dailyHoroscope(sign, todayKey()) : null;
  const signMeta = SIGNS.find((x) => x.id === sign);

  const name = profile.name?.trim() || "dreamer";
  const hd = profile.humanDesign;

  return (
    <div className="page home">
      <header className="page-hero">
        <p className="eyebrow">vision</p>
        <h1>
          Hey {name}
          <span className="spark">.</span>
        </h1>
        <p className="lede">
          Your dream life, all in one place — boards, check-offs, sleep
          affirmations, prompts, stars & Human Design. No app-hopping.
        </p>
      </header>

      {hd && (
        <section className="card hd-home" onClick={() => setTab("stars")}>
          <p className="card-label">Human Design</p>
          <p className="hd-home-type">{hd.type}</p>
          <div className="chip-row">
            <span className="chip">{hd.profile}</span>
            <span className="chip">{hd.strategy}</span>
          </div>
          <span className="card-cta">Open full chart →</span>
        </section>
      )}

      <div className="stat-row">
        <button type="button" className="stat-card" onClick={() => setTab("board")}>
          <span className="stat-n">{board.items.length}</span>
          <span className="stat-l">board images</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setTab("manifest")}>
          <span className="stat-n">
            {done}/{done + open || 0}
          </span>
          <span className="stat-l">manifested</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setTab("journal")}>
          <span className="stat-n">{todayEntry()?.body ? "✓" : "·"}</span>
          <span className="stat-l">today’s write</span>
        </button>
      </div>

      <section className="card prompt-card" onClick={() => setTab("journal")}>
        <p className="card-label">Today’s prompt</p>
        <p className="prompt-text">“{todayPrompt()}”</p>
        <span className="card-cta">Write a little →</span>
      </section>

      {horoscope ? (
        <section className="card stars-card" onClick={() => setTab("stars")}>
          <p className="card-label">
            {signMeta?.emoji} {horoscope.title}
          </p>
          <p className="stars-body">{horoscope.body}</p>
          <div className="chip-row">
            <span className="chip">focus · {horoscope.focus}</span>
            <span className="chip">lucky · {horoscope.lucky}</span>
          </div>
        </section>
      ) : (
        <section className="card" onClick={() => setTab("stars")}>
          <p className="card-label">Astrology</p>
          <p>Add your birthday for a soft daily reading & optional reminders.</p>
          <span className="card-cta">Set up stars →</span>
        </section>
      )}

      <div className="quick-grid">
        <button type="button" className="quick" onClick={() => setTab("board")}>
          <span>✨</span> Dream board
        </button>
        <button type="button" className="quick" onClick={() => setTab("manifest")}>
          <span>✓</span> Check it off
        </button>
        <button type="button" className="quick" onClick={() => setTab("affirm")}>
          <span>🌙</span> Sleep affirm
        </button>
        <button type="button" className="quick" onClick={() => setTab("stars")}>
          <span>✧</span> Daily stars
        </button>
      </div>
    </div>
  );
}
