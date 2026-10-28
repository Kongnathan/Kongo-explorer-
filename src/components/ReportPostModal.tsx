import React, { useState } from "react";
import { TourismPost } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface ReportPostModalProps {
  post: TourismPost | null;
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}

const REPORT_REASONS = [
  "Informations fausses ou trompeuses",
  "Contenu inapproprié ou offensant",
  "Spam, publicité ou arnaque",
  "Lieu fermé, inexistant ou inaccessible",
  "Tarifs ou horaires erronés",
  "Violation de droits d'auteur sur les photos",
  "Autre motif",
];

export default function ReportPostModal({
  post,
  isOpen,
  onClose,
  onReported,
}: ReportPostModalProps) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await addDoc(collection(db, "reports"), {
        postId: post.id,
        postTitle: post.title,
        postCategory: post.category,
        postLocation: post.location,
        reason,
        details: details.trim() || undefined,
        reportedBy: currentUser?.uid || "visiteur_anonyme",
        reportedByEmail: currentUser?.email || "anonyme",
        reportedAt: new Date().toISOString(),
        status: "pending",
      });

      setSuccess(true);
      if (onReported) onReported();
      setTimeout(() => {
        setSuccess(false);
        setDetails("");
        setSubmitting(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("[Report] Error sending report:", err);
      setErrorMsg("Impossible d'envoyer le signalement. Merci de réessayer.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <span className="material-symbols-outlined text-[22px]">flag</span>
            <h3 className="font-serif font-bold text-base">Signaler cette publication</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-variant/40 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-surface-container text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Publication concernée
            </span>
            <p className="font-bold text-on-surface line-clamp-1">{post.title}</p>
            <span className="text-[11px] text-on-surface-variant block">
              {post.category} • {post.location}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 text-emerald-600">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
              <h4 className="font-bold text-sm">Signalement transmis</h4>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Merci pour votre contribution. Notre équipe de modération va examiner cette publication.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Motif du signalement *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-rose-500 focus:outline-none text-xs text-on-surface cursor-pointer"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Précisions complémentaires (facultatif)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Donnez plus de détails pour aider l'équipe de modération..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-rose-500 focus:outline-none text-xs text-on-surface resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Envoyer le signalement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
