import React from "react";
import { LANGUAGES, LangCode, setLanguage } from "../lib/i18n";

interface LanguageSelectProps {
  onSelect: () => void;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ onSelect }) => {
  const handleSelect = (code: LangCode) => {
    setLanguage(code);
    onSelect();
  };

  return (
    <div className="lang-select-screen">
      <div className="lang-select-card">
        <div className="lang-select-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#lg1)"/>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
            <path d="M14 24c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M24 14c-3 4-3 12 0 20M24 14c3 4 3 12 0 20M14 24h20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="lang-select-title">YT Downloader</h1>

        <div className="lang-select-grid">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className="lang-card"
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-card__flag">{lang.flag}</span>
              <span className="lang-card__name">{lang.name}</span>
              {lang.nameEn !== lang.name && (
                <span className="lang-card__name-en">{lang.nameEn}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};