import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseAppletConfig from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || "",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || "",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || "",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || "",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || "",
};

const databaseId = (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId || "";

// Check if we have at least projectId or apiKey to initialize real Firebase
const isFirebaseConfigured = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

if (!isFirebaseConfigured) {
  console.warn(
    "[Firebase] Firebase configuration is missing or incomplete."
  );
}

// Always initialize the app, but log warnings or allow graceful fallbacks if not configured
const app = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    : {
        apiKey: "placeholder-api-key",
        authDomain: "placeholder-project.firebaseapp.com",
        projectId: "placeholder-project",
        storageBucket: "placeholder-project.appspot.com",
        messagingSenderId: "1234567890",
        appId: "1:1234567890:web:1234567890",
      }
);

export const db = (isFirebaseConfigured && databaseId && databaseId !== "(default)")
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export const storage = getStorage(app);
export { isFirebaseConfigured };

