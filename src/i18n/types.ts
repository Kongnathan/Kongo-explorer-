export type SupportedLanguage = "fr" | "en" | "ln" | "kg";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean; // true for fr and en, false/coming soon for ln and kg
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "fr", name: "Français", nativeName: "Français", flag: "🇫🇷", available: true },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", available: true },
  { code: "ln", name: "Lingala", nativeName: "Lingála", flag: "🇨🇩", available: false },
  { code: "kg", name: "Kikongo", nativeName: "Kikôngo", flag: "🇨🇩", available: false },
];

export interface Translations {
  // Navigation bar
  nav: {
    explore: string;
    infos: string;
    map: string;
    circuits: string;
    carnet: string;
    tips: string;
  };

  // Top header & common buttons
  header: {
    title: string;
    guidedTour: string;
    tourTooltip: string;
    tourismNews: string;
    tips: string;
    language: string;
    switchLanguage: string;
    back: string;
    close: string;
  };

  // Explore view & search
  explore: {
    searchPlaceholder: string;
    categories: {
      all: string;
      incontournables: string;
      nature: string;
      history: string;
      urban: string;
    };
    voiceSearchTooltip: string;
    voiceListening: string;
    noResults: string;
    savedCount: string;
    detailsButton: string;
  };

  // Destination detail view
  detail: {
    headerTitle: string;
    itinerary: string;
    itineraryTooltip: string;
    openMaps: string;
    openMapsTooltip: string;
    chatGuide: string;
    chatGuideTooltip: string;
    save: string;
    savedInCarnet: string;
    saveTooltip: string;
    reportError: string;
    reportErrorTooltip: string;
    quickHelpTitle: string;
    quickHelpText: string;
    needHelp: string;
    audioguideTitle: string;
    audioguidePlaying: string;
    audioguidePaused: string;
    audioguideListen: string;
    audioguidePause: string;
    audioguideResume: string;
    effortTitle: string;
    weatherTitle: string;
    seeWeather: string;
    hideWeather: string;
    generalPresentation: string;
    historyCulture: string;
    localCustoms: string;
    ecoResponsibility: string;
    checklistTitle: string;
    bestSeasonTitle: string;
    safetyTitle: string;
    bottomSavedTitle: string;
    bottomSavedDesc: string;
    bottomUnsavedTitle: string;
    bottomUnsavedDesc: string;
    removeButton: string;
    saveButton: string;
  };

  // Offline / Carnet
  carnet: {
    title: string;
    description: string;
    badgeOffline: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreDestinations: string;
    readyOffline: string;
    downloadManagerTitle: string;
    downloadManagerDesc: string;
    downloadButton: string;
    updateButton: string;
    deleteButton: string;
    progressPhotos: string;
    spaceUsed: string;
    destinationsCount: string;
    photosCount: string;
    successDownloaded: string;
    successCleared: string;
  };

  // Tourism News (Infos Tourisme)
  news: {
    title: string;
    subtitle: string;
    postButton: string;
    myPostsButton: string;
    filterAll: string;
    emptyTitle: string;
    emptyDesc: string;
    searchPlaceholder: string;
    readMore: string;
    proposedBy: string;
    statusPending: string;
    statusValidated: string;
    statusRejected: string;
  };

  // Circuits
  circuits: {
    title: string;
    subtitle: string;
    stopsCount: string;
    accessType: string;
    duration: string;
    viewCircuit: string;
    savePromptTitle: string;
    savePromptDesc: string;
  };

  // Map
  map: {
    title: string;
    subtitle: string;
    locateMe: string;
    viewSheet: string;
  };

  // Conseils & settings
  tips: {
    title: string;
    subtitle: string;
    languageCardTitle: string;
    languageCardDesc: string;
    themeCardTitle: string;
    themeCardDesc: string;
    nightMode: string;
    dayMode: string;
    bestSeasonTitle: string;
    bestSeasonDesc: string;
    safetyTitle: string;
    cultureTitle: string;
  };

  // Welcome modal
  welcome: {
    badge: string;
    title: string;
    message: string;
    startTour: string;
    later: string;
    selectLanguage: string;
  };

  // Guide Kongo assistant chat
  guideChat: {
    headerTitle: string;
    headerSubtitle: string;
    startTourBtn: string;
    welcomeMsg: string;
    inputPlaceholder: string;
    suggestionsTitle: string;
    send: string;
    showMe: string;
    suggestedQuestions: string[];
  };
}
