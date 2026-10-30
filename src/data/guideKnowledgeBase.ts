/**
 * Base de connaissances officielle pour l'agent IA "Guide Kongo"
 * et pour la visite guidée interactive de Kongo Explorer.
 */

export interface GuideFeature {
  id: string;
  name: string;
  category: "navigation" | "decouverte" | "collaboration" | "compte" | "utilitaire";
  summary: string;
  description: string;
  howToUse: string;
  whereToFind: string;
  route: string;
  targetSelector?: string;
}

export const GUIDE_FEATURES: GuideFeature[] = [
  {
    id: "accueil-recherche",
    name: "Accueil & Recherche intelligente",
    category: "decouverte",
    summary: "Explorez les destinations phares du Kongo Central et filtrez par catégorie.",
    description: "La page d'accueil rassemble tous les sites touristiques incontournables (chutes, grottes, parcs, monuments historiques). Une barre de recherche rapide permet de retrouver un lieu par son nom ou sa ville, complétée par des filtres (Incontournables, Nature, Histoire, Urbain).",
    howToUse: "Saisissez un mot-clé dans la barre de recherche ou cliquez sur une puce thématique pour filtrer la liste en direct.",
    whereToFind: "Onglet 'Explorer' dans la barre de navigation du bas ou en cliquant sur le logo Kongo Explorer en haut.",
    route: "/",
    targetSelector: "[data-guide='search-section']",
  },
  {
    id: "carte-interactive",
    name: "Carte interactive du Kongo Central",
    category: "navigation",
    summary: "Visualisez tous les sites sur la carte géographique interactive avec calcul d'itinéraire.",
    description: "Une carte géographique complète situant les villes (Matadi, Boma, Muanda, Kisantu, Mbanza-Ngungu, Zongo) et leurs trésors. Cliquez sur un repère pour voir la fiche concise et lancer un itinéraire guidé.",
    howToUse: "Naviguez sur la carte, zoomez avec vos doigts ou la molette, et cliquez sur les marqueurs colorés.",
    whereToFind: "Onglet 'Carte' (icône boussole/repère) dans la barre de navigation inférieure.",
    route: "/carte",
    targetSelector: "[data-guide='nav-carte']",
  },
  {
    id: "circuits-itineraires",
    name: "Circuits & Itinéraires thématiques",
    category: "navigation",
    summary: "Des circuits clés en main organisés étape par étape selon vos envies de voyage.",
    description: "Parcourez des circuits thématiques conçus pour optimiser votre séjour (Route du Fleuve, Écotourisme, Trésors coloniaux, Épopée océanique). Chaque circuit indique la durée conseillée, les types d'accès (voiture, 4x4, marche) et chaque halte avec conseils.",
    howToUse: "Sélectionnez un circuit, parcourez les étapes numérotées et ouvrez les fiches de chaque étape.",
    whereToFind: "Onglet 'Circuits' (icône itinéraire) dans la barre inférieure.",
    route: "/circuits",
    targetSelector: "[data-guide='nav-circuits']",
  },
  {
    id: "infos-tourisme",
    name: "Rubrique 'Infos Tourisme' (Publications citoyennes)",
    category: "collaboration",
    summary: "Bons plans, hébergements, restos et actus partagés par la communauté et validés par modération.",
    description: "Espace communautaire ouvert à tous pour découvrir des événements, restaurants, hébergements, lieux insolites et conseils pratiques. Tout visiteur peut lire librement. Les utilisateurs connectés peuvent publier leurs bons plans. IMPORTANT : Toute publication est systématiquement vérifiée et validée par un administrateur avant d'apparaître en ligne.",
    howToUse: "Consultez les publications filtrables par ville et catégorie. Pour publier, cliquez sur '+ Proposer une publication', téléversez jusqu'à 5 photos et remplissez les détails. Un bouton 'Signaler' permet de rapporter tout contenu non conforme.",
    whereToFind: "Onglet 'Infos' (icône journal/flux) dans le menu et la barre de navigation.",
    route: "/infos-tourisme",
    targetSelector: "[data-guide='nav-infos']",
  },
  {
    id: "carnet-offline",
    name: "Carnet de voyage hors-ligne",
    category: "utilitaire",
    summary: "Consultez vos fiches favorites même en pleine brousse sans aucune connexion Internet.",
    description: "Le Kongo Central possède des zones reculées sans réseau mobile. Grâce au carnet hors-ligne, enregistrez en un clic les fiches des cascades, grottes ou réserves pour y accéder sans connexion.",
    howToUse: "Cliquez sur l'icône signet/carnet sur n'importe quelle fiche de destination pour l'ajouter à vos favoris locaux.",
    whereToFind: "Onglet 'Carnet' (icône marque-page) dans la barre inférieure.",
    route: "/carnet",
    targetSelector: "[data-guide='nav-carnet']",
  },
  {
    id: "conseils-meteo",
    name: "Conseils pratiques & Météo locale",
    category: "decouverte",
    summary: "Informations essentielles : saisons, santé, tenue vestimentaire, coutumes et numéros utiles.",
    description: "Un guide pratique complet pour bien préparer sa valise, connaître la meilleure saison de visite (saison sèche de juin à septembre recommandée), respecter les coutumes des chefs de terre et voyager en toute sécurité.",
    howToUse: "Lisez les conseils thématiques et recommandations culturelles.",
    whereToFind: "Onglet 'Conseils' dans la barre de navigation ou bouton en haut à droite.",
    route: "/conseils",
    targetSelector: "[data-guide='nav-conseils']",
  },
  {
    id: "compte-auth",
    name: "Compte & Authentification",
    category: "compte",
    summary: "Connexion par Email ou Google pour publier des infos touristiques et suivre vos propositions.",
    description: "Créer un compte vous permet de soumettre des publications touristiques (jusqu'à 5 par jour), de consulter l'historique de vos soumissions et de voir le statut de validation par les administrateurs.",
    howToUse: "Cliquez sur 'Se connecter' ou 'Créer un compte' dans la rubrique Infos Tourisme ou lors d'une action réservée.",
    whereToFind: "Accessible via le bouton de connexion dans la section Infos Tourisme et les modales de publication.",
    route: "/infos-tourisme",
    targetSelector: "[data-guide='auth-btn']",
  },
  {
    id: "capture-vocale",
    name: "Note de voyage vocale & rapide",
    category: "utilitaire",
    summary: "Capturez une note ou une observation sur le terrain en parlant directement à l'application.",
    description: "Permet aux explorateurs de terrain d'enregistrer vocalement une découverte ou un conseil qui est analysé intelligemment.",
    howToUse: "Cliquez sur l'icône micro à droite de la barre de recherche sur la page d'accueil.",
    whereToFind: "Bouton micro dans la barre de recherche sur la page d'accueil.",
    route: "/",
    targetSelector: "[data-guide='voice-btn']",
  }
];

export const GUIDE_SUGGESTED_QUESTIONS = [
  "Comment publier une info touristique ?",
  "Comment utiliser la carte interactive ?",
  "Comment enregistrer un lieu pour le voir hors ligne ?",
  "Qui valide les publications touristiques ?",
  "Quels sont les plus beaux circuits à faire ?",
];
