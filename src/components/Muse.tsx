import { useEffect, useRef, useState } from "react";
import { useVision } from "../store";
import {
  DEFAULT_MUSE,
  MUSE_PROVIDERS,
  MUSE_QUICK,
  buildMuseSystemPrompt,
  callMuse,
} from "../lib/muse";
import type { MuseMessage, MuseProviderId, MuseSettings } from "../types";

function mid() {
  return `m_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
}

export function Muse() {
  const setTab = useVision((s) => s.setTab);
  const profile = useVision((s) => s.profile);
  const board = useVision((s) => s.activeBoard());
  const goals = useVision((s) => s.goals);
  const affirmations = useVision((s) => s.affirmations);
  const journal = useVision((s) => s.journal);
  const museSettings = useVision((s) => s.museSettings);
  const setMuseSettings = useVision((s) => s.setMuseSettings);
  const museMessages = useVision((s) => s.museMessages);
  const pushMuseMessage = useVision((s) => s.pushMuseMessage);
  const clearMuseMessages = useVision((s) => s.clearMuseMessages);
  const addAffirmation = useVision((s) => s.addAffirmation);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(!museSettings.apiKey);
  const [draft, setDraft] = useState<MuseSettings>(museSettings);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(museSettings);
  }, [museSettings]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [museMessages, busy]);

  const saveSettings = () => {
    const next = {
      ...draft,
      model:
        draft.model.trim() ||
        MUSE_PROVIDERS[draft.provider].defaultModel,
    };
    setMuseSettings(next);
    setShowSettings(false);
    setError("");
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setError("");
    setInput("");
    const userMsg: MuseMessage = {
      id: mid(),
      role: "user",
      content,
      at: new Date().toISOString(),
    };
    pushMuseMessage(userMsg);
    setBusy(true);
    try {
      const system = buildMuseSystemPrompt({
        name: profile.name,
        profile,
        board,
        goals,
        affirmations,
        journal,
        hd: profile.humanDesign,
      });
      const history = [...museMessages, userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-16)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const reply = await callMuse({
        settings: museSettings.apiKey ? museSettings : draft,
        messages: [{ role: "system", content: system }, ...history],
      });

      pushMuseMessage({
        id: mid(),
        role: "assistant",
        content: reply,
        at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const provider = MUSE_PROVIDERS[draft.provider];

  return (
    <div className="page muse-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Muse</p>
          <h1>Your soft AI ally</h1>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setShowSettings((v) => !v)}
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      </header>
      <p className="lede tight">
        Chat about your board, goals, affirmations, journal, or Human Design.
        Use <strong>your</strong> ChatGPT / OpenRouter / Grok key — it stays on
        this device.
      </p>

      {showSettings && (
        <section className="card form-card muse-settings">
          <p className="card-label">Connect your model</p>
          <label>
            Provider
            <select
              value={draft.provider}
              onChange={(e) => {
                const provider = e.target.value as MuseProviderId;
                setDraft((d) => ({
                  ...d,
                  provider,
                  model: MUSE_PROVIDERS[provider].defaultModel,
                  baseUrl: "",
                }));
              }}
            >
              {(Object.keys(MUSE_PROVIDERS) as MuseProviderId[]).map((id) => (
                <option key={id} value={id}>
                  {MUSE_PROVIDERS[id].label}
                </option>
              ))}
            </select>
          </label>
          <p className="muted tiny">{provider.hint}</p>
          <label>
            API key
            <input
              type="password"
              autoComplete="off"
              placeholder="sk-… (stored only on this phone/browser)"
              value={draft.apiKey}
              onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
            />
          </label>
          <label>
            Model
            <input
              value={draft.model}
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
              placeholder={provider.defaultModel}
            />
          </label>
          <label>
            Base URL (optional)
            <input
              value={draft.baseUrl}
              onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
              placeholder={provider.defaultBase}
            />
          </label>
          <label>
            Proxy URL (optional)
            <input
              value={draft.proxyUrl}
              onChange={(e) =>
                setDraft((d) => ({ ...d, proxyUrl: e.target.value }))
              }
              placeholder="Leave empty — uses /api/muse on Vercel"
            />
          </label>
          <p className="muted tiny">
            On GitHub Pages, OpenAI blocks direct browser calls. Easiest path:
            deploy this same repo to{" "}
            <a href="https://vercel.com" target="_blank" rel="noreferrer">
              Vercel
            </a>{" "}
            (free) so Muse can use a private proxy — or paste a proxy URL you
            trust.
          </p>
          <div className="add-row">
            <button type="button" className="btn primary" onClick={saveSettings}>
              Save Muse settings
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setDraft(DEFAULT_MUSE);
                setMuseSettings(DEFAULT_MUSE);
              }}
            >
              Clear key
            </button>
          </div>
        </section>
      )}

      <div className="muse-quick">
        {MUSE_QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            className="chip muse-chip"
            disabled={busy}
            onClick={() => void send(q.prompt)}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="muse-chat card">
        {museMessages.length === 0 && (
          <p className="muse-empty">
            Say hi, or tap a chip above. Muse can see your board labels, open
            goals, favorite affirmations, journal snippets, and Human Design —
            only on this device.
          </p>
        )}
        {museMessages.map((m) => (
          <div key={m.id} className={`muse-bubble ${m.role}`}>
            <span className="muse-role">
              {m.role === "user" ? "You" : "Muse"}
            </span>
            <p>{m.content}</p>
            {m.role === "assistant" && m.content.includes("I ") && (
              <button
                type="button"
                className="btn ghost tiny-btn"
                onClick={() => {
                  // grab first line that looks like an affirmation
                  const line =
                    m.content
                      .split("\n")
                      .map((l) => l.replace(/^[\d.*\-]+\s*/, "").trim())
                      .find((l) => l.length > 12 && l.length < 160) || "";
                  if (line) {
                    addAffirmation(line.replace(/^["“]|["”]$/g, ""));
                    setTab("affirm");
                  }
                }}
              >
                Save a line to affirmations
              </button>
            )}
          </div>
        ))}
        {busy && (
          <div className="muse-bubble assistant">
            <span className="muse-role">Muse</span>
            <p className="muted">Listening…</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="status-line" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="muse-composer">
        <textarea
          rows={2}
          value={input}
          placeholder="Ask Muse anything soft or strategic…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <button
          type="button"
          className="btn primary"
          disabled={busy || !input.trim()}
          onClick={() => void send(input)}
        >
          Send
        </button>
      </div>

      {museMessages.length > 0 && (
        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: "0.5rem" }}
          onClick={() => clearMuseMessages()}
        >
          Clear conversation
        </button>
      )}
    </div>
  );
}
