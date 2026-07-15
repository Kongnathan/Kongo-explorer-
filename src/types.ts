export interface Location {
  id: string;
  title: string;
  description: string;
  locationName: string;
  image: string;
  category: "Nature" | "Histoire" | "Urbain" | "Incontournables";
  status: "PUBLISHED" | "DRAFT" | "WAITING";
  coords: { x: number; y: number }; // percentage coords on custom map
  lat?: number;                       // real latitude
  lng?: number;                       // real longitude
  rating: number | null;
  timeToVisit: string | null;
  cognitiveEffort: number | null; // e.g. 70%
  intensity: string | null;
  terrain: string | null;
  currentStatus: string | null;
  history: string | null;
  checklist: string[] | null;
  bestSeason: string | null;          // Meilleure période pour visiter
  safetyGuidelines: string | null;    // Consignes de sécurité
  ecoResponsibility: string | null;   // Respect de l'environnement
  localCustoms: string | null;        // Coutumes locales à respecter
}

export interface SavedLocation {
  id: string;
  locationId: string;
  title: string;
  image: string;
  savedAt: string;
}

export interface PendingPermit {
  id: string;
  title: string;
  subtitle: string;
  status: "VERIFICATION" | "PENDING" | "COMPLETED";
  icon: string;
}

export interface VoiceNote {
  id: string;
  text: string;
  timestamp: string;
  processed?: boolean;
}
