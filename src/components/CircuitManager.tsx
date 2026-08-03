import React, { useState } from "react";
import { Circuit, CircuitStop, Location } from "../types";

interface CircuitManagerProps {
  circuits: Circuit[];
  locations: Location[];
  onSaveCircuit: (updatedCircuit: Circuit) => void;
  onAddCircuit: (newCircuit: Circuit) => void;
  onDeleteCircuit: (circuitId: string) => void;
}

const CIRCUIT_PRESETS = [
  {
    title: "Chutes de Zongo & Forêt",
    url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
    tag: "Chutes & Nature"
  },
  {
    title: "Fleuve Congo & Boma",
    url: "https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=1200&auto=format&fit=crop&q=80",
    tag: "Histoire & Fleuve"
  },
  {
    title: "Jardin Botanique Kisantu",
    url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80",
    tag: "Botanique & Flore"
  },
  {
    title: "Mangroves & Ocean Muanda",
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=80",
    tag: "Réserve Marine"
  },
  {
    title: "Plage Atlantique & Falaises",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    tag: "Littoral & Plage"
  },
  {
    title: "Pont Maréchal & Matadi",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
    tag: "Génie Civil & Fleuve"
  }
];

function SingleImagePicker({
  value,
  onChange,
  label = "Photo de couverture"
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [activeTab, setActiveTab] = useState<"presets" | "upload" | "url">("presets");
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez choisir un fichier image valide (JPG, PNG, WEBP).");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 })
        });
        const data = await response.json();
        if (data.url) {
          onChange(data.url);
        } else {
          onChange(base64);
        }
      } catch (err) {
        onChange(base64);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold text-on-surface uppercase flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">add_a_photo</span>
          {label}
        </label>
        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5 text-[10px] font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`px-2 py-1 rounded-md transition-all ${activeTab === "presets" ? "bg-primary text-white shadow-sm" : "text-outline hover:text-on-surface"}`}
          >
            Bibliothèque
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2 py-1 rounded-md transition-all ${activeTab === "upload" ? "bg-primary text-white shadow-sm" : "text-outline hover:text-on-surface"}`}
          >
            Importer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2 py-1 rounded-md transition-all ${activeTab === "url" ? "bg-primary text-white shadow-sm" : "text-outline hover:text-on-surface"}`}
          >
            Lien URL
          </button>
        </div>
      </div>

      {/* Image Preview */}
      {value && (
        <div className="relative h-32 rounded-xl overflow-hidden border border-outline-variant/40 group shadow-inner">
          <img
            src={value}
            alt="Aperçu"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <span className="text-white text-xs font-mono font-bold bg-black/60 px-2 py-1 rounded-md">
              Photo Active
            </span>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {CIRCUIT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(preset.url)}
              className={`relative h-16 rounded-lg overflow-hidden border transition-all cursor-pointer group text-left ${
                value === preset.url ? "border-primary ring-2 ring-primary/40 scale-[0.98]" : "border-outline-variant/30 hover:border-primary/50"
              }`}
            >
              <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1 flex flex-col justify-end">
                <span className="text-[9px] font-sans font-bold text-white line-clamp-1">{preset.title}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragActive(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragActive ? "border-primary bg-primary/10" : "border-outline-variant/40 hover:bg-surface-container"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary">
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
              <span>Traitement de l'image...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="material-symbols-outlined text-outline text-2xl">cloud_upload</span>
              <p className="text-xs font-sans text-on-surface font-medium">Déposez votre photo ici ou cliquez pour choisir</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "url" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}

export default function CircuitManager({
  circuits,
  locations,
  onSaveCircuit,
  onAddCircuit,
  onDeleteCircuit
}: CircuitManagerProps) {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>(circuits[0]?.id || "");
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(
    circuits.find(c => c.id === selectedCircuitId) || circuits[0] || null
  );
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(0);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const activeCircuit = editingCircuit || circuits.find(c => c.id === selectedCircuitId) || circuits[0];

  const handleSelectCircuit = (id: string) => {
    setSelectedCircuitId(id);
    const target = circuits.find(c => c.id === id);
    if (target) {
      setEditingCircuit(JSON.parse(JSON.stringify(target)));
      setActiveStopIndex(0);
    }
  };

  const handleCreateNewCircuit = () => {
    const newId = `circuit-${Date.now()}`;
    const newCircuitObj: Circuit = {
      id: newId,
      title: "Nouveau Circuit Écotourisme Kongo-Central",
      subtitle: "Itinéraire thématique à la découverte des trésors locaux.",
      duration: "2 Jours / 1 Nuit",
      badge: "🆕 Nouveau Circuit",
      image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
      description: "Description globale du parcours, des paysages traversés et des conseils de voyage.",
      bestFor: "Explorateurs, familles, photographes.",
      accessType: "VOITURE",
      stops: [
        {
          locationId: locations[0]?.id || "zongo",
          title: "Étape 1 : Point de départ",
          subtitle: "Inauguration de l'itinéraire",
          duration: "2h00",
          description: "Présentation du site et première immersion.",
          image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
          tips: "Prendre de l'eau et vérifier la météo."
        }
      ]
    };

    onAddCircuit(newCircuitObj);
    setSelectedCircuitId(newId);
    setEditingCircuit(newCircuitObj);
    setActiveStopIndex(0);
    showToast("Nouveau circuit créé avec succès !");
  };

  const handleSaveCurrentCircuit = () => {
    if (!editingCircuit) return;
    onSaveCircuit(editingCircuit);
    showToast("Modifications du circuit enregistrées !");
  };

  const handleDeleteCurrentCircuit = () => {
    if (!editingCircuit) return;
    if (confirm(`Voulez-vous vraiment supprimer le circuit "${editingCircuit.title}" ?`)) {
      onDeleteCircuit(editingCircuit.id);
      const remaining = circuits.filter(c => c.id !== editingCircuit.id);
      if (remaining.length > 0) {
        setSelectedCircuitId(remaining[0].id);
        setEditingCircuit(JSON.parse(JSON.stringify(remaining[0])));
      } else {
        setEditingCircuit(null);
      }
      showToast("Circuit supprimé.");
    }
  };

  const showToast = (msg: string) => {
    setSaveNotification(msg);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleUpdateField = (field: keyof Circuit, value: any) => {
    if (!editingCircuit) return;
    setEditingCircuit({
      ...editingCircuit,
      [field]: value
    });
  };

  const handleUpdateStop = (index: number, field: keyof CircuitStop, value: any) => {
    if (!editingCircuit) return;
    const updatedStops = [...editingCircuit.stops];
    updatedStops[index] = {
      ...updatedStops[index],
      [field]: value
    };
    setEditingCircuit({
      ...editingCircuit,
      stops: updatedStops
    });
  };

  const handleAddStop = () => {
    if (!editingCircuit) return;
    const newStop: CircuitStop = {
      locationId: locations[0]?.id || "zongo",
      title: `Étape ${editingCircuit.stops.length + 1} : Nouvelle Destination`,
      subtitle: "Sous-titre descriptif de l'étape",
      duration: "2h00",
      description: "Description des activités et lieux à visiter lors de cette étape.",
      image: "https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=1200&auto=format&fit=crop&q=80",
      tips: "Conseil de sécurité ou d'organisation pour les voyageurs."
    };
    const newStops = [...editingCircuit.stops, newStop];
    setEditingCircuit({
      ...editingCircuit,
      stops: newStops
    });
    setActiveStopIndex(newStops.length - 1);
  };

  const handleDeleteStop = (index: number) => {
    if (!editingCircuit) return;
    if (editingCircuit.stops.length <= 1) {
      alert("Un circuit doit contenir au moins une étape.");
      return;
    }
    const updatedStops = editingCircuit.stops.filter((_, idx) => idx !== index);
    setEditingCircuit({
      ...editingCircuit,
      stops: updatedStops
    });
    setActiveStopIndex(Math.max(0, index - 1));
  };

  const handleMoveStop = (index: number, direction: "up" | "down") => {
    if (!editingCircuit) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editingCircuit.stops.length) return;

    const newStops = [...editingCircuit.stops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIdx];
    newStops[targetIdx] = temp;

    setEditingCircuit({
      ...editingCircuit,
      stops: newStops
    });
    setActiveStopIndex(targetIdx);
  };

  return (
    <div className="space-y-6">
      {/* Save Notification Toast */}
      {saveNotification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-2xl font-sans text-xs font-bold flex items-center gap-2 animate-bounce border border-emerald-500/30">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase mb-1">
            <span className="material-symbols-outlined text-[20px]">photo_camera_back</span>
            <span>Gestion des Circuits & Médias</span>
          </div>
          <h2 className="font-sans text-headline-sm font-extrabold text-on-surface">
            Éditeur de Circuits & Galerie des Étapes
          </h2>
          <p className="text-xs text-outline font-sans mt-0.5">
            Gérez les photos de couverture, les badges, les durées et l'iconographie étape par étape de chaque itinéraire.
          </p>
        </div>

        <button
          onClick={handleCreateNewCircuit}
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-white font-sans text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Créer un Circuit</span>
        </button>
      </div>

      {/* Main Grid: Circuit Selector & Circuit Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Circuits */}
        <div className="space-y-3">
          <h3 className="font-sans font-bold text-body-md text-on-surface px-1 flex items-center justify-between">
            <span>Circuits Disponibles ({circuits.length})</span>
          </h3>

          <div className="space-y-3">
            {circuits.map((circuit) => {
              const isSelected = circuit.id === (editingCircuit?.id || selectedCircuitId);
              return (
                <button
                  key={circuit.id}
                  onClick={() => handleSelectCircuit(circuit.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                    isSelected
                      ? "bg-surface-container-lowest border-primary shadow-lg ring-2 ring-primary/30"
                      : "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container"
                  }`}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
                    <img
                      src={circuit.image}
                      alt={circuit.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-block truncate max-w-full">
                      {circuit.badge}
                    </span>
                    <h4 className="font-sans font-bold text-body-sm text-on-surface line-clamp-1">
                      {circuit.title}
                    </h4>
                    <p className="text-[11px] font-mono text-outline">
                      ⏱️ {circuit.duration} • {circuit.stops.length} Étape{circuit.stops.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Circuit Photo & Content Editor */}
        {editingCircuit ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="font-sans text-title-md font-bold text-on-surface">
                    Édition : {editingCircuit.title}
                  </h3>
                  <p className="text-xs text-outline font-mono">ID : {editingCircuit.id}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteCurrentCircuit}
                    className="px-3 py-2 bg-error/10 hover:bg-error text-error hover:text-white rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="Supprimer ce circuit"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>

                  <button
                    onClick={handleSaveCurrentCircuit}
                    className="px-5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-sans font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>

              {/* Cover Photo Management */}
              <SingleImagePicker
                value={editingCircuit.image}
                onChange={(url) => handleUpdateField("image", url)}
                label="Photo Principale de Couverture du Circuit"
              />

              {/* General Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                    Titre du Circuit
                  </label>
                  <input
                    type="text"
                    value={editingCircuit.title}
                    onChange={(e) => handleUpdateField("title", e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                    Badge de Style (Ex. 🌿 Nature)
                  </label>
                  <input
                    type="text"
                    value={editingCircuit.badge}
                    onChange={(e) => handleUpdateField("badge", e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                    Durée Recommandée
                  </label>
                  <input
                    type="text"
                    value={editingCircuit.duration}
                    onChange={(e) => handleUpdateField("duration", e.target.value)}
                    placeholder="Ex. 2 Jours / 1 Nuit"
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                    Type d'Accès Requis
                  </label>
                  <select
                    value={editingCircuit.accessType}
                    onChange={(e) => handleUpdateField("accessType", e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="VOITURE">🚗 VOITURE (Berline Standard OK)</option>
                    <option value="4X4">🚙 4X4 (Tout-Terrain obligatoire)</option>
                    <option value="MIXTE">🚘 MIXTE (Voiture + Pirogue/Bateau)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                  Sous-titre / Accroche
                </label>
                <input
                  type="text"
                  value={editingCircuit.subtitle}
                  onChange={(e) => handleUpdateField("subtitle", e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                  Description Globale du Circuit
                </label>
                <textarea
                  rows={3}
                  value={editingCircuit.description}
                  onChange={(e) => handleUpdateField("description", e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-outline uppercase mb-1">
                  Ideal Pour (Audience)
                </label>
                <input
                  type="text"
                  value={editingCircuit.bestFor}
                  onChange={(e) => handleUpdateField("bestFor", e.target.value)}
                  placeholder="Ex. Photographes, aventuriers et familles"
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Stops Photo & Detail Management Section */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-title-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">photo_library</span>
                    <span>Gestion des Étapes & Photos ({editingCircuit.stops.length})</span>
                  </h4>

                  <button
                    onClick={handleAddStop}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Ajouter une Étape</span>
                  </button>
                </div>

                {/* Steps Accordion/Tabs */}
                <div className="space-y-4">
                  {editingCircuit.stops.map((stop, idx) => {
                    const isOpen = activeStopIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isOpen
                            ? "bg-surface-container-low border-primary/50 shadow-md"
                            : "bg-surface-container border-outline-variant/30"
                        }`}
                      >
                        {/* Accordion Bar */}
                        <div
                          onClick={() => setActiveStopIndex(isOpen ? null : idx)}
                          className="p-4 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary text-white font-mono font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <h5 className="font-sans font-bold text-body-sm text-on-surface">
                                {stop.title}
                              </h5>
                              <p className="text-[11px] font-mono text-outline">
                                ⏱️ {stop.duration}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleMoveStop(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded-lg text-outline hover:text-on-surface disabled:opacity-30 cursor-pointer"
                              title="Déplacer vers le haut"
                            >
                              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                            </button>
                            <button
                              onClick={() => handleMoveStop(idx, "down")}
                              disabled={idx === editingCircuit.stops.length - 1}
                              className="p-1 rounded-lg text-outline hover:text-on-surface disabled:opacity-30 cursor-pointer"
                              title="Déplacer vers le bas"
                            >
                              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStop(idx)}
                              className="p-1 rounded-lg text-error hover:bg-error/10 cursor-pointer"
                              title="Supprimer cette étape"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                            <span className="material-symbols-outlined text-[20px] text-outline">
                              {isOpen ? "expand_less" : "expand_more"}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Content */}
                        {isOpen && (
                          <div className="p-4 pt-0 space-y-4 border-t border-outline-variant/20">
                            {/* Step Photo Uploader */}
                            <SingleImagePicker
                              value={stop.image}
                              onChange={(url) => handleUpdateStop(idx, "image", url)}
                              label={`Photo de l'Étape ${idx + 1}`}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-outline uppercase mb-1">
                                  Destination Liée (Site)
                                </label>
                                <select
                                  value={stop.locationId}
                                  onChange={(e) => handleUpdateStop(idx, "locationId", e.target.value)}
                                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                      {loc.title} ({loc.locationName})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-outline uppercase mb-1">
                                  Durée Estimée de la Visite
                                </label>
                                <input
                                  type="text"
                                  value={stop.duration}
                                  onChange={(e) => handleUpdateStop(idx, "duration", e.target.value)}
                                  placeholder="Ex. 2h30"
                                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-outline uppercase mb-1">
                                  Titre de l'Étape
                                </label>
                                <input
                                  type="text"
                                  value={stop.title}
                                  onChange={(e) => handleUpdateStop(idx, "title", e.target.value)}
                                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-outline uppercase mb-1">
                                  Sous-titre
                                </label>
                                <input
                                  type="text"
                                  value={stop.subtitle}
                                  onChange={(e) => handleUpdateStop(idx, "subtitle", e.target.value)}
                                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold text-outline uppercase mb-1">
                                Description de l'Étape
                              </label>
                              <textarea
                                rows={2}
                                value={stop.description}
                                onChange={(e) => handleUpdateStop(idx, "description", e.target.value)}
                                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-bold text-outline uppercase mb-1">
                                Conseil Éco-Garde (Tips)
                              </label>
                              <input
                                type="text"
                                value={stop.tips || ""}
                                onChange={(e) => handleUpdateStop(idx, "tips", e.target.value)}
                                placeholder="Ex. Prévoyez des chaussures antidérapantes..."
                                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline">route</span>
            <p className="font-sans text-body-md text-on-surface">Sélectionnez un circuit à gauche pour gérer ses photos et détails.</p>
          </div>
        )}
      </div>
    </div>
  );
}
