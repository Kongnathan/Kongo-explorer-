import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    authPromptReason,
    closeAuthModal,
    openAuthModal,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const getFrenchErrorMessage = (code: string): string => {
    switch (code) {
      case "auth/invalid-email":
        return "L'adresse email saisie n'est pas valide.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email ou mot de passe incorrect.";
      case "auth/email-already-in-use":
        return "Cette adresse email est déjà associée à un compte.";
      case "auth/weak-password":
        return "Le mot de passe doit comporter au moins 6 caractères.";
      case "auth/popup-closed-by-user":
        return "La fenêtre de connexion Google a été fermée avant la fin.";
      case "auth/network-request-failed":
        return "Erreur de connexion réseau. Vérifiez votre accès internet.";
      default:
        return "Une erreur est survenue lors de l'authentification. Veuillez réessayer.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    if (authModalMode === "register" && !displayName.trim()) {
      setErrorMsg("Veuillez saisir votre prénom ou nom d'auteur.");
      return;
    }

    setLoading(true);
    try {
      if (authModalMode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
    } catch (err: any) {
      console.warn("Auth error:", err);
      setErrorMsg(getFrenchErrorMessage(err?.code || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn("Google Auth error:", err);
      if (err?.code !== "auth/popup-closed-by-user") {
        setErrorMsg(getFrenchErrorMessage(err?.code || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/10 via-surface-container-low to-surface-container">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-variant/40 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">account_circle</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">
                {authModalMode === "login" ? "Connexion" : "Créer un compte"}
              </h3>
              <p className="text-xs text-on-surface-variant">Kongo Central Explorer</p>
            </div>
          </div>

          {authPromptReason && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">info</span>
              <span>{authPromptReason}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="mt-4 flex bg-surface-container-highest/60 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                openAuthModal("login", authPromptReason || undefined);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authModalMode === "login"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                openAuthModal("register", authPromptReason || undefined);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authModalMode === "register"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              S'inscrire
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-outline-variant/60 bg-surface hover:bg-surface-variant/40 transition-all font-semibold text-xs text-on-surface shadow-xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-outline-variant/40 w-full" />
            <span className="bg-surface-container-lowest px-3 text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">
              ou par email
            </span>
            <div className="border-t border-outline-variant/40 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalMode === "register" && (
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Votre nom ou pseudo public *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Nathan Mayifuila"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Adresse email *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Mot de passe *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  lock
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : authModalMode === "login" ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Se connecter</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Créer mon compte</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
