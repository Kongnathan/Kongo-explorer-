import React, { useState, useRef, useEffect } from "react";
import { notify } from "../lib/feedback";
import { Location } from "../types";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import L from "leaflet";
import { getUserGeolocation } from "../lib/geoUtils";
import { getGeoPermissionState } from "../lib/locationPermission";
import LocationHelpModal, { LocationHelpMode } from "./LocationHelpModal";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  (typeof window !== "undefined" ? localStorage.getItem("kongo_google_maps_key") : null) ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY !== "";

interface MapViewProps {
  locations: Location[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
}

// Helper component to pan Google Maps smoothly when selected marker or user GPS changes
function GoogleMapRecenter({ center, zoom }: { center: { lat: number; lng: number } | null; zoom?: number }) {
  let map: any = null;
  try {
    map = useMap();
  } catch {
    map = null;
  }
  useEffect(() => {
    if (map && center && typeof center.lat === "number" && typeof center.lng === "number") {
      map.panTo(center);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

export default function MapView({
  locations,
  onSelectLocation,
  onNavigate,
}: MapViewProps) {
  const [activeMarkerId, setActiveId] = useState<string | null>("zongo");
  const [activeChip, setActiveChip] = useState("Tous");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState({ x: 0, y: 0 });

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  // Map Mode Selector: "google" (par défaut, mis en avant) | "osm" (OpenStreetMap) | "topographic"
  const [mapMode, setMapMode] = useState<"google" | "osm" | "topographic">("google");
  // Map Type Selector: "roadmap" (plan classique) | "satellite" (vue satellite)
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  // Panneau d'aide qui explique les modes de la carte en mots simples
  const [showMapHelp, setShowMapHelp] = useState(false);

  // Leaflet references
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // User GPS Tracking States
  const [userPos, setUserPos] = useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
    accuracy?: number;
    isMocked?: boolean;
    label?: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  // Fenêtre d'aide pour la localisation (explication, bouton bloqué, réglages, choix d'une ville)
  const [locationHelp, setLocationHelp] = useState<LocationHelpMode | null>(null);
  const stuckTimerRef = useRef<number | null>(null);

  const clearStuckTimer = () => {
    if (stuckTimerRef.current !== null) {
      window.clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
  };

  const closeLocationHelp = () => {
    try {
      sessionStorage.setItem("kongo_loc_intro_seen", "1");
    } catch {
      // Stockage indisponible : ce n'est pas grave.
    }
    setLocationHelp(null);
  };

  // Transforme une position GPS en point sur la carte topographique
  const projectToTopo = (lat: number, lng: number) => {
    let x = 50;
    let y = 50;
    const inKongoCentral = lat >= -6.2 && lat <= -4.0 && lng >= 12.0 && lng <= 16.0;

    if (inKongoCentral) {
      x = 10 + ((lng - 12.35) / (15.3 - 12.35)) * 80;
      y = 15 + ((lat - -4.3) / (-5.9 - -4.3)) * 70;
    } else {
      // Projection stable : deux positions différentes donnent deux points différents
      x = 35 + (Math.abs(lng) % 30);
      y = 40 + (Math.abs(lat) % 30);
    }

    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(15, Math.min(85, y)),
    };
  };

  const applyPosition = (
    lat: number,
    lng: number,
    accuracy: number | undefined,
    isMocked: boolean,
    announce: boolean,
    label?: string
  ) => {
    const { x, y } = projectToTopo(lat, lng);
    setUserPos({ x, y, lat, lng, accuracy, isMocked, label });
    setIsLocating(false);

    if (announce) {
      setActiveId("user_gps");
      setZoomLevel(1.3);
      if (label) {
        showToast(`📍 Position choisie : ${label}`);
      } else if (isMocked) {
        showToast("ℹ️ Votre position n'a pas été trouvée. Nous montrons un point d'exemple : les chutes de Zongo.");
      } else {
        showToast("📍 Votre position a été trouvée.");
      }
    }
  };

  const handleGetGPSLocation = (silent = false) => {
    setIsLocating(true);
    setGpsError(null);
    clearStuckTimer();

    let finished = false;

    // Si la fenêtre d'autorisation reste sans réponse, c'est souvent une application affichée par-dessus.
    if (!silent) {
      stuckTimerRef.current = window.setTimeout(async () => {
        if (finished) return;
        if ((await getGeoPermissionState()) === "prompt") {
          setLocationHelp("stuck");
        }
      }, 8000);
    }

    getUserGeolocation(
      (pos) => {
        finished = true;
        clearStuckTimer();
        setLocationHelp(null);
        applyPosition(pos.lat, pos.lng, pos.accuracy, pos.isMocked || false, true);

        // Suivi continu pour mettre la position à jour pendant que vous bougez
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            applyPosition(watchPos.coords.latitude, watchPos.coords.longitude, watchPos.coords.accuracy, false, false);
          },
          (err) => console.warn("Watch position update error:", err),
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
        );
      },
      (errorMsg, fallbackPos, reason) => {
        finished = true;
        clearStuckTimer();
        setIsLocating(false);
        setGpsError(errorMsg);

        if (fallbackPos) {
          applyPosition(fallbackPos.lat, fallbackPos.lng, fallbackPos.accuracy, true, true);
        }

        if (!silent) {
          showToast(`⚠️ ${errorMsg}`);
          if (reason === "denied") {
            setLocationHelp("denied");
          } else if (reason === "unavailable" || reason === "timeout") {
            setLocationHelp("unavailable");
          }
        }
      },
      { timeoutMs: 15000 }
    );
  };

  // L'utilisateur choisit sa ville à la main (quand la localisation ne marche pas)
  const handlePickPlace = (place: { name: string; lat: number; lng: number }) => {
    clearStuckTimer();
    setLocationHelp(null);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    applyPosition(place.lat, place.lng, undefined, true, true, place.name);
  };

  // À l'ouverture de la carte : on cherche la position seulement si elle est déjà autorisée.
  // Si elle n'a jamais été demandée, on explique d'abord, avant que le téléphone pose la question.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const state = await getGeoPermissionState();
      if (cancelled) return;

      if (state === "prompt") {
        let alreadySeen = false;
        try {
          alreadySeen = sessionStorage.getItem("kongo_loc_intro_seen") === "1";
        } catch {
          // Stockage indisponible : on affiche l'explication.
        }
        if (!alreadySeen) setLocationHelp("intro");
      } else if (state !== "denied") {
        handleGetGPSLocation(true);
      }
    })();

    return () => {
      cancelled = true;
      clearStuckTimer();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const categories = [
    { name: "Tous", icon: "apps", color: "bg-primary text-white" },
    { name: "Incontournables", icon: "star", color: "bg-amber-500 text-white" },
    { name: "Nature", icon: "forest", color: "bg-emerald-600 text-white" },
    { name: "Histoire", icon: "history_edu", color: "bg-orange-700 text-white" },
    { name: "Urbain", icon: "location_city", color: "bg-blue-600 text-white" }
  ];

  // Dynamically filter markers based on active tab
  const activeCategoryLocations = locations.filter(loc => {
    if (loc.status !== "PUBLISHED") return false;
    if (activeChip === "Tous") return true;
    return loc.category === activeChip || loc.id === activeMarkerId;
  });

  // Render markers inside OpenStreetMap (Leaflet)
  const renderLeafletMarkers = () => {
    if (!mapRef.current) return;
    
    if (!markersLayerGroupRef.current) {
      markersLayerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    } else {
      markersLayerGroupRef.current.clearLayers();
    }

    // Add markers for current category locations
    activeCategoryLocations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return;

      const isActive = activeMarkerId === loc.id;
      
      const markerHtml = `
        <div class="flex items-center justify-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300 ${
            isActive 
              ? "bg-red-500 border-white text-white scale-110 ring-4 ring-red-500/30" 
              : "bg-emerald-600 border-white text-white hover:bg-emerald-700 hover:scale-105"
          }">
            <span class="material-symbols-outlined" style="font-size: 16px; display: block; line-height: 1;">location_on</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-leaflet-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([loc.lat, loc.lng], { icon: customIcon })
        .addTo(markersLayerGroupRef.current!)
        .on("click", () => {
          setActiveId(isActive ? null : loc.id);
        });
    });

    // Add user position if present
    if (userPos && userPos.lat && userPos.lng) {
      const isUserActive = activeMarkerId === "user_gps";
      const userMarkerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping"></div>
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 bg-blue-600 border-white text-white ${
            isUserActive ? "ring-4 ring-blue-500/30 scale-110" : ""
          }">
            <span class="material-symbols-outlined" style="font-size: 16px; display: block; line-height: 1;">person</span>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: "user-leaflet-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([userPos.lat, userPos.lng], { icon: userIcon })
        .addTo(markersLayerGroupRef.current!)
        .on("click", () => {
          setActiveId(isUserActive ? null : "user_gps");
        });
    }
  };

  const useLeaflet = mapMode === "osm" || (mapMode === "google" && !hasValidKey);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!useLeaflet || !containerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerGroupRef.current = null;
        tileLayerRef.current = null;
      }
      return;
    }

    let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    if (mapMode === "google") {
      tileUrl = mapType === "satellite"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    } else {
      tileUrl = mapType === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }

    if (!mapRef.current) {
      // Create map instance
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-5.3, 14.1], 8.2);

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 19,
      }).addTo(map);

      // Add attribution control manually
      L.control.attribution({ position: "bottomright" }).addTo(map);

      mapRef.current = map;

      // Invalidate size to prevent tile clipping/gray box bugs
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(tileUrl);
      }
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 250);
    }

    renderLeafletMarkers();

    return () => {
      // kept simple
    };
  }, [mapMode, mapType, activeChip, userPos]);

  // Update markers when activeMarkerId changes
  useEffect(() => {
    if (useLeaflet && mapRef.current) {
      renderLeafletMarkers();
    }
  }, [activeMarkerId, useLeaflet]);

  // Pan Leaflet map to selected coordinates
  useEffect(() => {
    if (useLeaflet && mapRef.current && activeMarkerId) {
      if (activeMarkerId === "user_gps" && userPos) {
        mapRef.current.flyTo([userPos.lat, userPos.lng], 10, { duration: 1.5 });
      } else {
        const selectedLoc = locations.find(l => l.id === activeMarkerId);
        if (selectedLoc && selectedLoc.lat && selectedLoc.lng) {
          mapRef.current.flyTo([selectedLoc.lat, selectedLoc.lng], 10, { duration: 1.5 });
        }
      }
    }
  }, [activeMarkerId, useLeaflet]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.8));
    setMapCenter({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 h-dvh w-screen flex flex-col bg-background text-on-background relative overflow-hidden animate-fade-in font-sans">
      <h1 className="sr-only">Carte interactive du Kongo Central</h1>

      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm h-16">
        <div className="relative flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-full">
          {/* Subtle watermark background logo */}
          <div 
            className="absolute inset-0 bg-[url('/icon.svg')] bg-no-repeat bg-center bg-contain opacity-[0.08] pointer-events-none -z-10" 
            id="header-bg-logo-map"
          />
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate("explore"); }}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            title="Kongo Explorer – Accueil"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 overflow-hidden border border-primary/20">
              <img src="/icon.svg" className="w-full h-full object-contain" alt="Logo Kongo Explorer" />
            </div>
            <span className="font-sans text-headline-md font-bold text-primary">Kongo Explorer</span>
          </a>
          <span className="text-on-surface-variant text-xs font-mono font-semibold bg-surface-container px-3 py-1 rounded-full">
            {mapMode === "google" ? "Mode Google Maps" : mapMode === "osm" ? "Mode OpenStreetMap" : "Mode Topographique"}
          </span>
        </div>
      </header>

      {/* Map Content Area */}
      <main className="flex-1 relative overflow-hidden h-full w-full">
        
        {/* Toggle between Google Maps, OpenStreetMap, and Topographic + Plan/Satellite Toggle */}
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-[95vw]">
          <div className="flex flex-col sm:flex-row items-center gap-2 max-w-[95vw]">
          <div className="flex bg-surface-container-lowest/90 backdrop-blur-md rounded-full p-1 shadow-lg border border-outline-variant/20 max-w-[90vw] overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setMapMode("google");
              }}
              className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                mapMode === "google"
                  ? "bg-primary text-white shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span>Google Maps 🗺️</span>
              <span className="text-[10px] font-mono bg-white/20 text-white px-1.5 py-0.2 rounded-full uppercase">Par défaut</span>
            </button>

            <button
              onClick={() => setMapMode("osm")}
              className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                mapMode === "osm"
                  ? "bg-primary text-white shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              OpenStreetMap (Open Maps) 🌐
            </button>

            <button
              onClick={() => setMapMode("topographic")}
              className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                mapMode === "topographic"
                  ? "bg-primary text-white shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              Carte Topo 🎨
            </button>
          </div>

          {/* Plan / Satellite Toggle Pill */}
          <div className="flex bg-surface-container-lowest/95 backdrop-blur-md rounded-full p-1 shadow-lg border border-outline-variant/30 items-center gap-0.5">
            <button
              onClick={() => setMapType("roadmap")}
              className={`px-3 py-1 rounded-full font-sans text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                mapType === "roadmap"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              title="Plan : dessin simple avec les routes et les noms des lieux"
            >
              <span className="material-symbols-outlined text-[15px]">map</span>
              <span>Plan</span>
            </button>
            <button
              onClick={() => setMapType("satellite")}
              className={`px-3 py-1 rounded-full font-sans text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                mapType === "satellite"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              title="Satellite : photos prises du ciel, pour voir les lieux tels qu'ils sont"
            >
              <span className="material-symbols-outlined text-[15px]">satellite_alt</span>
              <span>Satellite</span>
            </button>
          </div>
          </div>

          {/* Explications simples, centrées, pour savoir à quoi sert chaque mode */}
          <div className="w-[min(92vw,26rem)] text-center space-y-1.5">
            <div>
              <button
                onClick={() => setShowMapHelp(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 hover:bg-primary text-white text-[11px] font-bold shadow-md transition-all cursor-pointer active:scale-95"
                aria-expanded={showMapHelp}
              >
                <span className="material-symbols-outlined text-[15px]">{showMapHelp ? "close" : "help"}</span>
                {showMapHelp ? "Fermer l'aide" : "À quoi servent ces boutons ?"}
              </button>
            </div>

            {showMapHelp && (
              <div className="bg-surface-container-lowest/97 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-primary/20 text-center space-y-2.5 animate-fade-in max-h-[50vh] overflow-y-auto">
                <h2 className="font-sans text-sm font-bold text-primary">Bien choisir sa carte</h2>
                <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                  <p>
                    <strong className="text-on-surface">Plan</strong> : un dessin simple avec les routes et les noms. Idéal en ville.
                  </p>
                  <p>
                    <strong className="text-on-surface">Satellite</strong> : des photos prises du ciel : forêts, rivières, chutes, état des chemins. Peut être lent si le réseau est faible.
                  </p>
                  <p>
                    <strong className="text-on-surface">Google Maps</strong> : la plus complète, avec le chemin pour y aller.
                  </p>
                  <p>
                    <strong className="text-on-surface">OpenStreetMap</strong> : carte gratuite, avec souvent de petits chemins.
                  </p>
                  <p>
                    <strong className="text-on-surface">Carte Topo</strong> : relief et zones naturelles.
                  </p>
                  <p>
                    <strong className="text-on-surface">Le bouton rond de position</strong> : montre où vous êtes sur la carte.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMapHelp(false);
                      setLocationHelp("help");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-on-surface text-[11px] font-bold cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[15px]">location_off</span>
                    Ma position ne s'affiche pas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notification Overlay */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl border border-primary/20 flex items-center gap-2.5 text-xs font-sans font-bold text-on-surface animate-fade-in max-w-[90vw]">
            <span className="material-symbols-outlined text-primary text-[18px]">my_location</span>
            <span>{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              className="ml-2 text-outline hover:text-on-surface p-0.5 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {/* MAP RENDER AREA */}
        {mapMode === "topographic" ? (
          /* Custom topographic simulated map layer */
          <div 
            className="absolute inset-0 z-0 map-canvas bg-slate-900 select-none overflow-hidden"
            onClick={() => setActiveId(null)}
            style={{ cursor: "grab" }}
          >
            <div 
              className="w-full h-full bg-cover bg-center transition-all duration-300 ease-out origin-center opacity-85"
              style={{ 
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDY1sxM2gXxGhPTenAZFDTtHkNIM_kGsmkUhhcOL_wHd7dCI6CF0L5Bjxxx_NC-PG5GlYJGZyz2aS6AmZMPki19YgU36qRobW9U5TDX12uNM4DRR2GmIB6Cg-7oyOmQeP_WdZWBc1PYMBjTsv5sRE7Z_349_OfE1yF6lHTYLwScCQB2iLxJdEUAOemJ5xN7J3TXzDstDmR2KMhX8v4rk686DUc3y4UPmQ9ZOadY1vw2Oa9QkDXhZJRS3Q')",
                transform: `scale(${zoomLevel}) translate(${mapCenter.x}px, ${mapCenter.y}px)`
              }}
            ></div>
          </div>
        ) : useLeaflet ? (
          /* Live OpenStreetMap Interactive Component */
          <div 
            ref={containerRef} 
            className="absolute inset-0 z-0 h-full w-full"
            style={{ outline: "none" }}
          />
        ) : (
          /* Live Google Maps Interactive Component */
          <div className="absolute inset-0 z-0 h-full w-full">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: -5.3, lng: 14.1 }} // Focus on Kongo Central Matadi/Mbanza-Ngungu center
                defaultZoom={8.2}
                mapId="DEMO_MAP_ID"
                mapTypeId={mapType === "satellite" ? "hybrid" : "roadmap"}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: "100%", height: "100%" }}
                mapTypeControl={true}
                gestureHandling="greedy"
              >
                <GoogleMapRecenter 
                  center={
                    activeMarkerId === "user_gps" && userPos
                      ? { lat: userPos.lat, lng: userPos.lng }
                      : activeMarkerId
                        ? (() => {
                            const loc = locations.find(l => l.id === activeMarkerId);
                            return loc && loc.lat && loc.lng ? { lat: loc.lat, lng: loc.lng } : null;
                          })()
                        : null
                  } 
                  zoom={activeMarkerId === "user_gps" ? 11 : 10}
                />

                {activeCategoryLocations.map(loc => {
                  if (!loc.lat || !loc.lng) return null;
                  const isActive = activeMarkerId === loc.id;
                  return (
                    <AdvancedMarker
                      key={loc.id}
                      position={{ lat: loc.lat, lng: loc.lng }}
                      onClick={() => setActiveId(isActive ? null : loc.id)}
                    >
                      <Pin 
                        background={isActive ? "#ef4444" : "#0d9488"} 
                        borderColor={isActive ? "#b91c1c" : "#0f766e"} 
                        glyphColor="#fff" 
                      />
                    </AdvancedMarker>
                  );
                })}

                {userPos && (
                  <AdvancedMarker
                    position={{ lat: userPos.lat, lng: userPos.lng }}
                    onClick={() => setActiveId("user_gps")}
                    title="Votre position GPS"
                  >
                    <div className="relative flex items-center justify-center cursor-pointer group">
                      <div className="absolute -inset-3 rounded-full bg-blue-500/30 animate-ping"></div>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-xl border-2 border-white bg-blue-600 text-white font-bold ring-4 ring-blue-500/30 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[18px]">my_location</span>
                      </div>
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          </div>
        )}

        {/* Floating UI Overlays: Contextual Category Chips */}
        <div className="absolute top-4 left-0 right-0 z-20 overflow-x-auto no-scrollbar flex px-5 gap-2 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => {
                setActiveChip(cat.name);
                setActiveId(null); // Reset active popup
              }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl font-sans text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer border transition-all ${
                activeChip === cat.name
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/30"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* TOPOGRAPHIC MODE MARKERS */}
        {mapMode === "topographic" && activeCategoryLocations.map(loc => {
          const catConfig = categories.find(c => c.name === loc.category) || categories[0];
          const isActive = activeMarkerId === loc.id;
          return (
            <div
              key={loc.id}
              className="absolute z-10 cursor-pointer group"
              style={{ 
                top: `${loc.coords.y}%`, 
                left: `${loc.coords.x}%`,
                transform: "translate(-50%, -50%)"
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(isActive ? null : loc.id);
              }}
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping"></div>
                )}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-primary/10 transition-transform hover:scale-110 ${catConfig.color}`}>
                  <span className="material-symbols-outlined text-[15px] fill">{catConfig.icon}</span>
                </div>
              </div>

              {/* Custom Marker Info Window Popups (Topographic Map Mode) */}
              {isActive && (
                <div 
                  className="absolute bottom-11 left-1/2 -translate-x-1/2 w-60 p-4 rounded-2xl shadow-xl border border-outline-variant/30 bg-surface-container-lowest backdrop-blur-md animate-slide-up z-50 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                    {loc.category}
                  </span>
                  <h3 className="font-sans text-body-md font-bold text-on-surface mt-1 mb-0.5">{loc.title}</h3>
                  <p className="text-on-surface-variant font-sans text-xs mb-3 leading-relaxed line-clamp-2">
                    {loc.description}
                  </p>
                  
                  <div className="flex gap-2 border-t border-outline-variant/10 pt-3">
                    <button 
                      onClick={() => onSelectLocation(loc.id)}
                      className="flex-1 bg-primary text-white py-2 rounded-xl font-sans text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      En savoir plus
                    </button>
                    <button 
                      onClick={() => {
                        notify(`Pour vous rendre à ${loc.title} (${loc.locationName}), consultez les Conseils de préparation (route ou randonnée) ou rapprochez-vous des écogardes.`, "info");
                      }}
                      className="bg-secondary text-white px-3 py-2 rounded-xl font-sans text-[11px] font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                      title="Conseils d'accès"
                    >
                      <span className="material-symbols-outlined text-[16px]">directions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* TOPOGRAPHIC MODE USER POSITION MARKER */}
        {mapMode === "topographic" && userPos && (
          <div
            className="absolute z-30 cursor-pointer"
            style={{ 
              top: `${userPos.y}%`, 
              left: `${userPos.x}%`,
              transform: "translate(-50%, -50%)"
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveId("user_gps");
            }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-14 h-14 bg-blue-500/30 rounded-full animate-ping"></div>
              <div className="absolute w-8 h-8 bg-blue-500/55 rounded-full"></div>
              <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              </div>
            </div>

            {/* User GPS Popup Window (Topographic Mode) */}
            {activeMarkerId === "user_gps" && (
              <div 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 p-4 rounded-2xl shadow-xl border border-blue-200 bg-blue-50/95 backdrop-blur-md animate-slide-up z-50 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    LIVE GPS
                  </span>
                  {userPos.isMocked && (
                    <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                      Projeté
                    </span>
                  )}
                </div>
                
                <h3 className="font-sans text-body-md font-bold text-blue-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">my_location</span>
                  Votre Position
                </h3>
                
                <p className="text-blue-800 font-sans text-xs mt-1 mb-2 leading-relaxed">
                  {userPos.isMocked 
                    ? "Votre position est montrée sur la carte du Kongo Central."
                    : "Votre téléphone a trouvé où vous êtes en ce moment."}
                </p>

                <div className="bg-white/85 rounded-xl p-2.5 space-y-1 text-[10px] font-mono text-blue-950 border border-blue-200/50">
                  <div>Lat : {userPos.lat.toFixed(5)}°</div>
                  <div>Lng : {userPos.lng.toFixed(5)}°</div>
                  <div>Précision : environ {Math.round(userPos.accuracy || 10)} m</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => {
                      setZoomLevel(1.5);
                      setMapCenter({ x: 0, y: 0 });
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-sans text-[11px] font-bold text-center active:scale-95 transition-all cursor-pointer"
                  >
                    Centrer
                  </button>
                  <button 
                    onClick={() => {
                      setUserPos(null);
                      setActiveId(null);
                    }}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-xl font-sans text-[11px] font-bold hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                    title="Désactiver"
                  >
                    Arrêter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE MAP FLOATING OVERLAY CARDS (MODERN BOTTOM DRAWER DESIGN) */}
        {(mapMode === "google" || mapMode === "osm") && activeMarkerId && activeMarkerId !== "user_gps" && (
          (() => {
            const selectedLoc = locations.find(l => l.id === activeMarkerId);
            if (!selectedLoc) return null;
            return (
              <div className="absolute bottom-6 left-6 z-20 max-w-sm w-[calc(100%-48px)] bg-surface-container-lowest/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-outline-variant/20 animate-slide-up">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {selectedLoc.category}
                  </span>
                  <button 
                    onClick={() => setActiveId(null)}
                    className="material-symbols-outlined text-outline hover:text-on-surface text-lg cursor-pointer"
                  >
                    close
                  </button>
                </div>
                
                <div className="flex gap-4">
                  {selectedLoc.image && (
                    <img 
                      src={selectedLoc.image} 
                      alt={selectedLoc.title} 
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-xl object-cover flex-none shadow-sm" 
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=300&auto=format&fit=crop&q=80";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans text-body-lg font-bold text-on-surface truncate">{selectedLoc.title}</h3>
                    <p className="text-on-surface-variant font-sans text-xs line-clamp-2 mt-0.5 leading-relaxed">
                      {selectedLoc.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-outline-variant/10 mt-4 pt-3">
                  <button 
                    onClick={() => onSelectLocation(selectedLoc.id)}
                    className="flex-1 bg-primary text-white py-2 rounded-xl font-sans text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    Fiche d'exploration
                  </button>
                  <button 
                    onClick={() => {
                      notify(`📍 ${selectedLoc.title}\nLatitude : ${selectedLoc.lat || "N/A"}°\nLongitude : ${selectedLoc.lng || "N/A"}°\nPour vous rendre sur place, contactez les guides locaux.`, "info");
                    }}
                    className="bg-secondary text-white px-3 py-2 rounded-xl font-sans text-[11px] font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    title="Coordonnées GPS"
                  >
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                  </button>
                </div>
              </div>
            );
          })()
        )}

        {/* INTERACTIVE MAP USER GPS FLOATING OVERLAY CARD */}
        {(mapMode === "google" || mapMode === "osm") && activeMarkerId === "user_gps" && userPos && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[calc(100%-32px)] bg-surface-container-lowest/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-outline-variant/20 animate-slide-up">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                {userPos.isMocked ? "Simulé" : "Position Live GPS"}
              </span>
              <button 
                onClick={() => {
                  setActiveId(null);
                }}
                className="material-symbols-outlined text-outline hover:text-on-surface text-lg cursor-pointer"
              >
                close
              </button>
            </div>
            
            <h3 className="font-sans text-body-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">my_location</span>
              Votre position
            </h3>
            
            <p className="text-on-surface-variant font-sans text-xs mt-1 leading-relaxed">
              Latitude : {userPos.lat.toFixed(5)}°<br />
              Longitude : {userPos.lng.toFixed(5)}°<br />
              Précision : {userPos.accuracy ? `environ ${Math.round(userPos.accuracy)} mètres` : "non disponible"}
            </p>

            <div className="text-[10px] text-outline font-mono mt-3 border-t border-outline-variant/10 pt-2 flex justify-between items-center">
              <span>{userPos.label ? `Position choisie : ${userPos.label}.` : userPos.isMocked ? "Position d'exemple : chutes de Zongo." : "Position en direct activée."}</span>
              <button 
                onClick={() => {
                  setUserPos(null);
                  setActiveId(null);
                }}
                className="text-red-500 font-bold hover:underline cursor-pointer"
              >
                Désactiver
              </button>
            </div>
          </div>
        )}

        {/* Floating Controls (GPS Locate, Plan/Satellite Toggle, zoom controls) positioned on the left to separate from Guide Kongo AI */}
        <div className="absolute bottom-24 left-4 z-30 flex flex-col gap-3">

          {/* Plan vs Satellite Toggle Button */}
          <button 
            onClick={() => setMapType(mapType === "roadmap" ? "satellite" : "roadmap")}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
              mapType === "satellite" 
                ? "bg-amber-600 text-white border-amber-500 shadow-amber-900/20" 
                : "bg-surface-container-lowest text-primary border-outline-variant/30"
            }`}
            title={mapType === "roadmap" ? "Voir les photos du ciel (satellite)" : "Revenir au plan simple"}
          >
            <span className="material-symbols-outlined font-bold">
              {mapType === "satellite" ? "map" : "satellite_alt"}
            </span>
          </button>

          {/* GPS Locate Button */}
          <button 
            onClick={() => handleGetGPSLocation(false)}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
              isLocating 
                ? "bg-blue-100 text-blue-600 border-blue-300 animate-pulse" 
                : userPos 
                  ? "bg-blue-600 text-white border-blue-700" 
                  : "bg-surface-container-lowest text-primary border-outline-variant/30"
            }`}
            title="Voir où je me trouve sur la carte"
            disabled={isLocating}
          >
            {isLocating ? (
              <span className="animate-spin text-sm font-bold">⏳</span>
            ) : (
              <span className={`material-symbols-outlined font-bold ${userPos ? "text-white" : "text-primary"}`}>my_location</span>
            )}
          </button>
          
          {mapMode === "topographic" && (
            <div className="flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-lg">
              <button 
                onClick={handleZoomIn}
                className="w-12 h-12 flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer border-b border-outline-variant/10"
                title="Zoom +"
              >
                <span className="material-symbols-outlined font-bold">add</span>
              </button>
              <button 
                onClick={handleZoomOut}
                className="w-12 h-12 flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer"
                title="Zoom -"
              >
                <span className="material-symbols-outlined font-bold">remove</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <LocationHelpModal
        mode={locationHelp}
        onClose={closeLocationHelp}
        onRetry={() => {
          setLocationHelp(null);
          handleGetGPSLocation(false);
        }}
        onPickPlace={handlePickPlace}
      />
    </div>
  );
}
