export interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  targetSelector?: string;
  badge?: string;
  tooltipPosition?: "top" | "bottom" | "center" | "auto";
  highlightPadding?: number;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "step-intro",
    title: "Bienvenue sur Kongo Explorer !",
    description: "Votre compagnon pour explorer les merveilles naturelles, culturelles et historiques de la province du Kongo Central en RDC. Suivez ce guide interactif pour découvrir chaque fonctionnalité.",
    route: "/",
    badge: "1 / 8",
    tooltipPosition: "center",
  },
  {
    id: "step-search",
    title: "Recherche & Filtres thématiques",
    description: "Recherchez facilement une cascade, une ville, une grotte ou un monument. Vous pouvez filtrer par thématiques (Incontournables, Nature, Histoire, Urbain) ou utiliser le micro pour capturer une note vocale de terrain.",
    route: "/",
    targetSelector: "[data-guide='search-section']",
    badge: "2 / 8",
    tooltipPosition: "bottom",
    highlightPadding: 10,
  },
  {
    id: "step-carte",
    title: "Carte interactive du Kongo Central",
    description: "Visualisez l'ensemble des sites majeurs géolocalisés (Zongo, Matadi, Boma, Muanda, Kisantu, Mbanza-Ngungu). Cliquez sur un repère pour voir la fiche détaillée et lancer un calcul d'itinéraire.",
    route: "/carte",
    targetSelector: "[data-guide='nav-carte']",
    badge: "3 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-circuits",
    title: "Circuits & Itinéraires thématiques",
    description: "Des parcours clés en main conçus pour vos excursions (Route du Fleuve, Écotourisme, Trésors coloniaux...). Chaque circuit indique le type d'accès (voiture, 4x4, marche), la durée et les étapes clés.",
    route: "/circuits",
    targetSelector: "[data-guide='nav-circuits']",
    badge: "4 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-infos",
    title: "Rubrique « Infos Tourisme »",
    description: "Consultez les bons plans, hébergements, restos et événements partagés par la communauté. Vous pouvez aussi proposer vos propres publications avec photos. Important : toute publication est soumise à validation préalable par un administrateur avant d'apparaître.",
    route: "/infos-tourisme",
    targetSelector: "[data-guide='nav-infos']",
    badge: "5 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-carnet",
    title: "Carnet de voyage hors-ligne",
    description: "Dans les zones sans réseau mobile, consultez vos fiches enregistrées sans aucune connexion Internet. Cliquez sur le signet d'une destination pour la garder dans votre carnet.",
    route: "/carnet",
    targetSelector: "[data-guide='nav-carnet']",
    badge: "6 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-conseils",
    title: "Conseils pratiques & Météo",
    description: "Retrouvez les meilleures saisons pour voyager (saison sèche de juin à septembre), les coutumes locales à respecter, les équipements indispensables et les consignes de sécurité.",
    route: "/conseils",
    targetSelector: "[data-guide='nav-conseils']",
    badge: "7 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-chat",
    title: "L'assistant « Guide Kongo » à votre écoute",
    description: "Vous avez une question sur une destination ou une option du site ? Cliquez à tout moment sur le bouton flottant en bas à droite pour discuter avec moi ou revoir cette visite guidée.",
    route: "/",
    targetSelector: "[data-guide='guide-fab']",
    badge: "8 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
];
