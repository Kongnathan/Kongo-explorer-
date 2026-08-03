import React, { useState, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  posterImage?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  posterImage,
  className = ''
}) => {
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videoUrl || !videoUrl.trim()) return null;

  let raw = videoUrl.trim();

  // Extract src if user pasted full <iframe src="..."></iframe> snippet
  const iframeSrcMatch = raw.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    raw = iframeSrcMatch[1];
  }

  // YouTube match regex (supports watch?v=, shorts/, embed/, youtu.be/, m.youtube.com, etc.)
  const ytMatch = raw.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  const isShorts = raw.includes("shorts");
  
  // Vimeo match
  const vimeoMatch = raw.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
  
  // Google Drive match
  const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([^\/]+)/i);

  // Dailymotion match
  const dailyMatch = raw.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);

  // Direct MP4 / WebM / OGG match
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(raw) || raw.startsWith('data:video') || raw.startsWith('blob:');

  let embedSrc = raw;
  let originalLink = raw;
  let isIframe = false;
  let platformName = "Vidéo";
  let iconName = "play_circle";

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    // youtube-nocookie.com with playsinline=1 & origin for mobile webview compatibility
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`;
    originalLink = `https://www.youtube.com/watch?v=${videoId}`;
    isIframe = true;
    platformName = isShorts ? "YouTube Shorts" : "YouTube";
    iconName = "smart_display";
  } else if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    embedSrc = `https://player.vimeo.com/video/${videoId}?color=e53935&portrait=0&byline=0&playsinline=1`;
    originalLink = `https://vimeo.com/${videoId}`;
    isIframe = true;
    platformName = "Vimeo";
  } else if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    embedSrc = `https://drive.google.com/file/d/${fileId}/preview`;
    originalLink = `https://drive.google.com/file/d/${fileId}/view`;
    isIframe = true;
    platformName = "Google Drive";
  } else if (dailyMatch && dailyMatch[1]) {
    const videoId = dailyMatch[1];
    embedSrc = `https://www.dailymotion.com/embed/video/${videoId}`;
    originalLink = `https://www.dailymotion.com/video/${videoId}`;
    isIframe = true;
    platformName = "Dailymotion";
  } else if (isDirectVideo) {
    isIframe = false;
    platformName = "Vidéo Fichier (MP4)";
    iconName = "movie";
  } else if (raw.includes("embed") || raw.includes("player.")) {
    isIframe = true;
    platformName = "Vidéo Web";
  }

  const renderMediaContent = (inModal = false) => {
    if (isIframe) {
      return (
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title={`Vidéo de ${title}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; playsinline"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          onError={() => setHasError(true)}
        ></iframe>
      );
    }
    return (
      <video
        ref={videoRef}
        src={raw}
        controls
        playsInline
        preload="metadata"
        poster={posterImage}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      >
        Votre navigateur ne prend pas en charge la lecture de vidéos.
      </video>
    );
  };

  return (
    <>
      {/* Main In-Page Player */}
      <div className={`bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden ${className}`}>
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">{iconName}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-sans text-body-lg font-bold text-on-surface truncate">Vidéo & Présentation</h3>
              <p className="text-xs text-on-surface-variant truncate">Découverte immersive ({platformName})</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Mini Player Toggle */}
            <button
              onClick={() => setIsMiniPlayer(!isMiniPlayer)}
              className="inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
              title={isMiniPlayer ? "Agrandir dans la page" : "Activer le lecteur flottant"}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isMiniPlayer ? "picture_in_picture_off" : "picture_in_picture_alt"}
              </span>
              <span className="hidden sm:inline">{isMiniPlayer ? "Fixer" : "Flottant"}</span>
            </button>

            {/* Theater Mode Button */}
            <button
              onClick={() => setIsTheaterOpen(true)}
              className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              title="Ouvrir le mode Cinéma plein écran"
            >
              <span className="material-symbols-outlined text-[15px]">open_in_full</span>
              <span>Plein Écran</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Box */}
        {!isMiniPlayer && (
          <div className={`relative w-full ${isShorts ? 'aspect-[9/16] max-w-xs mx-auto' : 'aspect-video'} rounded-xl overflow-hidden bg-black shadow-inner`}>
            {renderMediaContent(false)}

            {/* In-app overlay trigger if user clicks directly */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setIsTheaterOpen(true)}
                className="bg-black/70 hover:bg-black/90 backdrop-blur-md text-white p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">fit_screen</span>
                <span className="text-[11px] font-bold">Grand Écran</span>
              </button>
            </div>
          </div>
        )}

        {/* Status & Fallback hint */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Lecture fluide intégrée dans l'application
          </span>
          <a
            href={originalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary flex items-center gap-0.5"
          >
            <span>Lien source</span>
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
          </a>
        </div>
      </div>

      {/* Floating Mini Player (Picture in Picture in-app) */}
      {isMiniPlayer && (
        <div className="fixed bottom-20 right-4 z-50 w-72 md:w-80 aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border-2 border-red-500/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
            <button
              onClick={() => setIsTheaterOpen(true)}
              className="w-7 h-7 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
              title="Agrandir en grand écran"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_full</span>
            </button>
            <button
              onClick={() => setIsMiniPlayer(false)}
              className="w-7 h-7 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
              title="Replacer dans la page"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          {renderMediaContent(false)}
        </div>
      )}

      {/* Theater / Cinema Fullscreen Modal */}
      {isTheaterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between mb-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">movie</span>
              </div>
              <div>
                <h4 className="font-bold text-base md:text-lg line-clamp-1">{title}</h4>
                <p className="text-xs text-white/70">Mode Cinéma KongoExplorer • {platformName}</p>
              </div>
            </div>

            <button
              onClick={() => setIsTheaterOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer le mode cinéma"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Main Large Video Frame */}
          <div className={`w-full max-w-5xl ${isShorts ? 'max-w-md aspect-[9/16]' : 'aspect-video'} bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative`}>
            {renderMediaContent(true)}
          </div>

          {/* Footer note */}
          <div className="mt-4 text-center text-xs text-white/60 font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            <span>Appuyez sur Échap ou le bouton de fermeture pour revenir à la vue destination.</span>
          </div>
        </div>
      )}
    </>
  );
};
