import React, { useState, useEffect } from "react";
import { Location } from "../types";
import { 
  downloadAllForOffline, 
  getOfflineCacheStatus, 
  clearOfflineCache, 
  OfflineDownloadProgress, 
  OfflineCacheStatus 
} from "../lib/indexedDB";

interface OfflineDownloadManagerProps {
  locations: Location[];
  onSyncComplete?: () => void;
  compact?: boolean;
}

export default function OfflineDownloadManager({
  locations,
  onSyncComplete,
  compact = false,
}: OfflineDownloadManagerProps) {
  const [status, setStatus] = useState<OfflineCacheStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<OfflineDownloadProgress | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await getOfflineCacheStatus();
      setStatus(res);
    } catch (e) {
      console.warn("Could not load cache status:", e);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [locations]);

  const handleStartDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await downloadAllForOffline(locations, (p) => {
        setProgress(p);
      });

      if (result.success) {
        setSuccessMessage(
          `Succès ! ${result.locationsCount} destinations et ${result.imagesCount} photos sont désormais stockées en local dans IndexedDB (${(result.totalBytes / (1024 * 1024)).toFixed(1)} Mo).`
        );
        await loadStatus();
        if (onSyncComplete) onSyncComplete();
      } else {
        setErrorMessage(result.error || "Une erreur est survenue lors du téléchargement.");
      }
    } catch (err) {
      console.error("Offline download failed:", err);
      setErrorMessage("Échec du téléchargement. Vérifiez votre connexion internet.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearOfflineCache();
      setShowClearConfirm(false);
      setSuccessMessage("Le stockage hors-ligne a été vidé.");
      await loadStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (e) {
      setErrorMessage("Impossible de vider le cache.");
    }
  };

  return (
    <div 
      className={`bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 shadow-sm space-y-4 ${
        compact ? "p-4" : "p-5"
      }`}
      data-guide="offline-download-section"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              {status?.isFullyCached ? "offline_pin" : "cloud_download"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans text-sm font-bold text-on-surface">
                Mode Hors-ligne & Données Complètes
              </h3>
              {status?.isFullyCached ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Prêt Hors-ligne
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 uppercase border border-amber-500/30">
                  Non téléchargé
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Pré-chargez dynamiquement toutes les fiches, textes descriptifs, coordonnées GPS et photos en mémoire locale (<strong>IndexedDB</strong>) pour explorer sans aucun réseau.
            </p>
          </div>
        </div>

        {/* Action Button */}
        {!isDownloading && (
          <button
            onClick={handleStartDownload}
            disabled={locations.length === 0}
            className={`px-4 py-2.5 rounded-xl font-sans text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center shrink-0 ${
              status?.isFullyCached
                ? "bg-surface-container border border-outline-variant/40 text-on-surface hover:bg-surface-container-high"
                : "bg-primary text-white hover:bg-primary-container"
            }`}
            title="Télécharger toutes les données et photos pour un usage 100% hors-ligne"
          >
            <span className="material-symbols-outlined text-[18px]">
              {status?.isFullyCached ? "sync" : "download"}
            </span>
            <span>
              {status?.isFullyCached ? "Actualiser le hors-ligne" : "Tout télécharger pour hors-ligne"}
            </span>
          </button>
        )}
      </div>

      {/* Real-time Progress Bar */}
      {isDownloading && progress && (
        <div className="bg-surface-container p-4 rounded-2xl border border-primary/20 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{progress.currentTitle}</span>
            </span>
            <span className="font-mono font-bold text-primary">
              {progress.percent}%
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-200 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
            <span>
              Photos : {progress.completedImages} / {progress.totalImages}
            </span>
            <span>
              Taille : {(progress.totalBytes / (1024 * 1024)).toFixed(1)} Mo
            </span>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && !isDownloading && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span className="flex-1 font-medium">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && !isDownloading && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Details / Storage stats */}
      {status && (
        <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-outline">database</span>
              <span><strong>{status.locationsCount}</strong> destinations dans IndexedDB</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-outline">image</span>
              <span><strong>{status.imagesCount}</strong> photos en cache</span>
            </span>
            {status.estimatedMb > 0 && (
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-outline">hard_drive</span>
                <span><strong>~{status.estimatedMb} Mo</strong> d'espace utilisé</span>
              </span>
            )}
          </div>

          {/* Clear button if cache has items */}
          {(status.locationsCount > 0 || status.imagesCount > 0) && !isDownloading && (
            <div>
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-outline hover:text-rose-600 transition-colors text-[11px] underline cursor-pointer"
                >
                  Vider le cache hors-ligne
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">Confirmer ?</span>
                  <button
                    onClick={handleClear}
                    className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] text-on-surface-variant hover:underline cursor-pointer"
                  >
                    Non
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
