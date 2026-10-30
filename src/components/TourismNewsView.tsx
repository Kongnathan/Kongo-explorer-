import React, { useState, useMemo } from "react";
import { TourismPost, TourismCategory } from "../types";
import LazyImage from "./LazyImage";
import { useAuth } from "../contexts/AuthContext";
import CreateTourismPostModal from "./CreateTourismPostModal";
import MyTourismPostsModal from "./MyTourismPostsModal";
import ReportPostModal from "./ReportPostModal";

interface TourismNewsViewProps {
  posts: TourismPost[];
  onSelectPost: (id: string) => void;
  onNavigate: (tab: string) => void;
  onPostCreated?: (post: TourismPost) => void;
  onStartTour?: () => void;
}

const CATEGORIES: ("Toutes" | TourismCategory)[] = [
  "Toutes",
  "Lieu à visiter",
  "Événement",
  "Hébergement",
  "Restaurant",
  "Conseil pratique",
  "Transport",
];

const LOCATIONS = [
  "Tous",
  "Matadi",
  "Boma",
  "Muanda",
  "Zongo",
  "Kisantu",
  "Mbanza-Ngungu",
  "Kongo Central",
];

export default function TourismNewsView({
  posts,
  onSelectPost,
  onNavigate,
  onPostCreated,
  onStartTour,
}: TourismNewsViewProps) {
  const { currentUser, userProfile, isAdmin, openAuthModal, logout } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<"Toutes" | TourismCategory>("Toutes");
  const [selectedLocation, setSelectedLocation] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMyPostsModalOpen, setIsMyPostsModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<TourismPost | null>(null);

  // User posts calculation for quota & "My posts" list
  const userPosts = useMemo(() => {
    if (!currentUser) return [];
    return posts.filter((p) => p.authorId === currentUser.uid);
  }, [posts, currentUser]);

  const userPostsTodayCount = useMemo(() => {
    if (!currentUser) return 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return userPosts.filter((p) => {
      const time = new Date(p.createdAt).getTime();
      return !isNaN(time) && time > oneDayAgo;
    }).length;
  }, [userPosts, currentUser]);

  // Only show VALIDATED publications to the public
  const validatedPosts = useMemo(() => {
    return posts.filter((p) => {
      const s = String(p.status).toLowerCase();
      return s === "validated";
    });
  }, [posts]);

  // Filter by category, location, and search keyword
  const filteredPosts = useMemo(() => {
    return validatedPosts.filter((post) => {
      const matchCat =
        selectedCategory === "Toutes" || post.category === selectedCategory;

      const matchLoc =
        selectedLocation === "Tous" ||
        post.location.toLowerCase().includes(selectedLocation.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.location.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query);

      return matchCat && matchLoc && matchSearch;
    });
  }, [validatedPosts, selectedCategory, selectedLocation, searchQuery]);

  const handleProposeClick = () => {
    if (!currentUser) {
      openAuthModal("login", "Connectez-vous pour proposer une publication touristique.");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const getCategoryBadgeClass = (category: TourismCategory) => {
    switch (category) {
      case "Lieu à visiter":
        return "bg-emerald-600 text-white";
      case "Événement":
        return "bg-amber-600 text-white";
      case "Hébergement":
        return "bg-indigo-600 text-white";
      case "Restaurant":
        return "bg-rose-600 text-white";
      case "Conseil pratique":
        return "bg-sky-600 text-white";
      case "Transport":
        return "bg-amber-700 text-white";
      default:
        return "bg-primary text-white";
    }
  };

  const getCategoryIcon = (category: TourismCategory) => {
    switch (category) {
      case "Lieu à visiter":
        return "attractions";
      case "Événement":
        return "event";
      case "Hébergement":
        return "hotel";
      case "Restaurant":
        return "restaurant";
      case "Conseil pratique":
        return "lightbulb";
      case "Transport":
        return "directions_bus";
      default:
        return "newspaper";
    }
  };

  return (
    <div className="flex-1 pb-24 font-sans animate-fade-in bg-background text-on-background">
      {/* Top Header */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low/95 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
        <div className="relative flex items-center justify-between px-4 sm:px-6 w-full max-w-7xl mx-auto h-16">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("explore");
            }}
            className="flex items-center gap-2.5 select-none hover:opacity-90 transition-opacity"
            title="Kongo Explorer – Accueil"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 overflow-hidden border border-primary/20">
              <img src="/icon.svg" className="w-full h-full object-contain" alt="Logo Kongo Explorer" />
            </div>
            <div>
              <span className="font-sans text-headline-md font-bold text-primary block leading-none">
                Kongo Explorer
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                Infos Tourisme
              </span>
            </div>
          </a>

          {/* User actions */}
          <div className="flex items-center gap-2">
            {/* Propose post button */}
            <button
              onClick={handleProposeClick}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span className="hidden sm:inline">Publier une info</span>
              <span className="sm:hidden">Publier</span>
            </button>

            {/* My Posts if logged in */}
            {currentUser && (
              <button
                onClick={() => setIsMyPostsModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container hover:bg-surface-variant text-on-surface transition-all flex items-center gap-1.5 cursor-pointer relative"
                title="Consulter l'état de mes publications"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">folder_shared</span>
                <span className="hidden md:inline">Mes publications</span>
                {userPosts.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                    {userPosts.length}
                  </span>
                )}
              </button>
            )}

            {/* Auth pill */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-outline-variant/30">
                <div
                  className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30"
                  title={currentUser.displayName || currentUser.email || "Utilisateur"}
                >
                  {(userProfile?.displayName || currentUser.email || "U")[0].toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                  title="Se déconnecter"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal("login")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container hover:bg-surface-variant text-on-surface transition-all flex items-center gap-1 cursor-pointer"
                  data-guide="auth-btn"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span className="hidden sm:inline">Connexion</span>
                </button>
              )}

              {onStartTour && (
                <button
                  onClick={onStartTour}
                  className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Visite guidée"
                >
                  <span className="material-symbols-outlined text-[20px]">tour</span>
                </button>
              )}
            </div>
          </div>
        </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-primary to-emerald-950 text-white px-5 py-8 md:py-12 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-emerald-100 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">feed</span>
              Actualités & Bonnes Adresses
            </span>

            {currentUser && (
              <span className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">account_circle</span>
                Connecté en tant que <strong>{userProfile?.displayName || currentUser.displayName || currentUser.email}</strong>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight mb-2">
            Infos Tourisme au Kongo Central
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
            Événements culturels, nouveautés des sites historiques, hébergements vérifiés, adresses gourmandes et conseils des guides de la province.
          </p>

          {/* Search Input Bar */}
          <div className="mt-6 max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden text-neutral-800">
              <span className="material-symbols-outlined text-neutral-400 ml-4 text-[22px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une actu, un festival, un restaurant..."
                className="w-full py-3.5 px-3 text-sm focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                  title="Effacer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Category Filters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">category</span>
              Filtrer par Catégorie
            </h2>
            <span className="text-xs text-on-surface-variant/80 font-medium">
              {filteredPosts.length} publication{filteredPosts.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isSelected
                      ? "bg-primary text-white shadow-md scale-102"
                      : "bg-surface-container hover:bg-surface-variant text-on-surface border border-outline-variant/30"
                  }`}
                >
                  {cat !== "Toutes" && (
                    <span className="material-symbols-outlined text-[15px]">
                      {getCategoryIcon(cat as TourismCategory)}
                    </span>
                  )}
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Location Filters */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-500">location_on</span>
            Filtrer par Ville ou Lieu
          </h2>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {LOCATIONS.map((loc) => {
              const isSelected = selectedLocation === loc;
              return (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-on-surface text-surface font-bold"
                      : "bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </section>

        {/* Cards Grid or Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high mx-auto flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-on-surface">
                Aucune publication validée trouvée
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                Aucune information ne correspond aux critères sélectionnés. Essayez d'élargir vos filtres ou de modifier vos mots-clés.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory("Toutes");
                  setSelectedLocation("Tous");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-surface-container hover:bg-surface-variant text-on-surface cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
              <button
                onClick={handleProposeClick}
                className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary/95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Proposer une publication</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="group rounded-3xl bg-surface-container-lowest border border-outline-variant/30 overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Photo Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-black/5">
                  <LazyImage
                    src={post.photo}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Category Chip */}
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1 ${getCategoryBadgeClass(
                      post.category
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {getCategoryIcon(post.category)}
                    </span>
                    {post.category}
                  </span>

                  {/* Report Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportingPost(post);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-rose-600 text-white/80 hover:text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-xs cursor-pointer"
                    title="Signaler un contenu inapproprié"
                  >
                    <span className="material-symbols-outlined text-[16px]">flag</span>
                  </button>

                  {/* Location Pin */}
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-amber-400">
                      location_on
                    </span>
                    {post.location}
                  </span>

                  {/* Gallery count if multiple photos */}
                  {post.gallery && post.gallery.length > 1 && (
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">photo_library</span>
                      {post.gallery.length} photos
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Date and Author */}
                    <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {post.date}
                      </span>
                      <span className="truncate max-w-[130px] text-right font-medium text-primary">
                        {post.author}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-on-surface-variant/90 line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  {/* Card Footer with Price/Contact or Action */}
                  <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                    {post.priceRange ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        {post.priceRange}
                      </span>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        Kongo Central
                      </span>
                    )}

                    <span className="font-bold text-primary flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Lire la suite
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Publication Modals */}
      <CreateTourismPostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userPostsTodayCount={userPostsTodayCount}
        onPostCreated={onPostCreated}
      />

      <MyTourismPostsModal
        isOpen={isMyPostsModalOpen}
        onClose={() => setIsMyPostsModalOpen(false)}
        posts={userPosts}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        onSelectPost={onSelectPost}
      />

      <ReportPostModal
        isOpen={reportingPost !== null}
        post={reportingPost}
        onClose={() => setReportingPost(null)}
      />
    </div>
  );
}
