import { useEffect, useState } from "react";
import { useVision } from "../store";
import { AppearancePicker } from "./AppearancePicker";
import { LanguagePicker } from "./LanguagePicker";
import {
  DEFAULT_BRIDGE,
  DEFAULT_MUSE,
  checkMuseBridge,
  resolveBridgeUrl,
  suggestedBridgeUrl,
} from "../lib/muse";
import type { MuseProviderId } from "../types";

/**
 * Settings hub: look & feel, language, Muse / ChatGPT connection.
 */
export function Settings() {
  const museSettings = useVision((s) => s.museSettings);
  const setMuseSettings = useVision((s) => s.setMuseSettings);
  const profile = useVision((s) => s.profile);

  const [bridgeUrl, setBridgeUrl] = useState(
    () => resolveBridgeUrl(museSettings.proxyUrl),
  );
  const [apiKey, setApiKey] = useState(museSettings.apiKey || "");
  const [model, setModel] = useState(
    museSettings.model && museSettings.model !== "codex"
      ? museSettings.model
      : "gpt-4o-mini",
  );
  const [provider, setProvider] = useState<MuseProviderId>(
    museSettings.provider === "openai" ? "openai" : "codex",
  );
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setBridgeUrl(resolveBridgeUrl(museSettings.proxyUrl));
    setApiKey(museSettings.apiKey || "");
    if (museSettings.provider === "openai") setProvider("openai");
  }, [museSettings.proxyUrl, museSettings.apiKey, museSettings.provider]);

  const saveMuse = async () => {
    setChecking(true);
    setStatus("");
    const next = {
      ...DEFAULT_MUSE,
      ...museSettings,
      provider,
      apiKey: provider === "openai" ? apiKey.trim() : "",
      model: provider === "openai" ? model.trim() || "gpt-4o-mini" : "codex",
      proxyUrl:
        provider === "codex"
          ? bridgeUrl.trim() || suggestedBridgeUrl()
          : museSettings.proxyUrl || "",
    };
    setMuseSettings(next);

    if (provider === "codex") {
      const st = await checkMuseBridge(next.proxyUrl);
      setStatus(
        st.ok
          ? "Codex bridge ready"
          : st.error || "Bridge not reachable — run npm run muse-bridge",
      );
    } else {
      setStatus(
        next.apiKey
          ? "OpenAI key saved on this device only. Muse will use the API (via bridge or /api/muse)."
          : "Paste an OpenAI API key to use cloud Muse.",
      );
    }
    setChecking(false);
  };

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Your setup</h1>
        </div>
      </header>
      <p className="lede tight">
        Colors, language, and how Muse talks to ChatGPT / OpenAI.
      </p>

      {/* Look */}
      <AppearancePicker />

      {/* Language */}
      <section className="card form-card">
        <LanguagePicker />
      </section>

      {/* Muse / ChatGPT */}
      <section className="card form-card">
        <p className="card-label">Muse · ChatGPT connection</p>
        <p className="hint" style={{ marginTop: 0 }}>
          There is no way for a normal website to “log into the ChatGPT app”
          itself. Two real options:
        </p>
        <ul className="settings-list">
          <li>
            <strong>Codex CLI</strong> (default) — uses your ChatGPT paid plan
            via <code>codex login</code> on your Mac. Free of API bills; needs
            the Muse bridge running.
          </li>
          <li>
            <strong>OpenAI API key</strong> — paid per token at{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
            >
              platform.openai.com
            </a>
            . Works without Codex limits; key stays only on this device.
          </li>
        </ul>

        <p className="muted tiny" style={{ margin: "0.75rem 0 0.5rem" }}>
          Backend
        </p>
        <div className="appear-mode-row">
          <button
            type="button"
            className={`appear-mode-pill ${provider === "codex" ? "on" : ""}`}
            onClick={() => setProvider("codex")}
          >
            Codex CLI
          </button>
          <button
            type="button"
            className={`appear-mode-pill ${provider === "openai" ? "on" : ""}`}
            onClick={() => setProvider("openai")}
          >
            OpenAI API
          </button>
        </div>

        {provider === "codex" ? (
          <>
            <label style={{ marginTop: "0.85rem" }}>
              Bridge URL
              <input
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder={DEFAULT_BRIDGE}
              />
            </label>
            <p className="muted tiny">
              Laptop: <code>{DEFAULT_BRIDGE}</code>
              <br />
              Phone (same Wi‑Fi):{" "}
              <code>http://&lt;mac-ip&gt;:5199/v1/muse</code>
              <br />
              Mac terminal: <code>cd vision && npm run muse-bridge</code>
            </p>
          </>
        ) : (
          <>
            <label style={{ marginTop: "0.85rem" }}>
              OpenAI API key
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
              />
            </label>
            <label>
              Model
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gpt-4o-mini">gpt-4o-mini (cheap)</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-4.1">gpt-4.1</option>
              </select>
            </label>
            <p className="muted tiny">
              Key never leaves this browser except when Muse sends a chat
              (through your Mac bridge or a deployed <code>/api/muse</code>{" "}
              proxy). Not the same as ChatGPT Plus — this is platform billing.
            </p>
          </>
        )}

        <div className="add-row" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="btn primary"
            disabled={checking}
            onClick={() => void saveMuse()}
          >
            {checking ? "…" : "Save Muse settings"}
          </button>
        </div>
        {status && <p className="status-line">{status}</p>}
      </section>

      <section className="card form-card">
        <p className="card-label">About this device</p>
        <p className="muted tiny" style={{ margin: 0 }}>
          Profile name: {profile.name?.trim() || "—"}
          <br />
          Data stays in this browser’s storage (boards, journal, keys).
        </p>
      </section>
    </div>
  );
}
