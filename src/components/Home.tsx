import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useVision } from "../store";
import { dailyHoroscope, SIGNS } from "../lib/astrology";
import { todayKey } from "../lib/prompts";
import {
  DEFAULT_MUSE,
  buildMuseSystemPrompt,
  callMuse,
  resolveBridgeUrl,
} from "../lib/muse";
import {
  affirmationForDay,
  formatTodayDate,
  hdTodayOneLiner,
  isEveningHours,
  mergeEveningBody,
  parseEveningLines,
} from "../lib/today";
import { useI18n } from "../lib/useI18n";

function TodayCard({
  className,
  icon,
  label,
  children,
  onClick,
}: {
  className: string;
  icon: string;
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <section
      className={`card today-card ${className}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive ? (e) => e.key === "Enter" && onClick?.() : undefined
      }
    >
      <div className="today-card-inner">
        <div className="today-card-main">
          <p className="card-label">{label}</p>
          {children}
        </div>
        <span className="today-icon" aria-hidden>
          {icon}
        </span>
      </div>
    </section>
  );
}

export function Home() {
  const { t } = useI18n();
  const setTab = useVision((s) => s.setTab);
  const profile = useVision((s) => s.profile);
  const goals = useVision((s) => s.goals);
  const affirmations = useVision((s) => s.affirmations);
  const journal = useVision((s) => s.journal);
  const board = useVision((s) => s.activeBoard());
  const todayEntry = useVision((s) => s.todayEntry);
  const todayPrompt = useVision((s) => s.todayPrompt);
  const saveJournal = useVision((s) => s.saveJournal);
  const museSettings = useVision((s) => s.museSettings);
  const pushMuseMessage = useVision((s) => s.pushMuseMessage);
  const museMessages = useVision((s) => s.museMessages);
  const sign = useVision((s) => s.resolvedSign)();

  const name = profile.name?.trim() || t("common.dreamer");
  const hd = profile.humanDesign;
  const hdLine = hdTodayOneLiner(hd);
  const horoscope = sign ? dailyHoroscope(sign, todayKey()) : null;
  const signMeta = SIGNS.find((x) => x.id === sign);

  const boardPreview = useMemo(() => {
    const images = board.items
      .filter((it) => it.kind === "image" || it.src)
      .filter((it) => it.src)
      .slice(0, 6);
    const texts = board.items
      .filter((it) => it.kind === "text" || (!it.src && it.label))
      .map((it) => it.label)
      .filter(Boolean)
      .slice(0, 3);
    return { images, texts, count: board.items.length };
  }, [board.items]);

  const [affSalt, setAffSalt] = useState(0);
  const affirmation = useMemo(
    () => affirmationForDay(affirmations, affSalt),
    [affirmations, affSalt],
  );

  const [museBusy, setMuseBusy] = useState(false);
  const [museReply, setMuseReply] = useState("");
  const [museError, setMuseError] = useState("");

  const [evening, setEvening] = useState(() =>
    parseEveningLines(todayEntry()?.body || ""),
  );
  const [eveningSaved, setEveningSaved] = useState(false);

  useEffect(() => {
    setEvening(parseEveningLines(todayEntry()?.body || ""));
  }, [todayEntry]);

  const eveningFocus = isEveningHours();

  const runMuse10 = async () => {
    setMuseError("");
    setMuseBusy(true);
    const userContent = t("today.musePrompt");
    const at = new Date().toISOString();
    pushMuseMessage({
      id: `m_${Date.now().toString(16)}_u`,
      role: "user",
      content: userContent,
      at,
    });
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
            : resolveBridgeUrl(museSettings.proxyUrl),
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
      const history = [
        ...museMessages,
        { role: "user" as const, content: userContent },
      ]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const reply = await callMuse({
        settings,
        messages: [{ role: "system", content: system }, ...history],
      });
      setMuseReply(reply);
      pushMuseMessage({
        id: `m_${Date.now().toString(16)}_a`,
        role: "assistant",
        content: reply,
        at: new Date().toISOString(),
      });
    } catch (e) {
      setMuseError(e instanceof Error ? e.message : String(e));
    } finally {
      setMuseBusy(false);
    }
  };

  const saveEvening = () => {
    const next = mergeEveningBody(todayEntry()?.body || "", evening);
    saveJournal(next, todayEntry()?.prompt || todayPrompt());
    setEveningSaved(true);
    window.setTimeout(() => setEveningSaved(false), 1600);
  };

  return (
    <div className="page home today-page">
      <header className="page-hero today-hero">
        <div className="today-hero-row">
          <p className="eyebrow">
            {t("today.eyebrow", { date: formatTodayDate() })}
          </p>
          <button
            type="button"
            className="btn ghost tiny-btn"
            onClick={() => setTab("settings")}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
        <h1>
          {t("today.hey", { name })}
          <span className="spark">.</span>
        </h1>
      </header>

      {/* 1 · Vision board — primary */}
      <TodayCard
        className="today-board"
        icon="✨"
        label={t("today.boardLabel")}
        onClick={() => setTab("board")}
      >
        <p className="today-board-name">{board.name}</p>
        {boardPreview.count === 0 ? (
          <p className="today-line muted">{t("today.boardEmpty")}</p>
        ) : (
          <>
            {boardPreview.images.length > 0 && (
              <div className="today-board-thumbs">
                {boardPreview.images.map((it) => (
                  <div
                    key={it.id}
                    className="today-board-thumb"
                    style={{ backgroundImage: `url(${it.src})` }}
                  />
                ))}
              </div>
            )}
            {boardPreview.texts.length > 0 && (
              <p className="today-board-texts">
                {boardPreview.texts.join(" · ")}
              </p>
            )}
            <p className="muted tiny today-board-meta">
              {t("today.boardMeta", { count: boardPreview.count })}
            </p>
          </>
        )}
      </TodayCard>

      {/* 2 · Stars — full daily reading snapshot */}
      <TodayCard
        className="stars-card"
        icon={signMeta?.emoji || "⋆"}
        label={t("today.starLabel")}
        onClick={() => setTab("stars")}
      >
        {horoscope && signMeta ? (
          <>
            <p className="today-stars-sign">
              {signMeta.emoji} {signMeta.label}
            </p>
            <p className="today-stars-body">{horoscope.body}</p>
            <div className="today-stars-chips">
              <span className="chip">focus · {horoscope.focus}</span>
              <span className="chip">lucky · {horoscope.lucky}</span>
            </div>
          </>
        ) : (
          <>
            <p className="today-line muted">{t("today.starsEmpty")}</p>
            <p className="muted tiny" style={{ marginTop: "0.35rem" }}>
              Add your birthday under Stars for a daily reading.
            </p>
          </>
        )}
      </TodayCard>

      {/* 3 · HD */}
      <TodayCard
        className="hd-home"
        icon="◎"
        label={t("today.hdLabel")}
        onClick={() => setTab("stars")}
      >
        {hdLine ? (
          <p className="today-line">{hdLine.line}</p>
        ) : (
          <p className="today-line muted">{t("today.hdEmpty")}</p>
        )}
      </TodayCard>

      {/* 4 · Word */}
      <TodayCard className="today-affirm" icon="❝" label={t("today.wordLabel")}>
        {affirmation ? (
          <p className="today-affirm-text">“{affirmation.text}”</p>
        ) : (
          <p className="today-line muted">{t("today.noAffirm")}</p>
        )}
        <button
          type="button"
          className="btn ghost tiny-btn today-inline-btn"
          onClick={(e) => {
            e.stopPropagation();
            setAffSalt((n) => n + 1);
          }}
        >
          {t("today.another")}
        </button>
      </TodayCard>

      {/* 5 · Muse */}
      <TodayCard className="today-muse" icon="♡" label={t("today.museLabel")}>
        <button
          type="button"
          className="btn primary today-one-btn muse-10-btn"
          disabled={museBusy}
          onClick={(e) => {
            e.stopPropagation();
            void runMuse10();
          }}
        >
          {museBusy ? t("today.museBusy") : t("today.museBtn")}
        </button>
        {museError && (
          <p className="status-line today-err" style={{ color: "var(--danger)" }}>
            {museError}{" "}
            <button
              type="button"
              className="btn ghost tiny-btn"
              onClick={() => setTab("muse")}
            >
              {t("today.museSetup")}
            </button>
          </p>
        )}
        {museReply && (
          <div className="today-muse-reply">
            <p>{museReply}</p>
          </div>
        )}
      </TodayCard>

      {/* 6 · Evening */}
      <TodayCard
        className={`today-evening ${eveningFocus ? "evening-now" : ""}`}
        icon="☾"
        label={t("today.eveningLabel")}
      >
        <div className="today-evening-fields">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              className="today-evening-input"
              value={evening[i] || ""}
              onChange={(e) => {
                const next = [...evening] as [string, string, string];
                next[i] = e.target.value;
                setEvening(next);
              }}
              placeholder={
                [t("today.line1"), t("today.line2"), t("today.line3")][i]
              }
            />
          ))}
        </div>
        <button
          type="button"
          className="btn primary today-one-btn"
          onClick={saveEvening}
        >
          {eveningSaved ? t("common.saved") : t("today.saveEvening")}
        </button>
      </TodayCard>
    </div>
  );
}
