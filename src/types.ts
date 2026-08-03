export interface Location {
  id: string;
  title: string;
  description: string;
  locationName: string;
  image: string;
  images?: string[];                  // Dynamic photo gallery
  category: "Nature" | "Histoire" | "Urbain" | "Incontournables";
  status: "PUBLISHED" | "DRAFT" | "WAITING";
  coords: { x: number; y: number }; // percentage coords on custom map
  lat?: number;                       // real latitude
  lng?: number;                       // real longitude
  rating: number | null;
  ratingCount?: number | null;
  ratingSum?: number | null;
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
  videoUrl?: string;                  // Lien vidéo (YouTube Embed, Vimeo, ou MP4 direct)
  // New Enhanced Fields
  accessType?: "VOITURE" | "4X4" | "MARCHE" | "BATEAU"; // Type d'accès requis
  amenities?: string[];               // e.g. ["Guide Local", "Réseau Mobile", "Restauration", "Hébergement"]
  contactPhone?: string;              // Guide / Resort phone / WhatsApp
  entryFee?: string;                  // Tarif indicatif
  seasonality?: "ALL_YEAR" | "DRY_SEASON" | "RAIN_SEASON";
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

export interface CommunityReport {
  id: string;
  locationId: string;
  locationTitle: string;
  authorName: string;
  reportType: "ROUTE_CONDITION" | "FEE_UPDATE" | "GUIDE_INFO" | "GENERAL";
  comment: string;
  date: string;
  status?: "PENDING" | "VERIFIED";
}

export interface CircuitStop {
  locationId: string;
  title: string;
  subtitle: string;
  duration: string;
  description: string;
  image: string;
  tips?: string;
}

export interface Circuit {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  badge: string;
  image: string;
  description: string;
  bestFor: string;
  accessType: "VOITURE" | "4X4" | "MIXTE";
  stops: CircuitStop[];
}

export interface SubdomainConfig {
  subdomain: string;
  fullUrl: string;
  status: "ACTIVE" | "VERIFIED" | "PENDING" | "ERROR";
  updatedAt: string;
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
  }[];
  sslStatus?: string;
  updatedBy?: string;
}

