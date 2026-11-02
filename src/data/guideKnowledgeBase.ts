/**
 * Base de connaissances du « Guide Kongo » et de la visite guidée de Kongo Explorer.
 * Tous les textes sont écrits en langage simple, pour des visiteurs peu habitués au numérique.
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
    name: "Accueil et recherche",
    category: "decouverte",
    summary: "Trouvez un lieu à visiter par son nom ou par thème.",
    description: "La page d'accueil montre les plus beaux endroits du Kongo Central : chutes, grottes, parcs et monuments. Une barre de recherche permet de retrouver un lieu par son nom ou sa ville. Des boutons thématiques (Incontournables, Nature, Histoire, Ville) permettent de trier la liste.",
    howToUse: "Écrivez un mot dans la barre de recherche, ou touchez un thème pour ne voir que les lieux de ce thème.",
    whereToFind: "Bouton « Explorer » dans le menu du bas, ou touchez le logo Kongo Explorer en haut.",
    route: "/",
    targetSelector: "[data-guide='search-section']",
  },
  {
    id: "carte-interactive",
    name: "La carte",
    category: "navigation",
    summary: "Voyez où se trouvent tous les lieux à visiter.",
    description: "Une carte du Kongo Central avec les villes (Matadi, Boma, Muanda, Kisantu, Mbanza-Ngungu, Zongo) et leurs lieux à visiter. Touchez un point pour lire sa fiche et voir le chemin pour y aller.",
    howToUse: "Déplacez la carte avec votre doigt, agrandissez avec deux doigts, puis touchez un point coloré.",
    whereToFind: "Bouton « Carte » dans le menu du bas.",
    route: "/carte",
    targetSelector: "[data-guide='nav-carte']",
  },
  {
    id: "circuits-itineraires",
    name: "Les circuits",
    category: "navigation",
    summary: "Des promenades toutes prêtes, étape par étape.",
    description: "Chaque circuit regroupe plusieurs lieux à visiter dans le bon ordre (Route du Fleuve, Écotourisme, Trésors coloniaux...). Vous y voyez la durée conseillée et comment y aller : voiture, 4x4 ou à pied.",
    howToUse: "Choisissez un circuit, lisez les étapes dans l'ordre et ouvrez la fiche de chaque lieu.",
    whereToFind: "Bouton « Circuits » dans le menu du bas.",
    route: "/circuits",
    targetSelector: "[data-guide='nav-circuits']",
  },
  {
    id: "infos-tourisme",
    name: "Les infos tourisme",
    category: "collaboration",
    summary: "Bons plans, hôtels, restaurants et événements partagés par d'autres personnes.",
    description: "Tout le monde peut lire ces informations. Si vous avez un compte, vous pouvez aussi publier la vôtre, avec des photos. Important : chaque publication est d'abord relue et acceptée par l'équipe avant d'apparaître sur le site.",
    howToUse: "Pour lire, ouvrez la rubrique. Pour publier, connectez-vous, appuyez sur « Publier une info » et remplissez le formulaire (jusqu'à 5 photos). Le bouton drapeau permet de signaler une publication qui pose problème.",
    whereToFind: "Bouton « Infos » dans le menu du bas.",
    route: "/infos-tourisme",
    targetSelector: "[data-guide='nav-infos']",
  },
  {
    id: "carnet-offline",
    name: "Mon carnet de voyage",
    category: "utilitaire",
    summary: "Gardez vos lieux préférés pour les relire, même sans internet.",
    description: "Dans certaines zones du Kongo Central, il n'y a pas de réseau. Quand vous appuyez sur « Enregistrer » sur une fiche, elle est gardée dans votre téléphone. Vous pouvez la relire plus tard sans internet.",
    howToUse: "Ouvrez la fiche d'un lieu et appuyez sur « Enregistrer ». Retrouvez-la ensuite dans votre carnet.",
    whereToFind: "Bouton « Carnet » dans le menu du bas.",
    route: "/carnet",
    targetSelector: "[data-guide='nav-carnet']",
  },
  {
    id: "conseils-meteo",
    name: "Conseils pratiques",
    category: "decouverte",
    summary: "Ce qu'il faut savoir avant de partir : saisons, santé, tenue, coutumes, sécurité.",
    description: "Des conseils pour bien préparer votre voyage : la meilleure période (la saison sèche, de juin à septembre), les règles de politesse locales, ce qu'il faut emporter et comment rester en sécurité.",
    howToUse: "Lisez les conseils, rubrique par rubrique.",
    whereToFind: "Bouton « Conseils » dans le menu du bas.",
    route: "/conseils",
    targetSelector: "[data-guide='nav-conseils']",
  },
  {
    id: "compte-auth",
    name: "Mon compte",
    category: "compte",
    summary: "Connectez-vous pour publier des infos et suivre leur acceptation.",
    description: "Avec un compte, vous pouvez publier jusqu'à 5 infos par jour et voir si l'équipe les a acceptées ou refusées. Vous pouvez vous connecter avec votre e-mail ou avec Google.",
    howToUse: "Touchez « Connexion » dans la rubrique Infos Tourisme, ou quand le site vous le demande.",
    whereToFind: "Bouton « Connexion » en haut de la rubrique Infos Tourisme.",
    route: "/infos-tourisme",
    targetSelector: "[data-guide='auth-btn']",
  },
  {
    id: "capture-vocale",
    name: "Dicter une note",
    category: "utilitaire",
    summary: "Dites une note à voix haute au lieu de l'écrire.",
    description: "Pratique en voyage : vous parlez, et votre note ou votre recherche est écrite à votre place.",
    howToUse: "Touchez le micro à droite de la barre de recherche, puis parlez.",
    whereToFind: "Micro dans la barre de recherche, sur la page d'accueil.",
    route: "/",
    targetSelector: "[data-guide='voice-btn']",
  },
  {
    id: "mode-nuit",
    name: "Mode nuit",
    category: "utilitaire",
    summary: "Passez à un écran sombre, plus reposant le soir.",
    description: "Le mode nuit rend l'écran plus sombre pour mieux voir le soir et fatiguer moins les yeux. Votre choix est gardé pour la prochaine fois.",
    howToUse: "Allez dans « Conseils » et touchez le bouton Mode nuit.",
    whereToFind: "En haut de la rubrique « Conseils » (icône lune ou soleil).",
    route: "/conseils",
    targetSelector: "[data-guide='theme-settings-section']",
  },
  {
    id: "telecharger-hors-ligne-complet",
    name: "Utiliser le site sans internet",
    category: "utilitaire",
    summary: "Enregistrez toutes les destinations et leurs photos sur votre téléphone.",
    description: "Ce bouton garde sur votre téléphone toutes les destinations, leurs textes et leurs photos. Ensuite, vous pouvez tout lire sans internet, même au milieu d'un parc. Faites-le quand vous avez du réseau, avant de partir. Cela prend un peu de place sur le téléphone, et vous pouvez tout supprimer quand vous voulez.",
    howToUse: "Allez dans « Carnet », puis touchez « Enregistrer sur mon téléphone ». Attendez que la barre arrive à 100 %.",
    whereToFind: "En haut de la rubrique « Carnet ».",
    route: "/carnet",
    targetSelector: "[data-guide='offline-download-section']",
  },
  {
    id: "fiche-itineraire",
    name: "Itinéraire (sur une fiche)",
    category: "navigation",
    summary: "Voir le chemin pour aller à ce lieu.",
    description: "Sur la fiche d'un lieu, le bouton « Itinéraire » vous montre le chemin depuis l'endroit où vous êtes. Le bouton « Ouvrir Google Maps » ouvre le même lieu dans l'application Google Maps.",
    howToUse: "Ouvrez une fiche, puis touchez « Itinéraire ».",
    whereToFind: "Barre de boutons en haut de chaque fiche de destination.",
    route: "/",
  },
  {
    id: "fiche-ecrire-guide",
    name: "Écrire au guide (sur une fiche)",
    category: "utilitaire",
    summary: "Discuter avec un guide local sur WhatsApp.",
    description: "Sur certaines fiches, le bouton « Écrire au guide » ouvre WhatsApp pour poser vos questions à un guide. Ce bouton n'apparaît pas sur toutes les fiches : l'équipe peut l'activer ou le retirer selon les lieux.",
    howToUse: "Ouvrez une fiche et touchez « Écrire au guide ». WhatsApp doit être installé sur votre téléphone.",
    whereToFind: "Barre de boutons en haut de la fiche, quand il est disponible.",
    route: "/",
  },
  {
    id: "fiche-audioguide",
    name: "Audioguide (sur une fiche)",
    category: "decouverte",
    summary: "Écouter l'histoire du lieu à voix haute.",
    description: "Sur la fiche d'un lieu, touchez « Écouter le récit » : le téléphone lit le texte à voix haute. Vous pouvez mettre en pause, arrêter ou accélérer la lecture.",
    howToUse: "Ouvrez une fiche et touchez « Écouter le récit ».",
    whereToFind: "Sous la barre de boutons, sur chaque fiche de destination.",
    route: "/",
  },
  {
    id: "fiche-signaler",
    name: "Signaler une erreur (sur une fiche)",
    category: "collaboration",
    summary: "Dire à l'équipe qu'une information est fausse ou a changé.",
    description: "Une route est coupée, un prix a changé ou un texte est faux ? Touchez « Signaler une erreur » pour prévenir l'équipe, qui corrigera la fiche.",
    howToUse: "Ouvrez une fiche, touchez « Signaler une erreur » et expliquez le problème en quelques mots.",
    whereToFind: "Barre de boutons en haut de la fiche de destination.",
    route: "/",
  },
];

export const GUIDE_SUGGESTED_QUESTIONS = [
  "Comment utiliser le site sans internet ?",
  "Comment publier une info touristique ?",
  "À quoi servent les boutons d'une fiche ?",
  "Comment utiliser la carte ?",
  "Comment garder un lieu dans mon carnet ?",
  "Comment passer en mode nuit ?",
];
