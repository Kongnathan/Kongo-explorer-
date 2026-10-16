import React, { useState } from "react";
import { Location, PendingPermit, KongoNotification } from "../types";
import LazyImage from "./LazyImage";

interface ExploreViewProps {
  locations: Location[];
  pendingPermits: PendingPermit[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
  onOpenCapture: () => void;
  savedLocationIds: string[];
  onToggleSave: (id: string) => void;
  notifications?: KongoNotification[];
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export default function ExploreView({
  locations,
  pendingPermits,
  onSelectLocation,
  onNavigate,
  onOpenCapture,
  savedLocationIds,
  onToggleSave,
  notifications = [],
  unreadNotificationsCount = 0,
  onOpenNotifications
}: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Incontournables");

  // Top unread critical security alert
  const topCriticalAlert = notifications.find(
    (n) => !n.read && (n.severity === "CRITICAL" || n.type === "SECURITY_ALERT")
  );

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

  return (
    <div className="flex-1 pb-24 font-sans animate-fade-in bg-background text-on-background">
      {/* Header banner */}
      <header className="w-full top-0 sticky z-50 bg-surface-container-low/95 backdrop-blur-md shadow-sm">
        <div className="relative flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-16">
          {/* Subtle watermark background logo */}
          <div 
            className="absolute inset-0 bg-[url('/icon.svg')] bg-no-repeat bg-center bg-contain opacity-[0.08] pointer-events-none -z-10" 
            id="header-bg-logo-explore"
          />
          {/* Static Elegant Logo with Real Icon and Real Link */}
          <a 
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate("explore"); }}
            className="flex items-center gap-3 select-none hover:opacity-90 transition-opacity"
            title="Kongo Explorer – Accueil"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 overflow-hidden border border-primary/20">
              <img src="/icon.svg" className="w-full h-full object-contain" alt="Logo Kongo Explorer" />
            </div>
            <span className="font-sans text-headline-md font-bold text-primary">
              Kongo Explorer
            </span>
          </a>
          
          <div className="flex items-center gap-2">
            {/* Notification Bell Button with Badge */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface border border-outline-variant/30 transition-all cursor-pointer flex items-center justify-center"
                title="Centre d'Alertes & Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-surface animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            <a 
              href="/conseils"
              onClick={(e) => { e.preventDefault(); onNavigate("tips"); }}
              className="px-3.5 py-1.5 bg-primary/10 text-primary rounded-full font-sans text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1"
              title="Conseils Pratiques & Météo"
            >
              <span className="material-symbols-outlined text-[14px]">gavel</span>
              Conseils
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 space-y-6 mt-4">
        {/* Prominent Safety Alert Banner if Critical Notification exists */}
        {topCriticalAlert && (
          <section className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold uppercase text-red-600 tracking-wider">
                  ALERTE SÉCURITÉ URGENTE
                </span>
                {onOpenNotifications && (
                  <button
                    onClick={onOpenNotifications}
                    className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Consulter toutes les alertes ({unreadNotificationsCount})</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}
              </div>
              <h4 className="font-sans text-xs font-bold text-on-surface mt-0.5">
                {topCriticalAlert.title}
              </h4>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed mt-1">
                {topCriticalAlert.message}
              </p>
            </div>
          </section>
        )}

        {/* Slogan Banner with Single Primary H1 */}
        <section className="py-2 text-center md:text-left space-y-2 max-w-2xl">
          <a 
            href="/admin/login"
            onClick={(e) => { e.preventDefault(); onNavigate("admin-login"); }}
            className="inline-block text-[11px] font-mono text-on-surface-variant/35 tracking-[0.25em] uppercase cursor-pointer select-none transition-colors hover:text-on-surface-variant/60"
            title="Accès administration"
          >
            apk by nathan king
          </a>
          <h1 className="font-sans text-headline-lg-mobile md:text-headline-lg text-primary font-extrabold leading-tight tracking-tight">
            Explorez les merveilles du Kongo Central
          </h1>
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
                  <a 
                    key={loc.id} 
                    href={`/destinations/${loc.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectLocation(loc.id);
                    }}
                    className="group bg-surface-container-lowest rounded-[28px] overflow-hidden border border-outline-variant/30 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer relative text-inherit no-underline"
                    title={`Consulter la fiche détaillée : ${loc.title}`}
                  >
                    {/* Bookmark Indicator (Save for offline) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSave(loc.id);
                      }}
                      className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-primary active:scale-90 transition-all cursor-pointer"
                      title={isSaved ? "Retirer du carnet" : "Sauvegarder pour le hors-ligne"}
                      aria-label={isSaved ? "Retirer du carnet" : "Sauvegarder pour le hors-ligne"}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isSaved ? "bookmark" : "bookmark_border"}
                      </span>
                    </button>

                    <div className="relative h-52 w-full overflow-hidden bg-surface-variant">
                      <LazyImage 
                        src={loc.image} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={`Photographie de ${loc.title} au Kongo Central`}
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        <span className="bg-primary/90 backdrop-blur-md text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                          {loc.category}
                        </span>
                        <span className="bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                          {loc.accessType === "4X4" ? "🚙 4x4" : loc.accessType === "MARCHE" ? "🥾 Marche" : "🚗 Voiture"}
                        </span>
                      </div>

                      {loc.rating && (
                        <div className="absolute top-3 right-14 z-10 bg-amber-500 text-slate-950 font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] fill">star</span>
                          <span>{loc.rating}</span>
                        </div>
                      )}

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
                  </a>
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
            type="button"
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

      {/* Floating Action Button for Map view / Nearby search */}
      <a 
        href="/carte"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("map");
        }}
        className="fixed bottom-24 right-5 bg-primary text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-sans font-bold text-xs hover:bg-primary-container active:scale-95 transition-all z-40 cursor-pointer border border-white/20"
        title="Autour de moi - Géolocaliser les sites proches"
      >
        <span className="material-symbols-outlined text-[20px]">near_me</span>
        <span>Autour de moi</span>
      </a>
    </div>
  );
}
