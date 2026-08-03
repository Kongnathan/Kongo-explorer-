import React, { useState, useEffect } from "react";
import { 
  doc, 
  onSnapshot, 
  runTransaction, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebaseConfig";
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface RatingSectionProps {
  locationId: string;
  locationTitle: string;
  initialRating: number | null;
}

interface ReviewDoc {
  id: string;
  rating: number;
  comment?: string;
  createdAt?: any;
}

const RATING_LABELS: Record<number, string> = {
  1: "Décevant",
  2: "Moyen",
  3: "Bien",
  4: "Très bien",
  5: "Exceptionnel !"
};

export default function RatingSection({
  locationId,
  locationTitle,
  initialRating
}: RatingSectionProps) {
  const [avgRating, setAvgRating] = useState<number>(initialRating || 4.5);
  const [ratingCount, setRatingCount] = useState<number>(12);
  const [ratingSum, setRatingSum] = useState<number>((initialRating || 4.5) * 12);
  
  // User input states
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Recent reviews from Firestore
  const [recentReviews, setRecentReviews] = useState<ReviewDoc[]>([]);
  const [hasAlreadyRated, setHasAlreadyRated] = useState<boolean>(false);

  // Check local storage for previous submission
  useEffect(() => {
    const savedUserRating = localStorage.getItem(`kongo_rating_${locationId}`);
    if (savedUserRating) {
      setUserRating(Number(savedUserRating));
      setHasAlreadyRated(true);
    } else {
      setUserRating(0);
      setHasAlreadyRated(false);
    }
    setSubmitSuccess(false);
    setErrorMessage(null);
  }, [locationId]);

  // Real-time listener for location rating in Firestore
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const locRef = doc(db, "locations", locationId);
    const unsubscribeDoc = onSnapshot(locRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.rating === "number") {
          setAvgRating(data.rating);
        }
        if (typeof data.ratingCount === "number") {
          setRatingCount(data.ratingCount);
        }
        if (typeof data.ratingSum === "number") {
          setRatingSum(data.ratingSum);
        }
      }
    }, (err) => {
      console.warn("Firestore snapshot error on location rating:", err);
    });

    // Subcollection listener for recent reviews
    const ratingsCol = collection(db, "locations", locationId, "ratings");
    const q = query(ratingsCol, orderBy("createdAt", "desc"), limit(5));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const reviews: ReviewDoc[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        reviews.push({
          id: docSnap.id,
          rating: d.rating || 5,
          comment: d.comment || "",
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString("fr-FR") : "Récemment"
        });
      });
      setRecentReviews(reviews);
    }, (err) => {
      console.warn("Firestore reviews listener error:", err);
    });

    return () => {
      unsubscribeDoc();
      unsubscribeReviews();
    };
  }, [locationId]);

  const handleStarClick = (ratingValue: number) => {
    setUserRating(ratingValue);
    setErrorMessage(null);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) {
      setErrorMessage("Veuillez sélectionner au moins une étoile (1 à 5).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isFirebaseConfigured && db) {
        const locRef = doc(db, "locations", locationId);

        // 1. Update location summary rating using transaction
        await runTransaction(db, async (transaction) => {
          const locSnap = await transaction.get(locRef);
          
          let currentCount = ratingCount;
          let currentSum = ratingSum;

          if (locSnap.exists()) {
            const data = locSnap.data();
            currentCount = typeof data.ratingCount === "number" ? data.ratingCount : currentCount;
            currentSum = typeof data.ratingSum === "number" ? data.ratingSum : currentSum;
          }

          const newCount = currentCount + 1;
          const newSum = currentSum + userRating;
          const newAverage = Number((newSum / newCount).toFixed(1));

          transaction.set(locRef, {
            rating: newAverage,
            ratingCount: newCount,
            ratingSum: newSum,
            updatedAt: serverTimestamp()
          }, { merge: true });
        });

        // 2. Add individual rating review to subcollection
        const reviewsCol = collection(db, "locations", locationId, "ratings");
        await addDoc(reviewsCol, {
          rating: userRating,
          comment: userComment.trim(),
          createdAt: serverTimestamp()
        });
      } else {
        // Fallback local update if Firebase not configured
        const newCount = ratingCount + 1;
        const newSum = ratingSum + userRating;
        const newAvg = Number((newSum / newCount).toFixed(1));
        setAvgRating(newAvg);
        setRatingCount(newCount);
        setRatingSum(newSum);
      }

      // Save to local storage
      localStorage.setItem(`kongo_rating_${locationId}`, userRating.toString());
      setHasAlreadyRated(true);
      setSubmitSuccess(true);
      setUserComment("");
    } catch (error: any) {
      console.error("Error submitting rating to Firestore:", error);
      setErrorMessage("Échec de l'enregistrement dans Firestore. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRatingValue = hoverRating || userRating;

  return (
    <section className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
      {/* Header & Overall Rating Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[22px]">reviews</span>
            <h3 className="font-sans text-headline-sm font-bold text-primary">
              Avis & Évaluations des Voyageurs
            </h3>
          </div>
          <p className="text-on-surface-variant text-xs">
            Évaluez {locationTitle} et consultez la note moyenne synchronisée en temps réel sur Firestore.
          </p>
        </div>

        {/* Global Score Badge */}
        <div className="flex items-center gap-3 bg-surface-container-high px-4 py-3 rounded-2xl border border-outline-variant/30 self-start sm:self-auto">
          <div className="text-center">
            <div className="font-mono text-3xl font-extrabold text-on-surface leading-none">
              {avgRating.toFixed(1)}
            </div>
            <div className="text-[10px] text-on-surface-variant font-mono mt-1">sur 5</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= Math.round(avgRating);
                return (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      isFilled
                        ? "text-amber-400 fill-amber-400"
                        : "text-outline-variant/40 fill-transparent"
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-xs font-mono font-semibold text-primary">
              {ratingCount} {ratingCount > 1 ? "avis enregistrés" : "avis enregistré"}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Rating Form */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
        <h4 className="font-sans text-body-lg font-bold text-on-surface mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          {hasAlreadyRated ? "Votre avis a été soumis !" : "Attribuer une note à ce lieu"}
        </h4>

        {submitSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-sans animate-fade-in my-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Merci pour votre contribution !</p>
              <p className="text-xs text-emerald-700/90 mt-0.5">
                Votre note de {userRating}/5 a été mise à jour et la moyenne du lieu a été recalculée dans Firestore.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRating} className="space-y-4 mt-3">
            {/* Star Icons selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-mono font-semibold text-on-surface-variant">
                Sélectionnez les étoiles :
              </span>
              <div 
                className="flex items-center gap-1.5 cursor-pointer select-none"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= activeRatingValue;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1 transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                      title={`${star} étoile${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isActive
                            ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                            : "text-outline-variant hover:text-amber-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {activeRatingValue > 0 && (
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  {userRating > 0 ? `${userRating}/5 — ` : ""}{RATING_LABELS[activeRatingValue]}
                </span>
              )}
            </div>

            {/* Optional Comment Input */}
            <div>
              <label className="block text-xs font-mono text-on-surface-variant mb-1 font-semibold">
                Commentaire ou impression (optionnel) :
              </label>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Partagez vos conseils d'accès, la beauté du paysage, ou l'accueil local..."
                rows={2}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-600 text-xs font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Cloud Sync</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || userRating === 0}
                className="px-5 py-2.5 bg-primary text-white text-xs font-sans font-bold rounded-xl shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mise à jour Firestore...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{hasAlreadyRated ? "Mettre à jour ma note" : "Envoyer ma note"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Reviews List from Firestore */}
      {recentReviews.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-primary" />
            Derniers retours enregistrés ({recentReviews.length})
          </h4>

          <div className="space-y-2.5">
            {recentReviews.map((rev) => (
              <div 
                key={rev.id} 
                className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-outline-variant/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono font-bold text-on-surface">
                      {rev.rating}/5
                    </span>
                  </div>
                  {rev.comment ? (
                    <p className="text-xs text-on-surface-variant italic font-sans">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[11px] text-on-surface-variant/60 font-sans italic">
                      Note attribuée sans commentaire.
                    </p>
                  )}
                </div>

                <span className="text-[10px] font-mono text-on-surface-variant/70 self-end sm:self-center">
                  {rev.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
