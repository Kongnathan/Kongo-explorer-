import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface GuideFloatingButtonProps {
  onOpenChat: () => void;
  onStartTour: () => void;
}

export default function GuideFloatingButton({
  onOpenChat,
  onStartTour,
}: GuideFloatingButtonProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  return (
    <div 
      className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2"
      data-guide="guide-fab"
    >
      {/* Quick Action Flyout Menu */}
      <AnimatePresence>
        {isOpenMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ duration: 0.18 }}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-52 mb-2 text-on-surface backdrop-blur-md"
          >
            <div className="px-3 py-1.5 border-b border-outline-variant/20 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Guide Kongo
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <button
              onClick={() => {
                setIsOpenMenu(false);
                onOpenChat();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-emerald-700/10 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">forum</span>
              <span>Discuter avec l'assistant</span>
            </button>

            <button
              onClick={() => {
                setIsOpenMenu(false);
                onStartTour();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-emerald-700/10 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">tour</span>
              <span>Revoir la visite guidée</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpenMenu((prev) => !prev)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white shadow-xl hover:shadow-emerald-700/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-emerald-400/60 overflow-hidden p-0.5"
        title="Guide Kongo – Besoin d'aide ou visite guidée ?"
        aria-label="Ouvrir le Guide Kongo"
      >
        <img 
          src="/guide-avatar.jpg" 
          alt="Guide Kongo" 
          className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-110" 
        />

        {/* Status dot */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-surface-container-lowest" />
        </span>

        {/* Label on desktop hover */}
        <span className="hidden md:group-hover:inline-block absolute right-16 bg-surface-container-lowest text-on-surface border border-outline-variant/30 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none transition-opacity">
          Guide Kongo (Aide & Visite)
        </span>
      </button>
    </div>
  );
}
