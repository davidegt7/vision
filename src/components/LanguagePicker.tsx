import { useI18n } from "../lib/useI18n";

/** Compact language control — use on Today + Stars. */
export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { lang, setLanguage, languages, t } = useI18n();

  return (
    <label className={`lang-picker ${compact ? "compact" : ""}`}>
      {!compact && <span className="card-label">{t("common.language")}</span>}
      <select
        value={lang}
        onChange={(e) => setLanguage(e.target.value as typeof lang)}
        aria-label={t("common.language")}
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
