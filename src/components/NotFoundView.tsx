import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundView() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-24 h-24 mb-6 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
        <span className="material-symbols-outlined text-5xl">travel_explore</span>
      </div>

      <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full dark:bg-amber-950/50 dark:text-amber-300">
        Erreur 404 • Destination introuvable
      </span>

      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-on-surface mb-3 tracking-tight">
        Page ou destination introuvable
      </h1>

      <p className="max-w-md text-sm sm:text-base text-on-surface-variant mb-8 leading-relaxed">
        L'adresse demandée n'existe pas, a été modifiée ou le chemin renseigné est incorrect.
        Poursuivez votre exploration des trésors et merveilles du Kongo Central.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-xs sm:max-w-none">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-sans text-sm font-semibold shadow-md hover:brightness-110 active:scale-95 transition-all no-underline"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          Retour à l'accueil
        </Link>
        <Link
          to="/destinations"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-surface-container-high text-on-surface font-sans text-sm font-medium border border-outline/20 hover:bg-surface-container-highest active:scale-95 transition-all no-underline"
        >
          <span className="material-symbols-outlined text-lg">grid_view</span>
          Toutes les destinations
        </Link>
      </div>
    </div>
  );
}
