import React, { useEffect, useState, useRef } from "react";
import { Location, CommunityReport } from "../types";
import RatingSection from "./RatingSection";
import ReportModal from "./ReportModal";
import RouteDirectionsModal from "./RouteDirectionsModal";
import { VideoPlayer } from "./VideoPlayer";
import { openExternalGpsRoute } from "../lib/geoUtils";

interface DetailViewProps {
  locationId: string;
  locations: Location[];
  onBack: () => void;
  onNavigate: (tab: string) => void;
  savedLocationIds: string[];
  onToggleSave: (id: string) => void;
  onUpdateLocation?: (loc: Location) => void;
  isAdminAuthenticated?: boolean;
  onSubmitReport?: (report: CommunityReport) => void;
}

const DEFAULT_CATEGORY_PHOTOS: Record<string, string[]> = {
  Nature: [
    "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&auto=format&fit=crop&q=80"
  ],
  Histoire: [
    "https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&auto=format&fit=crop&q=80"
  ],
  Urbain: [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80"
  ],
  Incontournables: [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80"
  ]
};

export default function DetailView({
  locationId,
  locations,
  onBack,
  onNavigate,
  savedLocationIds,
  onToggleSave,
  onUpdateLocation,
  isAdminAuthenticated = false,
  onSubmitReport
}: DetailViewProps) {
  const loc = locations.find(l => l.id === locationId) || locations[0];
  const [timerOffset, setTimerOffset] = useState(100);
  const [weatherOpen, setWeatherOpen] = useState(false);

  // Dynamic Photo Gallery States
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState<boolean>(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Audio Guide Speech Synthesis States
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPausedAudio, setIsPausedAudio] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSpeechSupported(false);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech synthesis when switching location
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  }, [loc?.id]);

  const handlePlayAudio = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    window.speechSynthesis.cancel();

    // Construct structured narration text in French
    const parts = [
      `Bienvenue à ${loc.title}, situé à ${loc.locationName}, en République Démocratique du Congo.`,
      loc.description,
      loc.history ? `Contexte historique et culturel. ${loc.history}` : "",
      loc.localCustoms ? `Coutumes locales à observer : ${loc.localCustoms}` : "",
      loc.ecoResponsibility ? `Consignes d'éco-responsabilité : ${loc.ecoResponsibility}` : ""
    ].filter(Boolean).join(" ");

    const utterance = new SpeechSynthesisUtterance(parts);
    utterance.lang = "fr-FR";
    utterance.rate = playbackRate;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith("fr"));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const handlePauseAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const handleChangeSpeed = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setTimeout(() => {
        const parts = [
          `Bienvenue à ${loc.title}, situé à ${loc.locationName}, en République Démocratique du Congo.`,
          loc.description,
          loc.history ? `Contexte historique et culturel. ${loc.history}` : "",
          loc.localCustoms ? `Coutumes locales à observer : ${loc.localCustoms}` : "",
          loc.ecoResponsibility ? `Consignes d'éco-responsabilité : ${loc.ecoResponsibility}` : ""
        ].filter(Boolean).join(" ");

        const utterance = new SpeechSynthesisUtterance(parts);
        utterance.lang = "fr-FR";
        utterance.rate = newRate;

        const voices = window.speechSynthesis.getVoices();
        const frenchVoice = voices.find(v => v.lang.startsWith("fr"));
        if (frenchVoice) {
          utterance.voice = frenchVoice;
        }

        utterance.onend = () => {
          setIsPlayingAudio(false);
          setIsPausedAudio(false);
        };

        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setIsPausedAudio(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      }, 100);
    }
  };

  // Load photos when location changes
  useEffect(() => {
    if (loc.images && loc.images.length > 0) {
      setGalleryImages(loc.images);
    } else {
      const fallbackExtras = DEFAULT_CATEGORY_PHOTOS[loc.category] || DEFAULT_CATEGORY_PHOTOS.Nature;
      setGalleryImages([loc.image, ...fallbackExtras]);
    }
    setActiveImgIndex(0);
  }, [loc.id, loc.image, loc.images, loc.category]);

  // Animate circle progress based on cognitive effort rating
  useEffect(() => {
    const percent = loc.cognitiveEffort || 50;
    const offset = 100 - percent;
    const timer = setTimeout(() => {
      setTimerOffset(offset);
    }, 400);
    return () => clearTimeout(timer);
  }, [loc.cognitiveEffort]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, activeImgIndex, galleryImages.length]);

  const isSaved = savedLocationIds.includes(loc.id);

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const scrollThumbnails = (direction: "left" | "right") => {
    if (thumbnailContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      thumbnailContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleDeletePhoto = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdminAuthenticated) return;
    if (galleryImages.length <= 1) {
      alert("La galerie doit conserver au moins une photo principale.");
      return;
    }
    const updated = galleryImages.filter((_, idx) => idx !== indexToDelete);
    setGalleryImages(updated);
    if (activeImgIndex >= updated.length) {
      setActiveImgIndex(updated.length - 1);
    }
    if (onUpdateLocation) {
      onUpdateLocation({
        ...loc,
        images: updated
      });
    }
  };

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

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Dynamic Photo Gallery Hero Section */}
        <section className="relative w-full bg-surface-container-low border-b border-outline-variant/20">
          {/* Main Display Image */}
          <div className="relative w-full h-[340px] sm:h-[420px] md:h-[500px] overflow-hidden bg-surface-variant group">
            <img 
              key={activeImgIndex}
              alt={`${loc.title} - Photo ${activeImgIndex + 1}`} 
              className="w-full h-full object-cover transition-all duration-500 ease-out cursor-pointer" 
              src={galleryImages[activeImgIndex] || loc.image} 
              referrerPolicy="no-referrer"
              onClick={() => setIsFullscreen(true)}
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80";
              }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

            {/* Top Bar Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-mono font-bold uppercase shadow-sm">
                  {loc.category}
                </span>
                <span className="bg-black/60 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 border border-white/20">
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  Photo {activeImgIndex + 1} sur {galleryImages.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center border border-white/20 transition-all cursor-pointer active:scale-95"
                  title="Afficher en grand écran"
                >
                  <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                </button>
              </div>
            </div>

            {/* Center Carousel Left/Right Controls */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-primary hover:scale-105 flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-md active:scale-95 z-10"
                  aria-label="Photo précédente"
                >
                  <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-primary hover:scale-105 flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-md active:scale-95 z-10"
                  aria-label="Photo suivante"
                >
                  <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                </button>
              </>
            )}

            {/* Title & Location Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
              <h2 className="text-white text-headline-lg-mobile md:text-headline-lg font-bold font-sans drop-shadow-md">
                {loc.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-white text-[18px]">location_on</span>
                <p className="text-white/90 font-mono text-xs drop-shadow">{loc.locationName}, RD Congo</p>
              </div>
            </div>
          </div>

          {/* Horizontal Scrolling Photo Strip Component */}
          <div className="bg-surface-container p-4 border-t border-outline-variant/20">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">photo_library</span>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface">
                  Galerie Photos ({galleryImages.length})
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollThumbnails("left")}
                  className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface cursor-pointer border border-outline-variant/30"
                  title="Défiler à gauche"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
                </button>
                <button
                  onClick={() => scrollThumbnails("right")}
                  className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface cursor-pointer border border-outline-variant/30"
                  title="Défiler à droite"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Bar */}
            <div 
              ref={thumbnailContainerRef}
              className="flex items-center gap-3 overflow-x-auto snap-x scroll-smooth pb-2 pt-1 scrollbar-thin scrollbar-thumb-primary/30"
            >
              {galleryImages.map((imgUrl, index) => {
                const isActive = activeImgIndex === index;
                return (
                  <div
                    key={index}
                    onClick={() => setActiveImgIndex(index)}
                    className={`relative flex-none snap-start w-28 sm:w-32 h-20 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer group/thumb ${
                      isActive 
                        ? "ring-4 ring-primary border-2 border-white scale-105 shadow-md z-10 opacity-100" 
                        : "opacity-75 hover:opacity-100 hover:scale-102 border border-outline-variant/30"
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Miniature ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=300&auto=format&fit=crop&q=80";
                      }}
                    />
                    <div className={`absolute inset-0 ${isActive ? 'bg-primary/10' : 'bg-black/20 hover:bg-transparent'} transition-colors`} />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                      #{index + 1}
                    </span>

                    {/* Admin Delete Photo Button */}
                    {isAdminAuthenticated && galleryImages.length > 1 && (
                      <button
                        onClick={(e) => handleDeletePhoto(index, e)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-white opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:scale-110 active:scale-95 cursor-pointer z-20"
                        title="Supprimer cette photo (Admin)"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROMINENT HIGH-PRIORITY TOP ACTION BAR */}
        <section className="px-5 -mt-6 relative z-20">
          <div className="bg-surface-container-lowest border border-primary/20 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
            {/* Itinéraire In-App Button */}
            <button
              onClick={() => setIsRouteModalOpen(true)}
              className="flex-1 min-w-[150px] bg-primary hover:bg-primary-container text-white py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              title="Calculer l'itinéraire Google Maps en direct"
            >
              <span className="material-symbols-outlined text-[20px]">directions</span>
              <span>Itinéraire</span>
            </button>

            {/* External GPS App Fallback */}
            <button
              onClick={() => openExternalGpsRoute(loc.lat, loc.lng, loc.title)}
              className="py-3 px-3 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface font-sans text-xs font-bold border border-outline-variant/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="Ouvrir dans Google Maps externe"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span className="hidden sm:inline">Maps Ext</span>
            </button>

            {/* Contacter Guide / Resort WhatsApp or Tel Button */}
            <a
              href={loc.contactPhone ? `tel:${loc.contactPhone}` : `https://wa.me/243810000000?text=${encodeURIComponent(`Bonjour, je souhaite des infos sur ${loc.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-3.5 rounded-xl font-sans text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Guide / WhatsApp</span>
            </a>

            {/* Offline Save Toggle */}
            <button
              onClick={() => onToggleSave(loc.id)}
              className={`py-3 px-3.5 rounded-xl font-sans text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSaved
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
                  : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-variant"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isSaved ? "fill text-amber-600" : ""}`}>
                {isSaved ? "bookmark_added" : "bookmark_add"}
              </span>
              <span className="hidden sm:inline">{isSaved ? "Dans le Carnet" : "Enregistrer"}</span>
            </button>

            {/* Community Report Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="py-3 px-3 rounded-xl font-sans text-xs font-bold bg-surface-container hover:bg-surface-variant border border-outline-variant/30 text-outline hover:text-on-surface transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="Signaler une modification sur la route ou le tarif"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">report_problem</span>
              <span className="hidden md:inline">Signaler MAJ</span>
            </button>
          </div>
        </section>

        {/* Audioguide Vocal Interactive Player Card */}
        <section className="px-5 mt-4 relative z-10">
          <div className="bg-gradient-to-r from-primary/10 via-surface-container-lowest to-secondary/10 border border-primary/20 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isPlayingAudio ? 'bg-primary text-white shadow-md animate-pulse' : 'bg-primary/15 text-primary'}`}>
                <span className="material-symbols-outlined text-[28px]">
                  {isPlayingAudio ? "volume_up" : isPausedAudio ? "pause_circle" : "record_voice_over"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-body-lg font-bold text-primary">Audioguide Vocal</h3>
                  {isPlayingAudio && (
                    <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      EN LECTURE
                    </span>
                  )}
                  {isPausedAudio && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      EN PAUSE
                    </span>
                  )}
                </div>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  {isPlayingAudio 
                    ? "Écoute de la narration en cours..." 
                    : isPausedAudio 
                    ? "Récit audio en pause" 
                    : "Écoutez la présentation et l'histoire du site en audio"}
                </p>
              </div>
            </div>

            {/* Audio Controls */}
            {isSpeechSupported ? (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {!isPlayingAudio ? (
                  <button
                    onClick={handlePlayAudio}
                    className="flex-1 md:flex-none bg-primary hover:bg-primary-container text-white py-2.5 px-4 rounded-xl font-sans text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPausedAudio ? "play_arrow" : "volume_up"}
                    </span>
                    <span>{isPausedAudio ? "Reprendre" : "Écouter le récit"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseAudio}
                    className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 rounded-xl font-sans text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">pause</span>
                    <span>Pause</span>
                  </button>
                )}

                {(isPlayingAudio || isPausedAudio) && (
                  <button
                    onClick={handleStopAudio}
                    className="bg-surface-container hover:bg-surface-variant text-on-surface p-2.5 rounded-xl border border-outline-variant/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Arrêter l'audioguide"
                  >
                    <span className="material-symbols-outlined text-[20px]">stop</span>
                  </button>
                )}

                {/* Speed buttons */}
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/30 text-xs font-mono">
                  {[1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleChangeSpeed(rate)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                        playbackRate === rate
                          ? "bg-primary text-white shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      title={`Vitesse x${rate}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-outline font-mono italic">Synthèse vocale indisponible</span>
            )}
          </div>
        </section>

        {/* Video Presentation Section (if available) */}
        {loc.videoUrl && (
          <section className="px-5 mt-5 relative z-10">
            <VideoPlayer
              videoUrl={loc.videoUrl}
              title={loc.title}
              posterImage={loc.image}
            />
          </section>
        )}

        {/* Cognitive Stamina & Status Row */}
        <section className="px-5 mt-4 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="font-sans text-headline-sm font-bold text-primary">Présentation générale</h3>
                {isSpeechSupported && (
                  <button
                    onClick={isPlayingAudio ? handlePauseAudio : handlePlayAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer active:scale-95"
                    title={isPlayingAudio ? "Mettre en pause" : "Écouter la narration"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPlayingAudio ? "pause" : "volume_up"}
                    </span>
                    <span>{isPlayingAudio ? "Pause" : "Écouter"}</span>
                  </button>
                )}
              </div>
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

            {/* Rating and User Feedback Section */}
            <RatingSection
              locationId={loc.id}
              locationTitle={loc.title}
              initialRating={loc.rating}
            />
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

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between animate-fade-in select-none">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent text-white z-10">
            <div className="space-y-0.5">
              <h3 className="font-sans text-body-lg md:text-headline-sm font-bold truncate max-w-md">
                {loc.title}
              </h3>
              <p className="font-mono text-xs text-white/70">
                Photo {activeImgIndex + 1} sur {galleryImages.length} • {loc.locationName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
                title="Fermer (Échap)"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
          </div>

          {/* Lightbox Center Image View */}
          <div className="relative flex-1 flex items-center justify-center p-4 md:p-8">
            <img
              src={galleryImages[activeImgIndex]}
              alt={`${loc.title} - Plein écran`}
              className="max-h-[75vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-all duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80";
              }}
            />

            {/* Left & Right Navigation Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xl active:scale-95"
                  aria-label="Image précédente"
                >
                  <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xl active:scale-95"
                  aria-label="Image suivante"
                >
                  <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Bar */}
          <div className="p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-center">
            <div className="flex items-center gap-2 max-w-full overflow-x-auto p-2 scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden transition-all border cursor-pointer ${
                    activeImgIndex === idx 
                      ? "ring-2 ring-primary border-white scale-110 opacity-100" 
                      : "opacity-40 hover:opacity-100 border-white/20"
                  }`}
                >
                  <img src={img} alt={`Aperçu ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Community Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        location={loc}
        locations={locations}
        onSubmitReport={(report) => {
          if (onSubmitReport) onSubmitReport(report);
        }}
      />

      {/* In-App Route & Directions Modal */}
      {isRouteModalOpen && (
        <RouteDirectionsModal
          location={loc}
          onClose={() => setIsRouteModalOpen(false)}
        />
      )}
    </div>
  );
}
