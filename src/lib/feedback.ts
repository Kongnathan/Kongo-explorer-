/**
 * Messages du site : remplacent les pop-ups du navigateur (alert / confirm).
 * Utilisables partout, même hors des composants :
 *   notify("Enregistré !", "success");
 *   if (await askConfirm({ message: "Supprimer ?" })) { ... }
 * L'affichage est assuré par le composant <FeedbackHost /> (monté une seule fois dans App.tsx).
 */

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

type ToastListener = (toast: ToastItem) => void;
type ConfirmListener = (req: ConfirmRequest) => void;

let toastListener: ToastListener | null = null;
let confirmListener: ConfirmListener | null = null;
let nextId = 1;

export function setFeedbackListeners(t: ToastListener | null, c: ConfirmListener | null) {
  toastListener = t;
  confirmListener = c;
}

export function notify(message: string, kind: ToastKind = "info") {
  if (toastListener) {
    toastListener({ id: nextId++, message, kind });
  } else {
    console.log(`[${kind}] ${message}`);
  }
}

export function askConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (confirmListener) {
      confirmListener({ ...options, resolve });
    } else {
      // Sécurité : si l'affichage n'est pas prêt, on n'exécute pas l'action (ex. une suppression).
      resolve(false);
    }
  });
}
