import { useEffect, useState } from "react";
import { useVision } from "../store";
import { SIGNS, dailyHoroscope, signFromBirthDate } from "../lib/astrology";
import { todayKey } from "../lib/prompts";
import type { ZodiacSign } from "../types";
import { HumanDesignPanel } from "./HumanDesign";

export function Stars() {
  const profile = useVision((s) => s.profile);
  const setProfile = useVision((s) => s.setProfile);
  const sign = useVision((s) => s.resolvedSign)();
  const [notifMsg, setNotifMsg] = useState("");

  const auto = signFromBirthDate(profile.birthDate);
  const horoscope = sign ? dailyHoroscope(sign, todayKey()) : null;

  useEffect(() => {
    if (!profile.notifications || !("Notification" in window)) return;
    // Schedule a simple daily check while the tab is open
    const tick = () => {
      const now = new Date();
      if (now.getHours() !== profile.notifHour) return;
      if (now.getMinutes() > 2) return;
      const key = `vision-notif-${todayKey()}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const s = sign || auto;
      if (!s || Notification.permission !== "granted") return;
      const h = dailyHoroscope(s, todayKey());
      new Notification("vision · daily stars", {
        body: h.body.slice(0, 120),
        tag: "vision-daily",
      });
    };
    const id = window.setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [profile.notifications, profile.notifHour, sign, auto]);

  const enableNotifs = async () => {
    if (!("Notification" in window)) {
      setNotifMsg("Notifications aren’t supported here — try adding to Home Screen on your phone.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setProfile({ notifications: true });
      setNotifMsg("Daily stars on — leave vision open or pinned for reminders.");
      const s = sign || auto;
      if (s) {
        const h = dailyHoroscope(s, todayKey());
        new Notification("vision · you’re set", { body: h.body.slice(0, 100) });
      }
    } else {
      setNotifMsg("Permission denied — you can still read the daily here.");
      setProfile({ notifications: false });
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Astrology</p>
          <h1>Daily stars</h1>
        </div>
      </header>
      <p className="lede tight">
        Soft guidance, not dogma. Astrology daily + your Human Design chart in one
        place — optional daily nudge.
      </p>

      <section className="card form-card">
        <label>
          Your name
          <input
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
            placeholder="What should we call you?"
          />
        </label>
        <label>
          Birthday
          <input
            type="date"
            value={profile.birthDate}
            onChange={(e) => setProfile({ birthDate: e.target.value, sign: undefined })}
          />
        </label>
        <label>
          Sign (optional override)
          <select
            value={profile.sign || auto || ""}
            onChange={(e) =>
              setProfile({
                sign: (e.target.value || undefined) as ZodiacSign | undefined,
              })
            }
          >
            <option value="">Auto from birthday</option>
            {SIGNS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.label} · {s.dates}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reminder hour
          <input
            type="number"
            min={0}
            max={23}
            value={profile.notifHour}
            onChange={(e) => setProfile({ notifHour: Number(e.target.value) || 9 })}
          />
        </label>
        <div className="add-row">
          <button type="button" className="btn primary" onClick={() => void enableNotifs()}>
            {profile.notifications ? "Notifications on" : "Enable daily notification"}
          </button>
          {profile.notifications && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setProfile({ notifications: false })}
            >
              Turn off
            </button>
          )}
        </div>
        {notifMsg && <p className="status-line">{notifMsg}</p>}
      </section>

      {horoscope ? (
        <section className="card stars-card big">
          <p className="card-label">{horoscope.title}</p>
          <p className="stars-body large">{horoscope.body}</p>
          <div className="chip-row">
            <span className="chip">focus · {horoscope.focus}</span>
            <span className="chip">lucky · {horoscope.lucky}</span>
          </div>
        </section>
      ) : (
        <p className="empty">Add a birthday to unlock today’s reading.</p>
      )}

      <HumanDesignPanel />
    </div>
  );
}
