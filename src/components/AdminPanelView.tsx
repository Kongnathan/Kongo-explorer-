import React, { useState, useEffect } from "react";
import { Location, PendingPermit, SubdomainConfig, Circuit } from "../types";
import CircuitManager from "./CircuitManager";
import { VideoPlayer } from "./VideoPlayer";
import adminProfileImg from "../assets/images/regenerated_image_1784273845010.jpg";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebaseConfig";

const RESERVED_SUBDOMAINS = [
  "admin", "api", "app", "www", "mail", "ftp", "localhost", "root", 
  "staging", "dev", "kongo", "kongoexplorer", "explorer", "test", 
  "demo", "ns", "dns", "blog", "shop", "store", "sys", "system"
];

function validateSubdomain(input: string): { isValid: boolean; normalized: string; errors: string[] } {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, "-");
  const errors: string[] = [];

  if (!normalized) {
    return { isValid: false, normalized: "", errors: ["Veuillez saisir un nom de sous-domaine."] };
  }
  if (normalized.length < 3) {
    errors.push("Le sous-domaine doit comporter au moins 3 caractères.");
  }
  if (normalized.length > 63) {
    errors.push("Le sous-domaine ne doit pas dépasser 63 caractères.");
  }
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    errors.push("Caractères autorisés : lettres minuscules (a-z), chiffres (0-9) et tirets (-).");
  }
  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    errors.push("Le sous-domaine ne doit ni commencer ni se terminer par un tiret.");
  }
  if (normalized.includes("--")) {
    errors.push("Les tirets consécutifs ne sont pas autorisés.");
  }
  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    errors.push(`'${normalized}' est un nom de sous-domaine réservé par le système.`);
  }

  return {
    isValid: errors.length === 0,
    normalized,
    errors
  };
}


function ImageUploader({ 
  value, 
  onChange, 
  label = "Photo de la destination" 
}: { 
  value: string; 
  onChange: (url: string) => void; 
  label?: string;
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide.");
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
        console.warn("Express upload server unavailable, storing image directly in local DB.", err);
        onChange(base64);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-mono font-bold text-on-surface-variant">{label}</label>
      
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
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
        className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragActive 
            ? "border-primary bg-primary/5 scale-[0.98]" 
            : "border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container-high"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
            <span className="font-sans text-xs text-on-surface-variant">Téléchargement vers le cloud...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="w-full h-24 rounded-lg overflow-hidden relative group">
              <img src={value} alt="Aperçu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">edit</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-primary break-all max-w-full truncate px-2">{value}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center py-2">
            <span className="material-symbols-outlined text-outline text-3xl">cloud_upload</span>
            <p className="font-sans text-xs text-on-surface">Glissez-déposez une image ou cliquez pour parcourir</p>
            <p className="font-mono text-[9px] text-outline">Formats acceptés : PNG, JPG, JPEG, WEBP</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-[10px] text-outline font-mono">Ou URL :</span>
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="flex-1 bg-surface-container px-3 py-1 rounded-lg font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/10"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-1.5 mt-1">
        <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Hébergement d'images & vidéos permanents :
        </span>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          Pour héberger gratuitement vos photos et vos vidéos de destinations (YouTube, Vimeo, ImgBB...) :
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono font-bold text-secondary">
          <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 text-red-600">
            <span className="material-symbols-outlined text-[10px]">play_circle</span> YouTube (Vidéos)
          </a>
          <a href="https://vimeo.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 text-cyan-600">
            <span className="material-symbols-outlined text-[10px]">open_in_new</span> Vimeo
          </a>
          <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">open_in_new</span> ImgBB (Photos)
          </a>
          <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">open_in_new</span> Postimages
          </a>
        </div>
      </div>
    </div>
  );
}

function DedicatedImageUploader({
  locations,
  onUpdateLocation
}: {
  locations: Location[];
  onUpdateLocation: (loc: Location) => void;
}) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || "");
  const [candidateImage, setCandidateImage] = useState<string>("");
  const [uploadSourceTab, setUploadSourceTab] = useState<"file" | "url" | "camera" | "presets">("file");
  const [uploadMode, setUploadMode] = useState<"gallery" | "main">("gallery");
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);

  const CONGO_PRESETS = [
    {
      title: "Chutes de Zongo & Forêt Dense",
      url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80",
      tag: "Chutes & Nature"
    },
    {
      title: "Coucher de soleil sur le Lac Kivu",
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
      tag: "Lac & Panorama"
    },
    {
      title: "Fleuve Congo & Végétation Equatoriale",
      url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80",
      tag: "Fleuve Congo"
    },
    {
      title: "Massif des Virunga & Reliefs",
      url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&auto=format&fit=crop&q=80",
      tag: "Parc & Montagne"
    },
    {
      title: "Savane & Pistes Ecotourisme",
      url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80",
      tag: "Ecotourisme"
    },
    {
      title: "Kinshasa & Architecture Moderne",
      url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&auto=format&fit=crop&q=80",
      tag: "Capitale & Ville"
    }
  ];

  const selectedLoc = locations.find(l => l.id === selectedLocationId) || locations[0];

  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Veuillez sélectionner un fichier au format image valide (PNG, JPG, WEBP)." });
      return;
    }

    setUploading(true);
    setFeedback(null);
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
          setCandidateImage(data.url);
        } else {
          setCandidateImage(base64);
        }
      } catch (err) {
        setCandidateImage(base64);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAction = async () => {
    if (!selectedLoc) {
      setFeedback({ type: "error", message: "Veuillez sélectionner un lieu." });
      return;
    }
    if (!candidateImage.trim()) {
      setFeedback({ type: "error", message: "Veuillez d'abord choisir ou déposer une image." });
      return;
    }

    let currentImages = selectedLoc.images ? [...selectedLoc.images] : [selectedLoc.image];
    let newMainImage = selectedLoc.image;

    if (uploadMode === "main") {
      newMainImage = candidateImage.trim();
      if (!currentImages.includes(candidateImage.trim())) {
        currentImages = [candidateImage.trim(), ...currentImages];
      }
    } else {
      if (!currentImages.includes(candidateImage.trim())) {
        currentImages.push(candidateImage.trim());
      }
    }

    const updatedLoc: Location = {
      ...selectedLoc,
      image: newMainImage,
      images: currentImages
    };

    try {
      await fetch(`/api/locations/${updatedLoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLoc)
      });
    } catch (err) {
      console.warn("API update failed, applying update locally:", err);
    }

    onUpdateLocation(updatedLoc);
    setFeedback({
      type: "success",
      message: `Image ${uploadMode === "main" ? "définie comme couverture principale" : "ajoutée à la galerie"} avec succès pour "${selectedLoc.title}" !`
    });
    setCandidateImage("");
  };

  const handleDeleteGalleryImage = async (imgToDelete: string) => {
    if (!selectedLoc) return;
    let currentImages = selectedLoc.images ? [...selectedLoc.images] : [selectedLoc.image];
    if (currentImages.length <= 1) {
      setFeedback({ type: "error", message: "La galerie doit conserver au moins une photo." });
      return;
    }
    const updatedImages = currentImages.filter(img => img !== imgToDelete);
    let newMainImage = selectedLoc.image;
    if (selectedLoc.image === imgToDelete) {
      newMainImage = updatedImages[0];
    }

    const updatedLoc: Location = {
      ...selectedLoc,
      image: newMainImage,
      images: updatedImages
    };

    try {
      await fetch(`/api/locations/${updatedLoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLoc)
      });
    } catch (err) {
      console.warn("API update failed, applying delete locally:", err);
    }

    onUpdateLocation(updatedLoc);
    setFeedback({
      type: "success",
      message: `Image supprimée de la galerie de "${selectedLoc.title}".`
    });
    if (previewLightboxUrl === imgToDelete) {
      setPreviewLightboxUrl(null);
    }
  };

  const handleSetMainCover = async (imgUrl: string) => {
    if (!selectedLoc) return;
    const updatedLoc: Location = {
      ...selectedLoc,
      image: imgUrl
    };

    try {
      await fetch(`/api/locations/${updatedLoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLoc)
      });
    } catch (err) {
      console.warn("API update failed, applying update locally:", err);
    }

    onUpdateLocation(updatedLoc);
    setFeedback({
      type: "success",
      message: `"${selectedLoc.title}" : Image de couverture principale mise à jour !`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Info */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold border border-primary/20">
              Module Administrateur Exclusif
            </span>
            <span className="text-xs text-outline font-mono">Gestionnaire d'Images & Médias</span>
          </div>
          <h2 className="font-sans text-headline-sm font-bold text-on-surface">
            Gestionnaire des Images & Galerie
          </h2>
          <p className="text-xs text-on-surface-variant font-sans max-w-2xl">
            Sélectionnez une destination, ajoutez des photos (glisser-déposer, URL, caméra ou banque d'images), définissez la photo de couverture et supprimez les images obsolètes.
          </p>
        </div>

        {/* Location Switcher Dropdown */}
        <div className="w-full md:w-auto min-w-[280px] bg-surface-container p-3 rounded-2xl border border-outline-variant/30 space-y-1.5">
          <label className="block text-[11px] font-mono font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
            Sélectionner la Destination :
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              setCandidateImage("");
              setFeedback(null);
            }}
            className="w-full bg-surface-container-lowest px-3 py-2 rounded-xl font-sans text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20 cursor-pointer"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} ({l.locationName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono font-bold animate-fade-in ${
          feedback.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" 
            : "bg-error/10 border-error/30 text-error"
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {feedback.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {selectedLoc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: SOURCE SELECTION & UPLOAD CONTROLS (7 COLS) */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <h3 className="font-sans text-body-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_a_photo</span>
                1. Choisir la source de l'image
              </h3>
              <span className="text-xs font-mono text-outline">Multi-Source Studio</span>
            </div>

            {/* Source Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-surface-container rounded-2xl border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setUploadSourceTab("file")}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  uploadSourceTab === "file"
                    ? "bg-primary text-white shadow-md"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Dropzone</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceTab("url")}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  uploadSourceTab === "url"
                    ? "bg-primary text-white shadow-md"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">link</span>
                <span>URL Web</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceTab("camera")}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  uploadSourceTab === "camera"
                    ? "bg-primary text-white shadow-md"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>Caméra</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceTab("presets")}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  uploadSourceTab === "presets"
                    ? "bg-primary text-white shadow-md"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">collections</span>
                <span>Banque RDC</span>
              </button>
            </div>

            {/* TAB 1: DROPZONE / LOCAL FILE */}
            {uploadSourceTab === "file" && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileProcess(file);
                  };
                  input.click();
                }}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] text-center ${
                  isDragActive
                    ? "border-primary bg-primary/10 scale-[0.99] shadow-inner"
                    : "border-primary/30 hover:border-primary hover:bg-primary/5"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                    <p className="font-mono text-xs text-primary font-bold">Téléversement de l'image en cours...</p>
                  </div>
                ) : candidateImage ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="relative w-full max-w-sm h-48 rounded-2xl overflow-hidden border border-outline-variant/30 shadow-md group">
                      <img src={candidateImage} alt="Image sélectionnée" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="text-white font-mono text-xs font-bold bg-black/60 px-3 py-1 rounded-full">
                          Cliquer pour remplacer
                        </span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Image chargée et prête
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                    </div>
                    <div>
                      <p className="font-sans text-body-md font-bold text-on-surface">
                        Glissez-déposez votre image ici
                      </p>
                      <p className="font-sans text-xs text-on-surface-variant mt-1">
                        ou cliquez pour parcourir les dossiers de votre appareil
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-outline bg-surface-container px-3 py-1 rounded-full">
                      PNG, JPG, WEBP, GIF (Max 10Mo)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: URL WEB */}
            {uploadSourceTab === "url" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-on-surface-variant">
                    Saisir l'URL Web de la photo :
                  </label>
                  <input
                    type="url"
                    value={candidateImage}
                    onChange={(e) => setCandidateImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-surface-container px-4 py-3 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                  />
                </div>

                {candidateImage.trim() && (
                  <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 space-y-2">
                    <p className="text-[10px] font-mono font-bold text-outline uppercase">Aperçu avant enregistrement :</p>
                    <div className="h-40 rounded-xl overflow-hidden bg-surface-variant border border-outline-variant/30">
                      <img 
                        src={candidateImage.trim()} 
                        alt="Prévisualisation" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CAMERA CAPTURE */}
            {uploadSourceTab === "camera" && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-6 border-2 border-dashed border-tertiary/40 rounded-3xl bg-tertiary/5 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-sans text-body-md font-bold text-on-surface">Capture photo en direct</h4>
                    <p className="text-xs text-on-surface-variant">Activez la caméra de votre smartphone, tablette ou ordinateur pour prendre une photo en direct.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.setAttribute("capture", "environment");
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileProcess(file);
                      };
                      input.click();
                    }}
                    className="px-6 py-3 bg-tertiary text-white font-mono text-xs font-bold rounded-xl shadow cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">linked_camera</span>
                    Prendre une photo
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: CONGO PRESETS */}
            {uploadSourceTab === "presets" && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs font-mono font-bold text-on-surface-variant">
                  Sélectionnez une illustration parmi la banque officielle Congo :
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {CONGO_PRESETS.map((preset, pIdx) => (
                    <div 
                      key={pIdx}
                      onClick={() => setCandidateImage(preset.url)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer h-24 transition-all ${
                        candidateImage === preset.url
                          ? "ring-2 ring-primary border-primary shadow-md scale-[0.98]"
                          : "border-outline-variant/30 hover:border-primary"
                      }`}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                        <span className="text-[8px] font-mono font-bold text-white/80 uppercase">{preset.tag}</span>
                        <p className="text-[10px] font-sans font-bold text-white line-clamp-1">{preset.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode Selector */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/10">
              <label className="block text-xs font-mono font-bold text-on-surface-variant">
                2. Choisir le mode d'enregistrement :
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadMode("gallery")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    uploadMode === "gallery"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                      : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">collections</span>
                  <div>
                    <span className="block text-xs font-mono">Ajouter à la Galerie</span>
                    <span className="text-[10px] opacity-75 font-sans">S'ajoute aux photos secondaires</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadMode("main")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    uploadMode === "main"
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                      : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                  <div>
                    <span className="block text-xs font-mono">Remplacer Couverture</span>
                    <span className="text-[10px] opacity-75 font-sans">Devient la photo principale</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Confirm Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={!candidateImage.trim()}
                className={`w-full py-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
                  candidateImage.trim()
                    ? "bg-primary text-white hover:bg-primary-container active:scale-98"
                    : "bg-outline/20 text-outline cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Confirmer l'enregistrement pour "{selectedLoc.title}"</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: LIVE PREVIEW & EXISTING GALLERY (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Card Preview */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                <h3 className="font-sans text-body-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  Aperçu en Temps Réel
                </h3>
                <span className="text-[10px] font-mono text-outline uppercase">{selectedLoc.category}</span>
              </div>

              <div 
                onClick={() => setPreviewLightboxUrl(candidateImage && uploadMode === "main" ? candidateImage : selectedLoc.image)}
                className="rounded-2xl overflow-hidden border border-outline-variant/30 shadow-md bg-surface-container cursor-pointer group"
              >
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={candidateImage && uploadMode === "main" ? candidateImage : selectedLoc.image}
                    alt={selectedLoc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <span className="bg-primary text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full w-fit mb-1">
                      {selectedLoc.locationName}
                    </span>
                    <h4 className="text-white font-sans text-body-lg font-bold drop-shadow-sm flex items-center justify-between">
                      <span>{selectedLoc.title}</span>
                      <span className="text-xs font-mono text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">Zoom ↗</span>
                    </h4>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-lowest text-[11px] font-sans text-on-surface-variant flex justify-between items-center">
                  <span>Photo principale de couverture</span>
                  <span className="font-mono text-primary font-bold">★ {selectedLoc.rating || 4.5}</span>
                </div>
              </div>
            </div>

            {/* Existing Gallery Photos Manager & Delete options */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                <h3 className="font-sans text-body-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">photo_library</span>
                  Galerie Actuelle ({(selectedLoc.images || [selectedLoc.image]).length})
                </h3>
                <span className="text-[10px] font-mono text-outline">Gestion Tactile</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                {(selectedLoc.images || [selectedLoc.image]).map((imgUrl, idx) => {
                  const isMain = selectedLoc.image === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-xl overflow-hidden border group h-32 transition-all ${
                        isMain 
                          ? "ring-2 ring-primary border-primary shadow-sm" 
                          : "border-outline-variant/30 hover:border-outline"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Galerie ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />

                      {/* Touch & Hover Responsive Overlay */}
                      <div className="absolute inset-0 bg-black/65 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => setPreviewLightboxUrl(imgUrl)}
                          className="w-full bg-white/20 hover:bg-white/30 text-white text-[9px] font-mono font-bold py-1 px-1.5 rounded-lg border border-white/30 text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">zoom_in</span>
                          <span>Agrandir</span>
                        </button>

                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainCover(imgUrl)}
                            className="w-full bg-primary text-white text-[9px] font-mono font-bold py-1 px-1.5 rounded-lg shadow cursor-pointer hover:bg-primary-container text-center flex items-center justify-center gap-1"
                            title="Définir comme couverture principale"
                          >
                            <span className="material-symbols-outlined text-[12px]">star</span>
                            <span>Couverture</span>
                          </button>
                        )}
                        {(selectedLoc.images || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryImage(imgUrl)}
                            className="w-full bg-error text-white text-[9px] font-mono font-bold py-1 px-1.5 rounded-lg shadow cursor-pointer hover:bg-error/80 flex items-center justify-center gap-1"
                            title="Supprimer la photo"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>

                      {isMain && (
                        <span className="absolute top-1 left-1 bg-primary text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow z-10">
                          COUVERTURE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL */}
      {previewLightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-4xl w-full bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 bg-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <span className="font-sans text-xs font-bold text-on-surface">
                  Inspection Image - {selectedLoc?.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewLightboxUrl(null)}
                className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 bg-black overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
              <img 
                src={previewLightboxUrl} 
                alt="Agrandissement" 
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-surface-container flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10">
              <span className="text-[11px] font-mono text-outline line-clamp-1 max-w-md">
                {previewLightboxUrl}
              </span>

              <div className="flex items-center gap-2 ml-auto">
                {selectedLoc && selectedLoc.image !== previewLightboxUrl && (
                  <button
                    onClick={() => {
                      handleSetMainCover(previewLightboxUrl);
                      setPreviewLightboxUrl(null);
                    }}
                    className="px-4 py-2 bg-primary text-white font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 shadow hover:bg-primary-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">star</span>
                    Définir en Couverture
                  </button>
                )}

                {selectedLoc && (selectedLoc.images || []).length > 1 && (
                  <button
                    onClick={() => handleDeleteGalleryImage(previewLightboxUrl)}
                    className="px-4 py-2 bg-error text-white font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 shadow hover:bg-error/80 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Supprimer cette photo
                  </button>
                )}

                <button
                  onClick={() => setPreviewLightboxUrl(null)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface font-mono text-xs font-bold rounded-xl cursor-pointer hover:bg-surface-variant"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminPanelViewProps {
  locations: Location[];
  circuits?: Circuit[];
  pendingPermits: PendingPermit[];
  onAddLocation: (loc: Location) => void;
  onUpdateLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
  onUpdatePendingPermit: (permit: PendingPermit) => void;
  onDeletePendingPermit: (id: string) => void;
  onSaveCircuit?: (updatedCircuit: Circuit) => void;
  onAddCircuit?: (newCircuit: Circuit) => void;
  onDeleteCircuit?: (circuitId: string) => void;
  onLogout: () => void;
}

export default function AdminPanelView({
  locations,
  circuits = [],
  pendingPermits,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onUpdatePendingPermit,
  onDeletePendingPermit,
  onSaveCircuit = () => {},
  onAddCircuit = () => {},
  onDeleteCircuit = () => {},
  onLogout
}: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Location form states
  const [newTitle, setNewTitle] = useState("");
  const [newLocName, setNewLocName] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Incontournables");
  const [newDesc, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newStatus, setNewStatus] = useState<any>("PUBLISHED");
  const [newLat, setNewLat] = useState<string>("");
  const [newLng, setNewLng] = useState<string>("");

  // Subdomain Management States
  const [subdomainInput, setSubdomainInput] = useState<string>("explore");
  const [subdomainConfig, setSubdomainConfig] = useState<SubdomainConfig | null>({
    subdomain: "explore",
    fullUrl: "https://explore.kongoexplorer.cd",
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
    dnsRecords: [
      { type: "CNAME", name: "explore", value: "ais-dev-fe2khec5btgm2wbcvmdjto.cloudrun.app" },
      { type: "A", name: "@", value: "130.50.0.64" }
    ],
    sslStatus: "Actif (TLS 1.3 - Let's Encrypt)"
  });
  const [isSubdomainLoading, setIsSubdomainLoading] = useState<boolean>(false);
  const [isSubdomainSaving, setIsSubdomainSaving] = useState<boolean>(false);
  const [subdomainFeedback, setSubdomainFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [subdomainHistory, setSubdomainHistory] = useState<Array<{ subdomain: string; fullUrl: string; date: string }>>([
    { subdomain: "explore", fullUrl: "https://explore.kongoexplorer.cd", date: "Initialisation système" }
  ]);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Fetch current subdomain configuration from Firestore or API
  useEffect(() => {
    async function loadSubdomainConfig() {
      setIsSubdomainLoading(true);

      // 1. Fetch from Firestore if configured
      if (isFirebaseConfigured) {
        try {
          const docRef = doc(db, "settings", "subdomain");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as SubdomainConfig;
            setSubdomainConfig(data);
            setSubdomainInput(data.subdomain);
            setIsSubdomainLoading(false);
            return;
          }
        } catch (err) {
          console.warn("[Firestore] Failed to fetch settings/subdomain:", err);
        }
      }

      // 2. Fallback to API route
      try {
        const res = await fetch("/api/subdomain");
        if (res.ok) {
          const data = await res.json();
          setSubdomainConfig(data);
          if (data.subdomain) setSubdomainInput(data.subdomain);
        }
      } catch (err) {
        console.error("API subdomain load error:", err);
      } finally {
        setIsSubdomainLoading(false);
      }
    }

    loadSubdomainConfig();
  }, []);

  const currentSubdomainValidation = validateSubdomain(subdomainInput);

  const handleVerifySubdomain = async () => {
    const val = validateSubdomain(subdomainInput);
    if (!val.isValid) {
      setSubdomainFeedback({
        type: "error",
        message: `Invalide : ${val.errors.join(" ")}`
      });
      return;
    }

    setSubdomainFeedback({
      type: "info",
      message: "Vérification de la disponibilité du sous-domaine dans Firestore..."
    });

    try {
      // Check in Firestore if subdomain doc exists
      if (isFirebaseConfigured) {
        const checkDoc = await getDoc(doc(db, "subdomains", val.normalized));
        if (checkDoc.exists() && checkDoc.data().subdomain !== subdomainConfig?.subdomain) {
          setSubdomainFeedback({
            type: "error",
            message: `Le sous-domaine '${val.normalized}' est déjà réservé dans la base de données Firestore.`
          });
          return;
        }
      }

      // Also check API validation endpoint
      const res = await fetch("/api/subdomain/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: val.normalized })
      });
      const data = await res.json();

      if (data.valid) {
        setSubdomainFeedback({
          type: "success",
          message: `Le sous-domaine '${val.normalized}' est valide et disponible ! URL finale : ${data.fullUrl}`
        });
      } else {
        setSubdomainFeedback({
          type: "error",
          message: data.errors.join(" ")
        });
      }
    } catch (err: any) {
      setSubdomainFeedback({
        type: "success",
        message: `Format valide ('${val.normalized}'). Prêt pour l'enregistrement dans Firestore.`
      });
    }
  };

  const handleSaveSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubdomainFeedback(null);

    const val = validateSubdomain(subdomainInput);
    if (!val.isValid) {
      setSubdomainFeedback({
        type: "error",
        message: `Erreur de validation : ${val.errors.join(" ")}`
      });
      return;
    }

    setIsSubdomainSaving(true);
    const normalized = val.normalized;

    const updatedConfig: SubdomainConfig = {
      subdomain: normalized,
      fullUrl: `https://${normalized}.kongoexplorer.cd`,
      status: "ACTIVE",
      updatedAt: new Date().toISOString(),
      dnsRecords: [
        { type: "CNAME", name: normalized, value: "ais-dev-fe2khec5btgm2wbcvmdjto.cloudrun.app" },
        { type: "A", name: "@", value: "130.50.0.64" }
      ],
      sslStatus: "Actif (TLS 1.3 - Let's Encrypt)",
      updatedBy: "Conservateur Admin"
    };

    let firestoreSaved = false;

    // 1. Save to Firestore
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, "settings", "subdomain"), updatedConfig);
        await setDoc(doc(db, "subdomains", normalized), {
          subdomain: normalized,
          fullUrl: updatedConfig.fullUrl,
          status: "ACTIVE",
          createdAt: new Date().toISOString()
        });
        firestoreSaved = true;
      } catch (err: any) {
        console.error("Error writing subdomain to Firestore:", err);
      }
    }

    // 2. Save to backend API server
    try {
      const res = await fetch("/api/subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: normalized })
      });
      const data = await res.json();
      if (data.config) {
        setSubdomainConfig(data.config);
      } else {
        setSubdomainConfig(updatedConfig);
      }
    } catch (err) {
      setSubdomainConfig(updatedConfig);
    }

    setIsSubdomainSaving(false);

    // Update history
    setSubdomainHistory(prev => [
      {
        subdomain: normalized,
        fullUrl: `https://${normalized}.kongoexplorer.cd`,
        date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      },
      ...prev.filter(item => item.subdomain !== normalized)
    ]);

    setSubdomainFeedback({
      type: "success",
      message: firestoreSaved
        ? `Sous-domaine '${normalized}' sauvegardé avec succès dans Firestore !`
        : `Sous-domaine '${normalized}' sauvegardé dans le système !`
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };


  const handleEditClick = (loc: Location) => {
    setEditingLoc({ ...loc });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;

    try {
      const response = await fetch(`/api/locations/${editingLoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLoc)
      });
      const data = await response.json();
      onUpdateLocation(data);
      setEditingLoc(null);
      alert("Destination mise à jour avec succès !");
    } catch (err) {
      console.error(err);
      onUpdateLocation(editingLoc);
      setEditingLoc(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Client-side generated unique ID ensures safety and prevents missing ID issues
    const generatedId = `loc-${Date.now()}`;

    const newLoc: Location = {
      id: generatedId,
      title: newTitle,
      locationName: newLocName || "Kongo Central",
      category: newCategory,
      description: newDesc,
      status: newStatus,
      coords: { x: 50, y: 50 },
      image: newImage || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
      videoUrl: newVideoUrl || undefined,
      lat: newLat ? Number(newLat) : undefined,
      lng: newLng ? Number(newLng) : undefined,
      rating: 4.5,
      cognitiveEffort: 50,
      timeToVisit: "3 heures",
      intensity: "Intensité Modérée",
      terrain: "Terrain Aménagé",
      currentStatus: "Ouvert aujourd'hui.",
      history: "Nouveau site culturel ou sauvage.",
      checklist: ["Bouteille d'eau", "Chaussures de marche"],
      bestSeason: "Saison sèche",
      safetyGuidelines: "Suivre les sentiers recommandés.",
      ecoResponsibility: "Ramasser ses déchets.",
      localCustoms: "S'adresser respectueusement aux anciens."
    };

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoc)
      });
      const data = await response.json();
      onAddLocation(data);
      setIsAddOpen(false);
      resetAddForm();
      alert("Nouvelle destination ajoutée avec succès !");
    } catch (err) {
      console.error(err);
      onAddLocation(newLoc);
      setIsAddOpen(false);
      resetAddForm();
    }
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewLocName("");
    setNewCategory("Incontournables");
    setNewDescription("");
    setNewImage("");
    setNewVideoUrl("");
    setNewStatus("PUBLISHED");
    setNewLat("");
    setNewLng("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette destination ?")) return;

    try {
      await fetch(`/api/locations/${id}`, { method: "DELETE" });
      onDeleteLocation(id);
    } catch (err) {
      console.error(err);
      onDeleteLocation(id);
    }
  };

  // Promote pending permit to actual location
  const handlePromoteContribution = (permit: PendingPermit) => {
    // Attempt to extract place name from subtitle
    let extractedPlace = "Kongo Central";
    if (permit.subtitle) {
      const parts = permit.subtitle.split(" • ");
      if (parts[0]) {
        extractedPlace = parts[0].replace(" (En attente d'évaluation)", "").replace(" (Traitement local)", "");
      }
    }

    setNewTitle(permit.title);
    setNewLocName(extractedPlace);
    setNewDescription(`Découverte soumise par l'un de nos explorateurs : "${permit.title}". Validée par le conservateur.`);
    setNewCategory("Incontournables");
    setNewImage("");
    setNewStatus("PUBLISHED");
    
    // Open the creation modal
    setIsAddOpen(true);

    // Update pending permit status to completed
    onUpdatePendingPermit({ ...permit, status: "COMPLETED" });
  };

  // Change contribution status directly
  const handleTogglePermitStatus = (permit: PendingPermit) => {
    const nextStatus = permit.status === "PENDING" ? "VERIFICATION" : "COMPLETED";
    onUpdatePendingPermit({ ...permit, status: nextStatus });
  };

  // Reject and delete user contribution
  const handleRejectContribution = async (id: string) => {
    if (!confirm("Voulez-vous rejeter et supprimer définitivement cette proposition utilisateur ?")) return;
    onDeletePendingPermit(id);
  };

  const filteredLocations = locations.filter(loc => 
    loc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    loc.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculations
  const totalLocations = locations.length;
  const publishedCount = locations.filter(l => l.status === "PUBLISHED").length;
  const draftCount = locations.filter(l => l.status === "DRAFT").length;
  const waitingCount = locations.filter(l => l.status === "WAITING").length;

  const totalContributions = pendingPermits.length;
  const pendingContributions = pendingPermits.filter(p => p.status === "PENDING").length;
  const verificationContributions = pendingPermits.filter(p => p.status === "VERIFICATION").length;
  const completedContributions = pendingPermits.filter(p => p.status === "COMPLETED").length;

  // Category counts
  const categoryCounts = {
    Incontournables: locations.filter(l => l.category === "Incontournables").length,
    Nature: locations.filter(l => l.category === "Nature").length,
    Histoire: locations.filter(l => l.category === "Histoire").length,
    Urbain: locations.filter(l => l.category === "Urbain").length,
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col md:flex-row relative">
      {/* Navigation Drawer (SideNav) */}
      <aside className="bg-surface-container-low w-full md:w-72 shadow-sm flex flex-col md:fixed md:inset-y-0 md:left-0 z-30 h-auto md:h-full border-r border-outline-variant/20">
        <div className="p-6 flex flex-col gap-1">
          <h1 className="font-sans text-headline-md font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
            Espace Admin
          </h1>
          <p className="font-mono text-label-sm text-on-surface-variant opacity-75">CONSERVATEUR DU PATRIMOINE</p>
        </div>
        
        <nav className="flex-1 mt-4 space-y-1">
          <button 
            onClick={() => setActiveTab("Dashboard")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Dashboard"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="flex-1">Tableau de bord</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("Locations")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Locations"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] fill">map</span>
            <span className="flex-1">Destinations</span>
            <span className="bg-surface-container-high text-on-surface-variant text-[11px] px-2 py-0.5 rounded-full font-bold">
              {totalLocations}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("Contributions")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Contributions"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="flex-1">Fiches Utilisateurs</span>
            {pendingContributions > 0 && (
              <span className="bg-alert-time text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                {pendingContributions}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("Subdomain")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Subdomain"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">language</span>
            <span className="flex-1">Sous-Domaine</span>
            {subdomainConfig?.subdomain && (
              <span className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold truncate max-w-[80px]">
                {subdomainConfig.subdomain}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("Circuits")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Circuits"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">route</span>
            <span className="flex-1">Gestion des Circuits</span>
            <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {circuits.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("Images")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Images"
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            <span className="flex-1">Gestion des Images</span>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              ImageUploader
            </span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden flex-none">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Admin profile" 
                  src={adminProfileImg} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-body-md font-bold text-on-surface">Conservateur</span>
                <span className="font-mono text-label-sm text-on-surface-variant">Admin Kongo</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="material-symbols-outlined text-outline hover:text-error rounded-full p-2 hover:bg-error/10 transition-colors cursor-pointer"
              title="Se déconnecter"
            >
              logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-screen flex flex-col">
        {/* Top App Bar */}
        <header className="sticky top-0 w-full z-20 flex justify-between items-center px-6 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <h2 className="font-sans text-headline-sm font-bold text-primary">
              {activeTab === "Dashboard" && "Statistiques du Portail"}
              {activeTab === "Locations" && "Gérer les Destinations"}
              {activeTab === "Contributions" && "Modérer les Propositions Utilisateurs"}
              {activeTab === "Circuits" && "Gestion des Circuits & Médias"}
              {activeTab === "Subdomain" && "Configuration du Sous-Domaine"}
              {activeTab === "Images" && "Gestionnaire Dedié des Images"}
            </h2>
          </div>
          {activeTab === "Locations" && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une fiche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container rounded-full pl-10 pr-4 py-1.5 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-primary w-44 md:w-64 border border-outline-variant/30"
                />
                <span className="material-symbols-outlined text-outline absolute left-3 top-2 text-[18px]">search</span>
              </div>
            </div>
          )}
        </header>

        {/* Dynamic Page Canvas */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "Dashboard" && (
            <div className="space-y-8 animate-fade-in">
              {/* Bento Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-none">
                    <span className="material-symbols-outlined text-2xl fill">pin_drop</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-on-surface font-sans">{totalLocations}</span>
                    <span className="font-sans text-[11px] text-on-surface-variant font-medium">Destinations publiées</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-none animate-pulse">
                    <span className="material-symbols-outlined text-2xl fill">hourglass_empty</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-on-surface font-sans">{pendingContributions}</span>
                    <span className="font-sans text-[11px] text-on-surface-variant font-medium">En attente d'approbation</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-none">
                    <span className="material-symbols-outlined text-2xl fill">verified</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-on-surface font-sans">{completedContributions}</span>
                    <span className="font-sans text-[11px] text-on-surface-variant font-medium">Fiches intégrées</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary flex-none">
                    <span className="material-symbols-outlined text-2xl">insights</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-on-surface font-sans">
                      {totalLocations + totalContributions > 0 
                        ? ((publishedCount / (totalLocations + totalContributions)) * 100).toFixed(0) 
                        : 100}%
                    </span>
                    <span className="font-sans text-[11px] text-on-surface-variant font-medium">Disponibilité globale</span>
                  </div>
                </div>
              </div>

              {/* Graphical Analysis & Shortcuts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Categories Breakdown */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 lg:col-span-2 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans text-body-lg font-bold text-on-surface">Répartition thématique</h3>
                    <span className="font-mono text-[10px] uppercase text-outline">Kongo Central Explorer</span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Progress Bar 1 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-amber-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Incontournables
                        </span>
                        <span className="font-mono">{categoryCounts.Incontournables} sites</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${totalLocations > 0 ? (categoryCounts.Incontournables / totalLocations) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Bar 2 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Nature & Cascades
                        </span>
                        <span className="font-mono">{categoryCounts.Nature} sites</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${totalLocations > 0 ? (categoryCounts.Nature / totalLocations) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Bar 3 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-orange-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span> Histoire & Culture
                        </span>
                        <span className="font-mono">{categoryCounts.Histoire} sites</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${totalLocations > 0 ? (categoryCounts.Histoire / totalLocations) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Bar 4 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-blue-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Patrimoine Urbain
                        </span>
                        <span className="font-mono">{categoryCounts.Urbain} sites</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${totalLocations > 0 ? (categoryCounts.Urbain / totalLocations) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions box */}
                <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-3xl text-white flex flex-col justify-between shadow-md">
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-white/80 text-3xl">offline_bolt</span>
                    <h4 className="font-sans text-headline-sm font-extrabold leading-tight">Actions Administrateur</h4>
                    <p className="text-white/80 text-xs leading-relaxed">
                      Publiez de nouveaux guides ou évaluez les contributions soumises par les voyageurs en temps réel.
                    </p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <button 
                      onClick={() => { setActiveTab("Locations"); setIsAddOpen(true); }}
                      className="w-full bg-white text-primary py-2.5 rounded-2xl font-sans text-xs font-bold shadow-md hover:bg-surface-container-lowest transition-all active:scale-95 cursor-pointer"
                    >
                      Ajouter une destination
                    </button>
                    <button 
                      onClick={() => setActiveTab("Contributions")}
                      className="w-full bg-white/10 border border-white/20 text-white py-2.5 rounded-2xl font-sans text-xs font-semibold hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
                    >
                      Examiner les fiches ({pendingContributions})
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Log & Tips */}
              <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 space-y-4">
                <h3 className="font-sans text-body-lg font-bold text-on-surface">Journal de Modération</h3>
                <div className="space-y-3.5">
                  <div className="flex gap-3 text-xs">
                    <span className="material-symbols-outlined text-emerald-600 flex-none">check_circle</span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-on-surface">Base de données synchronisée</p>
                      <p className="text-on-surface-variant font-medium">Les données locales et distantes s'exécutent de façon isolée et robuste.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs border-t border-outline-variant/10 pt-3">
                    <span className="material-symbols-outlined text-primary flex-none">info</span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-on-surface">Modération intelligente active</p>
                      <p className="text-on-surface-variant font-medium">Les fiches d'observation d'utilisateurs sont analysées à la volée par Gemini AI pour structurer le titre et le lieu.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATIONS LIST */}
          {activeTab === "Locations" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header inside Canvas */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="font-sans text-headline-sm font-bold text-on-surface font-bold">Répertoire officiel</h3>
                  <p className="text-on-surface-variant text-body-sm font-sans">Créez, modifiez ou masquez des destinations touristiques et écologiques.</p>
                </div>
                <button 
                  onClick={() => setIsAddOpen(true)}
                  className="bg-primary text-white px-5 py-2.5 rounded-full font-sans text-xs font-bold flex items-center gap-2 hover:bg-primary-container shadow-md self-start cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Ajouter une destination
                </button>
              </div>

              {/* Feed of current locations */}
              <div className="space-y-4">
                {filteredLocations.length === 0 ? (
                  <div className="bg-surface-container-low/40 rounded-3xl p-10 text-center border border-dashed border-outline-variant/35">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
                    <p className="text-on-surface-variant font-sans text-sm">Aucune destination ne correspond à votre recherche.</p>
                  </div>
                ) : (
                  filteredLocations.map((loc) => (
                    <div 
                      key={loc.id} 
                      className={`bg-surface-container-lowest border rounded-3xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all border-outline-variant/25 hover:border-primary/20 shadow-sm`}
                    >
                      <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-surface-container flex-none">
                          {loc.image ? (
                            <img 
                              className="w-full h-full object-cover" 
                              alt={loc.title} 
                              src={loc.image} 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                              <span className="material-symbols-outlined text-xl text-outline">image_not_supported</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-sans text-body-lg font-bold text-primary">{loc.title}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                            <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {loc.locationName}
                            </span>
                            <span className="text-[10px] font-mono text-outline font-bold uppercase bg-surface-container px-2 py-0.5 rounded-md">
                              {loc.category}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              loc.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {loc.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 self-stretch sm:self-center justify-end border-t sm:border-none pt-3 sm:pt-0">
                        <button 
                          onClick={() => handleEditClick(loc)}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span> Éditer
                        </button>
                        <button 
                          onClick={() => handleDelete(loc.id)}
                          className="px-4 py-2 border border-outline-variant/40 text-on-surface-variant hover:text-error hover:bg-error/10 hover:border-error rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span> Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: USER CONTRIBUTIONS / PENDING PERMITS */}
          {activeTab === "Contributions" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-outline-variant/20 pb-4">
                <h3 className="font-sans text-headline-sm font-bold text-on-surface font-bold">Contributions et Observations</h3>
                <p className="text-on-surface-variant text-body-sm font-sans">
                  Validez les observations soumises par les utilisateurs de l'application ou intégrez-les directement au catalogue.
                </p>
              </div>

              {pendingPermits.length === 0 ? (
                <div className="bg-surface-container-low/40 rounded-3xl p-12 text-center border border-dashed border-outline-variant/35">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">inbox</span>
                  <p className="text-on-surface-variant font-sans text-sm">Aucune contribution ou fiche utilisateur soumise pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingPermits.map((permit) => (
                    <div 
                      key={permit.id} 
                      className={`bg-surface-container-lowest border rounded-3xl p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all ${
                        permit.status === "PENDING" 
                          ? "border-amber-500/30 bg-amber-500/[0.01]" 
                          : permit.status === "VERIFICATION"
                          ? "border-blue-500/30 bg-blue-500/[0.01]"
                          : "border-outline-variant/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          permit.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : permit.status === "VERIFICATION"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          <span className="material-symbols-outlined text-2xl">
                            {permit.icon || "tour"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-sans text-body-lg font-bold text-on-surface leading-tight">
                            {permit.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                            {permit.subtitle}
                          </p>
                          
                          <div className="flex gap-2 items-center mt-2">
                            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              permit.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : permit.status === "VERIFICATION"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              Statut : {permit.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Control panel for each submission */}
                      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end border-t md:border-none pt-4 md:pt-0">
                        {permit.status !== "COMPLETED" && (
                          <button 
                            onClick={() => handlePromoteContribution(permit)}
                            className="px-4.5 py-2.5 bg-primary text-white rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 hover:bg-primary-container active:scale-95 transition-all shadow-sm cursor-pointer"
                            title="Publier cette fiche d'observation"
                          >
                            <span className="material-symbols-outlined text-[16px]">publish</span>
                            Intégrer au catalogue
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleTogglePermitStatus(permit)}
                          className="px-4.5 py-2.5 bg-surface-container-high text-on-surface-variant rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 hover:bg-surface-variant active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                          {permit.status === "PENDING" ? "Vérification" : permit.status === "VERIFICATION" ? "Valider directement" : "Re-traiter"}
                        </button>

                        <button 
                          onClick={() => handleRejectContribution(permit.id)}
                          className="px-4.5 py-2.5 border border-outline-variant hover:border-error hover:text-error hover:bg-error/10 text-outline rounded-xl font-sans text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          title="Supprimer la proposition"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUBDOMAIN MANAGEMENT */}
          {activeTab === "Subdomain" && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Status Card */}
              <div className="bg-surface-container-low rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[160px] text-primary">language</span>
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">public</span>
                        <h3 className="font-sans text-headline-sm font-bold text-on-surface">
                          Sous-Domaine Personnalisé
                        </h3>
                      </div>
                      <p className="font-sans text-body-sm text-on-surface-variant max-w-2xl">
                        Saisissez et enregistrez le sous-domaine personnalisé de votre portail Kongo Explorer dans Firestore. Vérification en temps réel des règles DNS et de la disponibilité.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {subdomainConfig?.status || "ACTIVE"} dans Firestore
                      </span>
                      {isFirebaseConfigured ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                          Firestore Connecté
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">storage</span>
                          Stockage Local Actif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Subdomain Overview Box */}
                  <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono font-bold text-outline uppercase tracking-wider">URL du Sous-Domaine Actif</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg md:text-xl font-bold text-primary break-all">
                          {subdomainConfig?.fullUrl || `https://${subdomainInput}.kongoexplorer.cd`}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono">
                        Dernière mise à jour : {subdomainConfig?.updatedAt ? new Date(subdomainConfig.updatedAt).toLocaleString("fr-FR") : "Aujourd'hui"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => copyToClipboard(subdomainConfig?.fullUrl || `https://${subdomainInput}.kongoexplorer.cd`)}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-outline-variant/20 transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedUrl ? "check_circle" : "content_copy"}
                        </span>
                        {copiedUrl ? "Copié !" : "Copier l'URL"}
                      </button>

                      <a
                        href={subdomainConfig?.fullUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none px-4 py-2.5 bg-primary text-white hover:bg-primary-container font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        Tester l'URL
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form & Realtime Validation Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Configuration Form */}
                <div className="lg:col-span-2 bg-surface-container-low rounded-3xl p-6 md:p-8 border border-outline-variant/20 space-y-6">
                  <div className="border-b border-outline-variant/10 pb-4">
                    <h4 className="font-sans text-title-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">edit_note</span>
                      Saisir un Nouveau Sous-Domaine
                    </h4>
                    <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                      Personnalisez le préfixe de votre adresse web. Le système appliquera automatiquement le formatage requis.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSubdomain} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold text-on-surface-variant">
                        Saisie du Sous-Domaine :
                      </label>
                      <div className="flex items-center bg-surface-container border-2 border-outline-variant/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl overflow-hidden transition-all p-1">
                        <span className="px-3 text-xs font-mono text-outline select-none font-bold bg-surface-container-high py-2.5 rounded-xl">
                          https://
                        </span>
                        <input
                          type="text"
                          value={subdomainInput}
                          onChange={(e) => {
                            setSubdomainInput(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                            setSubdomainFeedback(null);
                          }}
                          placeholder="mon-sous-domaine"
                          className="flex-1 bg-transparent px-3 py-2 font-mono text-sm md:text-base text-on-surface font-bold focus:outline-none"
                        />
                        <span className="px-3 text-xs font-mono text-primary font-bold select-none bg-primary/10 py-2.5 rounded-xl border border-primary/20">
                          .kongoexplorer.cd
                        </span>
                      </div>
                    </div>

                    {/* Live URL Preview */}
                    <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-outline">Aperçu direct de l'adresse :</span>
                      <span className="font-bold text-secondary truncate max-w-xs md:max-w-md">
                        https://{currentSubdomainValidation.normalized || "votre-choix"}.kongoexplorer.cd
                      </span>
                    </div>

                    {/* Realtime Validation Checklist */}
                    <div className="p-4 bg-surface-container/60 rounded-2xl border border-outline-variant/20 space-y-3">
                      <span className="text-xs font-mono font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">fact_check</span>
                        Règles de validation automatique :
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${subdomainInput.trim().length >= 3 && subdomainInput.trim().length <= 63 ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-surface-container text-on-surface-variant'}`}>
                          <span className={`material-symbols-outlined text-[16px] ${subdomainInput.trim().length >= 3 && subdomainInput.trim().length <= 63 ? 'text-emerald-600' : 'text-outline'}`}>
                            {subdomainInput.trim().length >= 3 && subdomainInput.trim().length <= 63 ? 'check_circle' : 'cancel'}
                          </span>
                          <span>3 à 63 caractères ({subdomainInput.trim().length} car.)</span>
                        </div>

                        <div className={`flex items-center gap-2 p-2 rounded-lg ${/^[a-z0-9-]+$/.test(subdomainInput.trim()) ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-surface-container text-on-surface-variant'}`}>
                          <span className={`material-symbols-outlined text-[16px] ${/^[a-z0-9-]+$/.test(subdomainInput.trim()) ? 'text-emerald-600' : 'text-outline'}`}>
                            {/^[a-z0-9-]+$/.test(subdomainInput.trim()) ? 'check_circle' : 'cancel'}
                          </span>
                          <span>Minuscules, chiffres et tirets</span>
                        </div>

                        <div className={`flex items-center gap-2 p-2 rounded-lg ${!subdomainInput.startsWith("-") && !subdomainInput.endsWith("-") && !subdomainInput.includes("--") ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-surface-container text-on-surface-variant'}`}>
                          <span className={`material-symbols-outlined text-[16px] ${!subdomainInput.startsWith("-") && !subdomainInput.endsWith("-") && !subdomainInput.includes("--") ? 'text-emerald-600' : 'text-outline'}`}>
                            {!subdomainInput.startsWith("-") && !subdomainInput.endsWith("-") && !subdomainInput.includes("--") ? 'check_circle' : 'cancel'}
                          </span>
                          <span>Pas de tiret en début/fin ni consécutif</span>
                        </div>

                        <div className={`flex items-center gap-2 p-2 rounded-lg ${!RESERVED_SUBDOMAINS.includes(subdomainInput.trim().toLowerCase()) ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-surface-container text-on-surface-variant'}`}>
                          <span className={`material-symbols-outlined text-[16px] ${!RESERVED_SUBDOMAINS.includes(subdomainInput.trim().toLowerCase()) ? 'text-emerald-600' : 'text-outline'}`}>
                            {!RESERVED_SUBDOMAINS.includes(subdomainInput.trim().toLowerCase()) ? 'check_circle' : 'cancel'}
                          </span>
                          <span>Non réservé par le système</span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Messages */}
                    {subdomainFeedback && (
                      <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-sans transition-all border ${
                        subdomainFeedback.type === "success" 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200" 
                          : subdomainFeedback.type === "error"
                          ? "bg-error/10 border-error/30 text-error"
                          : "bg-primary/10 border-primary/30 text-primary"
                      }`}>
                        <span className="material-symbols-outlined text-[20px] flex-none">
                          {subdomainFeedback.type === "success" ? "check_circle" : subdomainFeedback.type === "error" ? "warning" : "info"}
                        </span>
                        <div className="space-y-0.5">
                          <p className="font-bold">
                            {subdomainFeedback.type === "success" ? "Validation réussie" : subdomainFeedback.type === "error" ? "Erreur de sous-domaine" : "Information"}
                          </p>
                          <p>{subdomainFeedback.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleVerifySubdomain}
                        className="px-5 py-3 bg-surface-container-high hover:bg-surface-variant text-on-surface font-mono text-xs font-bold rounded-2xl flex items-center justify-center gap-2 border border-outline-variant/30 transition-all cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        Vérifier la validité
                      </button>

                      <button
                        type="submit"
                        disabled={isSubdomainSaving || !currentSubdomainValidation.isValid}
                        className={`flex-1 px-6 py-3 font-mono text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                          isSubdomainSaving || !currentSubdomainValidation.isValid
                            ? "bg-outline/30 text-outline cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary-container active:scale-95"
                        }`}
                      >
                        {isSubdomainSaving ? (
                          <>
                            <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                            Sauvegarde dans Firestore...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Enregistrer dans Firestore
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Side Info & DNS Panel */}
                <div className="space-y-6">
                  {/* Security & DNS Card */}
                  <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/20 space-y-4">
                    <h4 className="font-sans text-body-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">dns</span>
                      Enregistrements DNS
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Voici les redirections CNAME appliquées automatiquement dans la zone DNS globale :
                    </p>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 space-y-1">
                        <div className="flex justify-between text-outline text-[10px]">
                          <span>TYPE</span>
                          <span>HÔTE / NOM</span>
                        </div>
                        <div className="flex justify-between font-bold text-primary">
                          <span>CNAME</span>
                          <span>{subdomainConfig?.subdomain || "explore"}</span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate pt-1 border-t border-outline-variant/10">
                          Cible : <span className="text-secondary">ais-dev-fe2khec5btgm2wbcvmdjto.cloudrun.app</span>
                        </div>
                      </div>

                      <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 space-y-1">
                        <div className="flex justify-between text-outline text-[10px]">
                          <span>TYPE</span>
                          <span>VALEUR IP</span>
                        </div>
                        <div className="flex justify-between font-bold text-primary">
                          <span>A</span>
                          <span>130.50.0.64</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">lock</span>
                      <span>Certificat SSL/TLS 1.3 activé automatiquement.</span>
                    </div>
                  </div>

                  {/* History of Saved Subdomains */}
                  <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/20 space-y-4">
                    <h4 className="font-sans text-body-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                      Historique des Modifications
                    </h4>

                    <div className="space-y-3">
                      {subdomainHistory.map((item, idx) => (
                        <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-primary">{item.subdomain}.kongoexplorer.cd</span>
                            <p className="text-[10px] text-outline">{item.date}</p>
                          </div>
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEDICATED IMAGE UPLOADER */}
          {activeTab === "Images" && (
            <DedicatedImageUploader 
              locations={locations} 
              onUpdateLocation={onUpdateLocation} 
            />
          )}

          {/* TAB 6: CIRCUITS MANAGER */}
          {activeTab === "Circuits" && (
            <CircuitManager
              circuits={circuits}
              locations={locations}
              onSaveCircuit={onSaveCircuit}
              onAddCircuit={onAddCircuit}
              onDeleteCircuit={onDeleteCircuit}
            />
          )}

        </div>
      </main>

      {/* Edit Modal */}
      {editingLoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/30"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
              <h3 className="font-sans text-headline-sm font-bold text-primary">Modifier {editingLoc.title}</h3>
              <button 
                type="button" 
                onClick={() => setEditingLoc(null)}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container-high"
              >
                close
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold mb-1">Titre</label>
                <input 
                  type="text" 
                  value={editingLoc.title}
                  onChange={(e) => setEditingLoc({ ...editingLoc, title: e.target.value })}
                  className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold mb-1">Localisation (Ville)</label>
                <input 
                  type="text" 
                  value={editingLoc.locationName}
                  onChange={(e) => setEditingLoc({ ...editingLoc, locationName: e.target.value })}
                  className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Catégorie</label>
                  <select 
                    value={editingLoc.category}
                    onChange={(e) => setEditingLoc({ ...editingLoc, category: e.target.value as any })}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  >
                    <option value="Incontournables">Incontournables</option>
                    <option value="Nature">Nature</option>
                    <option value="Histoire">Histoire</option>
                    <option value="Urbain">Urbain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Statut</label>
                  <select 
                    value={editingLoc.status}
                    onChange={(e) => setEditingLoc({ ...editingLoc, status: e.target.value as any })}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="WAITING">WAITING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold mb-1">Description</label>
                <textarea 
                  value={editingLoc.description}
                  onChange={(e) => setEditingLoc({ ...editingLoc, description: e.target.value })}
                  className="w-full bg-surface-container p-4 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Latitude (GPS ex: -4.78)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={editingLoc.lat || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, lat: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Longitude (GPS ex: 14.35)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={editingLoc.lng || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, lng: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Effort de marche (%)</label>
                  <input 
                    type="number" 
                    value={editingLoc.cognitiveEffort || 50}
                    onChange={(e) => setEditingLoc({ ...editingLoc, cognitiveEffort: Number(e.target.value) })}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold mb-1 flex items-center gap-1 text-red-600">
                  <span className="material-symbols-outlined text-[15px]">play_circle</span>
                  Vidéo de la destination (Lien Web ou Fichier vidéo)
                </label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={editingLoc.videoUrl || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, videoUrl: e.target.value })}
                    placeholder="Lien YouTube, Vimeo, Dailymotion, Google Drive ou MP4..."
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-xl text-xs font-mono text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[15px]">upload_file</span>
                      <span>Charger un fichier vidéo (MP4/WebM)</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setEditingLoc({ ...editingLoc, videoUrl: evt.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editingLoc.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingLoc({ ...editingLoc, videoUrl: "" })}
                        className="text-xs text-red-500 font-mono hover:underline"
                      >
                        Effacer la vidéo
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Admin Video Preview */}
                {editingLoc.videoUrl && (
                  <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <p className="text-[11px] font-bold font-mono text-secondary mb-2">Aperçu vidéo en direct :</p>
                    <VideoPlayer 
                      videoUrl={editingLoc.videoUrl} 
                      title={editingLoc.title || "Aperçu vidéo"} 
                      posterImage={editingLoc.image}
                    />
                  </div>
                )}
              </div>

              <ImageUploader 
                value={editingLoc.image} 
                onChange={(url) => setEditingLoc({ ...editingLoc, image: url })} 
                label="Photo de la destination" 
              />
            </div>

            <div className="flex gap-4 pt-2 border-t border-outline-variant/10 pt-4">
              <button 
                type="button" 
                onClick={() => setEditingLoc(null)}
                className="flex-1 py-3 rounded-full border border-outline text-outline font-mono text-xs font-bold cursor-pointer hover:bg-surface-container-high transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-full bg-primary text-white font-mono text-xs font-bold cursor-pointer hover:bg-primary-container transition-all"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleAddSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/30"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
              <h3 className="font-sans text-headline-sm font-bold text-primary">Ajouter une fiche</h3>
              <button 
                type="button" 
                onClick={() => { setIsAddOpen(false); resetAddForm(); }}
                className="material-symbols-outlined text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container-high"
              >
                close
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold mb-1">Titre</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ruines de Banza Kongo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold mb-1">Localisation (Ville)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mbanza-Ngungu"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Catégorie</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  >
                    <option value="Incontournables">Incontournables</option>
                    <option value="Nature">Nature</option>
                    <option value="Histoire">Histoire</option>
                    <option value="Urbain">Urbain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Statut</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="WAITING">WAITING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold mb-1">Description</label>
                <textarea 
                  placeholder="Décrivez les attraits écologiques ou historiques de ce site..."
                  value={newDesc}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-surface-container p-4 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Latitude (GPS ex: -5.81)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    placeholder="-5.8144"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold mb-1">Longitude (GPS ex: 13.44)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    placeholder="13.4475"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold mb-1 flex items-center gap-1 text-red-600">
                  <span className="material-symbols-outlined text-[15px]">play_circle</span>
                  Vidéo de la destination (Lien Web ou Fichier vidéo)
                </label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="Lien YouTube, Vimeo, Dailymotion, Google Drive ou MP4..."
                    className="w-full bg-surface-container px-4 py-2 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-xl text-xs font-mono text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[15px]">upload_file</span>
                      <span>Charger un fichier vidéo (MP4/WebM)</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setNewVideoUrl(evt.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {newVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setNewVideoUrl("")}
                        className="text-xs text-red-500 font-mono hover:underline"
                      >
                        Effacer la vidéo
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Admin Video Preview */}
                {newVideoUrl && (
                  <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <p className="text-[11px] font-bold font-mono text-secondary mb-2">Aperçu vidéo en direct :</p>
                    <VideoPlayer 
                      videoUrl={newVideoUrl} 
                      title={newTitle || "Aperçu vidéo"} 
                      posterImage={newImage}
                    />
                  </div>
                )}
              </div>

              <ImageUploader 
                value={newImage} 
                onChange={setNewImage} 
                label="Photo de la destination" 
              />
            </div>

            <div className="flex gap-4 pt-2 border-t border-outline-variant/10 pt-4">
              <button 
                type="button" 
                onClick={() => { setIsAddOpen(false); resetAddForm(); }}
                className="flex-1 py-3 rounded-full border border-outline text-outline font-mono text-xs font-bold cursor-pointer hover:bg-surface-container-high transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-full bg-primary text-white font-mono text-xs font-bold cursor-pointer hover:bg-primary-container transition-all"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
