import React, { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useBackClose } from "../hooks/useBackClose";
import { ConfirmRequest, ToastItem, setFeedbackListeners } from "../lib/feedback";

/**
 * Affiche les messages temporaires (toasts) et les fenêtres de confirmation du site.
 * À monter UNE seule fois, dans App.tsx.
 */
export default function FeedbackHost() {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const requestRef = useRef<ConfirmRequest | null>(null);
  requestRef.current = request;
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    setFeedbackListeners(
      (toast) => {
        setToasts((list) => [...list.slice(-2), toast]);
        timers.push(window.setTimeout(() => dismissToast(toast.id), toast.kind === "error" ? 6000 : 4000));
      },
      (req) => {
        // Si une confirmation est déjà ouverte, on la refuse proprement avant d'ouvrir la nouvelle.
        requestRef.current?.resolve(false);
        setRequest(req);
      }
    );
    return () => {
      setFeedbackListeners(null, null);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [dismissToast]);

  const answer = useCallback((value: boolean) => {
    const req = requestRef.current;
    if (!req) return;
    requestRef.current = null;
    setRequest(null);
    req.resolve(value);
  }, []);

  // Le bouton « retour » du téléphone ferme la fenêtre (= Annuler)
  useBackClose(request !== null, () => answer(false));

  useEffect(() => {
    if (!request) return;
    cancelBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, answer]);

  const icon = (kind: ToastItem["kind"]) =>
    kind === "success" ? (
      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
    ) : kind === "error" ? (
      <AlertTriangle className="w-5 h-5 shrink-0 text-error" aria-hidden="true" />
    ) : (
      <Info className="w-5 h-5 shrink-0 text-primary" aria-hidden="true" />
    );

  return (
    <>
      {/* Messages temporaires, au-dessus de la barre du bas */}
      <div
        className="fixed left-0 right-0 z-[20000] flex flex-col items-center gap-2 px-4 pointer-events-none bottom-[calc(6rem+env(safe-area-inset-bottom))]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full max-w-md flex items-start gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface shadow-2xl px-4 py-3 animate-fade-in"
          >
            {icon(toast.kind)}
            <p className="flex-1 text-sm leading-snug whitespace-pre-line break-words">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="min-w-[32px] min-h-[32px] -mr-1 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label={t.ui.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Fenêtre de confirmation */}
      {request && (
        <div className="fixed inset-0 z-[20001] overflow-y-auto bg-black/50" onClick={() => answer(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="feedback-confirm-message"
              className="w-full max-w-sm rounded-3xl bg-surface-container-lowest text-on-surface shadow-2xl border border-outline-variant/30 p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {request.title && <h2 className="text-lg font-bold mb-2">{request.title}</h2>}
              <p id="feedback-confirm-message" className="text-sm leading-relaxed whitespace-pre-line break-words">
                {request.message}
              </p>
              <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  ref={cancelBtnRef}
                  type="button"
                  onClick={() => answer(false)}
                  className="min-h-[44px] px-5 rounded-full border border-outline-variant text-on-surface font-semibold hover:bg-surface-container"
                >
                  {request.cancelLabel ?? t.ui.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => answer(true)}
                  className={`min-h-[44px] px-5 rounded-full font-semibold text-white ${
                    request.danger ? "bg-error hover:opacity-90" : "bg-primary hover:opacity-90"
                  }`}
                >
                  {request.confirmLabel ?? t.ui.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
