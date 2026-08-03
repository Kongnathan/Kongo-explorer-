// Utility functions for GPS calculation and formatting

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  isMocked?: boolean;
}

export function getUserGeolocation(
  onSuccess: (pos: UserPosition) => void,
  onError: (errorMsg: string, fallbackPos?: UserPosition) => void,
  options: { timeoutMs?: number } = {}
) {
  if (!navigator.geolocation) {
    onError("La géolocalisation n'est pas supportée par votre navigateur.");
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
        onError("Permission GPS refusée. Activez la localisation dans la barre d'adresse du navigateur.");
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
          let msg = "Impossible d'obtenir le signal GPS précis.";
          if (err2.code === 1) {
            msg = "Permission GPS refusée par le navigateur.";
          } else if (err2.code === 3) {
            msg = "Délai d'attente de la localisation dépassé.";
          } else if (err2.code === 2) {
            msg = "Position GPS temporairement indisponible.";
          }

          // Fallback simulation for Kongo Central (Chutes de Zongo) if device location completely fails
          const fallbackPos: UserPosition = {
            lat: -4.7825,
            lng: 14.3541,
            accuracy: 100,
            isMocked: true,
          };
          onError(msg, fallbackPos);
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
    alert("Coordonnées GPS indisponibles pour ce site.");
    return;
  }
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(googleUrl, "_blank", "noopener,noreferrer");
}
