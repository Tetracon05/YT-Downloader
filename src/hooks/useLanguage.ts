import { useState, useEffect } from "react";
import { LangCode, getCurrentLang, subscribeLanguage, t } from "../lib/i18n";

/**
 * React hook that re-renders whenever the language changes.
 */
export function useLanguage() {
  const [lang, setLang] = useState<LangCode>(getCurrentLang);

  useEffect(() => {
    const unsub = subscribeLanguage((newLang) => setLang(newLang));
    return () => { unsub(); };
  }, []);

  return {
    lang,
    t: (key: Parameters<typeof t>[0]) => t(key, lang),
  };
}