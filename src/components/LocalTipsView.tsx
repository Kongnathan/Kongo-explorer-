import React, { useState, useEffect } from "react";

interface Phrase {
  french: string;
  local: string;
  lang: "Lingala" | "Kikongo";
}

interface PresetCity {
  name: string;
  lat: number;
  lng: number;
  desc: string;
}

const KONGO_CITIES: PresetCity[] = [
  { name: "Matadi", lat: -5.8422, lng: 13.4542, desc: "Chef-lieu & Port fluvial du Pont Maréchal" },
  { name: "Muanda", lat: -5.9333, lng: 12.3500, desc: "Côté Océan & Parc Marin des Mangroves" },
  { name: "Zongo", lat: -4.7700, lng: 14.8800, desc: "Chutes spectaculaires & Réserve naturelle" },
  { name: "Kisantu", lat: -5.1333, lng: 15.1000, desc: "Jardin Botanique historique de 1900" },
  { name: "Boma", lat: -5.8500, lng: 13.0500, desc: "Première Cathédrale Métallique & Cité historique" },
  { name: "Mbanza-Ngungu", lat: -5.2500, lng: 14.8667, desc: "Grottes sacrées & Poissons aveugles" },
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

function getWeatherInfo(code: number): { label: string; icon: string; bg: string; text: string; advice: string } {
  if (code === 0) {
    return {
      label: "Ensoleillé / Ciel dégagé",
      icon: "wb_sunny",
      bg: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      advice: "☀️ Conditions idéales ! Parfait pour l'exploration des chutes, les baignades à Muanda et les séances photo aux belvédères."
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      label: "Partiellement nuageux",
      icon: "partly_cloudy_day",
      bg: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
      text: "text-sky-600 dark:text-sky-400",
      advice: "⛅ Temps très agréable pour les randonnées botaniques à Kisantu et les visites culturelles à Boma sans forte chaleur."
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: "Brume / Brouillard tropical",
      icon: "foggy",
      bg: "from-slate-500/20 to-zinc-500/10 border-slate-500/30",
      text: "text-slate-600 dark:text-slate-300",
      advice: "🌫️ Visibilité réduite dans les montagnes du Mayombe. Prudence renforcée sur la Nationale 1 au niveau des virages."
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: "Pluie / Averses tropicales",
      icon: "rainy",
      bg: "from-blue-600/20 to-indigo-600/10 border-blue-600/30",
      text: "text-blue-600 dark:text-blue-400",
      advice: "🌧️ Pistes potentiellement boueuses. Un véhicule 4x4 est recommandé pour accéder aux sites naturels en forêt."
    };
  }
  if (code >= 95) {
    return {
      label: "Orages tropicaux violents",
      icon: "thunderstorm",
      bg: "from-purple-600/20 to-red-600/10 border-purple-600/30",
      text: "text-purple-600 dark:text-purple-400",
      advice: "⛈️ Risque de crues subites du fleuve et des rivières. Évitez les excursions en pirogue et mettez-vous à l'abri."
    };
  }
  return {
    label: "Variables locales",
    icon: "cloud",
    bg: "from-teal-500/20 to-emerald-500/10 border-teal-500/30",
    text: "text-teal-600 dark:text-teal-400",
    advice: "🌤️ Climat tropical sous contrôle. Pensez à prendre de l'eau et un vêtement imperméable léger."
  };
}

export default function LocalTipsView() {
  const [activeCategory, setActiveCategory] = useState<"meteo" | "culture" | "eco" | "prep" | "lang">("meteo");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "success" | "denied">("idle");
  const [selectedCityName, setSelectedCityName] = useState<string>("Matadi");

  const phrases: Phrase[] = [
    { french: "Bonjour (Comment ça va ?)", local: "Mbote (Sango nini ?)", lang: "Lingala" },
    { french: "Ça va bien", local: "Sango malamu", lang: "Lingala" },
    { french: "Merci beaucoup", local: "Melési mingi / Matondo mingi", lang: "Lingala" },
    { french: "S'il vous plaît", local: "S'il vous plaît / Tafadhali", lang: "Lingala" },
    { french: "Au revoir", local: "Tikala malamu (Restez bien)", lang: "Lingala" },
    { french: "Bonjour (à vous)", local: "Mbote na beno", lang: "Kikongo" },
    { french: "Merci beaucoup", local: "Matondo mingi", lang: "Kikongo" },
    { french: "Comment allez-vous ?", local: "Inki bansangu ?", lang: "Kikongo" },
    { french: "Tout va bien", local: "Bansangu yambote", lang: "Kikongo" },
    { french: "Eau", local: "Maza", lang: "Kikongo" }
  ];

  const fetchWeatherForCoords = async (lat: number, lng: number, labelName: string) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FKinshasa`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossible de joindre le service météo.");
      const data = await res.json();

      const dailyArr: DailyForecast[] = (data.daily?.time || []).map((t: string, idx: number) => ({
        date: t,
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
      setWeatherError("Erreur lors de la récupération des prévisions météo.");
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleUseGeolocation = () => {
    setGeoStatus("locating");
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      setWeatherError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("success");
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetchWeatherForCoords(lat, lng, "Ma Position Actuelle");
      },
      (err) => {
        console.warn("Geolocation denied or error:", err);
        setGeoStatus("denied");
        // Fallback to Matadi capital
        fetchWeatherForCoords(-5.8422, 13.4542, "Matadi (Capitale Kongo Central)");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Initial load
  useEffect(() => {
    fetchWeatherForCoords(-5.8422, 13.4542, "Matadi");
  }, []);

  return (
    <div className="flex-1 pb-24 font-sans bg-background text-on-background animate-fade-in">
      {/* Sticky Header */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm backdrop-blur-md">
        <div className="relative flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          <div 
            className="absolute inset-0 bg-[url('/icon.svg')] bg-no-repeat bg-center bg-contain opacity-[0.08] pointer-events-none -z-10" 
            id="header-bg-logo-tips"
          />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 overflow-hidden border border-primary/20">
              <img src="/icon.svg" className="w-full h-full object-contain" alt="Logo" />
            </div>
            <h1 className="font-sans text-headline-md font-bold text-primary">Kongo Explorer</h1>
          </div>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold uppercase">
            Guide & Météo
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-6 space-y-6">
        {/* Intro Hero Banner */}
        <section className="bg-gradient-to-br from-primary via-primary-container to-secondary text-white p-6 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">partly_cloudy_day</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold">
            <span className="material-symbols-outlined text-[16px] text-amber-300">wb_sunny</span>
            <span>Conseils Météo & Planification de Séjour</span>
          </div>
          <h2 className="font-sans text-headline-lg-mobile md:text-headline-md font-bold leading-tight">
            Anticipez votre itinéraire au Kongo Central
          </h2>
          <p className="text-white/90 text-body-md leading-relaxed">
            Consultez les conditions météorologiques en direct grâce à la géolocalisation pour planifier vos visites aux cascades, plages et forêts tropicales.
          </p>
        </section>

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
            Météo & Climat
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
            Coutumes
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
            Éco-Geste
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
            Préparation
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
            Lexique
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
                    <span>Prévisions en direct par zone</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Utilisez la géolocalisation ou choisissez une destination dans le Kongo Central.
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
                  <span>{geoStatus === "locating" ? "Localisation en cours..." : "Ma position actuelle"}</span>
                </button>
              </div>

              {/* Preset Cities Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-outline uppercase">
                  Grandes destinations du Kongo Central :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {KONGO_CITIES.map((city) => {
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
                  <p className="font-sans text-xs font-bold text-outline">Chargement des données météo en direct...</p>
                </div>
              )}

              {weatherError && !loadingWeather && (
                <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl">error</span>
                  <span className="text-xs font-sans font-medium">{weatherError}</span>
                </div>
              )}

              {weatherData && !loadingWeather && (() => {
                const info = getWeatherInfo(weatherData.current.weatherCode);
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
                              Ressenti {weatherData.current.apparentTemp}°C
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Weather Details Grid */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-outline-variant/20">
                        <div className="bg-surface-container-lowest/80 p-3 rounded-2xl text-center">
                          <span className="material-symbols-outlined text-sky-600 text-[20px]">humidity_mid</span>
                          <span className="block text-[10px] font-mono font-bold text-outline uppercase mt-0.5">Humidité</span>
                          <span className="font-sans font-bold text-xs text-on-surface">{weatherData.current.humidity}%</span>
                        </div>

                        <div className="bg-surface-container-lowest/80 p-3 rounded-2xl text-center">
                          <span className="material-symbols-outlined text-teal-600 text-[20px]">air</span>
                          <span className="block text-[10px] font-mono font-bold text-outline uppercase mt-0.5">Vent</span>
                          <span className="font-sans font-bold text-xs text-on-surface">{weatherData.current.windSpeed} km/h</span>
                        </div>

                        <div className="bg-surface-container-lowest/80 p-3 rounded-2xl text-center">
                          <span className="material-symbols-outlined text-blue-600 text-[20px]">water_drop</span>
                          <span className="block text-[10px] font-mono font-bold text-outline uppercase mt-0.5">Pluie</span>
                          <span className="font-sans font-bold text-xs text-on-surface">{weatherData.current.precipitation} mm</span>
                        </div>
                      </div>

                      {/* Dynamic Trip Planning Recommendation */}
                      <div className="bg-surface-container-lowest/90 p-4 rounded-2xl border border-outline-variant/20 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-primary uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Conseil de voyage adapté :
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
                        <span>Prévisions sur 7 jours</span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {weatherData.daily.map((day, idx) => {
                          const dayInfo = getWeatherInfo(day.weatherCode);
                          const dateObj = new Date(day.date);
                          const dayName = idx === 0 ? "Aujourd'hui" : dateObj.toLocaleDateString("fr-FR", { weekday: "short" });
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

          {/* TAB 2: CULTURE */}
          {activeCategory === "culture" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Coutumes & Savoir-Vivre</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Les traditions de l'Empire du Kongo et des cultures congolaises contemporaines accordent une place primordiale aux relations humaines, à l'hospitalité et au respect des aînés.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
                    Photographie éthique
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    Demandez <strong>toujours l'autorisation</strong> avant de photographier quelqu'un, en particulier les enfants ou les anciens. Expliquez poliment votre intérêt pour leur culture.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">diversity_3</span>
                    Salutations chaleureuses
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    Prendre le temps de saluer est obligatoire. Un simple <em>"Mbote"</em> accompagné d'un sourire sincère ouvre instantanément les cœurs et facilite l'échange.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">gavel</span>
                    Sagesse des Anciens
                  </h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    Dans les villages près des parcs et cascades, le chef coutumier ou les anciens incarnent la mémoire de la terre. Écoutez attentivement leurs récits, ils regorgent d'enseignements.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/25">
                  <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">local_activity</span>
                    Tenue vestimentaire
                  </h4>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                    Optez pour des vêtements pudiques et sobres, particulièrement lors de la visite d'églises historiques (comme à Boma) ou de réunions dans les communautés locales.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ECO */}
          {activeCategory === "eco" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">nature_people</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Éco-Responsabilité au Kongo Central</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Le Kongo Central, situé au sein du bassin du Congo (le deuxième poumon écologique de la Terre après l'Amazone), abrite des mangroves et forêts uniques. Sa protection dépend de nos gestes quotidiens en tant que voyageurs engagés.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">delete_sweep</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800">Politique Zéro Déchet</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      Aucune infrastructure de recyclage n'existe dans les parcs isolés. Emportez toujours un petit sac pour ramasser vos déchets (plastiques, piles, emballages) et ramenez-les vers les centres urbains majeurs pour traitement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">pets</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800">Préservation des Espèces</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      Ne touchez jamais aux animaux sauvages, ne nourrissez pas les bonobos ou singes dans les réserves. Conservez les distances de sécurité (10m minimum) pour éviter la transmission croisée de maladies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">water_drop</span>
                  <div>
                    <h4 className="font-sans text-body-lg font-bold text-emerald-800">Protection des Eaux</h4>
                    <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                      Utilisez exclusivement des savons biodégradables lors de vos campements près de rivières comme l'Inkisi ou le fleuve Congo pour ne pas contaminer la ressource potable des communautés en aval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREPARATION */}
          {activeCategory === "prep" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">work_history</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Préparation administrative & physique</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Une bonne préparation physique et matérielle est la clé d'un séjour sûr et mémorable dans les régions tropicales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">vaccines</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">Santé & Vaccins</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Vaccination <strong>Fièvre Jaune</strong> rigoureusement obligatoire pour l'entrée sur le territoire. Traitement antipaludéen fortement recommandé.
                  </p>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">Laisser-passer</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Certains parcs ou zones frontalières nécessitent des permis d'accès ou des autorisations écrites des parcs de l'ICCN. Anticipez vos demandes.
                  </p>
                </div>

                <div className="bg-surface-container p-4 rounded-2xl text-center space-y-2 border border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-3xl">luggage</span>
                  <h4 className="font-sans text-body-md font-bold text-primary">Bagages essentiels</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Vêtements longs en coton léger (protection insectes), gourde filtrante, imperméable robuste, et batterie externe solaire (zones non raccordées).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEXICON */}
          {activeCategory === "lang" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">record_voice_over</span>
                <h3 className="font-sans text-headline-md font-bold text-primary">Petit lexique d'accueil</h3>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                Parler même quelques mots de la langue locale témoigne d'un immense respect pour vos hôtes congolais. Le Lingala est parlé majoritairement à Kinshasa et le long du fleuve, tandis que le Kikongo est la langue historique du Kongo Central.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="py-2.5 px-3 font-sans text-body-md font-bold text-primary">Français</th>
                      <th className="py-2.5 px-3 font-sans text-body-md font-bold text-secondary">Traduction locale</th>
                      <th className="py-2.5 px-3 font-mono text-xs text-on-surface-variant">Langue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phrases.map((phrase, idx) => (
                      <tr key={idx} className="border-b border-outline-variant/20 hover:bg-surface-variant/20">
                        <td className="py-2 px-3 font-sans text-sm text-on-surface">{phrase.french}</td>
                        <td className="py-2 px-3 font-sans text-sm text-primary font-bold">{phrase.local}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            phrase.lang === "Lingala" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
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

