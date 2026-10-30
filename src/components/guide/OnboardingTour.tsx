import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TOUR_STEPS, TourStep } from "./guideSteps";

interface OnboardingTourProps {
  isOpen: boolean;
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onOpenChat: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingTour({
  isOpen,
  currentStepIndex,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onOpenChat,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const step = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Measure and update target element bounding box
  const updateTargetRect = useCallback(() => {
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      // Ensure element is visible in viewport
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const rect = el.getBoundingClientRect();
      const pad = step.highlightPadding || 8;
      setTargetRect({
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to allow any navigation / re-render to complete
    const timeout = setTimeout(updateTargetRect, 100);
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Keyboard navigation support: Esc, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isLastStep) {
          onComplete();
        } else {
          onNext();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (!isFirstStep) {
          onPrev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFirstStep, isLastStep, onNext, onPrev, onSkip, onComplete]);

  if (!isOpen) return null;

  // Determine tooltip style/positioning
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Centered on screen
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "460px",
        width: "calc(100vw - 32px)",
        zIndex: 10001,
      };
    }

    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    const tooltipWidth = Math.min(420, windowWidth - 32);
    // Align horizontally with target or center on small screens
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    if (left < 16) left = 16;
    if (left + tooltipWidth > windowWidth - 16) {
      left = windowWidth - tooltipWidth - 16;
    }

    // Check vertical room
    const spaceBelow = windowHeight - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;

    if (spaceBelow > 240 || spaceBelow > spaceAbove) {
      // Place below target
      return {
        position: "fixed",
        top: Math.min(windowHeight - 250, targetRect.top + targetRect.height + 12),
        left,
        width: tooltipWidth,
        zIndex: 10001,
      };
    } else {
      // Place above target
      return {
        position: "fixed",
        bottom: Math.max(16, windowHeight - targetRect.top + 12),
        left,
        width: tooltipWidth,
        zIndex: 10001,
      };
    }
  };

  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div
      className="fixed inset-0 z-[10000] overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Visite guidée de Kongo Explorer"
    >
      {/* Dark Spotlight overlay backdrop */}
      {targetRect ? (
        <div
          className="fixed pointer-events-none rounded-2xl transition-all duration-300 ease-out border-2 border-emerald-400/90"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 9999px rgba(6, 15, 12, 0.78), 0 0 25px rgba(52, 211, 153, 0.4)",
            zIndex: 10000,
          }}
        />
      ) : (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
          style={{ zIndex: 10000 }}
          onClick={onSkip}
        />
      )}

      {/* Tooltip Card with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={getTooltipStyle()}
          className="bg-surface-container-lowest text-on-surface border border-emerald-500/30 rounded-3xl p-5 shadow-2xl pointer-events-auto overflow-hidden flex flex-col gap-3.5 backdrop-blur-md"
        >
          {/* Header with Step indicator & Skip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/40 shadow-xs shrink-0 p-0.5 bg-emerald-700/10">
                <img src="/guide-avatar.jpg" alt="Guide Kongo" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block leading-tight">
                  Guide Kongo
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Étape {currentStepIndex + 1} sur {totalSteps}
                </span>
              </div>
            </div>

            <button
              onClick={onSkip}
              className="text-xs text-on-surface-variant/70 hover:text-on-surface px-2 py-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Passer la visite guidée (Échap)"
              aria-label="Passer la visite"
            >
              Passer
            </button>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="font-sans text-body-lg md:text-headline-sm font-bold text-primary flex items-center gap-2">
              {step.title}
            </h3>
            <p className="text-body-sm md:text-body-md text-on-surface-variant leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Final step bonus: Quick link to chat */}
          {isLastStep && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">forum</span>
                <span>Posez vos questions à tout moment dans le chat du Guide.</span>
              </div>
              <button
                onClick={() => {
                  onComplete();
                  onOpenChat();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                Ouvrir le chat
              </button>
            </div>
          )}

          {/* Action buttons bar */}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <button
              onClick={onPrev}
              disabled={isFirstStep}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                isFirstStep
                  ? "opacity-30 cursor-not-allowed text-on-surface-variant"
                  : "hover:bg-surface-container-high text-on-surface cursor-pointer active:scale-95"
              }`}
              aria-label="Étape précédente"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-2">
              {isLastStep ? (
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-700/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  aria-label="Terminer la visite guidée"
                >
                  <span>C'est parti !</span>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-700/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  aria-label="Étape suivante"
                >
                  <span>Suivant</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
