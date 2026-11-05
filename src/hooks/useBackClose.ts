import { useEffect, useRef } from "react";

/**
 * Fait fermer une fenêtre (modale) avec le bouton « retour » du téléphone,
 * comme dans une vraie application : au lieu de quitter la page, le retour ferme d'abord la fenêtre.
 *
 * Utilisation : useBackClose(isOpen, onClose);
 */
export function useBackClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const markerRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    if (timerRef.current !== null) {
      // Ré-exécution immédiate (mode développement) : on garde l'entrée d'historique déjà créée.
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    } else {
      const marker = Math.random().toString(36).slice(2);
      markerRef.current = marker;
      window.history.pushState({ ...(window.history.state ?? {}), kongoModal: marker }, "");
    }

    let closedByBack = false;
    const onPop = () => {
      closedByBack = true;
      markerRef.current = null;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      const marker = markerRef.current;
      if (closedByBack || !marker) return;
      // La fenêtre a été fermée par un bouton : on retire l'entrée d'historique ajoutée.
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        markerRef.current = null;
        if (window.history.state?.kongoModal === marker) {
          window.history.back();
        }
      }, 0);
    };
  }, [open]);
}
