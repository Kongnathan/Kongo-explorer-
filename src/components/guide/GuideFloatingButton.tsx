import React, { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

interface GuideFloatingButtonProps {
  onOpenChat: () => void;
  onStartTour?: () => void;
  hasBottomNav?: boolean;
}

export default function GuideFloatingButton({
  onOpenChat,
  onStartTour,
  hasBottomNav = true,
}: GuideFloatingButtonProps) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  return (
    <aside 
      className={`fixed ${
        hasBottomNav ? "bottom-24 sm:bottom-24" : "bottom-6 sm:bottom-8"
      } right-3 sm:right-6 z-[60] flex items-center`}
      data-guide="guide-fab"
      aria-label="Agent Guide Kongo"
    >
      <button
        onClick={onOpenChat}
        className="group relative flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 text-white shadow-2xl hover:shadow-emerald-700/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-emerald-400/70 backdrop-blur-md"
        title={t.guideFab.ariaLabel}
        aria-label={t.guideFab.ariaLabel}
      >
        {/* Avatar with fallback and pulsing online dot */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950/60 overflow-hidden flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
          {!imgError ? (
            <img 
              src="/guide-avatar.jpg" 
              alt="Guide Kongo" 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-110" 
            />
          ) : (
            <span className="material-symbols-outlined text-[24px] text-white">support_agent</span>
          )}

          {/* Online badge */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-emerald-900" />
          </span>
        </div>

        {/* Text identification */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-xs font-black tracking-tight text-white leading-tight">
              Guide Kongo
            </span>
            <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
              IA
            </span>
          </div>
          <span className="text-[10px] text-emerald-100/90 font-medium leading-tight">
            {t.guideFab.chat}
          </span>
        </div>
      </button>
    </aside>
  );
}
