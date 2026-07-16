import { useEffect, useRef, useState } from "react";
import { useVision } from "../store";
import {
  DEFAULT_BRIDGE,
  DEFAULT_MUSE,
  buildMuseSystemPrompt,
  callMuse,
  checkMuseBridge,
  isHttpsPublicPage,
  isLoopbackBridgeUrl,
  normalizeMuseSettings,
  resolveBridgeUrl,
  suggestedBridgeUrl,
  type BridgeStatus,
} from "../lib/muse";
import type { MuseMessage } from "../types";
import { useI18n } from "../lib/useI18n";

function mid() {
  return `m_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
}

export function Muse() {
  const { t } = useI18n();
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

  const suggested = suggestedBridgeUrl();
  const effectiveUrl = resolveBridgeUrl(museSettings.proxyUrl);
  const onPhoneOrLan = !isLoopbackBridgeUrl(suggested);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Draft field tracks user edits; always seed from resolved (not raw loopback).
  const [bridgeUrl, setBridgeUrl] = useState(effectiveUrl);
  const [bridge, setBridge] = useState<BridgeStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep bridge URL resolved for Codex (phone LAN fix).
  useEffect(() => {
    if (museSettings.provider === "openai") return;
    const next = normalizeMuseSettings(museSettings);
    if (museSettings.proxyUrl !== next.proxyUrl) {
      setMuseSettings(next);
    }
    if (!editingUrl) {
      setBridgeUrl(next.proxyUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [museSettings.proxyUrl, museSettings.provider, editingUrl]);

  const pingBridge = async (url = effectiveUrl) => {
    setChecking(true);
    if (museSettings.provider === "openai") {
      setBridge({
        ok: Boolean(museSettings.apiKey?.trim()),
        detail: museSettings.apiKey?.trim()
          ? "OpenAI API key on this device"
          : undefined,
        error: museSettings.apiKey?.trim()
          ? undefined
          : "Add an OpenAI API key in Settings",
      });
      setChecking(false);
      return;
    }
    const st = await checkMuseBridge(url);
    setBridge(st);
    setChecking(false);
    return st;
  };

  useEffect(() => {
    void pingBridge(effectiveUrl);
    const t = window.setInterval(() => {
      void pingBridge(effectiveUrl);
    }, 12_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUrl, museSettings.provider, museSettings.apiKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [museMessages, busy]);

  const saveBridge = () => {
    const url = resolveBridgeUrl(bridgeUrl.trim() || suggested);
    setEditingUrl(false);
    setMuseSettings({
      ...museSettings,
      ...DEFAULT_MUSE,
      provider: museSettings.provider === "openai" ? "openai" : "codex",
      apiKey: museSettings.provider === "openai" ? museSettings.apiKey : "",
      proxyUrl: url,
    });
    setBridgeUrl(url);
    void pingBridge(url);
    setError("");
  };

  const useSuggested = () => {
    setEditingUrl(false);
    setBridgeUrl(suggested);
    setMuseSettings({
      ...museSettings,
      provider: "codex",
      proxyUrl: suggested,
    });
    void pingBridge(suggested);
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
      const settings = {
        ...DEFAULT_MUSE,
        ...museSettings,
        provider:
          museSettings.provider === "openai"
            ? ("openai" as const)
            : ("codex" as const),
        proxyUrl:
          museSettings.provider === "openai"
            ? museSettings.proxyUrl || resolveBridgeUrl("")
            : resolveBridgeUrl(museSettings.proxyUrl || bridgeUrl),
      };
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
        settings,
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
      void pingBridge();
    } finally {
      setBusy(false);
    }
  };

  const ready = bridge?.ok;

  const chips = [
    {
      label: t("muse.chip.soften"),
      prompt:
        "Look at my open goals and rewrite 3 of them as kinder, more magnetic intentions — short.",
    },
    {
      label: t("muse.chip.affirm"),
      prompt:
        "Write 5 fresh affirmations tailored to my board, goals, and Human Design if I have one.",
    },
    {
      label: t("muse.chip.journal"),
      prompt:
        "Give me one gentle journaling prompt for tonight based on what I'm working on, then ask me one follow-up question.",
    },
    {
      label: t("muse.chip.board"),
      prompt:
        "From the labels and themes on my vision board, what story am I telling about my future?",
    },
    {
      label: t("muse.chip.hd"),
      prompt:
        "Using my Human Design (if set), give me 3 tiny practices for today that match my strategy and authority.",
    },
  ];

  return (
    <div className="page muse-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{t("muse.eyebrow")}</p>
          <h1>{t("muse.title")}</h1>
        </div>
        <span className={`muse-status ${ready ? "on" : "off"}`}>
          {checking
            ? t("muse.checking")
            : ready
              ? museSettings.provider === "openai"
                ? "API ready"
                : t("muse.ready")
              : museSettings.provider === "openai"
                ? "Need API key"
                : t("muse.off")}
        </span>
      </header>
      <p className="lede tight">{t("muse.lede")}</p>

      <section className="card form-card muse-settings">
        <p className="card-label">{t("muse.connection")}</p>
        {!ready && (
          <ol className="muse-setup">
            <li>{t("muse.setup1")}</li>
            <li>
              <code>npm run muse-bridge</code>
            </li>
            <li>{t("muse.setup3")}</li>
          </ol>
        )}
        {onPhoneOrLan && (
          <p className="status-line muse-phone-hint">
            {t("muse.usingMac")} <code>{effectiveUrl}</code>
            {bridgeUrl.trim() !== suggested && (
              <>
                {" "}
                <button
                  type="button"
                  className="btn ghost tiny-btn"
                  onClick={useSuggested}
                >
                  {t("muse.resetAuto")}
                </button>
              </>
            )}
          </p>
        )}
        {isHttpsPublicPage() && (
          <p className="status-line" style={{ color: "var(--danger)" }}>
            {t("muse.httpsBlock")}
          </p>
        )}
        <label>
          {t("muse.bridgeUrl")}
          <input
            value={bridgeUrl}
            onChange={(e) => {
              setEditingUrl(true);
              setBridgeUrl(e.target.value);
            }}
            onBlur={() => {
              if (editingUrl) saveBridge();
            }}
            placeholder={suggested}
          />
        </label>
        <p className="muted tiny">
          {t("muse.autoDevice")} <code>{suggested}</code>
          <br />
          {t("muse.laptopOnly")} <code>{DEFAULT_BRIDGE}</code>
        </p>
        {bridge?.error && !ready && (
          <p className="status-line" style={{ color: "var(--danger)" }}>
            {bridge.error}
            {onPhoneOrLan && isLoopbackBridgeUrl(bridgeUrl) && (
              <> {t("muse.loopbackHint")}</>
            )}
          </p>
        )}
        {ready && bridge?.detail && (
          <p className="status-line">{bridge.detail}</p>
        )}
        <div className="add-row">
          <button type="button" className="btn primary" onClick={saveBridge}>
            {t("muse.saveCheck")}
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={checking}
            onClick={() => void pingBridge()}
          >
            {checking ? "…" : t("muse.recheck")}
          </button>
        </div>
      </section>

      <div className="muse-quick">
        {chips.map((q) => (
          <button
            key={q.label}
            type="button"
            className="chip muse-chip"
            disabled={busy || !ready}
            onClick={() => void send(q.prompt)}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="muse-chat card">
        {museMessages.length === 0 && (
          <p className="muse-empty">
            {ready ? t("muse.emptyReady") : t("muse.emptyOff")}
          </p>
        )}
        {museMessages.map((m) => (
          <div key={m.id} className={`muse-bubble ${m.role}`}>
            <span className="muse-role">
              {m.role === "user" ? t("muse.you") : t("nav.muse")}
            </span>
            <p>{m.content}</p>
            {m.role === "assistant" && (
              <button
                type="button"
                className="btn ghost tiny-btn"
                onClick={() => {
                  const line =
                    m.content
                      .split("\n")
                      .map((l) => l.replace(/^[\d.*\-•]+\s*/, "").trim())
                      .find((l) => l.length > 12 && l.length < 160) || "";
                  if (line) {
                    addAffirmation(line.replace(/^["“]|["”]$/g, ""));
                    setTab("affirm");
                  }
                }}
              >
                {t("muse.saveLine")}
              </button>
            )}
          </div>
        ))}
        {busy && (
          <div className="muse-bubble assistant">
            <span className="muse-role">{t("nav.muse")}</span>
            <p className="muted">{t("muse.listening")}</p>
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
          placeholder={
            ready ? t("muse.placeholderReady") : t("muse.placeholderOff")
          }
          disabled={!ready}
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
          disabled={busy || !input.trim() || !ready}
          onClick={() => void send(input)}
        >
          {t("muse.send")}
        </button>
      </div>

      {museMessages.length > 0 && (
        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: "0.5rem" }}
          onClick={() => clearMuseMessages()}
        >
          {t("muse.clear")}
        </button>
      )}
    </div>
  );
}
