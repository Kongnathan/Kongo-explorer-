import React, { useState, useRef, useEffect } from "react";
import { notify } from "../lib/feedback";
import { useLanguage } from "../contexts/LanguageContext";
import { SupportedLanguage } from "../i18n";

interface LanguageSelectorProps {
  variant?: "compact" | "full" | "chips";
  className?: string;
}

export default function LanguageSelector({ variant = "compact", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentLangInfo = languages.find((l) => l.code === language) || languages[0];

  // Chips variant (e.g. For Welcome Modal or settings inline)
  if (variant === "chips") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline-variant/30 max-w-full ${className}`}>
        {languages.map((item) => {
          const isActive = language === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                if (item.available) {
                  setLanguage(item.code);
                } else {
                  notify(`${item.name} sera bientôt disponible !`, "info");
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-xs scale-102"
                  : item.available
                  ? "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  : "opacity-40 text-outline cursor-not-allowed"
              }`}
              title={item.available ? item.name : `${item.name} (Bientôt disponible)`}
            >
              <span>{item.flag}</span>
              <span>{item.code.toUpperCase()}</span>
              {!item.available && (
                <span className="text-[9px] font-mono opacity-70">prochainement</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Full cards variant (for Settings / Conseils page)
  if (variant === "full") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
        {languages.map((item) => {
          const isActive = language === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                if (item.available) {
                  setLanguage(item.code);
                } else {
                  notify(`${item.name} sera bientôt disponible !`, "info");
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                isActive
                  ? "bg-primary/10 border-primary shadow-sm ring-2 ring-primary/20"
                  : item.available
                  ? "bg-surface-container-low border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container"
                  : "bg-surface-container-low/50 border-outline-variant/15 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">{item.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm text-on-surface">{item.name}</span>
                    <span className="text-xs font-mono text-outline">({item.nativeName})</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                    {item.code === "fr" && "Langue principale • RDC"}
                    {item.code === "en" && "International travelers • English"}
                    {item.code === "ln" && "Langue nationale • Bientôt disponible"}
                    {item.code === "kg" && "Langue locale Kongo • Bientôt disponible"}
                  </p>
                </div>
              </div>

              <div>
                {isActive ? (
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                ) : item.available ? (
                  <span className="text-xs font-mono text-primary font-bold">Choisir</span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container-high text-outline">
                    Bientôt
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant (for sticky Top Navigation Headers)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        title="Changer de langue / Change language"
        aria-label="Sélectionner la langue"
        aria-expanded={isOpen}
      >
        <span className="text-sm select-none">{currentLangInfo.flag}</span>
        <span className="font-mono text-[11px] font-bold">{currentLangInfo.code.toUpperCase()}</span>
        <span className="material-symbols-outlined text-[16px] text-outline transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 py-1.5 z-50 animate-fade-in">
          <div className="px-3 py-1.5 border-b border-outline-variant/15 text-[10px] font-mono uppercase tracking-wider text-outline font-bold">
            Langue / Language
          </div>

          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  if (item.available) {
                    setLanguage(item.code);
                    setIsOpen(false);
                  } else {
                    notify(`${item.name} sera bientôt disponible !`, "info");
                  }
                }}
                disabled={!item.available}
                className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : item.available
                    ? "text-on-surface hover:bg-surface-container"
                    : "text-outline/60 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{item.flag}</span>
                  <span className="font-sans font-medium">{item.name}</span>
                </div>

                {isSelected ? (
                  <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                ) : !item.available ? (
                  <span className="text-[9px] font-mono text-outline">Bientôt</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
