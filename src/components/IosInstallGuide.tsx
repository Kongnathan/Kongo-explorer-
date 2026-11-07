import React, { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useBackClose } from "../hooks/useBackClose";

const DISMISS_KEY = "kongo_ios_install_dismissed_at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const classic = /iPad|iPhone|iPod/.test(ua);
  // iPadOS récent se présente comme un Mac, mais avec un écran tactile
  const ipadOs = navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  return classic || ipadOs;
}

function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      (navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  } catch {
    return false;
  }
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = parseInt(raw, 10);
    return Number.isFinite(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

/**
 * Sur iPhone / iPad, Safari n'a pas de bouton « Installer ».
 * Ce composant affiche une invitation, puis un guide en 3 étapes.
 */
export default function IosInstallGuide() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!isIos() || isInstalled() || wasRecentlyDismissed()) return;
    // On attend un peu pour ne pas se superposer à l'écran d'accueil et au choix de la langue
    const id = window.setTimeout(() => setShowBanner(true), 8000);
    return () => window.clearTimeout(id);
  }, []);

  const closeGuide = () => {
    setShowGuide(false);
    setShowBanner(false);
    rememberDismiss();
  };

  useBackClose(showGuide, closeGuide);

  if (!showBanner && !showGuide) return null;

  const steps = [
    { icon: "ios_share", text: t.iosInstall.step1 },
    { icon: "add_box", text: t.iosInstall.step2 },
    { icon: "check_circle", text: t.iosInstall.step3 },
  ];

  return (
    <>
      {showBanner && !showGuide && (
        <div className="fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 right-4 z-50 bg-primary border border-white/10 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <img src="/icon.svg" alt="" className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h3 className="font-sans text-sm font-bold">{t.iosInstall.title}</h3>
              <p className="text-white/80 text-[11px] leading-tight">{t.iosInstall.intro}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                rememberDismiss();
                setShowBanner(false);
              }}
              className="text-white/70 hover:text-white min-h-[44px] px-2 text-xs font-sans font-semibold cursor-pointer"
            >
              {t.ui.close}
            </button>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="bg-secondary text-white min-h-[44px] px-4 rounded-full font-sans text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {t.iosInstall.button}
            </button>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[10002] overflow-y-auto bg-black/60" onClick={closeGuide}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-install-title"
              className="w-full max-w-sm rounded-3xl bg-surface-container-lowest text-on-surface shadow-2xl border border-outline-variant/30 p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="ios-install-title" className="text-lg font-bold text-center">
                {t.iosInstall.title}
              </h2>
              <p className="mt-2 text-sm text-center text-on-surface-variant leading-relaxed">{t.iosInstall.intro}</p>

              <ol className="mt-4 space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-surface-container p-3">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                        {step.icon}
                      </span>
                    </span>
                    <span className="text-sm leading-snug">
                      <strong className="mr-1">{i + 1}.</strong>
                      {step.text}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 text-xs text-center text-on-surface-variant leading-relaxed">{t.iosInstall.safariNote}</p>

              <button
                type="button"
                onClick={closeGuide}
                className="mt-4 w-full min-h-[44px] rounded-full bg-primary text-white font-semibold active:scale-95 transition-all cursor-pointer"
              >
                {t.iosInstall.done}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
