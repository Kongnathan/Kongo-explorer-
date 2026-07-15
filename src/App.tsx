import React, { useState, useEffect } from "react";
import { Location, SavedLocation, PendingPermit } from "./types";
import { DEFAULT_LOCATIONS, DEFAULT_PENDING_PERMITS } from "./data";
import ExploreView from "./components/ExploreView";
import ListView from "./components/ListView";
import DetailView from "./components/DetailView";
import MapView from "./components/MapView";
import LocalTipsView from "./components/LocalTipsView";
import SavedOfflineView from "./components/SavedOfflineView";
import AdminLoginView from "./components/AdminLoginView";
import AdminPanelView from "./components/AdminPanelView";
import QuickCaptureModal from "./components/QuickCaptureModal";
import IntroSplash from "./components/IntroSplash";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseConfig";


export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("explore");
  const [prevTab, setPrevTab] = useState<string>("explore");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  
  // App data states
  const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
  const [pendingPermits, setPendingPermits] = useState<PendingPermit[]>(DEFAULT_PENDING_PERMITS);
  
  // Saved locations IDs (Persistent travel logs/offline bookmarks)
  const [savedLocationIds, setSavedLocationIds] = useState<string[]>([]);
  
  // UI states
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
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
            if (locs.length > 0) setLocations(locs);
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
        locsList.push({ id: doc.id, ...doc.data() } as Location);
      });

      if (locsList.length > 0) {
        setLocations(locsList);
      } else {
        // Automatically seed empty Firestore with defaults
        console.log("[Firebase] Firestore 'locations' collection is empty. Seeding defaults...");
        for (const loc of DEFAULT_LOCATIONS) {
          try {
            await setDoc(doc(db, "locations", loc.id), loc);
          } catch (e) {
            console.error("Failed to seed location:", loc.id, e);
          }
        }
      }
    }, (error) => {
      console.error("Firestore onSnapshot error for locations:", error);
    });

    const qPending = query(collection(db, "pendingPermits"));
    const unsubscribePending = onSnapshot(qPending, async (snapshot) => {
      const pendsList: PendingPermit[] = [];
      snapshot.forEach((doc) => {
        pendsList.push({ id: doc.id, ...doc.data() } as PendingPermit);
      });

      if (pendsList.length > 0) {
        setPendingPermits(pendsList);
      } else {
        console.log("[Firebase] Firestore 'pendingPermits' is empty. Seeding defaults...");
        for (const p of DEFAULT_PENDING_PERMITS) {
          try {
            await setDoc(doc(db, "pendingPermits", p.id), p);
          } catch (e) {
            console.error("Failed to seed pending permit:", p.id, e);
          }
        }
      }
    }, (error) => {
      console.error("Firestore onSnapshot error for pendingPermits:", error);
    });

    return () => {
      unsubscribeLocs();
      unsubscribePending();
    };
  }, []);

  // Handler to navigate between tabs
  const handleNavigate = (tab: string) => {
    setPrevTab(currentTab);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id);
    setPrevTab(currentTab);
    setCurrentTab("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackFromDetail = () => {
    setCurrentTab(prevTab === "detail" ? "explore" : prevTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        await setDoc(doc(db, "pendingPermits", newPermit.id), newPermit);
      } catch (err) {
        console.error("Failed to save pending permit to Firestore:", err);
      }
    } else {
      setPendingPermits(prev => [newPermit, ...prev]);
    }
  };

  // Admin database modification callbacks
  const handleAddLocation = async (newLoc: Location) => {
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, "locations", newLoc.id), newLoc);
      } catch (err) {
        console.error("Failed to save location to Firestore:", err);
      }
    } else {
      setLocations(prev => [...prev, newLoc]);
    }
  };

  const handleUpdateLocation = async (updatedLoc: Location) => {
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, "locations", updatedLoc.id), updatedLoc);
      } catch (err) {
        console.error("Failed to update location in Firestore:", err);
      }
    } else {
      setLocations(prev => prev.map(l => l.id === updatedLoc.id ? updatedLoc : l));
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "locations", id));
      } catch (err) {
        console.error("Failed to delete location from Firestore:", err);
      }
    } else {
      setLocations(prev => prev.filter(l => l.id !== id));
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

  // Render correct view panel
  const renderContent = () => {
    switch (currentTab) {
      case "explore":
        return (
          <ExploreView
            locations={locations}
            pendingPermits={pendingPermits}
            onSelectLocation={handleSelectLocation}
            onNavigate={handleNavigate}
            onOpenCapture={() => setIsCaptureOpen(true)}
            savedLocationIds={savedLocationIds}
            onToggleSave={handleToggleSave}
          />
        );
      case "list":
        return (
          <ListView
            locations={locations}
            pendingPermits={pendingPermits}
            onSelectLocation={handleSelectLocation}
            onNavigate={handleNavigate}
            onOpenCapture={() => setIsCaptureOpen(true)}
          />
        );
      case "map":
        return (
          <MapView
            locations={locations}
            onSelectLocation={handleSelectLocation}
            onNavigate={handleNavigate}
          />
        );
      case "saved":
        return (
          <SavedOfflineView
            savedLocations={mappedSavedLocations}
            locations={locations}
            onSelectLocation={handleSelectLocation}
            onNavigate={handleNavigate}
            onRemoveSave={handleRemoveSave}
          />
        );
      case "tips":
        return <LocalTipsView />;
      case "detail":
        if (!selectedLocationId) return null;
        return (
          <DetailView
            locationId={selectedLocationId}
            locations={locations}
            onBack={handleBackFromDetail}
            onNavigate={handleNavigate}
            savedLocationIds={savedLocationIds}
            onToggleSave={handleToggleSave}
          />
        );
      case "admin-login":
        if (isAdminAuthenticated) {
          setCurrentTab("admin-panel");
          return null;
        }
        return (
          <AdminLoginView
            onLoginSuccess={() => {
              setIsAdminAuthenticated(true);
              setCurrentTab("admin-panel");
            }}
            onCancel={() => handleNavigate("explore")}
          />
        );
      case "admin-panel":
        if (!isAdminAuthenticated) {
          setCurrentTab("admin-login");
          return null;
        }
        return (
          <AdminPanelView
            locations={locations}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            onLogout={() => {
              setIsAdminAuthenticated(false);
              handleNavigate("explore");
            }}
          />
        );
      default:
        return (
          <ExploreView
            locations={locations}
            pendingPermits={pendingPermits}
            onSelectLocation={handleSelectLocation}
            onNavigate={handleNavigate}
            onOpenCapture={() => setIsCaptureOpen(true)}
            savedLocationIds={savedLocationIds}
            onToggleSave={handleToggleSave}
          />
        );
    }
  };

  // Only render user-facing bottom bar if NOT on admin-login, admin-panel, or detail views
  const showBottomNav = ["explore", "map", "saved", "tips", "list"].includes(currentTab);

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

      {/* Dynamic Screen Content */}
      <div className="flex-1 flex flex-col">{renderContent()}</div>

      {/* Global Bottom Navigation Bar */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest border-t border-outline-variant/30 z-50 flex items-center justify-around px-2 shadow-2xl">
          <button 
            onClick={() => handleNavigate("explore")}
            className={`flex flex-col items-center justify-center w-16 h-16 transition-all rounded-xl cursor-pointer ${
              currentTab === "explore" 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${currentTab === "explore" ? "fill text-primary" : "text-outline"}`}>
              explore
            </span>
            <span className="text-[10px] font-sans mt-1 font-semibold">Découvrir</span>
          </button>

          <button 
            onClick={() => handleNavigate("map")}
            className={`flex flex-col items-center justify-center w-16 h-16 transition-all rounded-xl cursor-pointer ${
              currentTab === "map" 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${currentTab === "map" ? "fill text-primary" : "text-outline"}`}>
              map
            </span>
            <span className="text-[10px] font-sans mt-1 font-semibold">Carte</span>
          </button>

          <button 
            onClick={() => handleNavigate("saved")}
            className={`flex flex-col items-center justify-center w-16 h-16 transition-all rounded-xl cursor-pointer ${
              currentTab === "saved" 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${currentTab === "saved" ? "fill text-primary" : "text-outline"}`}>
              offline_pin
            </span>
            <span className="text-[10px] font-sans mt-1 font-semibold">Carnet</span>
          </button>

          <button 
            onClick={() => handleNavigate("tips")}
            className={`flex flex-col items-center justify-center w-16 h-16 transition-all rounded-xl cursor-pointer ${
              currentTab === "tips" 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${currentTab === "tips" ? "fill text-primary" : "text-outline"}`}>
              gavel
            </span>
            <span className="text-[10px] font-sans mt-1 font-semibold">Conseils</span>
          </button>

          <button 
            onClick={() => handleNavigate("list")}
            className={`flex flex-col items-center justify-center w-16 h-16 transition-all rounded-xl cursor-pointer ${
              currentTab === "list" 
                ? "text-primary font-bold scale-105" 
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${currentTab === "list" ? "fill text-primary" : "text-outline"}`}>
              list_alt
            </span>
            <span className="text-[10px] font-sans mt-1 font-semibold">Répertoire</span>
          </button>
        </nav>
      )}

      {/* Capture Modal overlay */}
      <QuickCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onItemAdded={handleItemCaptured}
      />
    </div>
  );
}
