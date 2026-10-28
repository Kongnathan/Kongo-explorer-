import React, { useState, useMemo } from "react";
import { TourismCategory, TourismPost } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { uploadTourismImage } from "../lib/imageCompression";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface CreateTourismPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: TourismPost) => void;
  userPostsTodayCount: number;
}

const CATEGORIES: TourismCategory[] = [
  "Lieu à visiter",
  "Événement",
  "Hébergement",
  "Restaurant",
  "Conseil pratique",
  "Transport",
];

const SUGGESTED_LOCATIONS = [
  "Matadi",
  "Boma",
  "Muanda",
  "Zongo",
  "Kisantu",
  "Mbanza-Ngungu",
  "Luozi",
  "Inga",
  "Kimpese",
  "Kasangulu",
];

export default function CreateTourismPostModal({
  isOpen,
  onClose,
  onPostCreated,
  userPostsTodayCount,
}: CreateTourismPostModalProps) {
  const { currentUser, userProfile } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TourismCategory>("Lieu à visiter");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [priceRange, setPriceRange] = useState("");

  // Photo management (1 to 5 photos)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isDailyLimitReached = userPostsTodayCount >= 5;

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: File[] = Array.from(e.target.files);

    if (selectedFiles.length + newFiles.length > 5) {
      setErrorMsg("Vous pouvez ajouter jusqu'à 5 photos maximum par publication.");
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const f of newFiles) {
      if (!f.type.startsWith("image/")) {
        setErrorMsg("Seuls les formats d'image (JPEG, PNG, WEBP) sont acceptés.");
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...validPreviews]);
    setErrorMsg(null);
  };

  const removePhoto = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg("Vous devez être connecté pour publier.");
      return;
    }

    if (isDailyLimitReached) {
      setErrorMsg("Limite atteinte : vous ne pouvez publier que 5 informations par jour.");
      return;
    }

    if (title.trim().length < 5) {
      setErrorMsg("Le titre doit comporter au moins 5 caractères.");
      return;
    }

    if (!location.trim()) {
      setErrorMsg("Veuillez renseigner le lieu ou la ville.");
      return;
    }

    if (content.trim().length < 15) {
      setErrorMsg("Veuillez rédiger une description détaillée d'au moins 15 caractères.");
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg("Veuillez joindre au moins une photo pour illustrer votre publication.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      // 1. Upload photos sequentially with client-side compression
      const uploadedUrls: string[] = [];
      const total = selectedFiles.length;

      for (let i = 0; i < total; i++) {
        const file = selectedFiles[i];
        const url = await uploadTourismImage(file, currentUser.uid, (p) => {
          const overall = Math.round(((i + p / 100) / total) * 80) + 10;
          setUploadProgress(overall);
        });
        uploadedUrls.push(url);
      }

      setUploadProgress(95);

      // 2. Prepare post document conforming to requirements:
      // status strictly forced to "pending", authorId = user.uid
      const now = new Date();
      const frenchDate = now.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const authorName =
        userProfile?.displayName ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Auteur Voyageur";

      const newPostData = {
        title: title.trim(),
        category,
        location: location.trim(),
        date: frenchDate,
        author: authorName,
        authorId: currentUser.uid,
        authorEmail: currentUser.email || "",
        photo: uploadedUrls[0] || "",
        gallery: uploadedUrls,
        summary: content.trim().slice(0, 150) + (content.length > 150 ? "..." : ""),
        content: content.trim(),
        status: "pending" as const,
        contactPhone: contactPhone.trim() || undefined,
        priceRange: priceRange.trim() || undefined,
        createdAt: now.toISOString(),
      };

      // 3. Save to Firestore collection "tourism_posts"
      const docRef = await addDoc(collection(db, "tourism_posts"), newPostData);

      const createdPost: TourismPost = {
        ...newPostData,
        id: docRef.id,
      };

      if (onPostCreated) {
        onPostCreated(createdPost);
      }

      setUploadProgress(100);
      setSuccessMsg("Votre publication est en attente de validation.");

      setTimeout(() => {
        // Reset form
        setTitle("");
        setLocation("");
        setContent("");
        setContactPhone("");
        setPriceRange("");
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSubmitting(false);
        setUploadProgress(null);
        setSuccessMsg(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error("[CreateTourismPost] Error creating publication:", err);
      setErrorMsg(
        err?.message || "Une erreur est survenue lors de l'enregistrement de votre publication."
      );
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">Proposer une publication</h3>
              <p className="text-[11px] text-on-surface-variant">
                Partagez un bon plan, un événement ou un lieu au Kongo Central
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

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Daily limit badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">history_toggle_off</span>
              <span>Quota quotidien : <strong>{userPostsTodayCount} / 5</strong> publications</span>
            </div>
            {isDailyLimitReached && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                Limite atteinte
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex flex-col gap-1 items-center text-center animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 mb-1">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <strong className="text-sm font-bold">{successMsg}</strong>
              <p className="text-[11px] opacity-80">
                Nos modérateurs examineront votre proposition sous 24h. Vous pourrez suivre son statut dans "Mes publications".
              </p>
            </div>
          )}

          <form id="tourism-post-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Titre de la publication *
              </label>
              <input
                type="text"
                required
                disabled={submitting}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nouveau restaurant panoramique avec vue sur le fleuve Congo"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
              />
            </div>

            {/* Category & Location grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Catégorie *
                </label>
                <select
                  value={category}
                  disabled={submitting}
                  onChange={(e) => setCategory(e.target.value as TourismCategory)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface cursor-pointer"
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
                  Lieu / Ville *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  list="suggested-locations"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Matadi, Boma, Muanda..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
                />
                <datalist id="suggested-locations">
                  {SUGGESTED_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Description / Content */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Description détaillée *
              </label>
              <textarea
                required
                rows={4}
                disabled={submitting}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Racontez votre expérience, les horaires d'accès, les conseils de visite, ce qui rend ce lieu ou cet événement remarquable..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface resize-none"
              />
            </div>

            {/* Optional Contact and Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Téléphone / WhatsApp (facultatif)
                </label>
                <input
                  type="text"
                  disabled={submitting}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+243 ..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Tarif indicatif (facultatif)
                </label>
                <input
                  type="text"
                  disabled={submitting}
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="Ex: Gratuit, 10$ à 25$..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
                />
              </div>
            </div>

            {/* Photos (1 to 5) with client-side compression */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Photos (1 à 5 photos) *
                </label>
                <span className="text-[10px] text-primary font-semibold">
                  {selectedFiles.length} / 5 sélectionnées
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mb-2">
                Compression automatique côté client (&lt; 2 Mo par photo) vers Firebase Storage.
              </p>

              {/* Upload trigger button */}
              {selectedFiles.length < 5 && (
                <label className="border-2 border-dashed border-outline-variant/60 hover:border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-surface-container-high/30 hover:bg-surface-container-high/60">
                  <span className="material-symbols-outlined text-2xl text-primary mb-1">
                    add_a_photo
                  </span>
                  <span className="text-xs font-semibold text-on-surface">
                    Ajouter des photos
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    JPG, PNG ou WEBP (max 5 photos)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={submitting}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Photos preview thumbnails */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden border border-outline-variant/40 bg-black/10 group"
                    >
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          Principale
                        </span>
                      )}
                      {!submitting && (
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                          title="Supprimer cette photo"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Bar when uploading */}
            {uploadProgress !== null && (
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                  <span>Compression & Téléversement...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low/60">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            Annuler
          </button>

          <button
            form="tourism-post-form"
            type="submit"
            disabled={submitting || isDailyLimitReached || selectedFiles.length === 0}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Envoyer pour validation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
