import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "",
};

// Check if we have at least projectId or apiKey to initialize real Firebase
const isFirebaseConfigured = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

if (!isFirebaseConfigured) {
  console.warn(
    "[Firebase] Firebase configuration is missing or incomplete. Please configure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your environment."
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

export const db = getFirestore(app);
export const storage = getStorage(app);
export { isFirebaseConfigured };
