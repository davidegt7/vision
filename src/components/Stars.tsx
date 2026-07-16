import { useEffect, useState } from "react";
import { useVision } from "../store";
import { SIGNS, dailyHoroscope, signFromBirthDate } from "../lib/astrology";
import { todayKey } from "../lib/prompts";
import type { ZodiacSign } from "../types";
import { HumanDesignPanel } from "./HumanDesign";
import { useI18n } from "../lib/useI18n";

export function Stars() {
  const { t } = useI18n();
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
      setNotifMsg(t("stars.notifUnsupported"));
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setProfile({ notifications: true });
      setNotifMsg(t("stars.notifGranted"));
      const s = sign || auto;
      if (s) {
        const h = dailyHoroscope(s, todayKey());
        new Notification("vision", { body: h.body.slice(0, 100) });
      }
    } else {
      setNotifMsg(t("stars.notifDenied"));
      setProfile({ notifications: false });
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{t("stars.eyebrow")}</p>
          <h1>{t("stars.title")}</h1>
        </div>
      </header>
      <p className="lede tight">{t("stars.lede")}</p>

      <section className="card form-card">
        <label>
          {t("stars.name")}
          <input
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
            placeholder={t("stars.namePh")}
          />
        </label>
        <label>
          {t("stars.birthday")}
          <input
            type="date"
            value={profile.birthDate}
            onChange={(e) => setProfile({ birthDate: e.target.value, sign: undefined })}
          />
        </label>
        <label>
          {t("stars.sign")}
          <select
            value={profile.sign || auto || ""}
            onChange={(e) =>
              setProfile({
                sign: (e.target.value || undefined) as ZodiacSign | undefined,
              })
            }
          >
            <option value="">{t("stars.autoSign")}</option>
            {SIGNS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.label} · {s.dates}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("stars.notifHour")}
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
            {profile.notifications ? t("stars.notifOn") : t("stars.notifEnable")}
          </button>
          {profile.notifications && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setProfile({ notifications: false })}
            >
              {t("stars.notifOff")}
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
