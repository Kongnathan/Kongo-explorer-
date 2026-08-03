import { Circuit } from "./types";

export const DEFAULT_CIRCUITS: Circuit[] = [
  {
    id: "circuit-historique-boma-matadi",
    title: "Circuit Historique & Portuaire : Boma – Matadi – Vivi",
    subtitle: "Plongez dans le passé prestigieux de la première capitale du Congo et la majesté du Fleuve.",
    duration: "2 Jours / 1 Nuit",
    badge: "🏛️ Histoire & Mémoire",
    image: "https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=1200&auto=format&fit=crop&q=80",
    description: "Ce parcours mythique vous emmène sur les traces des grands explorateurs, des premiers gouverneurs de Boma et des imposants ouvrages d'art de la ville portuaire de Matadi.",
    bestFor: "Amateurs d'histoire, photographes et familles en quête de découvertes culturelles.",
    accessType: "VOITURE",
    stops: [
      {
        locationId: "boma_baobab",
        title: "Etape 1 : Le Baobab de Stanley à Boma",
        subtitle: "Rendez-vous sous l'arbre centenaire",
        duration: "1h30",
        description: "Explorez le baobab creux dans lequel Henry Morton Stanley a rédigé ses récits en 1877 et abrité ses premiers bureaux.",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80",
        tips: "Demandez à l'éco-guide local de vous montrer le vieux bureau de poste au cœur de Boma."
      },
      {
        locationId: "boma",
        title: "Etape 2 : La Cité Historique & Première Cathédrale de Boma",
        subtitle: "Architecture précurseure en fonte importée",
        duration: "2h00",
        description: "Fabriquée en Belgique et assemblée en 1890, l'Église Notre-Dame de Boma et les demeures coloniales constituent un patrimoine architectural unique.",
        image: "https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=1200&auto=format&fit=crop&q=80",
        tips: "Combinez cette visite avec un déjeuner de poisson frais du fleuve sur le quai portuaire."
      },
      {
        locationId: "pont_marechal",
        title: "Etape 3 : Le Pont Maréchal Mobutu à Matadi",
        subtitle: "L'un des plus grands ponts suspendus d'Afrique",
        duration: "2h30",
        description: "Inauguré en 1983, ce chef-d'œuvre d'ingénierie relie les deux rives du Fleuve Congo en franchissant de violents rapides.",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
        tips: "Visitez le belvédère de Matadi en fin d'après-midi pour immortaliser le coucher de soleil sur le fleuve."
      }
    ]
  },
  {
    id: "escapade-nature-kisantu-zongo",
    title: "Escapade Nature & Détente : Kisantu – Zongo",
    subtitle: "Une immersion ressourçante entre forêt tropicale, cascades assourdissantes et flore rare.",
    duration: "3 Jours / 2 Nuits",
    badge: "🌿 Nature & Éco-Tourisme",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
    description: "Le circuit indispensable pour s'évader de la jungle urbaine. Parcourez le jardin botanique séculaire de Kisantu avant d'affronter le rugissement des Chutes de Zongo.",
    bestFor: "Éco-touristes, randonneurs et séjours romantiques en resort naturel.",
    accessType: "4X4",
    stops: [
      {
        locationId: "kisantu",
        title: "Etape 1 : Le Jardin Botanique de Kisantu",
        subtitle: "Créé en 1900 par le Frère Gillet",
        duration: "3h00",
        description: "Un havre de paix de 225 hectares abritant plus de 3000 espèces végétales, un arboretum géant et une serre de cactus exotiques.",
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80",
        tips: "Profitez-en pour pique-niquer sous l'ombre des bambous géants au bord de la rivière Inkisi."
      },
      {
        locationId: "grottes_mbanza",
        title: "Etape 2 : Les Grottes de Mbanza-Ngungu",
        subtitle: "Mystère souterrain & Poissons aveugles",
        duration: "2h30",
        description: "Pénétrez dans les galeries calcaires sacrées pour observer le Caecobarbus geertsii, un poisson aveugle unique au monde.",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
        tips: "Prévoyez des chaussures de randonnée antidérapantes et une lampe frontale haute puissance."
      },
      {
        locationId: "zongo",
        title: "Etape 3 : Les Spectaculaires Chutes de Zongo",
        subtitle: "67 mètres de chute libre et brume vivifiante",
        duration: "Journée entière",
        description: "Contemplez les rochers du diable, les rapides et dormez au Seli Safari Resort au milieu des bruits apaisants de la forêt.",
        image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
        tips: "L'accès en période de pluie nécessite impérativement un véhicule 4x4 tout-terrain."
      }
    ]
  },
  {
    id: "route-cote-atlantique-muanda",
    title: "Odyssée Atlantique & Parc des Mangroves de Muanda",
    subtitle: "Des plages de sable doré de l'Océan Atlantique aux méandres sauvages du Parc Marin.",
    duration: "2 Jours / 1 Nuit",
    badge: "🌊 Océan & Réserve Marine",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=80",
    description: "Découvrez l'unique accès maritime de la République Démocratique du Congo. Rencontrez les lamantins et tortues marines dans le Parc National des Mangroves.",
    bestFor: "Passionnés de biodiversité marine, farniente au bord de l'océan et dégustation de fruits de mer.",
    accessType: "MIXTE",
    stops: [
      {
        locationId: "parc_mangroves",
        title: "Etape 1 : Safari en Pirogue dans les Mangroves",
        subtitle: "La seule réserve marine protégée du RDC",
        duration: "3h30",
        description: "Embarquez avec un éco-garde local pour naviguer dans le labyrinthe de palétuviers et observer les oiseaux aquatiques.",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=80",
        tips: "Apportez des jumelles pour repérer les singes et martins-pêcheurs cachés dans les racines."
      },
      {
        locationId: "plage_tonde",
        title: "Etape 2 : Les Falaises Sacrées & Plage de Tonde",
        subtitle: "Où les falaises ocre surplombent les vagues de l'Océan",
        duration: "Journée entière",
        description: "Explorez les magnifiques falaises sacrées de Muanda et profitez de la brise marine sur les plages de sable fin.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
        tips: "Savourez des crevettes géantes sautées à l'ail fraîchement pêchées dans les paillotes bordant la plage."
      }
    ]
  }
];
