import React, { useState } from "react";
import { TourismPost, TourismCategory } from "../types";

interface TourismPostsManagerProps {
  posts: TourismPost[];
  onAddPost: (post: TourismPost) => void;
  onUpdatePost: (post: TourismPost) => void;
  onDeletePost: (id: string) => void;
}

const CATEGORIES: TourismCategory[] = [
  "Lieu à visiter",
  "Événement",
  "Hébergement",
  "Restaurant",
  "Conseil pratique",
  "Transport",
];

export default function TourismPostsManager({
  posts,
  onAddPost,
  onUpdatePost,
  onDeletePost,
}: TourismPostsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALIDATED" | "PENDING" | "REJECTED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<TourismPost | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<TourismCategory>("Lieu à visiter");
  const [formLocation, setFormLocation] = useState("");
  const [formAuthor, setFormAuthor] = useState("Office du Tourisme Kongo Central");
  const [formDate, setFormDate] = useState(() =>
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  );
  const [formPhoto, setFormPhoto] = useState("");
  const [formGalleryText, setFormGalleryText] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formStatus, setFormStatus] = useState<"VALIDATED" | "PENDING" | "REJECTED">("VALIDATED");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formPriceRange, setFormPriceRange] = useState("");

  const handleOpenAdd = () => {
    setEditingPost(null);
    setFormTitle("");
    setFormCategory("Lieu à visiter");
    setFormLocation("");
    setFormAuthor("Office du Tourisme Kongo Central");
    setFormDate(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
    setFormPhoto("");
    setFormGalleryText("");
    setFormSummary("");
    setFormContent("");
    setFormStatus("VALIDATED");
    setFormContactPhone("");
    setFormPriceRange("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: TourismPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormCategory(post.category);
    setFormLocation(post.location);
    setFormAuthor(post.author);
    setFormDate(post.date);
    setFormPhoto(post.photo);
    setFormGalleryText(post.gallery ? post.gallery.join("\n") : "");
    setFormSummary(post.summary);
    setFormContent(post.content);
    setFormStatus(post.status);
    setFormContactPhone(post.contactPhone || "");
    setFormPriceRange(post.priceRange || "");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formLocation.trim() || !formContent.trim()) {
      alert("Veuillez remplir au moins le titre, le lieu et le contenu.");
      return;
    }

    const fallbackPhoto =
      formPhoto.trim() ||
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80";

    const galleryUrls = formGalleryText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http") || s.startsWith("data:"));

    if (!galleryUrls.includes(fallbackPhoto)) {
      galleryUrls.unshift(fallbackPhoto);
    }

    if (editingPost) {
      const updated: TourismPost = {
        ...editingPost,
        title: formTitle.trim(),
        category: formCategory,
        location: formLocation.trim(),
        author: formAuthor.trim(),
        date: formDate.trim(),
        photo: fallbackPhoto,
        gallery: galleryUrls,
        summary: formSummary.trim() || formContent.slice(0, 140) + "...",
        content: formContent.trim(),
        status: formStatus,
        contactPhone: formContactPhone.trim() || undefined,
        priceRange: formPriceRange.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdatePost(updated);
    } else {
      const newPost: TourismPost = {
        id: `post-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        location: formLocation.trim(),
        author: formAuthor.trim(),
        date: formDate.trim(),
        photo: fallbackPhoto,
        gallery: galleryUrls,
        summary: formSummary.trim() || formContent.slice(0, 140) + "...",
        content: formContent.trim(),
        status: formStatus,
        contactPhone: formContactPhone.trim() || undefined,
        priceRange: formPriceRange.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddPost(newPost);
    }

    setIsModalOpen(false);
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: TourismPost["status"]) => {
    switch (status) {
      case "VALIDATED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Validée (Publique)
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            En attente
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Rejetée
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-on-surface">
            Gestion des Publications "Infos Tourisme"
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Ajoutez, validez ou modérez les actualités, événements et bonnes adresses visibles sur la page publique.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Nouvelle Publication
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-2">
          {(["ALL", "VALIDATED", "PENDING", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container hover:bg-surface-variant text-on-surface-variant"
              }`}
            >
              {st === "ALL" && `Toutes (${posts.length})`}
              {st === "VALIDATED" && `Validées (${posts.filter((p) => p.status === "VALIDATED").length})`}
              {st === "PENDING" && `En attente (${posts.filter((p) => p.status === "PENDING").length})`}
              {st === "REJECTED" && `Rejetées (${posts.filter((p) => p.status === "REJECTED").length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, ville..."
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
      </div>

      {/* Posts List / Table */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-40 block mb-2">
              post_add
            </span>
            <p className="text-xs text-on-surface-variant">Aucune publication trouvée dans cette section.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-wrap md:flex-nowrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <img
                  src={post.photo}
                  alt={post.title}
                  className="w-16 h-14 rounded-xl object-cover flex-shrink-0 bg-neutral-900 shadow-xs"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                      {post.category}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">pin_drop</span>
                      {post.location}
                    </span>
                    <span className="text-[11px] text-on-surface-variant/80">• {post.date}</span>
                    {getStatusBadge(post.status)}
                  </div>
                  <h4 className="font-sans text-sm font-bold text-on-surface truncate">
                    {post.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
                    {post.summary}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status Toggle Quick Action */}
                {post.status !== "VALIDATED" ? (
                  <button
                    onClick={() => onUpdatePost({ ...post, status: "VALIDATED" })}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                    title="Valider la publication pour affichage public"
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Valider
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdatePost({ ...post, status: "REJECTED" })}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer transition-all"
                    title="Rejeter / Masquer du public"
                  >
                    <span className="material-symbols-outlined text-[14px]">block</span>
                    Masquer
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(post)}
                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface transition-all cursor-pointer"
                  title="Modifier"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Confirmez-vous la suppression de « ${post.title} » ?`)) {
                      onDeletePost(post.id);
                    }
                  }}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                  title="Supprimer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-outline-variant/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-on-surface">
                {editingPost ? "Modifier la Publication" : "Nouvelle Publication Tourisme"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Title */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Titre de la publication *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Rénovation du Baobab historique de Stanley"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Catégorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TourismCategory)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface font-semibold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Lieu / Ville *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ex: Boma, Matadi, Zongo, Muanda..."
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              {/* Author & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Auteur / Source *</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Date affichée *</label>
                  <input
                    type="text"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              {/* Photo & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">URL Photo Principale</label>
                  <input
                    type="url"
                    value={formPhoto}
                    onChange={(e) => setFormPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Statut de validation *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface font-bold"
                  >
                    <option value="VALIDATED">VALIDÉE (Visible sur le site public)</option>
                    <option value="PENDING">EN ATTENTE (Brouillon)</option>
                    <option value="REJECTED">REJETÉE (Masquée)</option>
                  </select>
                </div>
              </div>

              {/* Extra photos for gallery */}
              <div>
                <label className="block font-bold text-on-surface mb-1">
                  Galerie Photos supplémentaires (1 URL par ligne)
                </label>
                <textarea
                  rows={2}
                  value={formGalleryText}
                  onChange={(e) => setFormGalleryText(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1...&#10;https://images.unsplash.com/photo-2..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 focus:outline-none focus:border-primary text-on-surface font-mono text-[11px]"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Résumé court (accroche)</label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Bref résumé accrocheur pour la carte..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Contenu complet de l'article *</label>
                <textarea
                  rows={5}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Rédigez ici le texte détaillé de la publication..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              {/* Optional Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Téléphone / WhatsApp (Facultatif)</label>
                  <input
                    type="text"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="+243..."
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Tarif / Budget indicatif (Facultatif)</label>
                  <input
                    type="text"
                    value={formPriceRange}
                    onChange={(e) => setFormPriceRange(e.target.value)}
                    placeholder="Ex: Entrée 5$ / À partir de 40$"
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-bold hover:bg-surface-container"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  {editingPost ? "Enregistrer les modifications" : "Publier l'actualité"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
