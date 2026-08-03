import React from "react";

interface BackButtonProps {
  /** Optional custom handler. If provided, overrides default history back logic. */
  onClick?: () => void;
  /** Fallback tab ID if direct entry from external link / notification (e.g. "explore"). */
  fallbackTab?: string;
  /** Main app view navigation function if available */
  onNavigate?: (tab: string) => void;
  /** Button visual style variant */
  variant?: "icon" | "pill" | "subtle";
  /** Custom label for pill or text variant */
  label?: string;
  /** Additional CSS class overrides */
  className?: string;
}

/**
 * Smart PWA Back Button Component for Kongo Explorer.
 * Features:
 * - Haptic vibration feedback on touch devices
 * - Intelligent navigation logic (window.history.back vs. fallback home/explore tab)
 * - Modern PWA active touch press animations (-webkit-tap-highlight-color transparent)
 */
export default function BackButton({
  onClick,
  fallbackTab = "explore",
  onNavigate,
  variant = "icon",
  label = "Retour",
  className = ""
}: BackButtonProps) {
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Trigger micro-haptic feedback on mobile browsers if supported
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore vibration permission or browser restrictions
      }
    }

    // 2. If a specific onClick handler was supplied, run it
    if (onClick) {
      onClick();
      return;
    }

    // 3. Intelligent History / Fallback Routing Check
    // Checks if the user has in-app browser history or landed directly from external link
    const hasHistory = typeof window !== "undefined" && window.history.length > 1;

    if (hasHistory && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else if (onNavigate) {
      onNavigate(fallbackTab);
    } else {
      // Fallback for standalone SPA routing
      window.history.back();
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label={label}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-sans font-bold text-xs border border-outline-variant/40 shadow-sm hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer ${className}`}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "subtle") {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label={label}
        className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/50 text-primary active:scale-95 transition-all cursor-pointer ${className}`}
      >
        <span className="material-symbols-outlined text-[22px]">arrow_back</span>
      </button>
    );
  }

  // Default "icon" variant (Circular PWA Floating Back Button)
  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      title={label}
      className={`btn-back ${className}`}
    >
      <span className="material-symbols-outlined text-[22px]">arrow_back</span>
    </button>
  );
}
