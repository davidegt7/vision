import { useCallback, useEffect } from "react";
import { useVision } from "../store";
import type { AppLanguage } from "../types";
import {
  DEFAULT_LANG,
  LANGUAGES,
  isLangId,
  langMeta,
  t as translate,
  type LangId,
} from "./i18n";

export function useI18n() {
  const language = useVision((s) => s.profile.language);
  const setProfile = useVision((s) => s.setProfile);
  const lang: LangId = isLangId(language) ? language : DEFAULT_LANG;

  useEffect(() => {
    const meta = langMeta(lang);
    document.documentElement.lang = meta.bcp47;
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const setLanguage = useCallback(
    (next: AppLanguage | LangId) => {
      if (!isLangId(next)) return;
      setProfile({ language: next });
    },
    [setProfile],
  );

  return {
    lang,
    t,
    setLanguage,
    languages: LANGUAGES,
    bcp47: langMeta(lang).bcp47,
  };
}
