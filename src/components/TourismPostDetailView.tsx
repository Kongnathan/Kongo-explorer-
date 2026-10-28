import React, { useState } from "react";
import { TourismPost, TourismCategory } from "../types";
import BackButton from "./BackButton";
import LazyImage from "./LazyImage";
import ReportPostModal from "./ReportPostModal";

interface TourismPostDetailViewProps {
  postId: string;
  posts: TourismPost[];
  onBack: () => void;
  onSelectPost: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function TourismPostDetailView({
  postId,
  posts,
  onBack,
  onSelectPost,
  onNavigate,
}: TourismPostDetailViewProps) {
  const post = posts.find((p) => p.id === postId);

  // Gallery active index state
  const galleryImages = post?.gallery && post.gallery.length > 0 ? post.gallery : (post?.photo ? [post.photo] : []);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-xl font-bold font-serif mb-2">Publication introuvable</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">
          Cette actualité ou recommandation touristique n'existe pas ou n'est plus accessible.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-primary text-white font-bold rounded-full text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          Retour aux Infos Tourisme
        </button>
      </div>
    );
  }

  // Related posts from same category or location
  const relatedPosts = posts
    .filter((p) => p.id !== post.id && p.status === "VALIDATED")
    .slice(0, 3);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const getCategoryBadgeClass = (category: TourismCategory) => {
    switch (category) {
      case "Lieu à visiter":
        return "bg-emerald-600 text-white";
      case "Événement":
        return "bg-amber-600 text-white";
      case "Hébergement":
        return "bg-indigo-600 text-white";
      case "Restaurant":
        return "bg-rose-600 text-white";
      case "Conseil pratique":
        return "bg-sky-600 text-white";
      case "Transport":
        return "bg-amber-700 text-white";
      default:
        return "bg-primary text-white";
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-32 animate-fade-in font-sans">
      {/* Top Bar */}
      <header className="w-full top-0 sticky bg-surface-container-low/95 backdrop-blur-md z-40 shadow-sm h-16">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-5xl mx-auto h-full">
          <BackButton onClick={onBack} variant="subtle" />
          <span className="font-sans text-sm font-bold text-primary truncate max-w-[200px] sm:max-w-md">
            {post.category}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/50 transition-colors cursor-pointer text-on-surface-variant hover:text-rose-600"
              title="Signaler cette publication"
              aria-label="Signaler"
            >
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/50 transition-colors cursor-pointer text-primary relative"
              title="Partager cet article"
              aria-label="Partager"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              {copyFeedback && (
                <span className="absolute -bottom-8 right-0 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
                  Lien copié !
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Metadata */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${getCategoryBadgeClass(
                post.category
              )}`}
            >
              {post.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">location_on</span>
              {post.location}
            </span>
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {post.date}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-on-surface tracking-tight leading-snug">
            {post.title}
          </h1>

          <div className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant border-b border-outline-variant/30 pb-4">
            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
            <span>Rédigé par <strong className="text-on-surface">{post.author}</strong></span>
          </div>
        </div>

        {/* Photo Gallery & Hero */}
        <section className="space-y-3">
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden bg-neutral-900 shadow-lg cursor-pointer group"
            title="Agrandir la photo"
          >
            <LazyImage
              src={galleryImages[activePhotoIndex] || post.photo}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md">
              <span className="material-symbols-outlined text-[16px]">fullscreen</span>
              <span>Agrandir</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    activePhotoIndex === idx
                      ? "border-primary shadow-md scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Lead / Summary Box */}
        {post.summary && (
          <div className="bg-primary/5 border-l-4 border-primary p-4 sm:p-5 rounded-r-2xl">
            <p className="font-serif italic text-base sm:text-lg text-on-surface leading-relaxed">
              « {post.summary} »
            </p>
          </div>
        )}

        {/* Practical Info Card if Contact/Price exists */}
        {(post.contactPhone || post.priceRange) && (
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
            {post.priceRange && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block">
                    Tarif indicatif
                  </span>
                  <span className="text-sm font-bold text-on-surface">{post.priceRange}</span>
                </div>
              </div>
            )}

            {post.contactPhone && (
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${post.contactPhone.replace(/\s+/g, "")}`}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  Appeler
                </a>
                <a
                  href={`https://wa.me/${post.contactPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        {/* Main Content Body */}
        <section className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-on-surface leading-relaxed text-sm sm:text-base pt-2">
          {post.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-justify sm:text-left text-on-surface/90">
              {para}
            </p>
          ))}
        </section>

        {/* Back and Navigation Actions */}
        <div className="pt-8 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Toutes les Infos Tourisme
          </button>

          <button
            onClick={() => onNavigate("explore")}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">explore</span>
            Explorer les destinations
          </button>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="pt-10 space-y-4">
            <h2 className="text-lg font-bold font-serif text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">feed</span>
              À lire également
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    onSelectPost(rel.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
                >
                  <div className="aspect-[16/10] bg-neutral-900 overflow-hidden">
                    <img
                      src={rel.photo}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {rel.category} • {rel.location}
                    </span>
                    <h3 className="font-serif text-xs font-bold line-clamp-2 text-on-surface group-hover:text-primary">
                      {rel.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer z-50"
            title="Fermer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] relative flex flex-col items-center"
          >
            <img
              src={galleryImages[activePhotoIndex]}
              alt={post.title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-4 flex items-center gap-2">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhotoIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                    activePhotoIndex === i ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      <ReportPostModal
        isOpen={isReportModalOpen}
        post={post}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
