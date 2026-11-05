import React from "react";
import { useBackClose } from "../hooks/useBackClose";
import { MANUAL_PLACES } from "../lib/locationPermission";

export type LocationHelpMode = "intro" | "stuck" | "denied" | "unavailable" | "help";

interface LocationHelpModalProps {
  /** Type d'aide à afficher. `null` = fenêtre fermée. */
  mode: LocationHelpMode | null;
  onClose: () => void;
  /** Bouton principal : relancer la recherche de position. */
  onRetry: () => void;
  /** Permet de choisir une ville à la main. */
  onPickPlace?: (place: { name: string; lat: number; lng: number }) => void;
}

const CONTENT: Record<LocationHelpMode, { icon: string; title: string; text: string }> = {
  intro: {
    icon: "my_location",
    title: "Montrer où vous êtes sur la carte",
    text: "Pour afficher votre position et calculer les distances, votre téléphone va vous demander l'autorisation. Quand la fenêtre apparaît, appuyez sur « Autoriser ».",
  },
  stuck: {
    icon: "touch_app",
    title: "Le bouton « Autoriser » ne répond pas ?",
    text: "Une autre application est sûrement affichée par-dessus l'écran. Elle empêche le téléphone d'accepter votre appui. Voici comment régler cela.",
  },
  denied: {
    icon: "location_off",
    title: "La localisation est bloquée",
    text: "Le site n'a pas l'autorisation de voir votre position. Voici comment la donner.",
  },
  unavailable: {
    icon: "gps_not_fixed",
    title: "Votre position n'a pas été trouvée",
    text: "Le téléphone n'arrive pas à vous situer pour le moment. Essayez les conseils ci-dessous, puis réessayez.",
  },
  help: {
    icon: "help",
    title: "Aide pour la localisation",
    text: "Si votre position ne s'affiche pas, suivez ces conseils, du plus simple au plus complet.",
  },
};

function Step({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-container border border-outline-variant/30 p-3.5 text-center">
      <div className="flex items-center justify-center gap-1.5 text-primary font-sans text-xs font-bold mb-1.5">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="text-xs text-on-surface-variant leading-relaxed space-y-1.5">{children}</div>
    </div>
  );
}

export default function LocationHelpModal({ mode, onClose, onRetry, onPickPlace }: LocationHelpModalProps) {
  // Le bouton « retour » du téléphone ferme cette fenêtre au lieu de quitter la page.
  useBackClose(mode !== null, onClose);

  if (!mode) return null;
  const content = CONTENT[mode];
  const isIntro = mode === "intro";
  const showAll = mode === "stuck" || mode === "denied" || mode === "help";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-help-title"
    >
      <div className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl p-5 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[30px]">{content.icon}</span>
        </div>

        <div className="space-y-1.5">
          <h2 id="location-help-title" className="font-sans text-base font-bold text-on-surface">
            {content.title}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">{content.text}</p>
        </div>

        {isIntro && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-on-surface leading-relaxed">
            <strong>Astuce :</strong> si rien ne se passe quand vous appuyez sur « Autoriser », fermez d'abord les
            applications affichées par-dessus les autres (bulles de discussion, filtre de lumière bleue,
            enregistreur d'écran), puis réessayez.
          </div>
        )}

        {showAll && (
          <div className="space-y-2.5">
            <Step icon="layers" title="1. Fermez les applications affichées par-dessus">
              <p>Elles bloquent le bouton « Autoriser » et les réglages. Les plus courantes :</p>
              <ul className="list-none space-y-0.5">
                <li>• les bulles de discussion (Messenger et autres)</li>
                <li>• les filtres d'écran : lumière bleue, protection des yeux</li>
                <li>• l'enregistreur d'écran et les boutons flottants</li>
              </ul>
              <p>
                Fermez-les un instant, puis appuyez sur « Réessayer ». Vous pourrez les remettre après. Pour les
                retrouver : Réglages → Applications → « Affichage par-dessus d'autres applis » (le nom change un
                peu selon le téléphone).
              </p>
            </Step>

            <Step icon="location_on" title="2. Activez la localisation du téléphone">
              <p>Faites glisser le haut de l'écran vers le bas et touchez l'icône « Localisation » (ou « Position »).</p>
              <p>Ou ouvrez Réglages → Localisation, et activez-la.</p>
            </Step>

            <Step icon="verified_user" title="3. Autorisez Kongo Explorer">
              <p>
                Application installée : appuyez longuement sur l'icône → « Infos sur l'appli » → Autorisations →
                Position → Autoriser.
              </p>
              <p>
                Dans Chrome : touchez le cadenas à côté de l'adresse (ou les trois points → Paramètres → Paramètres
                des sites → Position), puis autorisez ce site.
              </p>
            </Step>
          </div>
        )}

        {mode === "unavailable" && (
          <div className="space-y-2.5">
            <Step icon="location_on" title="Vérifiez ces points">
              <ul className="list-none space-y-0.5">
                <li>• La localisation du téléphone est activée</li>
                <li>• Vous êtes dehors ou près d'une fenêtre (le GPS aime le ciel dégagé)</li>
                <li>• Le mode économie d'énergie est désactivé</li>
              </ul>
              <p>Si une application est affichée par-dessus l'écran (bulle, filtre), fermez-la un instant.</p>
            </Step>
          </div>
        )}

        {!isIntro && onPickPlace && (
          <div className="space-y-2">
            <p className="font-sans text-xs font-bold text-on-surface">
              Pas grave : choisissez l'endroit où vous êtes
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {MANUAL_PLACES.map((place) => (
                <button
                  key={place.name}
                  type="button"
                  onClick={() => onPickPlace(place)}
                  className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface hover:bg-primary hover:text-white active:scale-95 transition-all cursor-pointer"
                >
                  {place.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-3 rounded-2xl bg-primary text-white font-sans text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">{isIntro ? "my_location" : "refresh"}</span>
            {isIntro ? "Activer ma position" : "Réessayer"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl text-on-surface-variant font-sans text-xs font-bold hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
          >
            {isIntro ? "Plus tard" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
