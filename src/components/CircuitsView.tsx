import React, { useState } from "react";
import { Circuit, Location } from "../types";
import { DEFAULT_CIRCUITS } from "../circuitsData";
import { openExternalGpsRoute } from "../lib/geoUtils";

interface CircuitsViewProps {
  locations: Location[];
  circuits?: Circuit[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function CircuitsView({
  locations,
  circuits = DEFAULT_CIRCUITS,
  onSelectLocation,
  onNavigate,
}: CircuitsViewProps) {
  const activeCircuitsList = circuits && circuits.length > 0 ? circuits : DEFAULT_CIRCUITS;
  const [activeCircuitId, setActiveCircuitId] = useState<string>(activeCircuitsList[0]?.id || "");
  const [filterAccess, setFilterAccess] = useState<string>("ALL");

  const filteredCircuits = activeCircuitsList.filter(circuit => {
    if (filterAccess !== "ALL" && circuit.accessType !== filterAccess) return false;
    return true;
  });

  const activeCircuit = activeCircuitsList.find(c => c.id === activeCircuitId) || activeCircuitsList[0];

  return (
    <div className="min-h-screen bg-background text-on-background pb-28">
      {/* Top Header Banner */}
      <div className="bg-primary text-white pt-8 pb-10 px-4 md:px-8 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[18px]">route</span>
            <span>Itinéraires Clés en Main • Kongo-Central</span>
          </div>
          <h1 className="font-sans text-display-xs md:text-display-sm font-extrabold tracking-tight mb-2">
            Circuits & Parcours Thématiques
          </h1>
          <p className="text-white/85 text-xs md:text-body-sm max-w-2xl font-sans leading-relaxed">
            Explorez la province grâce à nos parcours optimisés de 2 à 3 jours : logements suggérés, durées de trajet réalistes et conseils de route.
          </p>

          {/* Access Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-white/70 mr-1">Filtrer accès :</span>
            {[
              { id: "ALL", label: "Tous les circuits", icon: "apps" },
              { id: "VOITURE", label: "🚗 Voiture Standard", icon: "directions_car" },
              { id: "4X4", label: "🚙 4x4 Requis", icon: "potted_plant" },
              { id: "MIXTE", label: "🚘 Mixte / Bateau", icon: "sailing" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterAccess(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterAccess === f.id
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Circuits List & Detail Split */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        {/* Selector Tabs for Mobile / Tabbed View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {filteredCircuits.map(circuit => {
            const isActive = circuit.id === activeCircuitId;
            return (
              <button
                key={circuit.id}
                onClick={() => setActiveCircuitId(circuit.id)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isActive
                    ? "bg-surface-container-lowest border-primary shadow-xl ring-2 ring-primary/30"
                    : "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {circuit.badge}
                    </span>
                    <span className="text-[11px] font-sans font-bold text-outline">
                      ⏱️ {circuit.duration}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-body-md text-on-surface line-clamp-1 mb-1">
                    {circuit.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant/80 line-clamp-2 font-sans">
                    {circuit.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono font-bold text-outline">
                  <span>Accès : {circuit.accessType === "4X4" ? "🚙 4x4 Requis" : "🚗 Berline OK"}</span>
                  <span className="text-primary flex items-center gap-0.5">
                    Détails <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Circuit Full Showcase */}
        {activeCircuit && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            {/* Banner Header */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
              <img
                src={activeCircuit.image}
                alt={activeCircuit.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-amber-500 text-slate-950 font-sans font-extrabold text-[11px] px-3 py-1 rounded-full shadow">
                    {activeCircuit.badge}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-white font-sans font-bold text-[11px] px-3 py-1 rounded-full border border-white/20">
                    ⏱️ {activeCircuit.duration}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-white font-sans font-bold text-[11px] px-3 py-1 rounded-full border border-white/20">
                    {activeCircuit.accessType === "4X4" ? "🚙 4x4 Tout-Terrain" : "🚗 Accessible tout véhicule"}
                  </span>
                </div>
                <h2 className="font-sans text-title-lg md:text-display-xs font-bold leading-tight mb-1">
                  {activeCircuit.title}
                </h2>
                <p className="text-white/90 text-xs md:text-body-sm font-sans max-w-3xl">
                  {activeCircuit.subtitle}
                </p>
              </div>
            </div>

            {/* Circuit Overview Details */}
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low/40">
              <p className="text-xs md:text-body-sm text-on-surface font-sans leading-relaxed mb-4">
                {activeCircuit.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-sans font-semibold text-primary bg-primary/10 p-3 rounded-2xl border border-primary/20">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Ideal pour : {activeCircuit.bestFor}</span>
              </div>
            </div>

            {/* Step-by-Step Stops Timeline */}
            <div className="p-6">
              <h3 className="font-sans font-bold text-title-sm text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">timeline</span>
                <span>Étapes de l'Itinéraire</span>
              </h3>

              <div className="space-y-8 relative before:absolute before:top-3 before:bottom-3 before:left-5 before:w-0.5 before:bg-primary/20">
                {activeCircuit.stops.map((stop, idx) => {
                  const matchedLoc = locations.find(l => l.id === stop.locationId);
                  const stopImg = matchedLoc?.image || stop.image;
                  return (
                    <div key={idx} className="relative pl-12">
                      {/* Step Number Dot */}
                      <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-primary text-white font-mono font-bold text-sm flex items-center justify-center shadow-lg ring-4 ring-surface-container-lowest">
                        {idx + 1}
                      </div>

                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <h4 className="font-sans font-bold text-body-md text-on-surface">
                            {stop.title}
                          </h4>
                          <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full self-start md:self-auto">
                            ⏱️ Durée : {stop.duration}
                          </span>
                        </div>

                        <p className="text-xs font-sans text-outline mb-3">
                          {stop.subtitle}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
                          <div className="md:col-span-2 text-xs font-sans text-on-surface-variant leading-relaxed">
                            {stop.description}
                          </div>
                          {stopImg && (
                            <div className="h-28 rounded-xl overflow-hidden shadow-sm">
                              <img
                                src={stopImg}
                                alt={stop.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {stop.tips && (
                          <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs font-sans text-amber-900 dark:text-amber-200 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-600 text-[18px] flex-shrink-0 mt-0.5">
                              lightbulb
                            </span>
                            <span><strong>Conseil Éco-Garde :</strong> {stop.tips}</span>
                          </div>
                        )}

                        {/* Action buttons for stop */}
                        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                          {matchedLoc && (
                            <button
                              onClick={() => onSelectLocation(matchedLoc.id)}
                              className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span>Voir la Fiche Complète</span>
                            </button>
                          )}

                          {matchedLoc?.lat && matchedLoc?.lng && (
                            <button
                              onClick={() => openExternalGpsRoute(matchedLoc.lat, matchedLoc.lng, matchedLoc.title)}
                              className="px-3 py-1.5 bg-secondary text-white hover:brightness-110 rounded-xl text-xs font-sans font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <span className="material-symbols-outlined text-[16px]">navigation</span>
                              <span>Lancer GPS jusqu'à l'étape</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Circuit CTA */}
              <div className="mt-8 p-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-300 text-3xl">map</span>
                  <div>
                    <h4 className="font-sans font-bold text-body-md">
                      Prêt à partir sur le circuit ?
                    </h4>
                    <p className="text-white/80 text-xs font-sans">
                      Téléchargez les fiches du circuit pour votre trajet hors-ligne.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("saved")}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
                >
                  Ouvrir Mon Carnet Hors-Ligne
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
