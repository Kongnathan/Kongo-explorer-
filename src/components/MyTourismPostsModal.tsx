import React from "react";
import { TourismPost } from "../types";

interface MyTourismPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: TourismPost[];
  onOpenCreate: () => void;
  onSelectPost: (id: string) => void;
}

export default function MyTourismPostsModal({
  isOpen,
  onClose,
  posts,
  onOpenCreate,
  onSelectPost,
}: MyTourismPostsModalProps) {
  if (!isOpen) return null;

  const getStatusBadge = (status: TourismPost["status"], rejectionReason?: string) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case "validated":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Validée (Publiée)
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            Refusée
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            En attente de validation
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">folder_shared</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">Mes Publications</h3>
              <p className="text-[11px] text-on-surface-variant">
                Suivez l'état de validation de vos propositions touristiques
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-variant/40 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {posts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl">post_add</span>
              </div>
              <h4 className="font-bold text-sm">Aucune publication pour l'instant</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Vous n'avez pas encore proposé de lieu, événement ou bonne adresse au Kongo Central.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreate();
                }}
                className="mt-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/95 cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Proposer une publication</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border border-outline-variant/40 bg-surface hover:border-primary/50 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <img
                      src={post.photo || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=300"}
                      alt={post.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-outline-variant/30"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          {post.location}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          • {post.date}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                        {post.title}
                      </h4>
                      <div className="pt-1">
                        {getStatusBadge(post.status, post.rejectionReason)}
                      </div>

                      {/* Display reason if rejected */}
                      {String(post.status).toLowerCase() === "rejected" && post.rejectionReason && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] space-y-0.5">
                          <strong className="block font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            Motif du refus des modérateurs :
                          </strong>
                          <p className="italic">« {post.rejectionReason} »</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {String(post.status).toLowerCase() === "validated" && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectPost(post.id);
                      }}
                      className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <span>Voir la fiche</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low/60">
          <span className="text-xs text-on-surface-variant font-medium">
            {posts.length} publication{posts.length > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenCreate();
            }}
            className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nouvelle publication</span>
          </button>
        </div>
      </div>
    </div>
  );
}
