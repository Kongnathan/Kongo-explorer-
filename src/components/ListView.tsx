import React, { useState } from "react";
import { Location, PendingPermit } from "../types";

interface ListViewProps {
  locations: Location[];
  pendingPermits: PendingPermit[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
  onOpenCapture: () => void;
}

export default function ListView({
  locations,
  pendingPermits,
  onSelectLocation,
  onNavigate,
  onOpenCapture
}: ListViewProps) {
  const [activeChip, setActiveChip] = useState("Tout");

  const filterChips = ["Tout", "Incontournables", "Nature", "Histoire", "Urbain"];

  // Filter list by active chip category
  const filteredLocations = locations.filter(loc => {
    if (activeChip === "Tout") return true;
    return loc.category.toLowerCase() === activeChip.toLowerCase();
  });

  // Helper to color tag backgrounds
  const getTagColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "incontournables":
        return "bg-amber-600";
      case "histoire":
        return "bg-orange-700";
      case "urbain":
        return "bg-blue-600";
      case "nature":
        return "bg-emerald-600";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="flex-1 pb-24 font-sans animate-fade-in bg-background text-on-background">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">list_alt</span>
            <h1 className="font-sans text-headline-md font-bold text-primary">Répertoire Complet</h1>
          </div>
          <button 
            onClick={onOpenCapture}
            className="active:scale-95 duration-100 hover:bg-surface-variant/50 transition-colors p-2 rounded-full"
          >
            <span className="material-symbols-outlined text-primary">search</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 pt-6 space-y-6">
        {/* Filter Chips Section */}
        <div className="flex gap-2 overflow-x-auto scrolling-hide-scrollbar py-2 -mx-5 px-5 hide-scrollbar">
          {filterChips.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-2xl font-sans text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                activeChip === chip
                  ? "bg-primary text-white"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="space-y-1 px-1">
          <h2 className="font-sans text-headline-lg-mobile text-primary font-bold">Fiches d'exploration</h2>
          <p className="text-on-surface-variant text-body-md">Découvrez le patrimoine écologique et culturel de la région à votre rythme.</p>
        </div>

        {/* Destination Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map(loc => (
            <div 
              key={loc.id} 
              className="bg-surface-container-lowest rounded-3xl overflow-hidden hover:shadow-lg transition-all border border-outline-variant/30 flex flex-col hover:border-primary/25 cursor-pointer"
              onClick={() => onSelectLocation(loc.id)}
            >
              <div className="h-48 w-full bg-surface-variant relative">
                <img 
                  className="w-full h-full object-cover" 
                  alt={loc.title} 
                  src={loc.image} 
                />
                <div className={`absolute top-3 right-3 text-white text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider ${getTagColor(loc.category)}`}>
                  {loc.category.toUpperCase()}
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-sans text-headline-sm font-bold text-primary">{loc.title}</h3>
                </div>
                
                <div className="flex items-center gap-1 text-secondary font-mono text-xs mb-3 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>{loc.locationName}</span>
                </div>
                
                <p className="text-on-surface-variant font-sans text-sm line-clamp-2 leading-relaxed mb-4">
                  {loc.description}
                </p>
                
                <div className="mt-auto pt-4 flex gap-2 border-t border-outline-variant/10">
                  <button 
                    onClick={() => onSelectLocation(loc.id)}
                    className="w-full bg-primary/10 text-primary py-2 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-primary/20"
                  >
                    <span>Consulter la fiche</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Voice Capture FAB */}
      <button 
        id="fab-capture"
        onClick={onOpenCapture}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center z-50 active:scale-90 transition-transform cursor-pointer hover:brightness-110"
      >
        <span className="material-symbols-outlined text-[24px] fill">mic</span>
      </button>
    </div>
  );
}
