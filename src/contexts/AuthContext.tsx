import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebaseConfig";
import { UserProfile } from "../types";

// Known administrator email provided in environment / user context
export const DEFAULT_ADMIN_EMAIL = "elpubliologuenathan@gmail.com";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  authPromptReason: string | null;
  openAuthModal: (mode?: "login" | "register", reason?: string) => void;
  closeAuthModal: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);

  const openAuthModal = (mode: "login" | "register" = "login", reason?: string) => {
    setAuthModalMode(mode);
    setAuthPromptReason(reason || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPromptReason(null);
  };

  // Sync user profile document in Firestore
  const syncUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userRef);

      const isKnownAdmin =
        user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Promote to admin if known admin email
        if (isKnownAdmin && data.role !== "admin") {
          await setDoc(userRef, { role: "admin" }, { merge: true });
          data.role = "admin";
        }
        setUserProfile(data);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "Explorateur",
          photoURL: user.photoURL || undefined,
          role: isKnownAdmin ? "admin" : "user",
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn("[Auth] Could not sync user profile with Firestore:", err);
      // Fallback local profile
      setUserProfile({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "Explorateur",
        role: user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserProfile(cred.user);
    closeAuthModal();
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    await syncUserProfile(cred.user);
    closeAuthModal();
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(cred.user);
    closeAuthModal();
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const isAdmin = Boolean(
    userProfile?.role === "admin" ||
      currentUser?.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        isAuthModalOpen,
        authModalMode,
        authPromptReason,
        openAuthModal,
        closeAuthModal,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
