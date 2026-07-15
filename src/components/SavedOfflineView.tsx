import React from "react";
import { Location, SavedLocation } from "../types";

interface SavedOfflineViewProps {
  savedLocations: SavedLocation[];
  locations: Location[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
  onRemoveSave: (locId: string) => void;
}

export default function SavedOfflineView({
  savedLocations,
  locations,
  onSelectLocation,
  onNavigate,
  onRemoveSave
}: SavedOfflineViewProps) {
  
  // Map saved items to their full location objects
  const savedItemsWithDetails = savedLocations.map(saved => {
    const detail = locations.find(l => l.id === saved.locationId);
    return {
      ...saved,
      detail
    };
  }).filter(item => item.detail !== undefined);

  return (
    <div className="flex-1 pb-24 font-sans bg-background text-on-background animate-fade-in">
      {/* Header */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">offline_pin</span>
            <h1 className="font-sans text-headline-md font-bold text-primary">Carnet de Route</h1>
          </div>
          <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            MODE HORS-LIGNE ACTIF
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-6 space-y-6">
        {/* Explanation Card */}
        <section className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[36px]">download_done</span>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-sans text-body-lg font-bold text-primary">Destinations enregistrées sur l'appareil</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Les fiches détaillées, conseils pratiques et coordonnées GPS des sites ci-dessous sont stockés dans le stockage local de votre téléphone (PWA). Vous pouvez y accéder librement même sans aucune connexion internet au fond des parcs ou gorges.
            </p>
          </div>
        </section>

        {/* Saved List */}
        {savedItemsWithDetails.length === 0 ? (
          <div className="bg-surface-container-lowest border border-dashed border-outline-variant/50 p-10 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 bg-surface-variant/40 rounded-full flex items-center justify-center mx-auto text-outline">
              <span className="material-symbols-outlined text-[32px]">favorite_border</span>
            </div>
            <div>
              <h4 className="font-sans text-body-lg font-bold text-on-surface">Votre carnet de voyage est vide</h4>
              <p className="text-on-surface-variant text-sm mt-1 max-w-md mx-auto">
                Parcourez les merveilles naturelles et culturelles du Congo et cliquez sur "Sauvegarder" pour les stocker sur votre téléphone avant de partir en expédition.
              </p>
            </div>
            <button 
              onClick={() => onNavigate("explore")}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-sans text-label-md font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Découvrir les sites
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-sans text-headline-sm font-bold text-primary px-1">Fiches enregistrées ({savedItemsWithDetails.length})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedItemsWithDetails.map((item) => (
                <div 
                  key={item.id}
                  className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-md flex gap-4 hover:border-primary/20 transition-all cursor-pointer relative"
                  onClick={() => onSelectLocation(item.locationId)}
                >
                  <div 
                    className="w-24 h-24 rounded-2xl bg-cover bg-center flex-none"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  ></div>
                  
                  <div className="flex-grow flex flex-col justify-between pr-6">
                    <div>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                        {item.detail?.category}
                      </span>
                      <h3 className="font-sans text-body-md font-bold text-on-surface mt-1 line-clamp-1">{item.title}</h3>
                      <p className="text-on-surface-variant text-[11px] font-mono mt-0.5 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {item.detail?.locationName}
                      </p>
                      <p className="text-emerald-700 font-mono text-[10px] font-bold mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Prêt pour le hors-ligne
                      </p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Retirer "${item.title}" de votre carnet ?`)) {
                        onRemoveSave(item.locationId);
                      }
                    }}
                    className="absolute top-3 right-3 text-on-surface-variant/40 hover:text-alert-time p-1 rounded-full hover:bg-surface-variant transition-colors"
                    title="Retirer"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Offline Simulation Button */}
            <div className="pt-6 text-center">
              <button
                onClick={() => {
                  alert("Simulateur PWA :\nVos fiches de voyage et cartes géographiques locales sont synchronisées localement sur l'appareil et ne subiront aucune perte en cas de coupure réseau.");
                }}
                className="text-primary hover:text-primary-container font-mono text-xs font-bold underline cursor-pointer"
              >
                Vérifier l'intégrité de la base locale
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
