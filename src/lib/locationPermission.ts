// Aide autour de l'autorisation de localisation (GPS) du téléphone.

export type GeoPermissionState = "granted" | "prompt" | "denied" | "unknown";

/** Dit si la localisation est déjà autorisée, jamais demandée, ou bloquée. */
export async function getGeoPermissionState(): Promise<GeoPermissionState> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    if (status.state === "granted" || status.state === "prompt" || status.state === "denied") {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** Villes proposées quand la localisation ne marche pas (coordonnées approximatives du centre-ville). */
export const MANUAL_PLACES: { name: string; lat: number; lng: number }[] = [
  { name: "Matadi", lat: -5.8167, lng: 13.45 },
  { name: "Boma", lat: -5.85, lng: 13.05 },
  { name: "Muanda", lat: -5.9261, lng: 12.3517 },
  { name: "Mbanza-Ngungu", lat: -5.25, lng: 14.8667 },
  { name: "Kisantu", lat: -5.1333, lng: 15.0833 },
  { name: "Chutes de Zongo", lat: -4.7825, lng: 14.3541 },
  { name: "Kinshasa", lat: -4.325, lng: 15.3222 },
];
