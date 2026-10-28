import React, { useState, useMemo } from "react";
import { TourismPost, TourismReport, TourismCategory } from "../types";

interface TourismModerationViewProps {
  posts: TourismPost[];
  reports?: TourismReport[];
  onValidatePost?: (id: string) => void | Promise<void>;
  onRejectPost?: (id: string, reason: string) => void | Promise<void>;
  onUpdatePost?: (post: TourismPost) => void | Promise<void>;
  onDeletePost?: (id: string) => void | Promise<void>;
  onResolveReport?: (reportId: string) => void | Promise<void>;
}

const CATEGORIES: TourismCategory[] = [
  "Lieu à visiter",
  "Événement",
  "Hébergement",
  "Restaurant",
  "Conseil pratique",
  "Transport",
];

export default function TourismModerationView({
  posts,
  reports,
  onValidatePost,
  onRejectPost,
  onUpdatePost,
  onDeletePost,
  onResolveReport,
}: TourismModerationViewProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "validated" | "rejected" | "reported">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Refusal (Reason is MANDATORY)
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Modal State for Editing a post
  const [editingPost, setEditingPost] = useState<TourismPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<TourismCategory>("Lieu à visiter");
  const [editLocation, setEditLocation] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Preview / Lightbox
  const [previewingPost, setPreviewingPost] = useState<TourismPost | null>(null);

  // Filtered lists
  const pendingPosts = useMemo(
    () => posts.filter((p) => String(p.status).toLowerCase() === "pending"),
    [posts]
  );
  const validatedPosts = useMemo(
    () => posts.filter((p) => String(p.status).toLowerCase() === "validated"),
    [posts]
  );
  const rejectedPosts = useMemo(
    () => posts.filter((p) => String(p.status).toLowerCase() === "rejected"),
    [posts]
  );
  const pendingReports = useMemo(
    () => reports.filter((r) => r.status === "pending"),
    [reports]
  );

  const displayedPosts = useMemo(() => {
    let list: TourismPost[] = [];
    if (activeTab === "pending") list = pendingPosts;
    else if (activeTab === "validated") list = validatedPosts;
    else if (activeTab === "rejected") list = rejectedPosts;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [activeTab, pendingPosts, validatedPosts, rejectedPosts, searchQuery]);

  // Open Rejection Dialog
  const handleOpenReject = (postId: string) => {
    setRejectingPostId(postId);
    setRejectionReasonInput("");
    setRejectionError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReasonInput.trim()) {
      setRejectionError("Le motif de refus est obligatoire pour informer l'auteur.");
      return;
    }
    if (!rejectingPostId) return;

    setIsSubmittingRejection(true);
    try {
      await onRejectPost?.(rejectingPostId, rejectionReasonInput.trim());
      setRejectingPostId(null);
      setRejectionReasonInput("");
    } catch (err: any) {
      setRejectionError(err?.message || "Erreur lors du refus de la publication.");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (post: TourismPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditCategory(post.category);
    setEditLocation(post.location);
    setEditContent(post.content);
    setEditPhone(post.contactPhone || "");
    setEditPrice(post.priceRange || "");
  };

  const handleConfirmEdit = async () => {
    if (!editingPost) return;
    setIsSubmittingEdit(true);
    try {
      await onUpdatePost?.({
        ...editingPost,
        title: editTitle.trim(),
        category: editCategory,
        location: editLocation.trim(),
        content: editContent.trim(),
        summary: editContent.trim().slice(0, 150) + (editContent.length > 150 ? "..." : ""),
        contactPhone: editPhone.trim() || undefined,
        priceRange: editPrice.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      setEditingPost(null);
    } catch (err: any) {
      alert("Erreur lors de la modification : " + err?.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteWithConfirm = async (post: TourismPost) => {
    if (window.confirm(`Confirmer la suppression définitive de : "${post.title}" ?`)) {
      await onDeletePost?.(post.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
            <h2 className="text-xl font-bold font-serif text-on-surface">Modération Tourisme</h2>
          </div>
          <p className="text-xs text-on-surface-variant max-w-xl">
            Validez, refusez avec motif explicatif ou modifiez les publications et signalements de la communauté.
          </p>
        </div>

        {/* Global Statistics Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingPosts.length} en attente
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {validatedPosts.length} validées
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {pendingReports.length} signalement{pendingReports.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>En attente ({pendingPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("validated")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "validated"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Validées ({validatedPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            <span>Refusées ({rejectedPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reported")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "reported"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">flag</span>
            <span>Signalées ({pendingReports.length})</span>
          </button>
        </div>

        {/* Search bar inside active tab */}
        {activeTab !== "reported" && (
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, lieu..."
              className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-surface-container border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-on-surface"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === "reported" ? (
        /* Reports tab */
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/20 p-8">
              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">
                verified
              </span>
              <h3 className="font-bold text-sm text-on-surface">Aucun signalement en attente</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                La communauté n'a signalé aucun contenu abusif pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingReports.map((report) => {
                const targetPost = posts.find((p) => p.id === report.postId);

                return (
                  <div
                    key={report.id}
                    className="p-5 rounded-3xl bg-surface-container-lowest border border-rose-500/30 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                        <span className="material-symbols-outlined text-[18px]">flag</span>
                        <span>Motif : {report.reason}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant">
                        Signalé le {new Date(report.reportedAt).toLocaleDateString("fr-FR")} par {report.reportedByEmail || "Anonyme"}
                      </span>
                    </div>

                    {report.details && (
                      <div className="p-3 rounded-2xl bg-rose-500/5 text-xs text-on-surface border border-rose-500/10 italic">
                        « {report.details} »
                      </div>
                    )}

                    {targetPost ? (
                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-start gap-4">
                        <img
                          src={targetPost.photo || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=300"}
                          alt={targetPost.title}
                          className="w-24 h-24 rounded-2xl object-cover border border-outline-variant/20"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-primary">
                              {targetPost.category}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              • {targetPost.location}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              • Par {targetPost.author}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-on-surface line-clamp-1">
                            {targetPost.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant line-clamp-2">
                            {targetPost.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant italic">
                        La publication ciblée ({report.postId}) n'existe plus ou a été supprimée.
                      </p>
                    )}

                    {/* Report actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {targetPost && (
                        <>
                          <button
                            onClick={() => handleOpenReject(targetPost.id)}
                            className="px-3.5 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            <span>Refuser la publication</span>
                          </button>
                          <button
                            onClick={() => handleDeleteWithConfirm(targetPost)}
                            className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Supprimer</span>
                          </button>
                        </>
                      )}
                      {onResolveReport && (
                        <button
                          onClick={() => onResolveReport(report.id)}
                          className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">done_all</span>
                          <span>Marquer comme traité</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Posts list tabs (Pending / Validated / Rejected) */
        <div className="space-y-4">
          {displayedPosts.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/20 p-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
                content_paste_off
              </span>
              <h3 className="font-bold text-sm text-on-surface">Aucune publication dans cette catégorie</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
                {activeTab === "pending"
                  ? "Toutes les propositions soumises ont été modérées."
                  : "Aucun résultat ne correspond à votre recherche."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col lg:flex-row gap-5 items-start justify-between hover:border-primary/40 transition-all"
                >
                  {/* Photo & details */}
                  <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
                    <div className="relative w-full sm:w-44 h-36 rounded-2xl overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-black/10">
                      <img
                        src={post.photo || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600"}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      {post.gallery && post.gallery.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">photo_library</span>
                          {post.gallery.length}
                        </span>
                      )}
                      <button
                        onClick={() => setPreviewingPost(post)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center cursor-pointer"
                        title="Aperçu grand format"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                          {post.category}
                        </span>
                        <span className="text-xs text-on-surface-variant flex items-center gap-0.5 font-semibold">
                          <span className="material-symbols-outlined text-[14px] text-amber-500">location_on</span>
                          {post.location}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          • Soumis le {post.date}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          • Auteur : <strong>{post.author}</strong> ({post.authorEmail || "email non renseigné"})
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-on-surface tracking-tight">
                        {post.title}
                      </h3>

                      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Practical info badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-on-surface-variant">
                        {post.contactPhone && (
                          <span className="px-2 py-0.5 rounded-lg bg-surface-container flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">call</span>
                            {post.contactPhone}
                          </span>
                        )}
                        {post.priceRange && (
                          <span className="px-2 py-0.5 rounded-lg bg-surface-container flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">payments</span>
                            {post.priceRange}
                          </span>
                        )}
                      </div>

                      {/* If rejected, show reason */}
                      {String(post.status).toLowerCase() === "rejected" && post.rejectionReason && (
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                          <strong className="block font-bold">Motif du refus notifié à l'auteur :</strong>
                          <p className="italic mt-0.5">« {post.rejectionReason} »</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex sm:flex-col items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 lg:border-l border-outline-variant/30 pt-3 lg:pt-0 lg:pl-5 flex-shrink-0">
                    {/* Validate button */}
                    {String(post.status).toLowerCase() !== "validated" && (
                      <button
                        onClick={() => onValidatePost?.(post.id)}
                        className="w-full sm:w-36 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Valider</span>
                      </button>
                    )}

                    {/* Reject button (forces reason) */}
                    {String(post.status).toLowerCase() !== "rejected" && (
                      <button
                        onClick={() => handleOpenReject(post.id)}
                        className="w-full sm:w-36 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Refuser...</span>
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(post)}
                      className="w-full sm:w-36 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Modifier</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteWithConfirm(post)}
                      className="w-full sm:w-36 py-2 px-3 rounded-xl hover:bg-rose-500/10 text-rose-600 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal with MANDATORY reason */}
      {rejectingPostId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setRejectingPostId(null)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden text-on-surface p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-600">
              <span className="material-symbols-outlined text-2xl">cancel</span>
              <h3 className="font-serif font-bold text-base">Refuser la publication</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              Veuillez indiquer le motif du refus. Ce message sera transmis à l'auteur pour lui expliquer comment corriger sa proposition.
            </p>

            {rejectionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs">
                {rejectionError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Motif obligatoire *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Ex: Photo floue, informations insuffisantes, tarif non mentionné ou contenu non conforme aux critères du guide..."
                className="w-full p-3 rounded-2xl bg-surface-container-high border border-outline-variant/40 focus:border-rose-500 focus:outline-none text-xs text-on-surface resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingRejection}
                onClick={() => setRejectingPostId(null)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmittingRejection || !rejectionReasonInput.trim()}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRejection ? "Enregistrement..." : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditingPost(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] flex flex-col bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <h3 className="font-serif font-bold text-base">Modifier la publication</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="w-8 h-8 rounded-full bg-surface-variant/40 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Titre *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Catégorie *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as TourismCategory)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Lieu *
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Description *
                </label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Tarif
                  </label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-end gap-2 bg-surface-container-low">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Annuler
              </button>
              <button
                disabled={isSubmittingEdit}
                onClick={handleConfirmEdit}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary/95"
              >
                {isSubmittingEdit ? "Enregistrement..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Lightbox */}
      {previewingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewingPost(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-black">
              <img
                src={previewingPost.photo}
                alt={previewingPost.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setPreviewingPost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold text-xs uppercase">
                  {previewingPost.category}
                </span>
                <span className="text-xs text-on-surface-variant">
                  • {previewingPost.location}
                </span>
                <span className="text-xs text-on-surface-variant">
                  • {previewingPost.date}
                </span>
              </div>
              <h3 className="text-lg font-bold font-serif">{previewingPost.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                {previewingPost.content}
              </p>
              {previewingPost.gallery && previewingPost.gallery.length > 1 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-on-surface-variant block mb-2">
                    Galerie ({previewingPost.gallery.length} photos) :
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {previewingPost.gallery.map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt={`Photo ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-outline-variant/30"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
