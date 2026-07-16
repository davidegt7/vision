import { useEffect, useMemo, useState } from "react";
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
import {
  US_STATES,
  birthOffsetMinutes,
  citiesInState,
  findCityByLabel,
  formatUtcOffset,
  searchBirthCities,
  type BirthCity,
} from "../lib/cities";

function toProfile(
  chart: HumanDesignChart,
  source: "computed" | "manual",
): HumanDesignProfile {
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
  const initialCity = profile.birthPlace
    ? findCityByLabel(profile.birthPlace) ?? null
    : null;
  const [selectedState, setSelectedState] = useState(
    initialCity?.state || "",
  );
  const [selectedCity, setSelectedCity] = useState<BirthCity | null>(
    initialCity,
  );
  const [cityQuery, setCityQuery] = useState(initialCity?.city || "");
  const [showCityList, setShowCityList] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [mType, setMType] = useState<HDType>("Generator");
  const [mProfile, setMProfile] = useState("1/3");
  const [mAuth, setMAuth] = useState(HD_AUTHORITIES[1]!);

  const localOffset = useMemo(() => -new Date().getTimezoneOffset(), []);

  const citiesForState = useMemo(
    () => (selectedState ? citiesInState(selectedState) : []),
    [selectedState],
  );

  const citySuggestions = useMemo(
    () =>
      selectedState
        ? searchBirthCities(cityQuery, 12, selectedState)
        : [],
    [cityQuery, selectedState],
  );

  const resolvedZone =
    selectedCity?.timeZone || profile.birthTimeZone || "";

  const autoOffset = useMemo(() => {
    if (!resolvedZone || !profile.birthDate) {
      return selectedCity
        ? birthOffsetMinutes(selectedCity.timeZone, "2000-06-15", time)
        : localOffset;
    }
    return birthOffsetMinutes(resolvedZone, profile.birthDate, time || "12:00");
  }, [resolvedZone, profile.birthDate, time, selectedCity, localOffset]);

  useEffect(() => {
    if (profile.birthPlace) {
      const found = findCityByLabel(profile.birthPlace);
      if (found) {
        setSelectedCity(found);
        setSelectedState(found.state);
        setCityQuery(found.city);
      }
    }
  }, [profile.birthPlace]);

  const pickState = (code: string) => {
    setSelectedState(code);
    setSelectedCity(null);
    setCityQuery("");
    setShowCityList(false);
  };

  const pickCity = (city: BirthCity) => {
    setSelectedCity(city);
    setSelectedState(city.state);
    setCityQuery(city.city);
    setShowCityList(false);
    const off = profile.birthDate
      ? birthOffsetMinutes(city.timeZone, profile.birthDate, time || "12:00")
      : birthOffsetMinutes(city.timeZone, "2000-06-15", "12:00");
    setProfile({
      birthPlace: city.label,
      birthTimeZone: city.timeZone,
      birthTzOffsetMinutes: off,
    });
  };

  const runCompute = () => {
    setError("");
    if (!profile.birthDate) {
      setError("Add your birth date first.");
      return;
    }
    if (!selectedState) {
      setError("Select a US state first.");
      return;
    }
    if (!selectedCity) {
      setError("Select a city in that state.");
      return;
    }
    const zone = selectedCity.timeZone;
    const offset = birthOffsetMinutes(
      zone,
      profile.birthDate,
      time || "12:00",
    );
    setBusy(true);
    try {
      const placeLabel = selectedCity.label;
      const chart = computeHumanDesign({
        birthDate: profile.birthDate,
        birthTime: time || undefined,
        tzOffsetMinutes: offset,
        birthPlace: placeLabel,
        birthTimeZone: zone,
      });
      setProfile({
        birthTime: time,
        birthPlace: placeLabel,
        birthTimeZone: zone,
        birthTzOffsetMinutes: offset,
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
        Save your type, strategy, authority & profile in vision — with your
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
          {(profile.birthPlace || profile.birthTimeZone || hd.birthLocal) && (
            <p className="hd-birth-meta">
              {[
                profile.birthPlace && `📍 ${profile.birthPlace}`,
                profile.birthTimeZone &&
                  profile.birthTimeZone.replace(/_/g, " "),
                hd.birthLocal && hd.birthLocal.replace("T", " · "),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
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
            {(profile.birthPlace || profile.birthTimeZone) && (
              <div>
                <dt>Birth city</dt>
                <dd>
                  {profile.birthPlace || "—"}
                  {profile.birthTimeZone
                    ? ` (${profile.birthTimeZone.replace(/_/g, " ")})`
                    : ""}
                </dd>
              </div>
            )}
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
        <section className="card form-card hd-compute-form">
          <p className="hint" style={{ marginTop: 0 }}>
            USA only for now — pick your <strong>state</strong>, then the{" "}
            <strong>city</strong> you were born in. That sets timezone for the
            chart.
          </p>

          <label className="hd-city-field">
            <span className="hd-field-title">1. State</span>
            <select
              className="hd-city-select"
              value={selectedState}
              onChange={(e) => pickState(e.target.value)}
            >
              <option value="">Select a state…</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>

          <label className="hd-city-field">
            <span className="hd-field-title">2. City</span>
            <select
              className="hd-city-select"
              value={selectedCity?.label || ""}
              disabled={!selectedState}
              onChange={(e) => {
                const city = citiesForState.find(
                  (c) => c.label === e.target.value,
                );
                if (city) pickCity(city);
              }}
            >
              <option value="">
                {selectedState ? "Select a city…" : "Pick a state first…"}
              </option>
              {citiesForState.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.city}
                </option>
              ))}
            </select>
          </label>

          {selectedState && (
            <>
              <label className="hd-city-label">
                <span className="muted tiny">Or search cities in this state</span>
                <input
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setShowCityList(true);
                    const match = citiesForState.find(
                      (c) =>
                        c.city.toLowerCase() ===
                        e.target.value.trim().toLowerCase(),
                    );
                    if (match) pickCity(match);
                    else if (
                      selectedCity &&
                      e.target.value !== selectedCity.city
                    ) {
                      setSelectedCity(null);
                    }
                  }}
                  onFocus={() => setShowCityList(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowCityList(false), 180);
                  }}
                  placeholder="Type a city name…"
                  autoComplete="off"
                  disabled={!selectedState}
                />
              </label>

              {showCityList && citySuggestions.length > 0 && (
                <ul className="hd-city-list" role="listbox">
                  {citySuggestions.map((c) => (
                    <li key={c.label}>
                      <button
                        type="button"
                        className="hd-city-option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickCity(c)}
                      >
                        <span className="hd-city-name">{c.city}</span>
                        <span className="hd-city-tz muted tiny">
                          {c.timeZone.replace(/_/g, " ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {citiesForState.length > 0 && (
                <div className="hd-city-chips">
                  {citiesForState.slice(0, 8).map((c) => {
                    const on = selectedCity?.label === c.label;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        className={`chip hd-city-chip ${on ? "on" : ""}`}
                        onClick={() => pickCity(c)}
                      >
                        {c.city}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {selectedCity && (
            <div className="hd-tz-auto">
              <p className="hd-tz-line">
                <strong>Timezone from city</strong>
              </p>
              <p className="hd-tz-line">
                {selectedCity.label}
                {" · "}
                {selectedCity.timeZone.replace(/_/g, " ")}
                {" · "}
                <strong>{formatUtcOffset(autoOffset)}</strong>
                {profile.birthDate ? " on your birth date" : ""}
              </p>
            </div>
          )}

          <label>
            Birth date
            <input
              type="date"
              value={profile.birthDate}
              onChange={(e) => setProfile({ birthDate: e.target.value })}
            />
          </label>
          <label>
            Birth time (local at that city)
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>

          {error && (
            <p className="status-line" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={runCompute}
          >
            {busy
              ? "Calculating…"
              : hd
                ? "Recalculate chart"
                : "Generate my chart"}
          </button>
        </section>
      ) : (
        <section className="card form-card">
          <p className="hint" style={{ marginTop: 0 }}>
            Already know your design from another site? Enter it here and keep
            it next to your vision board.
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
            <select
              value={mProfile}
              onChange={(e) => setMProfile(e.target.value)}
            >
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
