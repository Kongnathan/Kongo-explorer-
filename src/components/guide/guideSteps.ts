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
    description: "Ce site vous aide à découvrir les plus beaux endroits du Kongo Central : nature, histoire et culture. Suivez cette petite visite : en quelques étapes, vous saurez à quoi sert chaque bouton.",
    route: "/",
    badge: "1 / 8",
    tooltipPosition: "center",
  },
  {
    id: "step-search",
    title: "Chercher un endroit",
    description: "Tapez le nom d'un lieu (une cascade, une ville, un monument) pour le trouver vite. Vous pouvez aussi choisir un thème : Incontournables, Nature, Histoire ou Ville. Le micro permet de dire sa recherche à voix haute.",
    route: "/",
    targetSelector: "[data-guide='search-section']",
    badge: "2 / 8",
    tooltipPosition: "bottom",
    highlightPadding: 10,
  },
  {
    id: "step-carte",
    title: "La carte",
    description: "Voyez où se trouvent les lieux à visiter (Zongo, Matadi, Boma, Muanda, Kisantu, Mbanza-Ngungu). Touchez un point pour lire sa fiche. Le bouton « Satellite » affiche des photos prises du ciel : pratique pour voir les forêts, les rivières et les chemins avant de partir.",
    route: "/carte",
    targetSelector: "[data-guide='nav-carte']",
    badge: "3 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-circuits",
    title: "Les circuits",
    description: "Des idées de promenades toutes prêtes, avec les lieux à voir dans l'ordre. Pour chaque circuit, vous voyez la durée et comment y aller (voiture, 4x4 ou à pied).",
    route: "/circuits",
    targetSelector: "[data-guide='nav-circuits']",
    badge: "4 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-infos",
    title: "Les infos tourisme",
    description: "Lisez les bons plans, les hôtels, les restaurants et les événements partagés par d'autres personnes. Vous pouvez aussi publier votre propre info avec des photos. Avant d'apparaître sur le site, chaque publication est relue et acceptée par l'équipe.",
    route: "/infos-tourisme",
    targetSelector: "[data-guide='nav-infos']",
    badge: "5 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-carnet",
    title: "Mon carnet de voyage",
    description: "Gardez vos destinations préférées dans votre carnet. Elles sont enregistrées sur votre téléphone : vous pouvez les relire même sans internet, par exemple en pleine nature.",
    route: "/carnet",
    targetSelector: "[data-guide='nav-carnet']",
    badge: "6 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-conseils",
    title: "Conseils pratiques",
    description: "Trouvez la meilleure période pour voyager (la saison sèche, de juin à septembre), les règles de politesse locales, ce qu'il faut emporter et les conseils pour rester en sécurité.",
    route: "/conseils",
    targetSelector: "[data-guide='nav-conseils']",
    badge: "7 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
  {
    id: "step-chat",
    title: "Le Guide Kongo est là pour vous",
    description: "Une question sur un lieu ou sur un bouton du site ? Touchez le bouton rond en bas à droite pour me parler, ou pour revoir cette visite quand vous voulez.",
    route: "/",
    targetSelector: "[data-guide='guide-fab']",
    badge: "8 / 8",
    tooltipPosition: "top",
    highlightPadding: 12,
  },
];
