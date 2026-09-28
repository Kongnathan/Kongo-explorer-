import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Location, SavedLocation, PendingPermit, Circuit, KongoNotification } from "./types";
import { DEFAULT_LOCATIONS, DEFAULT_PENDING_PERMITS, DEFAULT_NOTIFICATIONS } from "./data";
import { DEFAULT_CIRCUITS } from "./circuitsData";
import ExploreView from "./components/ExploreView";
import ListView from "./components/ListView";
import DetailView from "./components/DetailView";
import MapView from "./components/MapView";
import LocalTipsView from "./components/LocalTipsView";
import SavedOfflineView from "./components/SavedOfflineView";
import CircuitsView from "./components/CircuitsView";
import AdminLoginView from "./components/AdminLoginView";
import AdminPanelView from "./components/AdminPanelView";
import QuickCaptureModal from "./components/QuickCaptureModal";
import NotificationCenterModal from "./components/NotificationCenterModal";
import IntroSplash from "./components/IntroSplash";
import NotFoundView from "./components/NotFoundView";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseConfig";
import { 
  getLocationsFromDB, 
  saveLocationsToDB, 
  saveSingleLocationToDB, 
  deleteLocationFromDB 
} from "./lib/indexedDB";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function serializeLocationForFirestore(loc: Location): any {
  if (!loc) {
    throw new Error("Validation Error: Location data is null or undefined.");
  }
  if (!loc.id || typeof loc.id !== "string" || loc.id.trim() === "") {
    throw new Error("Validation Error: Location ID cannot be null, undefined, or empty.");
  }
  if (!loc.title || typeof loc.title !== "string" || loc.title.trim() === "") {
    throw new Error("Validation Error: Title cannot be null, undefined, or empty.");
  }
  if (!loc.description || typeof loc.description !== "string" || loc.description.trim() === "") {
    throw new Error("Validation Error: Description cannot be null, undefined, or empty.");
  }
  if (!loc.locationName || typeof loc.locationName !== "string" || loc.locationName.trim() === "") {
    throw new Error("Validation Error: Location name cannot be null, undefined, or empty.");
  }
  if (!loc.image || typeof loc.image !== "string" || loc.image.trim() === "") {
    throw new Error("Validation Error: Photo URL (image) cannot be null, undefined, or empty.");
  }
  if (!loc.category || typeof loc.category !== "string" || loc.category.trim() === "") {
    throw new Error("Validation Error: Category cannot be null, undefined, or empty.");
  }
  if (!loc.status || typeof loc.status !== "string" || loc.status.trim() === "") {
    throw new Error("Validation Error: Status cannot be null, undefined, or empty.");
  }
  if (!loc.coords || typeof loc.coords.x !== "number" || typeof loc.coords.y !== "number") {
    throw new Error("Validation Error: Coordinates must be valid numbers.");
  }

  return {
    id: loc.id.trim(),
    title: loc.title.trim(),
    description: loc.description.trim(),
    locationName: loc.locationName.trim(),
    image: loc.image.trim(),
    images: Array.isArray(loc.images) ? loc.images.filter(img => typeof img === "string" && img.trim() !== "") : [],
    videoUrl: typeof loc.videoUrl === "string" && loc.videoUrl.trim() !== "" ? loc.videoUrl.trim() : null,
    category: loc.category,
    status: loc.status,
    coords: {
      x: loc.coords.x,
      y: loc.coords.y,
    },
    lat: typeof loc.lat === "number" ? loc.lat : null,
    lng: typeof loc.lng === "number" ? loc.lng : null,
    rating: typeof loc.rating === "number" ? loc.rating : null,
    ratingCount: typeof loc.ratingCount === "number" ? loc.ratingCount : null,
    ratingSum: typeof loc.ratingSum === "number" ? loc.ratingSum : null,
    timeToVisit: typeof loc.timeToVisit === "string" ? loc.timeToVisit : null,
    cognitiveEffort: typeof loc.cognitiveEffort === "number" ? loc.cognitiveEffort : null,
    intensity: typeof loc.intensity === "string" ? loc.intensity : null,
    terrain: typeof loc.terrain === "string" ? loc.terrain : null,
    currentStatus: typeof loc.currentStatus === "string" ? loc.currentStatus : null,
    history: typeof loc.history === "string" ? loc.history : null,
    checklist: Array.isArray(loc.checklist) ? loc.checklist : null,
    bestSeason: typeof loc.bestSeason === "string" ? loc.bestSeason : null,
    safetyGuidelines: typeof loc.safetyGuidelines === "string" ? loc.safetyGuidelines : null,
    ecoResponsibility: typeof loc.ecoResponsibility === "string" ? loc.ecoResponsibility : null,
    localCustoms: typeof loc.localCustoms === "string" ? loc.localCustoms : null,
  };
}

function deserializeLocationFromFirestore(id: string, data: any): Location {
  const defaultLoc = DEFAULT_LOCATIONS.find(d => d.id === (id || data.id));
  const mainImage = (data.image && typeof data.image === "string" && data.image.trim() !== "")
    ? data.image.trim()
    : (defaultLoc?.image || "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80");

  return {
    id: id || data.id || "",
    title: data.title || defaultLoc?.title || "",
    description: data.description || defaultLoc?.description || "",
    locationName: data.locationName || defaultLoc?.locationName || "",
    image: mainImage,
    images: (Array.isArray(data.images) && data.images.filter(img => typeof img === "string" && img.trim() !== "").length > 0) 
      ? data.images.filter(img => typeof img === "string" && img.trim() !== "") 
      : (defaultLoc?.images || [mainImage]),
    videoUrl: typeof data.videoUrl === "string" && data.videoUrl ? data.videoUrl : undefined,
    category: data.category || defaultLoc?.category || "Nature",
    status: data.status || "PUBLISHED",
    coords: {
      x: typeof data.coords?.x === "number" ? data.coords.x : (defaultLoc?.coords.x || 50),
      y: typeof data.coords?.y === "number" ? data.coords.y : (defaultLoc?.coords.y || 50),
    },
    lat: typeof data.lat === "number" ? data.lat : undefined,
    lng: typeof data.lng === "number" ? data.lng : undefined,
    rating: typeof data.rating === "number" ? data.rating : null,
    ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : null,
    ratingSum: typeof data.ratingSum === "number" ? data.ratingSum : null,
    timeToVisit: data.timeToVisit || null,
    cognitiveEffort: typeof data.cognitiveEffort === "number" ? data.cognitiveEffort : null,
    intensity: data.intensity || null,
    terrain: data.terrain || null,
    currentStatus: data.currentStatus || null,
    history: data.history || null,
    checklist: Array.isArray(data.checklist) ? data.checklist : null,
    bestSeason: data.bestSeason || null,
    safetyGuidelines: data.safetyGuidelines || null,
    ecoResponsibility: data.ecoResponsibility || null,
    localCustoms: data.localCustoms || null,
  };
}

function serializePendingPermitForFirestore(permit: PendingPermit): any {
  if (!permit) {
    throw new Error("Validation Error: PendingPermit data is null or undefined.");
  }
  if (!permit.id || typeof permit.id !== "string" || permit.id.trim() === "") {
    throw new Error("Validation Error: Permit ID cannot be null, undefined, or empty.");
  }
  if (!permit.title || typeof permit.title !== "string" || permit.title.trim() === "") {
    throw new Error("Validation Error: Permit title cannot be null, undefined, or empty.");
  }
  if (!permit.subtitle || typeof permit.subtitle !== "string") {
    throw new Error("Validation Error: Permit subtitle must be a string.");
  }
  if (!permit.status || typeof permit.status !== "string") {
    throw new Error("Validation Error: Permit status cannot be null, undefined, or empty.");
  }
  if (!permit.icon || typeof permit.icon !== "string") {
    throw new Error("Validation Error: Permit icon must be a string.");
  }

  return {
    id: permit.id.trim(),
    title: permit.title.trim(),
    subtitle: permit.subtitle.trim(),
    status: permit.status,
    icon: permit.icon.trim(),
  };
}

function deserializePendingPermitFromFirestore(id: string, data: any): PendingPermit {
  return {
    id: id || data.id || "",
    title: data.title || "",
    subtitle: data.subtitle || "",
    status: data.status || "VERIFICATION",
    icon: data.icon || "explore",
  };
}

function serializeCircuitForFirestore(circuit: Circuit): any {
  if (!circuit || !circuit.id) {
    throw new Error("Validation Error: Circuit data is invalid or missing ID.");
  }
  return {
    id: circuit.id.trim(),
    title: (circuit.title || "").trim(),
    subtitle: (circuit.subtitle || "").trim(),
    duration: (circuit.duration || "").trim(),
    badge: (circuit.badge || "").trim(),
    image: (circuit.image || "").trim(),
    description: (circuit.description || "").trim(),
    bestFor: (circuit.bestFor || "").trim(),
    accessType: circuit.accessType || "MIXTE",
    stops: Array.isArray(circuit.stops) ? circuit.stops : [],
  };
}

function deserializeCircuitFromFirestore(id: string, data: any): Circuit {
  return {
    id: id || data.id || "",
    title: data.title || "",
    subtitle: data.subtitle || "",
    duration: data.duration || "",
    badge: data.badge || "",
    image: data.image || "",
    description: data.description || "",
    bestFor: data.bestFor || "",
    accessType: data.accessType || "MIXTE",
    stops: Array.isArray(data.stops) ? data.stops : [],
  };
}


function DetailRouteWrapper({
  locations,
  onNavigate,
  savedLocationIds,
  onToggleSave,
  onUpdateLocation,
  isAdminAuthenticated,
}: {
  locations: Location[];
  onNavigate: (tab: string) => void;
  savedLocationIds: string[];
  onToggleSave: (id: string) => void;
  onUpdateLocation: (loc: Location) => void;
  isAdminAuthenticated: boolean;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // If locations list is ready and the requested ID is not found, display 404
  const foundLoc = locations.find((l) => l.id === id);
  if (!foundLoc && locations.length > 0) {
    return <NotFoundView />;
  }

  return (
    <DetailView
      locationId={id || ""}
      locations={locations}
      onBack={() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate("/destinations");
        }
      }}
      onNavigate={onNavigate}
      savedLocationIds={savedLocationIds}
      onToggleSave={onToggleSave}
      onUpdateLocation={onUpdateLocation}
      isAdminAuthenticated={isAdminAuthenticated}
    />
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation helpers between views
  const handleNavigate = (tab: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    switch (tab) {
      case "explore": navigate("/"); break;
      case "list": navigate("/destinations"); break;
      case "map": navigate("/carte"); break;
      case "circuits": navigate("/circuits"); break;
      case "saved": navigate("/carnet"); break;
      case "tips": navigate("/conseils"); break;
      case "admin-login": navigate("/admin/login"); break;
      case "admin-panel": navigate("/admin"); break;
      default: navigate("/"); break;
    }
  };

  const handleSelectLocation = (id: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/destinations/${id}`);
  };
  
  // App data states
  const [locations, setLocations] = useState<Location[]>(() => {
    const localLocs = localStorage.getItem("kongo_custom_locations");
    if (localLocs) {
      try {
        const parsed = JSON.parse(localLocs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultMap = new Map(DEFAULT_LOCATIONS.map(l => [l.id, l]));
          return parsed.map((l: Location) => {
            const defaultLoc = defaultMap.get(l.id);
            const validImage = (l.image && typeof l.image === "string" && l.image.trim() !== "") 
              ? l.image.trim() 
              : (defaultLoc?.image || "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80");
            return {
              ...defaultLoc,
              ...l,
              image: validImage,
              images: (Array.isArray(l.images) && l.images.filter(img => typeof img === "string" && img.trim() !== "").length > 0) 
                ? l.images.filter(img => typeof img === "string" && img.trim() !== "") 
                : (defaultLoc?.images || [validImage]),
            };
          });
        }
      } catch (err) {
        console.error("Failed to parse local locations from storage", err);
      }
    }
    return DEFAULT_LOCATIONS;
  });
  const [pendingPermits, setPendingPermits] = useState<PendingPermit[]>(DEFAULT_PENDING_PERMITS);
  const [circuits, setCircuits] = useState<Circuit[]>(() => {
    const local = localStorage.getItem("kongo_circuits");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {
        console.error("Failed to load local circuits", err);
      }
    }
    return DEFAULT_CIRCUITS;
  });

  const handleSaveCircuit = async (updated: Circuit) => {
    setCircuits(prev => {
      const next = prev.map(c => c.id === updated.id ? updated : c);
      localStorage.setItem("kongo_circuits", JSON.stringify(next));
      return next;
    });
    if (isFirebaseConfigured) {
      try {
        const serialized = serializeCircuitForFirestore(updated);
        await setDoc(doc(db, "circuits", serialized.id), serialized);
        console.log(`[SaveWorkflow OK] Firestore setDoc verified for circuit ID '${serialized.id}'`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `circuits/${updated.id}`);
      }
    }
  };

  const handleAddCircuit = async (newCircuit: Circuit) => {
    setCircuits(prev => {
      const next = [newCircuit, ...prev];
      localStorage.setItem("kongo_circuits", JSON.stringify(next));
      return next;
    });
    if (isFirebaseConfigured) {
      try {
        const serialized = serializeCircuitForFirestore(newCircuit);
        await setDoc(doc(db, "circuits", serialized.id), serialized);
        console.log(`[SaveWorkflow OK] Firestore setDoc verified for new circuit ID '${serialized.id}'`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `circuits/${newCircuit.id}`);
      }
    }
  };

  const handleDeleteCircuit = async (id: string) => {
    setCircuits(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem("kongo_circuits", JSON.stringify(next));
      return next;
    });
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "circuits", id));
        console.log(`[SaveWorkflow OK] Firestore deleteDoc verified for circuit ID '${id}'`);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `circuits/${id}`);
      }
    }
  };
  
  // Notifications state & persistence
  const [notifications, setNotifications] = useState<KongoNotification[]>(() => {
    const local = localStorage.getItem("kongo_notifications");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {
        console.error("Failed to parse local notifications", err);
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem("kongo_notifications", JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured) {
      for (const notif of notifications) {
        if (!notif.read) {
          try {
            await setDoc(doc(db, "notifications", notif.id), { ...notif, read: true });
          } catch (err) {
            console.error("Failed to mark notification read in Firestore:", err);
          }
        }
      }
    }
  };

  const handleToggleNotificationRead = async (id: string) => {
    let updatedNotif: KongoNotification | undefined;
    setNotifications(prev => {
      const next = prev.map(n => {
        if (n.id === id) {
          updatedNotif = { ...n, read: !n.read };
          return updatedNotif;
        }
        return n;
      });
      localStorage.setItem("kongo_notifications", JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured && updatedNotif) {
      try {
        await setDoc(doc(db, "notifications", id), updatedNotif);
      } catch (err) {
        console.error("Failed to update notification read state in Firestore:", err);
      }
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      localStorage.setItem("kongo_notifications", JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "notifications", id));
      } catch (err) {
        console.error("Failed to delete notification from Firestore:", err);
      }
    }
  };

  const handleAddNotification = async (notif: KongoNotification) => {
    setNotifications(prev => {
      const next = [notif, ...prev];
      localStorage.setItem("kongo_notifications", JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, "notifications", notif.id), notif);
      } catch (err) {
        console.error("Failed to save notification to Firestore:", err);
      }
    }
  };

  // Saved locations IDs (Persistent travel logs/offline bookmarks)
  const [savedLocationIds, setSavedLocationIds] = useState<string[]>([]);
  
  // UI states
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("kongo_admin_authenticated") === "true";
  });
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // PWA & Connectivity states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallBtn(false);
    }

    // Load saved locations from localStorage on startup
    const localSaves = localStorage.getItem("kongo_saved_locations");
    if (localSaves) {
      try {
        setSavedLocationIds(JSON.parse(localSaves));
      } catch (err) {
        console.error("Failed to parse local saves", err);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Load initial locations from IndexedDB for instantaneous offline-first boot
  useEffect(() => {
    async function loadOfflineCachedLocations() {
      try {
        const cached = await getLocationsFromDB();
        if (cached && cached.length > 0) {
          console.log("[IndexedDB] Loaded cached locations on startup:", cached.length);
          const defaultMap = new Map(DEFAULT_LOCATIONS.map(l => [l.id, l]));
          const mergedList = cached.map(l => {
            const defaultLoc = defaultMap.get(l.id);
            const validImage = (l.image && typeof l.image === "string" && l.image.trim() !== "") 
              ? l.image.trim() 
              : (defaultLoc?.image || "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80");
            if (defaultLoc) {
              return {
                ...defaultLoc,
                ...l,
                image: validImage,
                images: (Array.isArray(l.images) && l.images.filter(img => typeof img === "string" && img.trim() !== "").length > 0) 
                  ? l.images.filter(img => typeof img === "string" && img.trim() !== "") 
                  : (defaultLoc?.images || [validImage]),
              };
            }
            return {
              ...l,
              image: validImage,
            };
          });
          setLocations(mergedList);
        }
      } catch (err) {
        console.error("[IndexedDB] Failed to load offline cache:", err);
      }
    }
    loadOfflineCachedLocations();
  }, []);

  // Fetch data using Firebase onSnapshot (if configured) or from local full-stack server fallback
  useEffect(() => {
    if (!isFirebaseConfigured) {
      async function loadInitialData() {
        try {
          const [locRes, pendingRes] = await Promise.all([
            fetch("/api/locations"),
            fetch("/api/pending")
          ]);

          if (locRes.ok) {
            const locs = await locRes.json();
            if (locs.length > 0) {
              const defaultMap = new Map(DEFAULT_LOCATIONS.map(l => [l.id, l]));
              const mergedList = locs.map((l: Location) => {
                const defaultLoc = defaultMap.get(l.id);
                const validImage = (l.image && typeof l.image === "string" && l.image.trim() !== "") 
                  ? l.image.trim() 
                  : (defaultLoc?.image || "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80");
                if (defaultLoc) {
                  return {
                    ...defaultLoc,
                    ...l,
                    image: validImage,
                    images: (Array.isArray(l.images) && l.images.filter(img => typeof img === "string" && img.trim() !== "").length > 0) 
                      ? l.images.filter(img => typeof img === "string" && img.trim() !== "") 
                      : (defaultLoc?.images || [validImage]),
                  };
                }
                return {
                  ...l,
                  image: validImage,
                };
              });
              setLocations(mergedList);
              // Save fetched locations to IndexedDB for offline access
              await saveLocationsToDB(mergedList);
            }
          }
          if (pendingRes.ok) {
            const pends = await pendingRes.json();
            if (pends.length > 0) setPendingPermits(pends);
          }
        } catch (err) {
          console.warn("Express server not fully booted or offline. Falling back to local state.", err);
        }
      }
      loadInitialData();
      return;
    }

    // Firebase is configured: Setup real-time onSnapshot listeners
    const qLocs = query(collection(db, "locations"));
    const unsubscribeLocs = onSnapshot(qLocs, async (snapshot) => {
      const locsList: Location[] = [];
      snapshot.forEach((doc) => {
        try {
          locsList.push(deserializeLocationFromFirestore(doc.id, doc.data()));
        } catch (err) {
          console.error("Failed to deserialize location:", doc.id, err);
        }
      });

      if (locsList.length > 0) {
        const defaultMap = new Map(DEFAULT_LOCATIONS.map(l => [l.id, l]));
        const mergedList = locsList.map(l => {
          const defaultLoc = defaultMap.get(l.id);
          const validImage = (l.image && typeof l.image === "string" && l.image.trim() !== "") 
            ? l.image.trim() 
            : (defaultLoc?.image || "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80");
          if (defaultLoc) {
            return {
              ...defaultLoc,
              ...l,
              image: validImage,
              images: (Array.isArray(l.images) && l.images.filter(img => typeof img === "string" && img.trim() !== "").length > 0) 
                ? l.images.filter(img => typeof img === "string" && img.trim() !== "") 
                : (defaultLoc?.images || [validImage]),
            };
          }
          return {
            ...l,
            image: validImage,
          };
        });
        setLocations(mergedList);
        // Persist to localStorage and IndexedDB cache so photos load instantly without showing defaults first
        localStorage.setItem("kongo_custom_locations", JSON.stringify(mergedList));
        await saveLocationsToDB(mergedList);
      } else {
        // Automatically seed empty Firestore with defaults or local custom locations
        console.log("[Firebase] Firestore 'locations' collection is empty. Seeding defaults or local custom locations...");
        const localLocsStr = localStorage.getItem("kongo_custom_locations");
        let initialToSeed = DEFAULT_LOCATIONS;
        if (localLocsStr) {
          try {
            const parsed = JSON.parse(localLocsStr);
            if (Array.isArray(parsed) && parsed.length > 0) initialToSeed = parsed;
          } catch (e) {}
        }
        for (const loc of initialToSeed) {
          try {
            const serialized = serializeLocationForFirestore(loc);
            await setDoc(doc(db, "locations", loc.id), serialized);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `locations/${loc.id}`);
          }
        }
      }
    }, (error) => {
      console.warn("[Firebase] Failed to listen to 'locations' collection:", error);
      try {
        handleFirestoreError(error, OperationType.GET, "locations");
      } catch (err) {
        // Log formatted Firestore error without throwing uncaught runtime exception
      }
    });

    const qCircuits = query(collection(db, "circuits"));
    const unsubscribeCircuits = onSnapshot(qCircuits, async (snapshot) => {
      const circList: Circuit[] = [];
      snapshot.forEach((doc) => {
        try {
          circList.push(deserializeCircuitFromFirestore(doc.id, doc.data()));
        } catch (err) {
          console.error("Failed to deserialize circuit:", doc.id, err);
        }
      });

      if (circList.length > 0) {
        setCircuits(circList);
        localStorage.setItem("kongo_circuits", JSON.stringify(circList));
      } else {
        console.log("[Firebase] Firestore 'circuits' collection is empty. Seeding default circuits...");
        const localCircsStr = localStorage.getItem("kongo_circuits");
        let initialCircsToSeed = DEFAULT_CIRCUITS;
        if (localCircsStr) {
          try {
            const parsed = JSON.parse(localCircsStr);
            if (Array.isArray(parsed) && parsed.length > 0) initialCircsToSeed = parsed;
          } catch (e) {}
        }
        for (const c of initialCircsToSeed) {
          try {
            const serialized = serializeCircuitForFirestore(c);
            await setDoc(doc(db, "circuits", c.id), serialized);
          } catch (e) {
            console.warn("Could not seed circuit to Firestore:", e);
          }
        }
      }
    }, (error) => {
      console.warn("[Firebase] Failed to listen to 'circuits' collection:", error);
      try {
        handleFirestoreError(error, OperationType.GET, "circuits");
      } catch (err) {
        // Log formatted Firestore error without throwing uncaught runtime exception
      }
    });

    const qPending = query(collection(db, "pendingPermits"));
    const unsubscribePending = onSnapshot(qPending, async (snapshot) => {
      const pendsList: PendingPermit[] = [];
      snapshot.forEach((doc) => {
        try {
          pendsList.push(deserializePendingPermitFromFirestore(doc.id, doc.data()));
        } catch (err) {
          console.error("Failed to deserialize pending permit:", doc.id, err);
        }
      });

      if (pendsList.length > 0) {
        setPendingPermits(pendsList);
      } else {
        console.log("[Firebase] Firestore 'pendingPermits' is empty. Seeding defaults...");
        for (const p of DEFAULT_PENDING_PERMITS) {
          try {
            const serialized = serializePendingPermitForFirestore(p);
            await setDoc(doc(db, "pendingPermits", p.id), serialized);
          } catch (e) {
            console.warn("Could not seed pending permit to Firestore:", e);
          }
        }
      }
    }, (error) => {
      console.warn("[Firebase] Failed to listen to 'pendingPermits' collection:", error);
      try {
        handleFirestoreError(error, OperationType.GET, "pendingPermits");
      } catch (err) {
        // Log formatted Firestore error without throwing uncaught runtime exception
      }
    });

    const qNotifs = query(collection(db, "notifications"));
    const unsubscribeNotifs = onSnapshot(qNotifs, async (snapshot) => {
      const notifsList: KongoNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifsList.push({
          id: doc.id,
          title: data.title || "",
          message: data.message || "",
          type: data.type || "INFO",
          severity: data.severity || "INFO",
          locationId: data.locationId || undefined,
          locationTitle: data.locationTitle || undefined,
          timestamp: data.timestamp || "Récemment",
          read: !!data.read,
          source: data.source || undefined,
        });
      });

      if (notifsList.length > 0) {
        setNotifications(notifsList);
        localStorage.setItem("kongo_notifications", JSON.stringify(notifsList));
      } else {
        console.log("[Firebase] Firestore 'notifications' is empty. Seeding defaults...");
        for (const notif of DEFAULT_NOTIFICATIONS) {
          try {
            await setDoc(doc(db, "notifications", notif.id), notif);
          } catch (e) {
            console.warn("Could not seed notification to Firestore:", e);
          }
        }
      }
    }, (error) => {
      console.warn("[Firebase] Failed to listen to 'notifications' collection:", error);
    });

    return () => {
      unsubscribeLocs();
      unsubscribeCircuits();
      unsubscribePending();
      unsubscribeNotifs();
    };
  }, []);

  // Save / Unsaves offline locations workflow
  const handleToggleSave = (locId: string) => {
    let updatedSaves: string[];
    if (savedLocationIds.includes(locId)) {
      updatedSaves = savedLocationIds.filter(id => id !== locId);
      alert("Destination retirée de votre carnet.");
    } else {
      updatedSaves = [...savedLocationIds, locId];
      alert("Fiche enregistrée avec succès pour consultation hors-ligne !");
    }
    setSavedLocationIds(updatedSaves);
    localStorage.setItem("kongo_saved_locations", JSON.stringify(updatedSaves));
  };

  const handleRemoveSave = (locId: string) => {
    const updatedSaves = savedLocationIds.filter(id => id !== locId);
    setSavedLocationIds(updatedSaves);
    localStorage.setItem("kongo_saved_locations", JSON.stringify(updatedSaves));
  };

  // Quick capture note addition
  const handleItemCaptured = async (newPermit: PendingPermit) => {
    if (isFirebaseConfigured) {
      try {
        const serialized = serializePendingPermitForFirestore(newPermit);
        await setDoc(doc(db, "pendingPermits", serialized.id), serialized);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `pendingPermits/${newPermit.id}`);
      }
    } else {
      setPendingPermits(prev => [newPermit, ...prev]);
    }
  };

  // Admin database modification callbacks
  const handleAddLocation = async (newLoc: Location) => {
    const safeLoc = { ...newLoc, id: newLoc.id || `loc-${Date.now()}` };
    console.log(`[SaveWorkflow] Initiating location add for ID '${safeLoc.id}' ('${safeLoc.title}')`);
    
    // 1. Update React state immediately for snappy UI
    setLocations(prev => {
      const next = [...prev.filter(l => l.id !== safeLoc.id), safeLoc];
      localStorage.setItem("kongo_custom_locations", JSON.stringify(next));
      return next;
    });
    
    // 2. Persist to local IndexedDB for offline persistence
    await saveSingleLocationToDB(safeLoc);
    console.log(`[SaveWorkflow OK] IndexedDB write completed for '${safeLoc.id}'`);

    // 3. Persist to Firebase Firestore if configured
    if (isFirebaseConfigured) {
      try {
        const serialized = serializeLocationForFirestore(safeLoc);
        await setDoc(doc(db, "locations", serialized.id), serialized);
        console.log(`[SaveWorkflow OK] Firestore setDoc verified for location ID '${serialized.id}'`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `locations/${safeLoc.id}`);
      }
    }
  };

  const handleUpdateLocation = async (updatedLoc: Location) => {
    console.log(`[SaveWorkflow] Initiating location update for ID '${updatedLoc.id}' ('${updatedLoc.title}')`);
    
    // 1. Update React state
    setLocations(prev => {
      const next = prev.map(l => l.id === updatedLoc.id ? updatedLoc : l);
      localStorage.setItem("kongo_custom_locations", JSON.stringify(next));
      return next;
    });
    
    // 2. Persist to local IndexedDB
    await saveSingleLocationToDB(updatedLoc);
    console.log(`[SaveWorkflow OK] IndexedDB update completed for '${updatedLoc.id}'`);

    // 3. Persist to Firebase Firestore if configured
    if (isFirebaseConfigured) {
      try {
        const serialized = serializeLocationForFirestore(updatedLoc);
        await setDoc(doc(db, "locations", serialized.id), serialized);
        console.log(`[SaveWorkflow OK] Firestore setDoc update verified for location ID '${serialized.id}'`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `locations/${updatedLoc.id}`);
      }
    }
  };

  const handleDeleteLocation = async (id: string) => {
    console.log(`[SaveWorkflow] Initiating location deletion for ID '${id}'`);
    
    // 1. Update React state
    setLocations(prev => {
      const next = prev.filter(l => l.id !== id);
      localStorage.setItem("kongo_custom_locations", JSON.stringify(next));
      return next;
    });
    
    // 2. Delete from local IndexedDB
    await deleteLocationFromDB(id);
    console.log(`[SaveWorkflow OK] IndexedDB deletion completed for '${id}'`);

    // 3. Delete from Firebase Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "locations", id));
        console.log(`[SaveWorkflow OK] Firestore deleteDoc verified for location ID '${id}'`);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `locations/${id}`);
      }
    }
  };

  const handleUpdatePendingPermit = async (updated: PendingPermit) => {
    if (isFirebaseConfigured) {
      try {
        const serialized = serializePendingPermitForFirestore(updated);
        await setDoc(doc(db, "pendingPermits", serialized.id), serialized);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `pendingPermits/${updated.id}`);
      }
    } else {
      try {
        await fetch(`/api/pending/${updated.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.error("Failed to update pending permit locally:", err);
      }
      setPendingPermits(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  const handleDeletePendingPermit = async (id: string) => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "pendingPermits", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `pendingPermits/${id}`);
      }
    } else {
      try {
        await fetch(`/api/pending/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete pending permit locally:", err);
      }
      setPendingPermits(prev => prev.filter(p => p.id !== id));
    }
  };

  // Map state to full SavedLocation shape for SavedOfflineView
  const mappedSavedLocations: SavedLocation[] = savedLocationIds.map(id => {
    const matchedLoc = locations.find(l => l.id === id);
    return {
      id: `saved-${id}`,
      locationId: id,
      title: matchedLoc?.title || "Fiche de voyage",
      image: matchedLoc?.image || "",
      savedAt: new Date().toLocaleDateString("fr-FR")
    };
  });

  // Navigation tab indicators
  const isDetailPage = location.pathname.startsWith("/destinations/") && location.pathname !== "/destinations";
  const isAdminPage = location.pathname.startsWith("/admin");
  const showBottomNav = !isDetailPage && !isAdminPage;

  const isExploreActive = location.pathname === "/" || location.pathname === "/explore";
  const isMapActive = location.pathname === "/carte" || location.pathname === "/map";
  const isCircuitsActive = location.pathname === "/circuits";
  const isSavedActive = location.pathname === "/carnet" || location.pathname === "/saved";
  const isTipsActive = location.pathname === "/conseils" || location.pathname === "/tips";

  return (
    <div className="min-h-screen bg-background text-on-background relative flex flex-col pb-20">
      {/* 3D Immersive Intro Splash Screen */}
      {showSplash && <IntroSplash onComplete={() => setShowSplash(false)} />}
      {/* PWA Install Banner */}
      {showInstallBtn && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-primary border border-white/10 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between backdrop-blur-md bg-opacity-95 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-sans text-body-md font-bold">Kongo Central Explorer</h3>
              <p className="text-white/80 text-[11px] leading-tight">Installez l'application pour y accéder hors ligne à tout moment.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setShowInstallBtn(false)}
              className="text-white/60 hover:text-white px-2 py-1 text-xs font-sans font-semibold cursor-pointer"
            >
              Plus tard
            </button>
            <button 
              onClick={handleInstallClick}
              className="bg-secondary text-white px-4 py-2 rounded-full font-sans text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Installer
            </button>
          </div>
        </div>
      )}

      {/* Offline Status Badge */}
      {!isOnline && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-orange-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-sans text-xs font-semibold animate-pulse">
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          <span>Mode hors connexion actif</span>
        </div>
      )}

      {/* Dynamic Screen Content with Smooth Route Transitions */}
      <div className="flex-1 flex flex-col relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full flex-1 flex flex-col"
          >
            <Routes location={location}>
              {/* Public Routes from sitemap.xml */}
              <Route
                path="/"
                element={
                  <ExploreView
                    locations={locations}
                    pendingPermits={pendingPermits}
                    onSelectLocation={handleSelectLocation}
                    onNavigate={handleNavigate}
                    onOpenCapture={() => setIsCaptureOpen(true)}
                    savedLocationIds={savedLocationIds}
                    onToggleSave={handleToggleSave}
                    notifications={notifications}
                    unreadNotificationsCount={unreadNotificationsCount}
                    onOpenNotifications={() => setIsNotificationModalOpen(true)}
                  />
                }
              />
              <Route path="/explore" element={<Navigate to="/" replace />} />
              <Route
                path="/destinations"
                element={
                  <ListView
                    locations={locations}
                    pendingPermits={pendingPermits}
                    onSelectLocation={handleSelectLocation}
                    onNavigate={handleNavigate}
                    onOpenCapture={() => setIsCaptureOpen(true)}
                  />
                }
              />
              <Route path="/list" element={<Navigate to="/destinations" replace />} />
              <Route
                path="/carte"
                element={
                  <MapView
                    locations={locations}
                    onSelectLocation={handleSelectLocation}
                    onNavigate={handleNavigate}
                    unreadNotificationsCount={unreadNotificationsCount}
                    onOpenNotifications={() => setIsNotificationModalOpen(true)}
                  />
                }
              />
              <Route path="/map" element={<Navigate to="/carte" replace />} />
              <Route
                path="/circuits"
                element={
                  <CircuitsView
                    locations={locations}
                    circuits={circuits}
                    onSelectLocation={handleSelectLocation}
                    onNavigate={handleNavigate}
                  />
                }
              />
              <Route
                path="/conseils"
                element={<LocalTipsView />}
              />
              <Route path="/tips" element={<Navigate to="/conseils" replace />} />
              <Route
                path="/carnet"
                element={
                  <SavedOfflineView
                    savedLocations={mappedSavedLocations}
                    locations={locations}
                    onSelectLocation={handleSelectLocation}
                    onNavigate={handleNavigate}
                    onRemoveSave={handleRemoveSave}
                  />
                }
              />
              <Route path="/saved" element={<Navigate to="/carnet" replace />} />
              <Route
                path="/destinations/:id"
                element={
                  <DetailRouteWrapper
                    locations={locations}
                    onNavigate={handleNavigate}
                    savedLocationIds={savedLocationIds}
                    onToggleSave={handleToggleSave}
                    onUpdateLocation={handleUpdateLocation}
                    isAdminAuthenticated={isAdminAuthenticated}
                  />
                }
              />

              {/* Administration Routes */}
              <Route
                path="/admin/login"
                element={
                  isAdminAuthenticated ? (
                    <Navigate to="/admin" replace />
                  ) : (
                    <AdminLoginView
                      onLoginSuccess={() => {
                        setIsAdminAuthenticated(true);
                        sessionStorage.setItem("kongo_admin_authenticated", "true");
                        navigate("/admin");
                      }}
                      onCancel={() => navigate("/")}
                    />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  !isAdminAuthenticated ? (
                    <AdminLoginView
                      onLoginSuccess={() => {
                        setIsAdminAuthenticated(true);
                        sessionStorage.setItem("kongo_admin_authenticated", "true");
                        navigate("/admin");
                      }}
                      onCancel={() => navigate("/")}
                    />
                  ) : (
                    <AdminPanelView
                      locations={locations}
                      circuits={circuits}
                      pendingPermits={pendingPermits}
                      onAddLocation={handleAddLocation}
                      onUpdateLocation={handleUpdateLocation}
                      onDeleteLocation={handleDeleteLocation}
                      onUpdatePendingPermit={handleUpdatePendingPermit}
                      onDeletePendingPermit={handleDeletePendingPermit}
                      onSaveCircuit={handleSaveCircuit}
                      onAddCircuit={handleAddCircuit}
                      onDeleteCircuit={handleDeleteCircuit}
                      onLogout={() => {
                        setIsAdminAuthenticated(false);
                        sessionStorage.removeItem("kongo_admin_authenticated");
                        navigate("/");
                      }}
                    />
                  )
                }
              />
              <Route path="/admin/panel" element={<Navigate to="/admin" replace />} />

              {/* 404 Fallback Route for non-existent pages */}
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Bottom Navigation Bar */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-outline-variant/30 z-50 flex items-center justify-around px-2 shadow-2xl backdrop-blur-md">
          <Link 
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`flex flex-col items-center justify-center w-14 h-14 transition-all rounded-xl cursor-pointer no-underline ${
              isExploreActive 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
            title="Explorer les merveilles du Kongo"
          >
            <span className={`material-symbols-outlined text-[22px] ${isExploreActive ? "fill text-primary" : "text-outline"}`}>
              explore
            </span>
            <span className="text-[10px] font-sans mt-0.5 font-semibold">Explorer</span>
          </Link>

          <Link 
            to="/carte"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`flex flex-col items-center justify-center w-14 h-14 transition-all rounded-xl cursor-pointer no-underline ${
              isMapActive 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
            title="Carte interactive du Kongo Central"
          >
            <span className={`material-symbols-outlined text-[22px] ${isMapActive ? "fill text-primary" : "text-outline"}`}>
              near_me
            </span>
            <span className="text-[10px] font-sans mt-0.5 font-semibold">Carte</span>
          </Link>

          <Link 
            to="/circuits"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`flex flex-col items-center justify-center w-14 h-14 transition-all rounded-xl cursor-pointer no-underline ${
              isCircuitsActive 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
            title="Circuits & Itinéraires thématiques"
          >
            <span className={`material-symbols-outlined text-[22px] ${isCircuitsActive ? "fill text-primary" : "text-outline"}`}>
              route
            </span>
            <span className="text-[10px] font-sans mt-0.5 font-semibold">Circuits</span>
          </Link>

          <Link 
            to="/carnet"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`flex flex-col items-center justify-center w-14 h-14 transition-all rounded-xl cursor-pointer no-underline ${
              isSavedActive 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
            title="Carnet de voyage hors-ligne"
          >
            <span className={`material-symbols-outlined text-[22px] ${isSavedActive ? "fill text-primary" : "text-outline"}`}>
              bookmark
            </span>
            <span className="text-[10px] font-sans mt-0.5 font-semibold">Carnet</span>
          </Link>

          <Link 
            to="/conseils"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`flex flex-col items-center justify-center w-14 h-14 transition-all rounded-xl cursor-pointer no-underline ${
              isTipsActive 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
            title="Conseils pratiques, météo et culture"
          >
            <span className={`material-symbols-outlined text-[22px] ${isTipsActive ? "fill text-primary" : "text-outline"}`}>
              info
            </span>
            <span className="text-[10px] font-sans mt-0.5 font-semibold">Conseils</span>
          </Link>
        </nav>
      )}

      {/* Capture Modal overlay */}
      <QuickCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onItemAdded={handleItemCaptured}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onToggleRead={handleToggleNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onAddNotification={handleAddNotification}
        onSelectLocation={handleSelectLocation}
        locations={locations}
      />
    </div>
  );
}
