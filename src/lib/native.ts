// Aide pour l'application Android (Capacitor).
// Sur le site web, ce fichier ne change rien : tout reste identique.

const DEFAULT_API_BASE_URL = "https://kongo-explorer.vercel.app";

/** Vrai quand le site tourne dans l'application Android (et non dans un navigateur). */
export function isNativeApp(): boolean {
  try {
    return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

/**
 * Dans l'application, le site est enregistré dans le téléphone : les adresses comme « /api/... »
 * doivent donc pointer vers le vrai site sur internet. Cette fonction s'en charge automatiquement.
 * L'adresse peut être changée avec VITE_API_BASE_URL (fichier .env).
 */
export function installNativeApiBridge() {
  if (!isNativeApp()) return;

  const configured = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const base = (configured || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && (input.startsWith("/api/") || input.startsWith("/uploads/"))) {
      return originalFetch(base + input, init);
    }
    return originalFetch(input, init);
  };
}
