// Utility functions for GPS calculation and formatting
import { notify } from "./feedback";

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  isMocked?: boolean;
}

/** Raison de l'échec de la localisation : refusée, indisponible, trop longue ou non prise en charge. */
export type GeolocationFailureReason = "denied" | "unavailable" | "timeout" | "unsupported";

export function getUserGeolocation(
  onSuccess: (pos: UserPosition) => void,
  onError: (errorMsg: string, fallbackPos?: UserPosition, reason?: GeolocationFailureReason) => void,
  options: { timeoutMs?: number } = {}
) {
  if (!navigator.geolocation) {
    onError("La localisation ne marche pas sur ce navigateur.", undefined, "unsupported");
    return;
  }

  const timeoutMs = options.timeoutMs || 15000;

  // Attempt 1: Try High Accuracy first
  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        isMocked: false,
      });
    },
    (err1) => {
      // If user explicitly denied permission (code 1), stop and return friendly error
      if (err1.code === 1) {
        onError("La localisation est bloquée pour ce site.", undefined, "denied");
        return;
      }

      // Attempt 2: Fallback to Low Accuracy (IP / Wi-Fi network location), works reliably on PC & laptops
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSuccess({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isMocked: false,
          });
        },
        (err2) => {
          let msg = "Votre position n'a pas pu être trouvée.";
          let reason: GeolocationFailureReason = "unavailable";
          if (err2.code === 1) {
            msg = "La localisation est bloquée pour ce site.";
            reason = "denied";
          } else if (err2.code === 3) {
            msg = "La recherche de votre position a pris trop de temps.";
            reason = "timeout";
          } else if (err2.code === 2) {
            msg = "Votre position n'est pas disponible pour le moment.";
          }

          // Fallback simulation for Kongo Central (Chutes de Zongo) if device location completely fails
          const fallbackPos: UserPosition = {
            lat: -4.7825,
            lng: 14.3541,
            accuracy: 100,
            isMocked: true,
          };
          onError(msg, fallbackPos, reason);
        },
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60000 }
      );
    },
    { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 }
  );
}

export function calculateDistanceKm(
  lat1?: number | null,
  lng1?: number | null,
  lat2?: number | null,
  lng2?: number | null
): number | null {
  if (
    lat1 === undefined || lat1 === null ||
    lng1 === undefined || lng1 === null ||
    lat2 === undefined || lat2 === null ||
    lng2 === undefined || lng2 === null
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

export function formatDistanceLabel(distanceKm: number | null): string {
  if (distanceKm === null) return "Distance N/A";
  if (distanceKm < 1) {
    return `à ${Math.round(distanceKm * 1000)} m de vous`;
  }
  return `à ${distanceKm} km de vous`;
}

export function openExternalGpsRoute(lat?: number, lng?: number, title?: string) {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    notify("Les coordonnées GPS de ce site ne sont pas disponibles.", "error");
    return;
  }
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(googleUrl, "_blank", "noopener,noreferrer");
}
