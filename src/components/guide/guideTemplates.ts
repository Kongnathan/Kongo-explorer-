import { SupportedLanguage } from "../../i18n";

export type MessageTemplateId =
  | "welcome"
  | "fallback_general"
  | "fallback_offtopic"
  | "fallback_news"
  | "fallback_map"
  | "fallback_circuits"
  | "fallback_log"
  | "fallback_tips"
  | "fallback_offline"
  | "network_error"
  | "destination_zongo"
  | "destination_boma"
  | "destination_muanda"
  | "destination_kisantu"
  | "destination_matadi";

export type SuggestedActionId =
  | "action_tour"
  | "action_map"
  | "action_circuits"
  | "action_news"
  | "action_log"
  | "action_tips"
  | "action_search"
  | "action_auth";

export interface ActionDefinition {
  actionId: SuggestedActionId;
  route: string;
  tourStepId?: string;
  labels: {
    fr: string;
    en: string;
  };
}

export const ACTION_DEFINITIONS: Record<SuggestedActionId, ActionDefinition> = {
  action_tour: {
    actionId: "action_tour",
    route: "/",
    tourStepId: "start-tour",
    labels: {
      fr: "Lancer la visite guidée",
      en: "Start guided tour",
    },
  },
  action_map: {
    actionId: "action_map",
    route: "/carte",
    tourStepId: "step-carte",
    labels: {
      fr: "Ouvrir la carte",
      en: "Open map",
    },
  },
  action_circuits: {
    actionId: "action_circuits",
    route: "/circuits",
    tourStepId: "step-circuits",
    labels: {
      fr: "Découvrir les circuits",
      en: "Discover circuits",
    },
  },
  action_news: {
    actionId: "action_news",
    route: "/infos-tourisme",
    tourStepId: "step-infos",
    labels: {
      fr: "Voir Infos Tourisme",
      en: "View Tourism News",
    },
  },
  action_log: {
    actionId: "action_log",
    route: "/carnet",
    tourStepId: "step-carnet",
    labels: {
      fr: "Voir mon carnet",
      en: "View my travel log",
    },
  },
  action_tips: {
    actionId: "action_tips",
    route: "/conseils",
    tourStepId: "step-conseils",
    labels: {
      fr: "Voir les conseils & météo",
      en: "View travel tips & weather",
    },
  },
  action_search: {
    actionId: "action_search",
    route: "/",
    tourStepId: "step-search",
    labels: {
      fr: "Rechercher un lieu",
      en: "Search destinations",
    },
  },
  action_auth: {
    actionId: "action_auth",
    route: "/infos-tourisme",
    tourStepId: "step-auth",
    labels: {
      fr: "Se connecter",
      en: "Sign in",
    },
  },
};

export const MESSAGE_TEMPLATES: Record<MessageTemplateId, { fr: string; en: string }> = {
  welcome: {
    fr: "Bonjour et bienvenue sur Kongo Explorer ! Je suis le Guide Kongo. Je peux vous expliquer à quoi sert chaque bouton du site et vous aider à trouver ce que vous cherchez. Que voulez-vous savoir ?",
    en: "Hello and welcome to Kongo Explorer! I am Guide Kongo. I can explain what each button on the site does and help you find what you need. What would you like to know?",
  },
  fallback_general: {
    fr: "Je suis le Guide Kongo ! Que voulez-vous découvrir : la carte, les circuits ou les bons plans du Kongo Central ?",
    en: "I am Guide Kongo! What would you like to explore: the map, the circuits, or the top travel tips in Kongo Central?",
  },
  fallback_offtopic: {
    fr: "Désolé, je suis uniquement le Guide de Kongo Explorer pour vous faire découvrir le Kongo Central. Souhaitez-vous voir nos destinations ou la carte ?",
    en: "Sorry, I am only the guide for Kongo Explorer to help you discover Kongo Central. Would you like to view our destinations or the map?",
  },
  fallback_news: {
    fr: "Connectez-vous, puis appuyez sur « Publier une info » dans la rubrique Infos Tourisme. Votre publication sera relue par l'équipe avant d'apparaître sur le site.",
    en: "Sign in, then tap 'Submit news' in the Tourism News section. Your submission will be reviewed by the team before appearing on the site.",
  },
  fallback_map: {
    fr: "La carte vous montre où se trouvent les lieux à visiter (Zongo, Matadi, Boma, Muanda...) et le chemin pour y aller. Voulez-vous l'ouvrir ?",
    en: "The interactive map shows you where destinations are (Zongo, Matadi, Boma, Muanda...) and how to get there. Would you like to open it?",
  },
  fallback_circuits: {
    fr: "Les circuits sont des promenades toutes prêtes, avec la durée et le type de véhicule conseillé (voiture ou 4x4). Voulez-vous les voir ?",
    en: "Circuits are ready-made travel itineraries with estimated duration and vehicle recommendations. Would you like to explore them?",
  },
  fallback_log: {
    fr: "Appuyez sur « Enregistrer » sur une fiche pour la garder dans votre carnet. Vous pourrez la relire plus tard, même sans internet. Voulez-vous voir votre carnet ?",
    en: "Tap 'Save' on any destination sheet to keep it in your travel log. You can review it later even without internet. Would you like to open your travel log?",
  },
  fallback_tips: {
    fr: "La rubrique Conseils regroupe la météo en direct, le convertisseur USD/CDF et des recommandations de préparation. Voulez-vous la consulter ?",
    en: "The Tips section provides live weather forecasts, a USD/CDF currency converter, and practical travel guidelines. Would you like to check it out?",
  },
  fallback_offline: {
    fr: "Vous pouvez enregistrer toutes les fiches et photos pour les consulter sans internet depuis la rubrique Conseils. Voulez-vous y aller ?",
    en: "You can download all destination sheets and photos to browse without internet in the Tips section. Would you like to go there?",
  },
  network_error: {
    fr: "Je suis à votre écoute pour vous aider à explorer le Kongo Central. Que souhaitez-vous découvrir ?",
    en: "I am here to help you explore Kongo Central. What would you like to discover?",
  },
  destination_zongo: {
    fr: "Les Chutes de Zongo offrent des cascades spectaculaires de 65m dans une nature luxuriante. Voulez-vous voir leur fiche ou leur position ?",
    en: "Zongo Waterfalls feature spectacular 65m cascades amidst lush tropical nature. Would you like to view its details or position?",
  },
  destination_boma: {
    fr: "Boma est une cité historique abritant la première cathédrale métallique d'Afrique centrale et le Baobab de Stanley. Voulez-vous la découvrir ?",
    en: "Boma is a historic city home to the first metal cathedral in Central Africa and Stanley's Baobab. Would you like to discover it?",
  },
  destination_muanda: {
    fr: "Muanda vous fait profiter de l'océan Atlantique et du Parc Marin des Mangroves. Voulez-vous ouvrir la carte pour la situer ?",
    en: "Muanda allows you to enjoy the Atlantic coast and the Mangroves Marine Park. Would you like to view it on the map?",
  },
  destination_kisantu: {
    fr: "Le Jardin Botanique de Kisantu présente des milliers d'espèces végétales et d'arbres centenaires. Voulez-vous explorer les circuits qui y mènent ?",
    en: "Kisantu Botanical Garden showcases thousands of plant species and century-old trees. Would you like to explore the tours leading there?",
  },
  destination_matadi: {
    fr: "Matadi est la capitale provinciale avec son port fluvial historique et le majestueux Pont Maréchal. Voulez-vous la voir sur la carte ?",
    en: "Matadi is the provincial capital featuring a historic river port and the majestic Pont Maréchal suspension bridge. Would you like to see it on the map?",
  },
};

/**
 * Returns the localized text for a message template.
 */
export function getMessageTemplate(id: MessageTemplateId, lang: SupportedLanguage): string {
  const tpl = MESSAGE_TEMPLATES[id] || MESSAGE_TEMPLATES.fallback_general;
  return lang === "en" ? tpl.en : tpl.fr;
}

/**
 * Returns the localized action object for a suggested action id.
 */
export function getActionTemplate(actionId: SuggestedActionId, lang: SupportedLanguage) {
  const def = ACTION_DEFINITIONS[actionId] || ACTION_DEFINITIONS.action_tour;
  return {
    actionId: def.actionId,
    label: lang === "en" ? def.labels.en : def.labels.fr,
    route: def.route,
    tourStepId: def.tourStepId,
  };
}

/**
 * Maps a string actionTarget (from server or Gemini) to our strong SuggestedActionId.
 */
export function mapActionTargetToId(target?: string | null): SuggestedActionId {
  if (!target) return "action_tour";
  const norm = target.toLowerCase();
  if (norm.includes("carte") || norm.includes("map")) return "action_map";
  if (norm.includes("circuit") || norm.includes("tour")) return "action_circuits";
  if (norm.includes("info") || norm.includes("post") || norm.includes("news")) return "action_news";
  if (norm.includes("carnet") || norm.includes("log") || norm.includes("save")) return "action_log";
  if (norm.includes("conseil") || norm.includes("tip") || norm.includes("meteo") || norm.includes("weather")) return "action_tips";
  if (norm.includes("recherche") || norm.includes("search")) return "action_search";
  if (norm.includes("connexion") || norm.includes("auth") || norm.includes("login")) return "action_auth";
  return "action_tour";
}

/**
 * Detects whether a string is primarily French, English, or ambiguous.
 */
export function detectLanguage(text: string): "fr" | "en" | "unknown" {
  if (!text || text.trim() === "") return "unknown";
  const lower = text.toLowerCase();

  const frMarkers = [
    /\bbonjour\b/, /\bsalut\b/, /\bdésolé\b/, /\bmerci\b/, /\bvous\b/, /\bvotre\b/,
    /\bcliquez\b/, /\bappuyez\b/, /\bpour\b/, /\bdans\b/, /\bavec\b/, /\bsur\b/,
    /\ble\b/, /\bla\b/, /\bles\b/, /\bun\b/, /\bune\b/, /\bdes\b/, /\bchutes\b/,
    /\bfiche\b/, /\bcarte\b/, /\bcircuit\b/, /\bcarnet\b/, /\brubrique\b/,
  ];

  const enMarkers = [
    /\bhello\b/, /\bhi\b/, /\bsorry\b/, /\bthank\b/, /\byou\b/, /\byour\b/,
    /\bclick\b/, /\btap\b/, /\bfor\b/, /\bwith\b/, /\bon\b/, /\bthe\b/,
    /\ba\b/, /\ban\b/, /\bwaterfall\b/, /\bsheet\b/, /\bmap\b/, /\btour\b/,
    /\bitinerary\b/, /\bsection\b/, /\bguide\b/,
  ];

  let frScore = 0;
  for (const rx of frMarkers) {
    if (rx.test(lower)) frScore++;
  }

  let enScore = 0;
  for (const rx of enMarkers) {
    if (rx.test(lower)) enScore++;
  }

  if (frScore > enScore) return "fr";
  if (enScore > frScore) return "en";
  return "unknown";
}

/**
 * Matches a user question to a recognized template and action.
 */
export function matchIntentTemplate(queryText: string): {
  templateId: MessageTemplateId;
  actionId: SuggestedActionId;
} | null {
  const q = queryText.toLowerCase();

  // Off-topic refusal
  const offTopicKeywords = [
    "code", "javascript", "python", "html", "math", "calcul",
    "devoir", "politique", "macron", "biden", "football europe",
    "recette pizza", "homework", "politics", "crypto", "bitcoin"
  ];
  if (offTopicKeywords.some((k) => q.includes(k))) {
    return { templateId: "fallback_offtopic", actionId: "action_map" };
  }

  // Specific destination queries
  if (q.includes("zongo") || q.includes("cascade") || q.includes("waterfall")) {
    return { templateId: "destination_zongo", actionId: "action_map" };
  }
  if (q.includes("boma") || q.includes("cathédrale") || q.includes("cathedral") || q.includes("baobab")) {
    return { templateId: "destination_boma", actionId: "action_map" };
  }
  if (q.includes("muanda") || q.includes("moanda") || q.includes("mangrove") || q.includes("plage") || q.includes("beach")) {
    return { templateId: "destination_muanda", actionId: "action_map" };
  }
  if (q.includes("kisantu") || q.includes("botanique") || q.includes("botanical") || q.includes("jardin") || q.includes("garden")) {
    return { templateId: "destination_kisantu", actionId: "action_circuits" };
  }
  if (q.includes("matadi") || q.includes("pont maréchal") || q.includes("marechal")) {
    return { templateId: "destination_matadi", actionId: "action_map" };
  }

  // Feature queries
  if (q.includes("publi") || q.includes("proposer") || q.includes("post") || q.includes("submit") || q.includes("news") || q.includes("share")) {
    return { templateId: "fallback_news", actionId: "action_news" };
  }
  if (q.includes("carte") || q.includes("map") || q.includes("itineraire") || q.includes("position") || q.includes("where") || q.includes("route")) {
    return { templateId: "fallback_map", actionId: "action_map" };
  }
  if (q.includes("circuit") || q.includes("trajet") || q.includes("trip") || q.includes("itinerary")) {
    return { templateId: "fallback_circuits", actionId: "action_circuits" };
  }
  if (q.includes("offline") || q.includes("hors ligne") || q.includes("sans internet") || q.includes("télécharg") || q.includes("download")) {
    return { templateId: "fallback_offline", actionId: "action_tips" };
  }
  if (q.includes("carnet") || q.includes("sauvegard") || q.includes("save") || q.includes("log")) {
    return { templateId: "fallback_log", actionId: "action_log" };
  }
  if (q.includes("conseil") || q.includes("tip") || q.includes("meteo") || q.includes("weather") || q.includes("devise") || q.includes("currency") || q.includes("dollar")) {
    return { templateId: "fallback_tips", actionId: "action_tips" };
  }

  return null;
}

/**
 * Ensures a response respects the active language. If the chatbot returned a response
 * in a mismatched language, this function filters or substitutes it with a matching template.
 */
export function filterOrTranslateResponse(
  rawReply: string,
  userQuery: string,
  activeLanguage: SupportedLanguage,
  serverActionTarget?: string | null,
  serverActionLabel?: string | null
): {
  text: string;
  templateId?: MessageTemplateId;
  suggestedAction?: {
    actionId: SuggestedActionId;
    label: string;
    route: string;
    tourStepId?: string;
  } | null;
} {
  const isEn = activeLanguage === "en";
  const intentMatch = matchIntentTemplate(userQuery);

  // Determine suggested action
  const actionId = intentMatch?.actionId || mapActionTargetToId(serverActionTarget);
  const actionTemplate = getActionTemplate(actionId, activeLanguage);
  const suggestedAction = {
    actionId,
    label: (serverActionLabel && detectLanguage(serverActionLabel) === (isEn ? "en" : "fr"))
      ? serverActionLabel
      : actionTemplate.label,
    route: actionTemplate.route,
    tourStepId: actionTemplate.tourStepId,
  };

  // If we had an explicit intent match and rawReply is empty, use template
  if (!rawReply || rawReply.trim() === "") {
    const tplId = intentMatch?.templateId || "fallback_general";
    return {
      text: getMessageTemplate(tplId, activeLanguage),
      templateId: tplId,
      suggestedAction,
    };
  }

  // Detect language mismatch between active context and generated reply
  const detected = detectLanguage(rawReply);
  const targetLang = isEn ? "en" : "fr";

  if (detected !== "unknown" && detected !== targetLang) {
    // Mismatch detected: e.g. User is in English but chatbot generated French
    if (intentMatch) {
      return {
        text: getMessageTemplate(intentMatch.templateId, activeLanguage),
        templateId: intentMatch.templateId,
        suggestedAction,
      };
    }

    // Default polite translation for mismatched output
    const fallbackId: MessageTemplateId = "fallback_general";
    return {
      text: getMessageTemplate(fallbackId, activeLanguage),
      templateId: fallbackId,
      suggestedAction,
    };
  }

  // If language matches, keep original text and preserve templateId if identified
  return {
    text: rawReply,
    templateId: intentMatch?.templateId,
    suggestedAction,
  };
}
