import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { persistedSlice, useVision } from "../store";
import { AppearancePicker } from "./AppearancePicker";
import { LanguagePicker } from "./LanguagePicker";
import {
  DEFAULT_BRIDGE,
  DEFAULT_MUSE,
  checkMuseBridge,
  resolveBridgeUrl,
  suggestedBridgeUrl,
} from "../lib/muse";
import {
  countsOf,
  describeCounts,
  downloadBackup,
  formatBytes,
  parseBackup,
  restoreBackup,
} from "../lib/backup";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState("");

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

  const onExport = () => {
    try {
      const { name, bytes } = downloadBackup();
      setBackupStatus(`Saved ${name} · ${formatBytes(bytes)}`);
    } catch {
      setBackupStatus("Couldn’t save the file — your board images may be too large.");
    }
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // so picking the same file twice still fires
    if (!file) return;
    setBackupStatus("");
    try {
      const parsed = parseBackup(await file.text());
      const incoming = describeCounts(countsOf(parsed.data));
      const here = describeCounts(countsOf(persistedSlice(useVision.getState())));
      const when = new Date(parsed.exportedAt);
      const savedOn = Number.isNaN(when.getTime())
        ? "this backup"
        : `the backup from ${when.toLocaleDateString()}`;
      const ok = window.confirm(
        `Restore ${savedOn}?\n\nWhat’s on this device now (${here}) will be replaced by what’s in the file (${incoming}).\n\nThis can’t be undone.`,
      );
      if (!ok) {
        setBackupStatus("Nothing changed.");
        return;
      }
      setBackupStatus(`Restored ${describeCounts(restoreBackup(parsed))}.`);
    } catch (err) {
      setBackupStatus(
        err instanceof Error ? err.message : "Couldn’t read that file.",
      );
    }
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

      {/* Backup */}
      <section className="card form-card">
        <p className="card-label">Backup</p>
        <p className="hint" style={{ marginTop: 0 }}>
          Your boards, goals, journal and affirmations live only in this
          browser. Clearing site data — or losing this phone — takes them with
          it. Saving a file now means you can always come back.
        </p>

        <div className="add-row" style={{ marginTop: "0.75rem" }}>
          <button type="button" className="btn primary" onClick={onExport}>
            Save a backup
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => fileRef.current?.click()}
          >
            Restore from file
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void onPickFile(e)}
        />
        <p className="muted tiny">
          Restoring replaces everything on this device — you’ll see what changes
          before it happens. Your Muse API key isn’t written to the file.
        </p>
        {backupStatus && <p className="status-line">{backupStatus}</p>}
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
