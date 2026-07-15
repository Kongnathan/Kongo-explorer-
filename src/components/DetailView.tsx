import React, { useEffect, useState } from "react";
import { Location } from "../types";

interface DetailViewProps {
  locationId: string;
  locations: Location[];
  onBack: () => void;
  onNavigate: (tab: string) => void;
  savedLocationIds: string[];
  onToggleSave: (id: string) => void;
}

export default function DetailView({
  locationId,
  locations,
  onBack,
  onNavigate,
  savedLocationIds,
  onToggleSave
}: DetailViewProps) {
  const loc = locations.find(l => l.id === locationId) || locations[0];
  const [timerOffset, setTimerOffset] = useState(100);
  const [weatherOpen, setWeatherOpen] = useState(false);

  // Animate the circle progress based on the cognitive effort rating
  useEffect(() => {
    const percent = loc.cognitiveEffort || 50;
    const offset = 100 - percent;
    const timer = setTimeout(() => {
      setTimerOffset(offset);
    }, 400);
    return () => clearTimeout(timer);
  }, [loc.cognitiveEffort]);

  const isSaved = savedLocationIds.includes(loc.id);

  return (
    <div className="flex-1 pb-32 font-sans bg-background text-on-background animate-fade-in">
      {/* Top AppBar */}
      <header className="w-full top-0 sticky bg-surface-container-low/95 backdrop-blur-md z-40 shadow-sm h-16">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-full">
          <button 
            onClick={onBack}
            aria-label="Retour" 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 duration-100 cursor-pointer text-primary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-sans text-headline-md font-bold text-primary">Fiche Destination</h1>
          
          <button 
            onClick={() => onToggleSave(loc.id)}
            aria-label={isSaved ? "Retirer du carnet" : "Sauvegarder pour le hors-ligne"} 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 duration-100 cursor-pointer text-primary"
          >
            <span className="material-symbols-outlined fill-current">
              {isSaved ? "bookmark" : "bookmark_border"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="relative w-full h-[320px] md:h-[450px] overflow-hidden">
          <div className="w-full h-full bg-surface-variant">
            <img 
              alt={loc.title} 
              className="w-full h-full object-cover" 
              src={loc.image} 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/90 to-transparent">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-mono font-bold uppercase">
              {loc.category}
            </span>
            <h2 className="text-white text-headline-lg-mobile md:text-headline-lg font-bold font-sans mt-2">
              {loc.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-white text-[18px]">location_on</span>
              <p className="text-white font-mono text-xs">{loc.locationName}, RD Congo</p>
            </div>
          </div>
        </section>

        {/* Cognitive Stamina & Status Row */}
        <section className="px-5 -mt-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Information & Stamina Widget */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-lg p-5 border-l-4 border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary fill text-2xl">hiking</span>
                <h3 className="font-sans text-body-lg font-bold text-primary">Effort de Randonnée</h3>
              </div>
              
              {/* Time-Timer Progress circle */}
              <div className="relative w-12 h-12">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle className="stroke-surface-variant" cx="18" cy="18" fill="none" r="16" strokeWidth="4"></circle>
                  <circle 
                    className="stroke-primary" 
                    cx="18" 
                    cy="18" 
                    fill="none" 
                    r="16" 
                    strokeDasharray="100" 
                    strokeDashoffset={timerOffset} 
                    strokeWidth="4"
                    style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-on-surface">
                    {loc.cognitiveEffort || 50}%
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-on-surface-variant text-sm mb-2">
              Temps estimé sur site : <strong>{loc.timeToVisit || "3 heures"}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-mono font-semibold">
                {loc.intensity || "Intensité Modérée"}
              </span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-xl text-xs font-mono font-semibold">
                {loc.terrain || "Terrain Accidenté"}
              </span>
            </div>
          </div>

          {/* Environmental and Meteorological Widget */}
          <div className="bg-surface-container shadow-md rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-secondary text-2xl">partly_cloudy_day</span>
                <h3 className="font-sans text-body-lg font-bold text-secondary">Conditions actuelles</h3>
              </div>
              <p className="text-on-surface-variant text-sm italic font-sans leading-relaxed">
                &ldquo;{loc.currentStatus || "La météo est agréable et propice aux excursions aujourd'hui."}&rdquo;
              </p>
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-3">
              <span className="text-on-surface font-mono text-xs flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Accès autorisé
              </span>
              <button 
                onClick={() => setWeatherOpen(!weatherOpen)}
                className="text-primary font-mono text-xs font-bold underline cursor-pointer hover:text-secondary"
              >
                {weatherOpen ? "Masquer météo" : "Détails climat"}
              </button>
            </div>

            {weatherOpen && (
              <div className="mt-3 p-3 bg-surface-container-highest rounded-xl text-xs space-y-1 border border-outline-variant/20 animate-fade-in font-mono">
                <p>🌤️ Température moyenne : 27°C</p>
                <p>💧 Humidité relative : 80% (Climat Équatorial)</p>
                <p>🌬️ Vent dominant : 12 km/h</p>
              </div>
            )}
          </div>
        </section>

        {/* Main Educational Content - Bento Style Grid */}
        <section className="px-5 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Articles (Left Col) */}
          <div className="lg:col-span-2 space-y-6">
            <article className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
              <h3 className="font-sans text-headline-sm font-bold text-primary mb-3">Présentation générale</h3>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                {loc.description}
              </p>
            </article>

            {/* Historical context (Primary cultural value) */}
            {loc.history && (
              <article className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">history_edu</span>
                  <h3 className="font-sans text-headline-sm font-bold text-primary">Contexte Historique & Culturel</h3>
                </div>
                <p className="text-on-surface-variant text-body-md leading-relaxed font-sans">
                  {loc.history}
                </p>
              </article>
            )}

            {/* Respect and Ethics Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loc.localCustoms && (
                <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary mb-2 text-2xl">diversity_1</span>
                  <h4 className="font-sans text-body-lg font-bold text-primary">Coutumes locales</h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    {loc.localCustoms}
                  </p>
                </div>
              )}

              {loc.ecoResponsibility && (
                <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20">
                  <span className="material-symbols-outlined text-emerald-600 mb-2 text-2xl">eco</span>
                  <h4 className="font-sans text-body-lg font-bold text-emerald-800">Éco-Responsabilité</h4>
                  <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                    {loc.ecoResponsibility}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Quick Tips (Right Col) */}
          <aside className="space-y-6">
            {/* Checklist items */}
            {loc.checklist && (
              <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/25 shadow-sm">
                <h4 className="font-sans text-body-lg text-primary mb-4 flex items-center gap-2 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[20px]">checklist</span>
                  Équipement requis
                </h4>
                <ul className="space-y-3">
                  {loc.checklist.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-on-surface-variant text-sm font-sans">
                      <span className="material-symbols-outlined text-primary text-[18px] fill">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Seasonal advice */}
            {loc.bestSeason && (
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20">
                <h4 className="font-sans text-body-lg text-primary mb-2 flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  Meilleure Saison
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {loc.bestSeason}
                </p>
              </div>
            )}

            {/* Safety advice */}
            {loc.safetyGuidelines && (
              <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/20">
                <h4 className="font-sans text-body-lg text-amber-800 mb-2 flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-[20px]">warning_amber</span>
                  Sécurité & Précaution
                </h4>
                <p className="text-amber-900/90 text-sm leading-relaxed">
                  {loc.safetyGuidelines}
                </p>
              </div>
            )}
          </aside>
        </section>

        {/* Saved offline status banner bottom */}
        <section className="px-5 mb-10">
          <div 
            onClick={() => onToggleSave(loc.id)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-primary/40 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSaved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                <span className="material-symbols-outlined text-[28px]">
                  {isSaved ? "offline_pin" : "bookmark_add"}
                </span>
              </div>
              <div className="text-left">
                <h4 className="font-sans text-body-lg font-bold text-on-surface">
                  {isSaved ? "Fiche stockée hors-ligne" : "Conserver pour votre voyage"}
                </h4>
                <p className="text-on-surface-variant text-xs leading-normal">
                  {isSaved 
                    ? "Cette fiche est enregistrée et sera disponible sans connexion internet." 
                    : "Ajoutez cette fiche à votre carnet pour la consulter hors-ligne lors de votre trajet."}
                </p>
              </div>
            </div>
            <button className="px-5 py-2.5 bg-primary text-white rounded-xl font-sans text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-transform cursor-pointer">
              {isSaved ? "Retirer" : "Enregistrer dans mon carnet"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
