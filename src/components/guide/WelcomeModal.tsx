import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onDismiss: () => void;
}

export default function WelcomeModal({
  isOpen,
  onStartTour,
  onDismiss,
}: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-2xl text-on-surface text-center overflow-hidden"
        >
          {/* Decorative subtle background gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Guide Kongo Friendly Avatar */}
          <div className="relative mx-auto mb-4 w-24 h-24 rounded-3xl bg-emerald-700/15 border-2 border-emerald-500/40 shadow-xl overflow-hidden p-1">
            <img 
              src="/guide-avatar.jpg" 
              alt="Mascotte Guide Kongo" 
              className="w-full h-full object-cover rounded-2xl shadow-inner" 
            />
            <div className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-1 shadow-md flex items-center justify-center border-2 border-surface-container-lowest">
              <span className="material-symbols-outlined text-[13px]">explore</span>
            </div>
          </div>

          <span className="inline-block px-3 py-1 mb-2 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold tracking-wide uppercase">
            Guide Kongo
          </span>

          <h2 id="welcome-modal-title" className="font-sans text-headline-sm md:text-headline-md font-extrabold text-primary mb-2">
            Bienvenue sur Kongo Explorer !
          </h2>

          <p className="text-body-md text-on-surface-variant leading-relaxed mb-6">
            Découvrez facilement les merveilles naturelles, historiques et les bons plans du Kongo Central. 
            <br />
            <strong className="text-on-surface font-semibold">Voulez-vous une visite guidée interactive ?</strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all text-sm font-semibold cursor-pointer active:scale-95"
            >
              Plus tard
            </button>
            <button
              onClick={onStartTour}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg hover:shadow-emerald-700/30 transition-all text-sm font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>Commencer la visite</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
