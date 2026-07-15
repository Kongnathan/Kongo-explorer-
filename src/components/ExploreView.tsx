import React, { useState } from "react";
import { Location, PendingPermit } from "../types";

interface ExploreViewProps {
  locations: Location[];
  pendingPermits: PendingPermit[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
  onOpenCapture: () => void;
  savedLocationIds: string[];
  onToggleSave: (id: string) => void;
}

export default function ExploreView({
  locations,
  pendingPermits,
  onSelectLocation,
  onNavigate,
  onOpenCapture,
  savedLocationIds,
  onToggleSave
}: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Incontournables");

  // Filter chips (non-commercial, informative)
  const categories = [
    { name: "Incontournables", icon: "star" },
    { name: "Nature", icon: "forest" },
    { name: "Histoire", icon: "history_edu" },
    { name: "Urbain", icon: "location_city" }
  ];

  // Filter locations by search query and category
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          loc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (loc.history && loc.history.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory ? loc.category === selectedCategory : true;
    return matchesSearch && matchesCategory && loc.status === "PUBLISHED";
  });

  // Nearby/Featured highlights for bento section (selecting other locations)
  const highlights = locations.filter(loc => loc.id !== "grottes_mbanza" && loc.id !== "parc_mangroves");

  return (
    <div className="flex-1 pb-24 font-sans animate-fade-in bg-background text-on-background">
      {/* Header banner */}
      <header className="w-full top-0 sticky z-50 bg-surface-container-low/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          {/* Static Elegant Logo */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px] fill">explore</span>
            </div>
            <h1 className="font-sans text-headline-md font-bold text-primary">
              Kongo Central Explorer
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => onNavigate("tips")}
              className="px-3.5 py-1.5 bg-primary/10 text-primary rounded-full font-sans text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">gavel</span>
              Conseils
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 space-y-6 mt-4">
        {/* Slogan Banner with Hidden Admin Entrance in Signature */}
        <section className="py-2 text-center md:text-left space-y-2 max-w-2xl">
          <div 
            onClick={() => onNavigate("admin-login")}
            className="inline-block text-[11px] font-mono text-on-surface-variant/35 tracking-[0.25em] uppercase cursor-default select-none transition-colors active:text-on-surface-variant/60"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            apk by nathan king
          </div>
          <h2 className="font-sans text-headline-lg-mobile md:text-headline-lg text-primary font-extrabold leading-tight tracking-tight">
            Explorez les merveilles du Kongo Central
          </h2>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Parcourez les paysages sauvages, l'histoire majestueuse et l'incroyable biodiversité de la province du Kongo Central. Une plateforme éducative et collaborative sans intérêt commercial.
          </p>
        </section>

        {/* Search Input Bar with Voice Note option */}
        <section className="relative">
          <div className="flex items-center bg-surface-container-highest rounded-2xl px-4 py-3.5 shadow-inner group transition-all focus-within:ring-2 focus-within:ring-primary border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 focus:outline-none w-full font-sans text-body-md text-on-surface placeholder:text-on-surface-variant/50" 
              placeholder="Rechercher une cascade, une ville, une grotte, un monument..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={onOpenCapture}
              className="bg-primary/15 text-primary p-2.5 rounded-full hover:scale-105 active:scale-95 duration-100 flex items-center justify-center cursor-pointer"
              title="Note de voyage vocale"
            >
              <span className="material-symbols-outlined text-[20px] fill">mic</span>
            </button>
          </div>
        </section>

        {/* Category Chips Selector */}
        <section className="space-y-2">
          <h3 className="font-sans text-body-md font-bold text-on-surface-variant px-1">Filtrer par thématique</h3>
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                }}
                className={`flex-none px-5 py-3 rounded-2xl font-sans text-label-md font-bold flex items-center space-x-2 active:scale-95 transition-all cursor-pointer border ${
                  selectedCategory === cat.name
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-variant/40"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Primary Dynamic Catalog Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="font-sans text-headline-sm text-primary font-bold">
              {selectedCategory} du Kongo Central ({filteredLocations.length})
            </h3>
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCategory("Incontournables"); }} 
                className="text-secondary font-mono text-xs hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {filteredLocations.length === 0 ? (
            <div className="bg-surface-container/50 border border-dashed border-outline-variant/40 rounded-3xl p-10 text-center space-y-2">
              <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
              <p className="text-on-surface-variant text-body-md">Aucune fiche ne correspond à votre recherche pour cette catégorie.</p>
              <button 
                onClick={() => setSelectedCategory("Incontournables")}
                className="text-primary font-mono text-xs font-bold underline"
              >
                Afficher les incontournables
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((loc) => {
                const isSaved = savedLocationIds.includes(loc.id);
                return (
                  <div 
                    key={loc.id} 
                    className="group bg-surface-container-lowest rounded-[28px] overflow-hidden border border-outline-variant/30 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer relative"
                    onClick={() => onSelectLocation(loc.id)}
                  >
                    {/* Bookmark Indicator (Save for offline) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(loc.id);
                      }}
                      className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-primary active:scale-90 transition-all cursor-pointer"
                      title={isSaved ? "Retirer du carnet" : "Sauvegarder pour le hors-ligne"}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isSaved ? "bookmark" : "bookmark_border"}
                      </span>
                    </button>

                    <div className="relative h-52 w-full overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                        style={{ backgroundImage: `url('${loc.image}')` }}
                      ></div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/30 to-transparent text-white">
                        <p className="font-sans text-[18px] font-bold tracking-tight">{loc.title}</p>
                        <p className="font-sans text-xs opacity-90 flex items-center mt-1 font-medium">
                          <span className="material-symbols-outlined text-sm mr-1">location_on</span> 
                          {loc.locationName}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col justify-between flex-grow">
                      <p className="text-on-surface-variant font-sans text-sm line-clamp-3 mb-4 leading-relaxed">
                        {loc.description}
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                          <span className="text-on-surface-variant font-mono text-[11px] font-bold">{loc.timeToVisit}</span>
                        </div>
                        <span className="text-primary font-sans text-xs font-bold group-hover:underline flex items-center gap-0.5">
                          Découvrir la fiche 
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Local Ecosystem Contribution Section */}
        <section className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-sans text-body-lg font-bold text-primary flex items-center gap-2 justify-center md:justify-start">
              <span className="material-symbols-outlined fill text-[20px]">psychology_alt</span>
              Contributeur Communautaire
            </h4>
            <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
              Vous connaissez un site d'exception ou possédez des anecdotes historiques vérifiées sur la région ? Enregistrez une note d'exploration en bas à droite pour soumettre vos idées aux écogardes !
            </p>
          </div>
          <button 
            onClick={onOpenCapture}
            className="px-5 py-3 bg-secondary text-white rounded-full font-sans text-xs font-bold hover:brightness-110 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Soumettre une fiche
          </button>
        </section>

        {/* Clean Static Footer */}
        <footer className="text-center py-8 border-t border-outline-variant/10 text-xs text-on-surface-variant/40 mt-8">
          <p>© 2026 Kongo Central Explorer. Portail d'écotourisme et de préservation du patrimoine.</p>
        </footer>
      </main>

      {/* Floating Action Button for Map view */}
      <button 
        onClick={() => onNavigate("map")}
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform z-40 hover:brightness-110 cursor-pointer"
        title="Voir sur la carte"
      >
        <span className="material-symbols-outlined text-[24px]">map</span>
      </button>
    </div>
  );
}
