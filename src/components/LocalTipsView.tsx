import React, { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { Location } from "../types";
import { DEFAULT_LOCATIONS } from "../data";
import OfflineDownloadManager from "./OfflineDownloadManager";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";

interface Phrase {
  french: string;
  english: string;
  local: string;
  lang: "Lingala" | "Kikongo";
}

interface PresetCity {
  name: string;
  lat: number;
  lng: number;
  desc: string;
}

const getPresetCities = (isEn: boolean): PresetCity[] => [
  { name: "Matadi", lat: -5.8422, lng: 13.4542, desc: isEn ? "Capital & Port city at Pont Maréchal" : "Chef-lieu & Port fluvial du Pont Maréchal" },
  { name: "Muanda", lat: -5.9333, lng: 12.3500, desc: isEn ? "Atlantic Coast & Mangroves Marine Park" : "Côté Océan & Parc Marin des Mangroves" },
  { name: "Zongo", lat: -4.7700, lng: 14.8800, desc: isEn ? "Spectacular Waterfalls & Nature Reserve" : "Chutes spectaculaires & Réserve naturelle" },
  { name: "Kisantu", lat: -5.1333, lng: 15.1000, desc: isEn ? "Historic 1900 Botanical Garden" : "Jardin Botanique historique de 1900" },
  { name: "Boma", lat: -5.8500, lng: 13.0500, desc: isEn ? "First Metal Cathedral & Historic City" : "Première Cathédrale Métallique & Cité historique" },
  { name: "Mbanza-Ngungu", lat: -5.2500, lng: 14.8667, desc: isEn ? "Sacred Caves & Blind Cavefish" : "Grottes sacrées & Poissons aveugles" },
];

interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProb: number;
}

interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  current: {
    temp: number;
    apparentTemp: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    isDay: number;
  };
  daily: DailyForecast[];
}

function getWeatherInfo(code: number, isEn: boolean): { label: string; icon: string; bg: string; text: string; advice: string } {
  if (code === 0) {
    return {
      label: isEn ? "Sunny / Clear skies" : "Ensoleillé / Ciel dégagé",
      icon: "wb_sunny",
      bg: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      advice: isEn
        ? "☀️ Ideal conditions! Perfect for exploring waterfalls, beach outings in Muanda, and photo sessions at scenic viewpoints."
        : "☀️ Conditions idéales ! Parfait pour l'exploration des chutes, les baignades à Muanda et les séances photo aux belvédères."
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      label: isEn ? "Partly cloudy" : "Partiellement nuageux",
      icon: "partly_cloudy_day",
      bg: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
      text: "text-sky-600 dark:text-sky-400",
      advice: isEn
        ? "⛅ Very pleasant weather for botanical walks in Kisantu and cultural tours in Boma without intense tropical heat."
        : "⛅ Temps très agréable pour les randonnées botaniques à Kisantu et les visites culturelles à Boma sans forte chaleur."
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: isEn ? "Mist / Tropical fog" : "Brume / Brouillard tropical",
      icon: "foggy",
      bg: "from-slate-500/20 to-zinc-500/10 border-slate-500/30",
      text: "text-slate-600 dark:text-slate-300",
      advice: isEn
        ? "🌫️ Reduced visibility in the Mayombe mountain passes. Drive with heightened caution on Route Nationale 1 curves."
        : "🌫️ Visibilité réduite dans les montagnes du Mayombe. Prudence renforcée sur la Nationale 1 au niveau des virages."
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: isEn ? "Rain / Tropical showers" : "Pluie / Averses tropicales",
      icon: "rainy",
      bg: "from-blue-600/20 to-indigo-600/10 border-blue-600/30",
      text: "text-blue-600 dark:text-blue-400",
      advice: isEn
        ? "🌧️ Forest roads and trails may be muddy. A 4x4 vehicle is recommended to access natural reserves."
        : "🌧️ Pistes potentiellement boueuses. Un véhicule 4x4 est recommandé pour accéder aux sites naturels en forêt."
    };
  }
  if (code >= 95) {
    return {
      label: isEn ? "Severe tropical thunderstorms" : "Orages tropicaux violents",
      icon: "thunderstorm",
      bg: "from-purple-600/20 to-red-600/10 border-purple-600/30",
      text: "text-purple-600 dark:text-purple-400",
      advice: isEn
        ? "⛈️ Risk of sudden river surges. Avoid boat excursions and seek safe shelter until the storm clears."
        : "⛈️ Risque de crues subites du fleuve et des rivières. Évitez les excursions en pirogue et mettez-vous à l'abri."
    };
  }
  return {
    label: isEn ? "Local variations" : "Variables locales",
    icon: "cloud",
    bg: "from-teal-500/20 to-emerald-500/10 border-teal-500/30",
    text: "text-teal-600 dark:text-teal-400",
    advice: isEn
      ? "🌤️ Tropical weather under control. Remember to carry drinking water and a light waterproof layer."
      : "🌤️ Climat tropical sous contrôle. Pensez à prendre de l'eau et un vêtement imperméable léger."
  };
}

interface LocalTipsViewProps {
  locations?: Location[];
}

export default function LocalTipsView({ locations }: LocalTipsViewProps = {}) {
  const activeLocations = (locations && locations.length > 0) ? locations : DEFAULT_LOCATIONS;
  const { isDark, toggleTheme, setTheme } = useTheme();
  const { language, t } = useLanguage();
  const isEn = language === "en";

  const [activeCategory, setActiveCategory] = useState<"meteo" | "devise" | "culture" | "eco" | "prep" | "lang">("meteo");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "success" | "denied">("idle");
  const [selectedCityName, setSelectedCityName] = useState<string>("Matadi");

  // Devises / Currency Converter State
  const [usdVal, setUsdVal] = useState<string>("10");
  const [cdfVal, setCdfVal] = useState<string>("28500");
  const [exchangeRate, setExchangeRate] = useState<number>(2850);
  const [customRateInput, setCustomRateInput] = useState<string>("2850");
  const [showRateEdit, setShowRateEdit] = useState<boolean>(false);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);

  // Fetch live exchange rate USD -> CDF
  const fetchLiveRate = async () => {
    setLoadingRate(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && data.rates.CDF) {
          const rate = Math.round(data.rates.CDF);
          setExchangeRate(rate);
          setCustomRateInput(rate.toString());
          const currentUsd = parseFloat(usdVal) || 0;
          setCdfVal(Math.round(currentUsd * rate).toString());
        }
      }
    } catch (e) {
      console.warn("Using default rate 2850 CDF:", e);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchLiveRate();
  }, []);

  const handleUsdChange = (val: string) => {
    setUsdVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setCdfVal(Math.round(num * exchangeRate).toString());
    } else {
      setCdfVal("");
    }
  };

  const handleCdfChange = (val: string) => {
    setCdfVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && exchangeRate > 0) {
      setUsdVal((num / exchangeRate).toFixed(2));
    } else {
      setUsdVal("");
    }
  };

  const handleSaveCustomRate = () => {
    const parsed = parseFloat(customRateInput);
    if (!isNaN(parsed) && parsed > 0) {
      setExchangeRate(parsed);
      setShowRateEdit(false);
      const currentUsd = parseFloat(usdVal) || 0;
      setCdfVal(Math.round(currentUsd * parsed).toString());
    }
  };

  const phrases: Phrase[] = [
    { french: "Bonjour (Comment ça va ?)", english: "Hello (How are you?)", local: "Mbote (Sango nini ?)", lang: "Lingala" },
    { french: "Ça va bien", english: "I am doing well", local: "Sango malamu", lang: "Lingala" },
    { french: "Merci beaucoup", english: "Thank you very much", local: "Melési mingi / Matondo mingi", lang: "Lingala" },
    { french: "S'il vous plaît", english: "Please", local: "S'il vous plaît / Tafadhali", lang: "Lingala" },
    { french: "Au revoir", english: "Goodbye (Stay well)", local: "Tikala malamu (Restez bien)", lang: "Lingala" },
    { french: "Bonjour (à vous)", english: "Hello (to you all)", local: "Mbote na beno", lang: "Kikongo" },
    { french: "Merci beaucoup", english: "Thank you very much", local: "Matondo mingi", lang: "Kikongo" },
    { french: "Comment allez-vous ?", english: "How are you doing?", local: "Inki bansangu ?", lang: "Kikongo" },
    { french: "Tout va bien", english: "All is well", local: "Bansangu yambote", lang: "Kikongo" },
    { french: "Eau", english: "Water", local: "Maza", lang: "Kikongo" }
  ];

  const fetchWeatherForCoords = async (lat: number, lng: number, labelName: string) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FKinshasa`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(isEn ? "Unable to reach weather service." : "Impossible de joindre le service météo.");
      const data = await res.json();

      const dailyArr: DailyForecast[] = (data.daily?.time || []).map((tVal: string, idx: number) => ({
        date: tVal,
        weatherCode: data.daily.weather_code[idx],
        tempMax: Math.round(data.daily.temperature_2m_max[idx]),
        tempMin: Math.round(data.daily.temperature_2m_min[idx]),
        precipProb: data.daily.precipitation_probability_max?.[idx] ?? 0
      }));

      setWeatherData({
        city: labelName,
        latitude: lat,
        longitude: lng,
        current: {
          temp: Math.round(data.current.temperature_2m),
          apparentTemp: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          precipitation: data.current.precipitation,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day
        },
        daily: dailyArr
      });
      setSelectedCityName(labelName);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setWeatherError(isEn ? "Error retrieving weather forecast." : "Erreur lors de la récupération des prévisions météo.");
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleUseGeolocation = () => {
    setGeoStatus("locating");
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      fetchWeatherForCoords(-5.8422, 13.4542, "Matadi");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("success");
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetchWeatherForCoords(lat, lng, isEn ? "My Current Location" : "Ma Position Actuelle");
      },
      (err) => {
        console.warn("Geolocation denied or error:", err);
        setGeoStatus("denied");
        // Smoothly fall back to Matadi without blocking the user
        fetchWeatherForCoords(-5.8422, 13.4542, isEn ? "Matadi (Kongo Central Capital)" : "Matadi (Capitale Kongo Central)");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Initial load
  useEffect(() => {
    fetchWeatherForCoords(-5.8422, 13.4542, "Matadi");
  }, []);

  const presetCities = getPresetCities(isEn);

  return (
    <div className="flex-1 pb-24 font-sans bg-background text-on-background animate-fade-in">
      {/* Sticky Header */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm backdrop-blur-md">
        <div className="relative flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          <div 
            className="absolute inset-0 bg-[url('/icon.svg')] bg-no-repeat bg-center bg-contain opacity-[0.08] pointer-events-none -z-10" 
            id="header-bg-logo-tips"
          />
          <a
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            title="Kongo Explorer – Accueil"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 overflow-hidden border border-primary/20">
              <img src="/icon.svg" className="w-full h-full object-contain" alt="Logo Kongo Explorer" />
            </div>
            <span className="font-sans text-headline-md font-bold text-primary">Kongo Explorer</span>
          </a>
          <div className="flex items-center gap-2">
            {/* Multilingual Selector */}
            <LanguageSelector variant="compact" />

            {/* Quick Night Mode Toggle Button in Header */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-all cursor-pointer shadow-xs active:scale-95"
              title={isDark ? (isEn ? "Switch to Day Mode (Light)" : "Passer en Mode Jour (Clair)") : (isEn ? "Switch to Night Mode (Dark)" : "Passer en Mode Nuit (Sombre)")}
              aria-label="Basculer le mode nuit"
              data-guide="btn-theme-header"
            >
              <span className={`material-symbols-outlined text-[16px] ${isDark ? "text-amber-400" : "text-primary"}`}>
                {isDark ? "light_mode" : "dark_mode"}
              </span>
              <span className="hidden sm:inline font-mono text-[11px] font-bold">
                {isDark ? t.tips.dayMode : t.tips.nightMode}
              </span>
            </button>

            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold uppercase hidden md:inline">
              {isEn ? "Guide & Weather" : "Guide & Météo"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-6 space-y-6">
        {/* Intro Hero Banner with Single H1 */}
        <section className="bg-gradient-to-br from-primary via-primary-container to-secondary text-white p-6 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">partly_cloudy_day</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold">
            <span className="material-symbols-outlined text-[16px] text-amber-300">wb_sunny</span>
            <span>{t.tips.heroBadge}</span>
          </div>
          <h1 className="font-sans text-headline-lg-mobile md:text-headline-md font-bold leading-tight">
            {t.tips.heroTitle}
          </h1>
          <p className="text-white/90 text-body-md leading-relaxed">
            {t.tips.heroSubtitle}
          </p>
        </section>

        {/* PARAMÈTRES D'AFFICHAGE & MODE NUIT */}
        <section 
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 shadow-sm space-y-3"
          data-guide="theme-settings-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                isDark 
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-400" 
                  : "bg-primary/10 border-primary/20 text-primary"
              }`}>
                <span className="material-symbols-outlined text-[22px]">
                  {isDark ? "dark_mode" : "light_mode"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-sm font-bold text-on-surface">
                    {t.tips.themeCardTitle}
                  </h2>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    isDark 
                      ? "bg-amber-400/20 text-amber-300" 
                      : "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                  }`}>
                    {isDark ? t.tips.nightModeActive : t.tips.dayModeActive}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  {t.tips.themeCardDesc}
                </p>
              </div>
            </div>

            {/* Toggle Segmented Pill */}
            <div className="flex items-center bg-surface-container p-1 rounded-2xl border border-outline-variant/20 self-start sm:self-center shrink-0">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isDark 
                    ? "bg-surface-container-lowest text-primary shadow-sm scale-[1.02]" 
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title={isEn ? "Activate Day Mode (Light)" : "Activer le Mode Jour (Clair)"}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">wb_sunny</span>
                <span>{t.tips.dayMode}</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark 
                    ? "bg-primary text-white shadow-sm scale-[1.02]" 
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title={isEn ? "Activate Night Mode (Dark)" : "Activer le Mode Nuit (Sombre)"}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-300">dark_mode</span>
                <span>{t.tips.nightMode}</span>
              </button>
            </div>
          </div>
        </section>

        {/* SÉLECTEUR DE LANGUE DE L'APPLICATION */}
        <LanguageSelector variant="full" />

        {/* OPTION TOUT TÉLÉCHARGER POUR HORS-LIGNE (INDEXEDDB) */}
        <OfflineDownloadManager locations={activeLocations} />

        {/* Categories Tab Selector */}
        <div className="flex space-x-1 bg-surface-container p-1.5 rounded-2xl overflow-x-auto hide-scrollbar shadow-inner">
          <button
            onClick={() => setActiveCategory("meteo")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "meteo"
                ? "bg-primary text-white shadow-md scale-[1.02]"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">thermostat</span>
            {t.tips.tabs.weather}
          </button>
          <button
            onClick={() => setActiveCategory("devise")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "devise"
                ? "bg-primary text-white shadow-md scale-[1.02]"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            {t.tips.tabs.currency}
          </button>
          <button
            onClick={() => setActiveCategory("culture")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "culture"
                ? "bg-primary text-white shadow-md scale-[1.02]"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">family_restroom</span>
            {t.tips.tabs.customs}
          </button>
          <button
            onClick={() => setActiveCategory("eco")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "eco"
                ? "bg-primary text-white shadow-md scale-[1.02]"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">eco</span>
            {t.tips.tabs.eco}
          </button>
          <button
            onClick={() => setActiveCategory("prep")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "prep"
                ? "bg-primary text-white shadow-md scale-[1.02]"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            {t.tips.tabs.prep}
          </button>
          <button
            onClick={() => setActiveCategory("lang")}
            className={`flex-1 py-3 px-4 rounded-xl font-sans text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === "lang"
                ? "bg-primary text-white shadow-md scale-[1.02]"
                : "text-on-surface-variant hover:bg-surface-variant/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">translate</span>
            {t.tips.tabs.lexicon}
          </button>
        </div>

        {/* Content Panel */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-md min-h-[350px]">
          {/* TAB 1: WEATHER & GEOLOCATION */}
          {activeCategory === "meteo" && (
            <div className="space-y-6 animate-fade-in">
              {/* Geolocation Button and City Shortcuts */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container p-4 rounded-2xl border border-outline-variant/20">
                <div>
                  <h3 className="font-sans font-bold text-body-lg text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">my_location</span>
                    <span>{t.tips.weather.headerTitle}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {t.tips.weather.headerSubtitle}
                  </p>
                </div>

                <button
                  onClick={handleUseGeolocation}
                  disabled={geoStatus === "locating"}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-container text-white font-sans text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${geoStatus === "locating" ? "animate-spin" : ""}`}>
                    {geoStatus === "locating" ? "sync" : "near_me"}
                  </span>
                  <span>{geoStatus === "locating" ? t.tips.weather.locating : t.tips.weather.myPositionBtn}</span>
                </button>
              </div>

              {/* Preset Cities Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-outline uppercase">
                  {t.tips.weather.citiesHeader}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {presetCities.map((city) => {
                    const isSelected = selectedCityName === city.name;
                    return (
                      <button
                        key={city.name}
                        onClick={() => fetchWeatherForCoords(city.lat, city.lng, city.name)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white border-primary shadow-md font-bold"
                            : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                        }`}
                        title={city.desc}
                      >
                        <span className="text-xs font-sans block line-clamp-1">{city.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weather Status & Display */}
              {loadingWeather && (
                <div className="py-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
                  <p className="font-sans text-xs font-bold text-outline">{t.tips.weather.loading}</p>
                </div>
              )}

              {weatherError && !loadingWeather && (
                <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl">error</span>
                  <span className="text-xs font-sans font-medium">{weatherError}</span>
                </div>
              )}

              {weatherData && !loadingWeather && (() => {
                const info = getWeatherInfo(weatherData.current.weatherCode, isEn);
                return (
                  <div className="space-y-6">
                    {/* Main Current Weather Card */}
                    <div className={`p-6 rounded-3xl bg-gradient-to-br ${info.bg} border shadow-lg space-y-4`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                            <span className="font-sans font-extrabold text-title-lg text-on-surface">
                              {weatherData.city}
                            </span>
                          </div>
                          <p className={`text-xs font-mono font-bold mt-1 ${info.text}`}>
                            {info.label}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`material-symbols-outlined text-5xl ${info.text}`}>
                            {info.icon}
                          </span>
                          <div>
                            <span className="font-sans font-black text-4xl text-on-surface">
                              {weatherData.current.temp}°C
                            </span>
                            <span className="block text-[11px] font-mono text-outline">
                              {t.tips.weather.feelsLike} {weatherData.current.apparentTemp}°C
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Weather Details Grid */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-outline-variant/20">
                        <div className="bg-surface-container-lowest/80 p-3 rounded-2xl text-center">
                          <span className="material-symbols-outlined text-sky-600 text-[20px]">humidity_mid</span>
                          <span className="block text-[10px] font-mono font-bold text-outline uppercase mt-0.5">{t.tips.weather.humidity}</span>
                          <span className="font-sans font-bold text-xs text-on-surface">{weatherData.current.humidity}%</span>
                        </div>

                        <div className="bg-surface-container-lowest/80 p-3 rounded-2xl text-center">
                          <span className="material-symbols-outlined text-teal-600 text-[20px]">air</span>
                          <span className="block text-[10px] font-mono font-bold text-outline uppercase mt-0.5">{t.tips.weather.wind}</span>
                          <span className="font-sans font-bold text-xs text-on-surface">{weatherData.current.windSpeed} km/h</span>
                        </div>

                        <div className="bg-surface-container-lowest/80 p-3 rounded-2xl text-center">
                          <span className="material-symbols-outlined text-blue-600 text-[20px]">water_drop</span>
                          <span className="block text-[10px] font-mono font-bold text-outline uppercase mt-0.5">{t.tips.weather.rain}</span>
                          <span className="font-sans font-bold text-xs text-on-surface">{weatherData.current.precipitation} mm</span>
                        </div>
                      </div>

                      {/* Dynamic Trip Planning Recommendation */}
                      <div className="bg-surface-container-lowest/90 p-4 rounded-2xl border border-outline-variant/20 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-primary uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          {t.tips.weather.adviceTitle}
                        </span>
                        <p className="text-xs font-sans text-on-surface font-medium leading-relaxed">
                          {info.advice}
                        </p>
                      </div>
                    </div>

                    {/* 7-Day Forecast */}
                    <div className="space-y-3">
                      <h4 className="font-sans font-bold text-body-md text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                        <span>{t.tips.weather.forecast7Days}</span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {weatherData.daily.map((day, idx) => {
                          const dayInfo = getWeatherInfo(day.weatherCode, isEn);
                          const dateObj = new Date(day.date);
                          const dayName = idx === 0 
                            ? t.tips.weather.today 
                            : dateObj.toLocaleDateString(isEn ? "en-US" : "fr-FR", { weekday: "short" });
                          return (
                            <div
                              key={day.date}
                              className="bg-surface-container p-3 rounded-2xl border border-outline-variant/20 text-center space-y-1"
                            >
                              <span className="text-[11px] font-mono font-bold text-outline uppercase block">
                                {dayName}
                              </span>
                              <span className={`material-symbols-outlined text-2xl my-1 block ${dayInfo.text}`}>
                                {dayInfo.icon}
                              </span>
                              <div className="text-xs font-sans font-bold text-on-surface">
                                {day.tempMax}° / <span className="text-outline text-[11px]">{day.tempMin}°</span>
                              </div>
                              {day.precipProb > 20 && (
                                <span className="text-[10px] font-mono font-bold text-blue-600 block">
                                  🌧️ {day.precipProb}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: CONVERTISSEUR DE DEVISES USD / CDF */}
          {activeCategory === "devise" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Banner & Exchange Rate Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-primary/5 to-amber-900/10 p-5 rounded-3xl border border-emerald-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[26px]">currency_exchange</span>
                    <h3 className="font-sans text-headline-md font-bold text-on-surface">
                      {t.tips.currency.title}
                    </h3>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {t.tips.currency.subtitle}
                  </p>
                </div>

                {/* Rate Status Pill */}
                <div className="flex items-center gap-2 bg-surface-container-lowest p-2.5 rounded-2xl border border-outline-variant/30 shadow-sm">
                  <div className="text-right">
                    <span className="block text-[10px] font-mono font-bold text-outline uppercase">{t.tips.currency.referenceRate}</span>
                    <span className="font-sans font-black text-sm text-primary">
                      1 USD = {exchangeRate.toLocaleString(isEn ? "en-US" : "fr-FR")} CDF
                    </span>
                  </div>
                  <button
                    onClick={fetchLiveRate}
                    disabled={loadingRate}
                    title={t.tips.currency.updateRate}
                    className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${loadingRate ? "animate-spin" : ""}`}>
                      sync
                    </span>
                  </button>
                  <button
                    onClick={() => setShowRateEdit(!showRateEdit)}
                    title={t.tips.currency.adjustRate}
                    className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>
              </div>

              {/* Manual Rate Edit Banner if toggled */}
              {showRateEdit && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                      {t.tips.currency.adjustTitle}
                    </span>
                    <button
                      onClick={() => setShowRateEdit(false)}
                      className="text-xs text-outline hover:text-on-surface cursor-pointer"
                    >
                      {t.tips.currency.cancel}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-on-surface">1 USD =</span>
                    <input
                      type="number"
                      value={customRateInput}
                      onChange={(e) => setCustomRateInput(e.target.value)}
                      placeholder="Ex: 2850"
                      className="w-32 bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                    <span className="text-xs font-mono font-bold text-on-surface">CDF</span>
                    <button
                      onClick={handleSaveCustomRate}
                      className="bg-primary hover:bg-primary-container text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow cursor-pointer"
                    >
                      {t.tips.currency.apply}
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    💡 {t.tips.currency.marketNote}
                  </p>
                </div>
              )}

              {/* Interactive Dual Converter Form */}
              <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* USD Box */}
                  <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono font-bold text-outline uppercase flex items-center gap-1.5">
                        <span className="text-lg">🇺🇸</span> {t.tips.currency.usdLabel}
                      </label>
                      <span className="text-xs font-bold text-primary font-mono">$</span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={usdVal}
                        onChange={(e) => handleUsdChange(e.target.value)}
                        placeholder="USD..."
                        className="w-full bg-surface-container/60 border border-outline-variant/30 rounded-xl px-4 py-3 text-2xl font-black font-sans text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xl text-outline">
                        $
                      </span>
                    </div>

                    {/* Quick Preset Buttons USD */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-outline block">{t.tips.currency.quickUsd}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["1", "5", "10", "20", "50", "100"].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => handleUsdChange(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              usdVal === preset
                                ? "bg-primary text-white shadow-sm"
                                : "bg-surface-container-high hover:bg-surface-variant text-on-surface"
                            }`}
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CDF Box */}
                  <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono font-bold text-outline uppercase flex items-center gap-1.5">
                        <span className="text-lg">🇨🇩</span> {t.tips.currency.cdfLabel}
                      </label>
                      <span className="text-xs font-bold text-emerald-600 font-mono">FC</span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={cdfVal}
                        onChange={(e) => handleCdfChange(e.target.value)}
                        placeholder="CDF..."
                        className="w-full bg-surface-container/60 border border-outline-variant/30 rounded-xl px-4 py-3 text-2xl font-black font-sans text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-sm text-outline">
                        FC
                      </span>
                    </div>

                    {/* Quick Preset Buttons CDF */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-outline block">{t.tips.currency.quickCdf}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "2,5k", val: "2500" },
                          { label: "5k", val: "5000" },
                          { label: "10k", val: "10000" },
                          { label: "20k", val: "20000" },
                          { label: "50k", val: "50000" },
                          { label: "100k", val: "100000" }
                        ].map((p) => (
                          <button
                            key={p.val}
                            onClick={() => handleCdfChange(p.val)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              cdfVal === p.val
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-surface-container-high hover:bg-surface-variant text-on-surface"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Output Banner */}
                {usdVal && cdfVal && !isNaN(parseFloat(usdVal)) && (
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-xs font-mono text-outline uppercase block">{t.tips.currency.estimatedEquiv}</span>
                    <p className="font-sans text-headline-sm font-extrabold text-primary">
                      {parseFloat(usdVal).toLocaleString(isEn ? "en-US" : "fr-FR")} $ USD ≈ {Math.round(parseFloat(cdfVal)).toLocaleString(isEn ? "en-US" : "fr-FR")} {isEn ? "Congolese Francs" : "Francs Congolais"}
                    </p>
                  </div>
                )}
              </div>

              {/* Practical Price Guide for Tourists in DRC */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">shopping_bag</span>
                  <h4 className="font-sans text-title-md font-bold text-on-surface">
                    {t.tips.currency.priceGuideTitle}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      icon: "water_drop",
                      title: isEn ? "Bottled mineral water 1.5L" : "Eau minérale 1.5L",
                      priceCDF: "2 500 - 3 500 FC",
                      priceUSD: "~ 1.00 $"
                    },
                    {
                      icon: "restaurant",
                      title: isEn ? "Local meal (Liboke / Fish)" : "Repas local (Liboke/Poisson)",
                      priceCDF: "15 000 - 30 000 FC",
                      priceUSD: isEn ? "~ $5.00 to $10.00" : "~ 5.00 $ à 10.00 $"
                    },
                    {
                      icon: "local_taxi",
                      title: isEn ? "City taxi ride (Matadi/Boma)" : "Course Taxi urbain (Matadi/Boma)",
                      priceCDF: "5 000 - 10 000 FC",
                      priceUSD: isEn ? "~ $1.75 to $3.50" : "~ 1.75 $ à 3.50 $"
                    },
                    {
                      icon: "sailing",
                      title: isEn ? "Pirogue / Boat cruise" : "Balade en pirogue / Bateau",
                      priceCDF: "30 000 - 60 000 FC",
                      priceUSD: isEn ? "~ $10.00 to $20.00" : "~ 10.00 $ à 20.00 $"
                    },
                    {
                      icon: "park",
                      title: isEn ? "Park / Botanical garden admission" : "Entrée Parc / Jardin Botanique",
                      priceCDF: "28 500 FC",
                      priceUSD: "~ 10.00 $"
                    },
                    {
                      icon: "nutrition",
                      title: isEn ? "Fresh tropical fruit bunch" : "Régime de bananes / Fruits",
                      priceCDF: "3 000 - 8 000 FC",
                      priceUSD: isEn ? "~ $1.00 to $3.00" : "~ 1.00 $ à 3.00 $"
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant/20 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </div>
                      <div>
                        <h5 className="font-sans text-xs font-bold text-on-surface">{item.title}</h5>
                        <p className="font-mono text-xs font-extrabold text-primary mt-0.5">{item.priceCDF}</p>
                        <span className="text-[10px] font-mono text-outline block">{item.priceUSD}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Advice Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 space-y-1.5">
                  <h5 className="font-sans text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    {t.tips.currency.paymentAdviceCDFTitle}
                  </h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t.tips.currency.paymentAdviceCDFDesc}
                  </p>
                </div>

                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20 space-y-1.5">
                  <h5 className="font-sans text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    {t.tips.currency.paymentAdviceUSDTitle}
                  </h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t.tips.currency.paymentAdviceUSDDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CULTURE */}
          {activeCategory === "culture" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">{t.tips.customs.title}</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                {t.tips.customs.intro}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
                    {t.tips.customs.photoTitle}
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    {t.tips.customs.photoDesc}
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">diversity_3</span>
                    {t.tips.customs.greetingsTitle}
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    {t.tips.customs.greetingsDesc}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">gavel</span>
                    {t.tips.customs.eldersTitle}
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    {t.tips.customs.eldersDesc}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">local_activity</span>
                    {t.tips.customs.dressTitle}
                  </h4>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                    {t.tips.customs.dressDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ECO */}
          {activeCategory === "eco" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">nature_people</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">{t.tips.eco.title}</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                {t.tips.eco.intro}
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">delete_sweep</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800 dark:text-emerald-300">{t.tips.eco.zeroWasteTitle}</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      {t.tips.eco.zeroWasteDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">pets</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800 dark:text-emerald-300">{t.tips.eco.wildlifeTitle}</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      {t.tips.eco.wildlifeDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">water_drop</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800 dark:text-emerald-300">{t.tips.eco.waterTitle}</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      {t.tips.eco.waterDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PREPARATION */}
          {activeCategory === "prep" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">work_history</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">{t.tips.prep.title}</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                {t.tips.prep.intro}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">vaccines</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">{t.tips.prep.healthTitle}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t.tips.prep.healthDesc}
                  </p>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">{t.tips.prep.permitsTitle}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t.tips.prep.permitsDesc}
                  </p>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">luggage</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">{t.tips.prep.luggageTitle}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t.tips.prep.luggageDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LEXICON */}
          {activeCategory === "lang" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">record_voice_over</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">{t.tips.lexicon.title}</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                {t.tips.lexicon.intro}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="py-2.5 px-3 font-sans text-body-md font-bold text-primary">{t.tips.lexicon.colMeaning}</th>
                      <th className="py-2.5 px-3 font-sans text-body-md font-bold text-secondary">{t.tips.lexicon.colLocal}</th>
                      <th className="py-2.5 px-3 font-mono text-xs text-on-surface-variant">{t.tips.lexicon.colLang}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phrases.map((phrase, idx) => (
                      <tr key={idx} className="border-b border-outline-variant/20 hover:bg-surface-variant/20">
                        <td className="py-2 px-3 font-sans text-sm text-on-surface">
                          {isEn ? phrase.english : phrase.french}
                        </td>
                        <td className="py-2 px-3 font-sans text-sm text-primary font-bold">{phrase.local}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            phrase.lang === "Lingala" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          }`}>
                            {phrase.lang}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
