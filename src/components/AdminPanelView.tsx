import React, { useState } from "react";
import { Location } from "../types";

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
          alert("Échec de l'upload de l'image.");
        }
      } catch (err) {
        console.error(err);
        alert("Erreur réseau lors de l'upload.");
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
              <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
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
          Hébergement d'images permanent :
        </span>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          Les images téléversées localement sont temporaires sur ce serveur de développement. Pour un affichage permanent de vos propres photos, utilisez des services d'hébergement gratuits :
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono font-bold text-secondary">
          <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">open_in_new</span> ImgBB.com
          </a>
          <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">open_in_new</span> Postimages.org
          </a>
          <a href="https://imgur.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">open_in_new</span> Imgur.com
          </a>
        </div>
        <p className="text-[9px] text-outline italic leading-tight">
          Astuce : Copiez le <strong>"Lien direct"</strong> (qui se termine par .jpg, .png ou .webp) et collez-le dans le champ "URL" ci-dessus pour qu'il soit sauvegardé de manière permanente dans la base de données.
        </p>
      </div>
    </div>
  );
}

interface AdminPanelViewProps {
  locations: Location[];
  onAddLocation: (loc: Location) => void;
  onUpdateLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
  onLogout: () => void;
}

export default function AdminPanelView({
  locations,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onLogout
}: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState("Locations");
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Location form states
  const [newTitle, setNewTitle] = useState("");
  const [newLocName, setNewLocName] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Incontournables");
  const [newDesc, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newStatus, setNewStatus] = useState<any>("PUBLISHED");
  const [newLat, setNewLat] = useState<string>("");
  const [newLng, setNewLng] = useState<string>("");

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

    const newLoc: Partial<Location> = {
      title: newTitle,
      locationName: newLocName || "Kongo Central",
      category: newCategory,
      description: newDesc,
      status: newStatus,
      image: newImage || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
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
      onAddLocation(newLoc as Location);
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

  const filteredLocations = locations.filter(loc => 
    loc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    loc.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col md:flex-row relative">
      {/* Navigation Drawer (SideNav) */}
      <aside className="bg-surface-container-low w-full md:w-72 shadow-sm flex flex-col md:fixed md:inset-y-0 md:left-0 z-30 h-auto md:h-full">
        <div className="p-6 flex flex-col gap-1">
          <h1 className="font-sans text-headline-md font-bold text-primary">Admin Panel</h1>
          <p className="font-mono text-label-sm text-on-surface-variant opacity-75">Kongo Explorer</p>
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
            <span>Tableau de bord</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("Locations")}
            className={`w-[calc(100%-16px)] flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all font-sans text-body-md text-left cursor-pointer ${
              activeTab === "Locations"
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] fill">map</span>
            <span>Destinations</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden flex-none">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Admin profile" 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" 
                />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-body-md font-bold text-on-surface">Conservateur</span>
                <span className="font-mono text-label-sm text-on-surface-variant">Admin</span>
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
        <header className="sticky top-0 w-full z-20 flex justify-between items-center px-6 h-16 bg-surface border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <h2 className="font-sans text-headline-md font-bold text-primary font-bold">Gérer les Fiches</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-container rounded-full pl-10 pr-4 py-1.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary w-44 md:w-64"
              />
              <span className="material-symbols-outlined text-outline absolute left-3 top-2 text-[18px]">search</span>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Quick Stats Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-2 border border-outline-variant/15">
              <span className="material-symbols-outlined text-primary text-2xl fill">pin_drop</span>
              <span className="text-3xl font-bold text-primary font-sans">{locations.length}</span>
              <span className="font-sans text-xs text-on-surface-variant font-semibold">Fiches Patrimoine Actives</span>
            </div>
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-2 border border-outline-variant/15">
              <span className="material-symbols-outlined text-secondary text-2xl fill">verified_user</span>
              <span className="text-3xl font-bold text-secondary font-sans">100%</span>
              <span className="font-sans text-xs text-on-surface-variant font-semibold">Taux de contribution validé</span>
            </div>
          </section>

          {/* Locations List Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-outline-variant/20 pb-4">
            <div>
              <h3 className="font-sans text-headline-md font-bold text-on-surface font-bold">Répertoire Kongo Explorer</h3>
              <p className="text-on-surface-variant text-body-md font-sans">Créez et éditez les guides d'exploration culturelle et géographique.</p>
            </div>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-full font-sans text-body-md font-bold flex items-center gap-2 hover:bg-primary-container shadow-md self-start"
            >
              <span className="material-symbols-outlined">add</span> Ajouter un site
            </button>
          </div>

          {/* Locations Dynamic Feed */}
          <div className="space-y-6">
            {filteredLocations.map((loc) => (
              <div 
                key={loc.id} 
                className={`bg-surface-container-lowest border rounded-3xl p-6 flex flex-col lg:flex-row gap-6 items-start transition-all ${
                  loc.status === "WAITING" ? "border-dashed border-outline-variant bg-surface-container-low/40" : "border-outline-variant/30"
                }`}
              >
                <div className="w-full lg:w-72 h-44 rounded-2xl overflow-hidden relative group flex-none">
                  {loc.image ? (
                    <img 
                      className="w-full h-full object-cover" 
                      alt={loc.title} 
                      src={loc.image} 
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline">image_not_supported</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-sans text-headline-md font-bold text-primary font-bold">{loc.title}</h4>
                      <p className="text-on-surface-variant font-sans text-sm mt-1 leading-relaxed">{loc.description || "Aucune description."}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed`}>
                      {loc.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl">
                      <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                      <span className="font-sans text-xs font-semibold">{loc.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl">
                      <span className="material-symbols-outlined text-sm text-secondary">category</span>
                      <span className="font-sans text-xs font-bold">{loc.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full lg:w-auto self-stretch lg:self-center justify-center">
                  <button 
                    onClick={() => handleEditClick(loc)}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 transition-all hover:shadow-md active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span> Éditer
                  </button>
                  <button 
                    onClick={() => handleDelete(loc.id)}
                    className="px-6 py-3 border border-outline text-outline rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error hover:border-error transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingLoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/30"
          >
            <h3 className="font-sans text-headline-sm font-bold text-primary font-bold">Modifier {editingLoc.title}</h3>
            
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
                <label className="block text-xs font-mono font-bold mb-1">Localisation</label>
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

              <ImageUploader 
                value={editingLoc.image} 
                onChange={(url) => setEditingLoc({ ...editingLoc, image: url })} 
                label="Photo de la destination (Uploader / Drag & Drop)" 
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button" 
                onClick={() => setEditingLoc(null)}
                className="flex-1 py-3 rounded-full border border-outline text-outline font-mono text-label-md cursor-pointer hover:bg-surface-container-high"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-full bg-primary text-white font-mono text-label-md font-bold cursor-pointer hover:bg-primary-container"
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
            <h3 className="font-sans text-headline-sm font-bold text-primary font-bold">Ajouter une fiche</h3>
            
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

              <ImageUploader 
                value={newImage} 
                onChange={setNewImage} 
                label="Photo de la destination (Uploader / Drag & Drop)" 
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAddOpen(false)}
                className="flex-1 py-3 rounded-full border border-outline text-outline font-mono text-label-md cursor-pointer hover:bg-surface-container-high"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-full bg-primary text-white font-mono text-label-md font-bold cursor-pointer hover:bg-primary-container"
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
