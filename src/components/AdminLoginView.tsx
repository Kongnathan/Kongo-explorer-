import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export default function AdminLoginView({ onLoginSuccess, onCancel }: AdminLoginViewProps) {
  const { currentUser, isAdmin, loading, loginWithGoogle, logout } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorText, setErrorText] = useState("");

  // L'accès n'est accordé que si le compte connecté est réellement administrateur
  useEffect(() => {
    if (isAdmin) onLoginSuccess();
  }, [isAdmin]);

  const handleGoogleSignIn = async () => {
    setErrorText("");
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setErrorText("Connexion Google impossible. Réessayez.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const isDenied = !loading && !!currentUser && !isAdmin;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-5 bg-background relative overflow-hidden bg-pattern font-sans">
      {/* Subtle Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-fixed blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary-fixed-dim blur-[100px] rounded-full"></div>
      </div>

      {/* Main Login Canvas */}
      <main className="relative z-10 w-full max-w-[420px] flex flex-col items-center animate-fade-in">
        
        {/* Header / Logo Area */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary text-on-primary rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="material-symbols-outlined text-[32px] fill">admin_panel_settings</span>
          </div>
          <h1 className="font-sans text-headline-lg-mobile text-primary mb-1 tracking-tight font-bold">Kongo Central</h1>
          <p className="font-sans text-body-md text-on-surface-variant font-medium">Administrative Secure Portal</p>
        </div>

        {/* Identity Card (Cognitive Anchor) */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-6 login-card-glow transition-all duration-300 hover:scale-[1.01]">
          <div className="flex flex-col gap-6">
            
            {/* Statut de connexion */}
            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 border border-outline-variant/20">
              <div className="w-12 h-12 rounded-full bg-earth-clay flex items-center justify-center flex-none">
                <span className="material-symbols-outlined text-tertiary fill text-2xl">person</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Accès réservé</span>
                <span className="font-sans text-body-md text-on-surface font-bold truncate">
                  {isDenied ? currentUser?.email : "Connexion administrateur requise"}
                </span>
              </div>
            </div>

            {isDenied && (
              <p className="font-sans text-body-sm text-red-700" role="alert">
                Ce compte n'a pas les droits d'administration.
              </p>
            )}
            {errorText && (
              <p className="font-sans text-body-sm text-red-700" role="alert">{errorText}</p>
            )}

            {/* Action Button */}
            <button 
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || loading}
              className="group flex items-center justify-center gap-3 w-full h-[56px] bg-white border border-outline-variant hover:bg-surface-container-high transition-all active:scale-95 rounded-full px-6 cursor-pointer font-sans text-body-md font-bold text-on-surface"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span>{isSigningIn ? "Connexion…" : "S'authentifier avec Google"}</span>
            </button>

            {/* Information/Help */}
            <div className="flex items-center justify-between">
              {isDenied ? (
                <button
                  onClick={() => logout()}
                  className="text-primary hover:text-secondary font-mono text-label-sm font-bold underline"
                >
                  Changer de compte
                </button>
              ) : (
                <div className="flex items-center gap-2 opacity-60">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <p className="font-mono text-label-sm font-semibold">Réservé aux administrateurs</p>
                </div>
              )}
              <button 
                onClick={onCancel}
                className="text-primary hover:text-secondary font-mono text-label-sm font-bold underline"
              >
                Retour
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
