import { useMemo, useState } from "react";
import { useVision } from "../store";
import {
  HD_AUTHORITIES,
  HD_PROFILES,
  HD_TYPES,
  centerLabel,
  chartFromManual,
  computeHumanDesign,
  type HDCenterId,
  type HDType,
  type HumanDesignChart,
} from "../lib/humanDesign";
import type { HumanDesignProfile } from "../types";

function toProfile(chart: HumanDesignChart, source: "computed" | "manual"): HumanDesignProfile {
  return {
    type: chart.type,
    strategy: chart.strategy,
    authority: chart.authority,
    profile: chart.profile,
    definition: chart.definition,
    notSelf: chart.notSelf,
    signature: chart.signature,
    consciousSun: chart.consciousSun,
    unconsciousSun: chart.unconsciousSun,
    definedChannels: chart.definedChannels,
    centers: chart.centers,
    approximate: chart.approximate,
    notes: chart.notes,
    birthLocal: chart.birthLocal,
    computedAt: chart.computedAt,
    source,
  };
}

const CENTER_ORDER: HDCenterId[] = [
  "head",
  "ajna",
  "throat",
  "g",
  "heart",
  "sacral",
  "spleen",
  "solar",
  "root",
];

export function HumanDesignPanel() {
  const profile = useVision((s) => s.profile);
  const setProfile = useVision((s) => s.setProfile);
  const hd = profile.humanDesign;

  const [mode, setMode] = useState<"compute" | "manual">("compute");
  const [time, setTime] = useState(profile.birthTime || "12:00");
  const [place, setPlace] = useState(profile.birthPlace || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Manual entry
  const [mType, setMType] = useState<HDType>("Generator");
  const [mProfile, setMProfile] = useState("1/3");
  const [mAuth, setMAuth] = useState(HD_AUTHORITIES[1]!);

  const localOffset = useMemo(() => -new Date().getTimezoneOffset(), []);

  const runCompute = () => {
    setError("");
    if (!profile.birthDate) {
      setError("Add your birth date above in Astrology first (or below).");
      return;
    }
    setBusy(true);
    try {
      const chart = computeHumanDesign({
        birthDate: profile.birthDate,
        birthTime: time || undefined,
        tzOffsetMinutes: profile.birthTzOffsetMinutes ?? localOffset,
      });
      setProfile({
        birthTime: time,
        birthPlace: place,
        birthTzOffsetMinutes: profile.birthTzOffsetMinutes ?? localOffset,
        humanDesign: toProfile(chart, "computed"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const runManual = () => {
    const chart = chartFromManual({
      type: mType,
      profile: mProfile,
      authority: mAuth,
    });
    setProfile({ humanDesign: toProfile(chart, "manual") });
  };

  const clear = () => setProfile({ humanDesign: null });

  return (
    <section className="hd-section">
      <header className="page-head" style={{ marginTop: "1.5rem" }}>
        <div>
          <p className="eyebrow">Human Design</p>
          <h2 className="hd-title">Your bodygraph basics</h2>
        </div>
      </header>
      <p className="lede tight">
        Save your type, strategy, authority & profile in vision — so it’s with your
        board and journal, not lost in another app.
      </p>

      {hd && (
        <div className="card hd-chart">
          <div className="hd-type-row">
            <span className="hd-type">{hd.type}</span>
            <span className="chip">Profile {hd.profile}</span>
            {hd.approximate && <span className="chip">approx</span>}
            {hd.source === "manual" && <span className="chip">manual</span>}
          </div>
          <dl className="hd-dl">
            <div>
              <dt>Strategy</dt>
              <dd>{hd.strategy}</dd>
            </div>
            <div>
              <dt>Authority</dt>
              <dd>{hd.authority}</dd>
            </div>
            <div>
              <dt>Definition</dt>
              <dd>{hd.definition}</dd>
            </div>
            <div>
              <dt>Signature</dt>
              <dd>{hd.signature}</dd>
            </div>
            <div>
              <dt>Not-self</dt>
              <dd>{hd.notSelf}</dd>
            </div>
            <div>
              <dt>Sun (P / D)</dt>
              <dd>
                {hd.consciousSun} / {hd.unconsciousSun}
              </dd>
            </div>
          </dl>

          {hd.definedChannels.length > 0 && (
            <div className="hd-channels">
              <p className="card-label">Defined channels</p>
              <div className="chip-row">
                {hd.definedChannels.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(hd.centers || {}).length > 0 && (
            <div className="hd-centers">
              <p className="card-label">Centers</p>
              <div className="center-grid">
                {CENTER_ORDER.map((id) => (
                  <span
                    key={id}
                    className={`center-pill ${hd.centers[id] ? "on" : "off"}`}
                  >
                    {centerLabel(id)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hd.notes?.length > 0 && (
            <ul className="hd-notes">
              {hd.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}

          <button type="button" className="btn ghost" onClick={clear}>
            Clear chart
          </button>
        </div>
      )}

      <div className="hd-mode-toggle">
        <button
          type="button"
          className={mode === "compute" ? "on" : ""}
          onClick={() => setMode("compute")}
        >
          Calculate
        </button>
        <button
          type="button"
          className={mode === "manual" ? "on" : ""}
          onClick={() => setMode("manual")}
        >
          I know my chart
        </button>
      </div>

      {mode === "compute" ? (
        <section className="card form-card">
          <p className="hint" style={{ marginTop: 0 }}>
            Uses your birth date, time & timezone. Time matters a lot in Human
            Design — noon is only a rough start.
          </p>
          <label>
            Birth date
            <input
              type="date"
              value={profile.birthDate}
              onChange={(e) => setProfile({ birthDate: e.target.value })}
            />
          </label>
          <label>
            Birth time (local)
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label>
            Place (optional label)
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="City, country"
            />
          </label>
          <label>
            Timezone offset (minutes east of UTC)
            <input
              type="number"
              value={profile.birthTzOffsetMinutes ?? localOffset}
              onChange={(e) =>
                setProfile({ birthTzOffsetMinutes: Number(e.target.value) })
              }
            />
          </label>
          <p className="muted tiny">
            Your browser offset right now: {localOffset} (e.g. US Eastern winter ≈
            −300). Adjust if you were born in another zone.
          </p>
          {error && <p className="status-line" style={{ color: "var(--danger)" }}>{error}</p>}
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={runCompute}
          >
            {busy ? "Calculating…" : hd ? "Recalculate chart" : "Generate my chart"}
          </button>
        </section>
      ) : (
        <section className="card form-card">
          <p className="hint" style={{ marginTop: 0 }}>
            Already know your design from another site? Enter it here and keep it
            next to your vision board.
          </p>
          <label>
            Type
            <select
              value={mType}
              onChange={(e) => setMType(e.target.value as HDType)}
            >
              {HD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Profile
            <select value={mProfile} onChange={(e) => setMProfile(e.target.value)}>
              {HD_PROFILES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            Authority
            <select value={mAuth} onChange={(e) => setMAuth(e.target.value)}>
              {HD_AUTHORITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn primary" onClick={runManual}>
            Save my chart
          </button>
        </section>
      )}
    </section>
  );
}
