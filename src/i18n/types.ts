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

  // Settings & display
  settings: {
    title: string;
    darkMode: string;
    lightMode: string;
    offlineData: string;
  };

  // Conseils & settings
  tips: {
    title: string;
    subtitle: string;
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    languageCardTitle: string;
    languageCardDesc: string;
    themeCardTitle: string;
    themeCardDesc: string;
    nightModeActive: string;
    dayModeActive: string;
    nightMode: string;
    dayMode: string;
    themeOverrideNote: string;
    bestSeasonTitle: string;
    bestSeasonDesc: string;
    safetyTitle: string;
    cultureTitle: string;
    tabs: {
      weather: string;
      currency: string;
      customs: string;
      eco: string;
      prep: string;
      lexicon: string;
    };
    weather: {
      headerTitle: string;
      headerSubtitle: string;
      myPositionBtn: string;
      locating: string;
      citiesHeader: string;
      loading: string;
      adviceTitle: string;
      forecast7Days: string;
      today: string;
      humidity: string;
      wind: string;
      rain: string;
      feelsLike: string;
    };
    currency: {
      title: string;
      subtitle: string;
      referenceRate: string;
      updateRate: string;
      adjustRate: string;
      adjustTitle: string;
      cancel: string;
      apply: string;
      marketNote: string;
      usdLabel: string;
      cdfLabel: string;
      quickUsd: string;
      quickCdf: string;
      estimatedEquiv: string;
      priceGuideTitle: string;
      paymentAdviceCDFTitle: string;
      paymentAdviceCDFDesc: string;
      paymentAdviceUSDTitle: string;
      paymentAdviceUSDDesc: string;
    };
    customs: {
      title: string;
      intro: string;
      photoTitle: string;
      photoDesc: string;
      greetingsTitle: string;
      greetingsDesc: string;
      eldersTitle: string;
      eldersDesc: string;
      dressTitle: string;
      dressDesc: string;
    };
    eco: {
      title: string;
      intro: string;
      zeroWasteTitle: string;
      zeroWasteDesc: string;
      wildlifeTitle: string;
      wildlifeDesc: string;
      waterTitle: string;
      waterDesc: string;
    };
    prep: {
      title: string;
      intro: string;
      healthTitle: string;
      healthDesc: string;
      permitsTitle: string;
      permitsDesc: string;
      luggageTitle: string;
      luggageDesc: string;
    };
    lexicon: {
      title: string;
      intro: string;
      colMeaning: string;
      colLocal: string;
      colLang: string;
    };
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

  // Interactive step-by-step tour
  tour: {
    stepOf: string;
    skip: string;
    prev: string;
    next: string;
    finish: string;
    haveQuestion: string;
    openChat: string;
  };

  // Guide floating action button
  guideFab: {
    chat: string;
    tour: string;
    badge: string;
    ariaLabel: string;
  };

  // Offline pre-download manager
  offlineManager: {
    title: string;
    desc: string;
    saveBtn: string;
    savingBtn: string;
    clearBtn: string;
    readyBadge: string;
    notReadyBadge: string;
    successMessage: string;
    errorMessage: string;
    clearSuccess: string;
    clearConfirmTitle: string;
    clearConfirmDesc: string;
    confirmYes: string;
    confirmNo: string;
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
    ariaLabel: string;
    mascotAlt: string;
    onlineStatus: string;
    defaultReply: string;
    fallbackGeneral: string;
    fallbackOffTopic: string;
    fallbackNews: string;
    fallbackMap: string;
    fallbackCircuits: string;
    fallbackLog: string;
    actionStartTour: string;
    actionOpenMap: string;
    actionViewNews: string;
    actionDiscoverCircuits: string;
    actionViewLog: string;
    suggestedQuestions: string[];
  };
}
