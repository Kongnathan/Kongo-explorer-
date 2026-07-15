import React, { useState, useRef, useEffect } from "react";
import { Location } from "../types";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import L from "leaflet";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY !== "";

interface MapViewProps {
  locations: Location[];
  onSelectLocation: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function MapView({ locations, onSelectLocation, onNavigate }: MapViewProps) {
  const [activeMarkerId, setActiveId] = useState<string | null>("zongo");
  const [activeChip, setActiveChip] = useState("Incontournables");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState({ x: 0, y: 0 });

  // Map Mode Selector: "topographic" | "google" | "osm" (defaults to google if key is present, otherwise osm)
  const [mapMode, setMapMode] = useState<"topographic" | "google" | "osm">(
    hasValidKey ? "google" : "osm"
  );
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Leaflet references
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // User GPS Tracking States
  const [userPos, setUserPos] = useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
    accuracy?: number;
    isMocked?: boolean;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur.");
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        let x = 50;
        let y = 50;
        let isMocked = false;

        // Check if user is in DRC or Kongo Central province
        const inKongoCentral = (latitude >= -6.2 && latitude <= -4.0 && longitude >= 12.0 && longitude <= 16.0);

        if (inKongoCentral) {
          x = 10 + ((longitude - 12.35) / (15.30 - 12.35)) * 80;
          y = 15 + ((latitude - (-4.30)) / ((-5.90) - (-4.30))) * 70;
        } else {
          isMocked = true;
          // Deterministic projection so different lat/lng gets different spots
          x = 35 + (Math.abs(longitude) % 30);
          y = 40 + (Math.abs(latitude) % 30);
        }

        // Keep within safe map bounds
        x = Math.max(10, Math.min(90, x));
        y = Math.max(15, Math.min(85, y));

        setUserPos({
          x,
          y,
          lat: latitude,
          lng: longitude,
          accuracy,
          isMocked
        });
        
        setIsLocating(false);
        setActiveId("user_gps");
        setZoomLevel(1.3);

        if (isMocked) {
          alert(`📍 GPS activé !\n\nCoordonnées réelles : ${latitude.toFixed(5)}°, ${longitude.toFixed(5)}° (Précision : ${Math.round(accuracy)}m).\n\nComme vous êtes hors du Kongo Central, votre position a été projetée sur notre carte interactive.`);
        } else {
          alert(`📍 GPS activé avec succès ! Vous êtes localisé en temps réel au Kongo Central (${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°).`);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsLocating(false);
        
        let msg = "Impossible d'accéder à votre position GPS.";
        if (error.code === 1) {
          msg = "Permission GPS refusée. Veuillez autoriser la localisation dans les réglages de votre navigateur.";
        } else if (error.code === 2) {
          msg = "La position GPS est indisponible.";
        } else if (error.code === 3) {
          msg = "Délai d'attente de la géolocalisation dépassé.";
        }
        
        setGpsError(msg);
        
        // Fallback simulated coordinates to keep GPS active
        const mockLat = -4.7825; 
        const mockLng = 14.3541;
        setUserPos({
          x: 45,
          y: 35,
          lat: mockLat,
          lng: mockLng,
          accuracy: 15,
          isMocked: true
        });
        setActiveId("user_gps");
        setZoomLevel(1.3);
        
        alert(`ℹ️ Mode de Simulation GPS activé !\n\nL'accès au GPS réel a échoué ou a été restreint par le navigateur (${msg}).\n\nUne position de simulation éco-garde a été configurée aux chutes de Zongo : ${mockLat}°, ${mockLng}°.`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const categories = [
    { name: "Incontournables", icon: "star", color: "bg-amber-500 text-white" },
    { name: "Nature", icon: "forest", color: "bg-emerald-600 text-white" },
    { name: "Histoire", icon: "history_edu", color: "bg-orange-700 text-white" },
    { name: "Urbain", icon: "location_city", color: "bg-blue-600 text-white" }
  ];

  // Dynamically filter markers based on active tab
  const activeCategoryLocations = locations.filter(
    loc => loc.category === activeChip && loc.status === "PUBLISHED"
  );

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

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (mapMode !== "osm" || !containerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerGroupRef.current = null;
      }
      return;
    }

    if (!mapRef.current) {
      // Create map instance
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-5.3, 14.1], 8.2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Add attribution control manually
      L.control.attribution({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
    }

    renderLeafletMarkers();

    // Clean up on unmount or mapMode change
    return () => {
      // kept simple
    };
  }, [mapMode, activeChip, userPos]);

  // Update markers when activeMarkerId changes
  useEffect(() => {
    if (mapMode === "osm" && mapRef.current) {
      renderLeafletMarkers();
    }
  }, [activeMarkerId]);

  // Pan Leaflet map to selected coordinates
  useEffect(() => {
    if (mapMode === "osm" && mapRef.current && activeMarkerId) {
      if (activeMarkerId === "user_gps" && userPos) {
        mapRef.current.flyTo([userPos.lat, userPos.lng], 10, { duration: 1.5 });
      } else {
        const selectedLoc = locations.find(l => l.id === activeMarkerId);
        if (selectedLoc && selectedLoc.lat && selectedLoc.lng) {
          mapRef.current.flyTo([selectedLoc.lat, selectedLoc.lng], 10, { duration: 1.5 });
        }
      }
    }
  }, [activeMarkerId, mapMode]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.8));
    setMapCenter({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 h-screen w-screen flex flex-col bg-background text-on-background relative overflow-hidden animate-fade-in font-sans">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-40 bg-surface-container-low shadow-sm h-16">
        <div className="flex items-center justify-between px-5 py-2 w-full max-w-7xl mx-auto h-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[26px]">map</span>
            <h1 className="font-sans text-headline-md font-bold text-primary">Carte Kongo Central</h1>
          </div>
          <span className="text-on-surface-variant text-xs font-mono font-semibold bg-surface-container px-3 py-1 rounded-full">
            {mapMode === "google" ? "Mode Google Maps" : mapMode === "osm" ? "Mode OpenStreetMap" : "Mode Topographique"}
          </span>
        </div>
      </header>

      {/* Map Content Area */}
      <main className="flex-1 relative overflow-hidden h-full w-full">
        
        {/* Toggle between Topographic, OpenStreetMap, and Real Google Maps */}
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 flex bg-surface-container-lowest/90 backdrop-blur-md rounded-full p-1 shadow-lg border border-outline-variant/20 max-w-[90vw] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMapMode("topographic")}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mapMode === "topographic"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Carte Topo 🎨
          </button>
          <button
            onClick={() => setMapMode("osm")}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mapMode === "osm"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            OpenStreetMap 🌐
          </button>
          <button
            onClick={() => {
              if (hasValidKey) {
                setMapMode("google");
              } else {
                setShowKeyModal(true);
              }
            }}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              mapMode === "google"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Google Maps 🗺️
            {!hasValidKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>

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
        ) : mapMode === "osm" ? (
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
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: "100%", height: "100%" }}
                mapTypeControl={true}
                gestureHandling="greedy"
              >
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
                  >
                    <Pin background="#2563eb" glyphColor="#fff" borderColor="#1d4ed8">
                      <span className="material-symbols-outlined text-[10px] text-white">person</span>
                    </Pin>
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
                        alert(`Itinéraire : Pour vous rendre aux ${loc.title} (${loc.locationName}), veuillez consulter les Conseils Locaux de préparation (Routier/Rando) ou vous rapprocher des écogardes.`);
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
                    ? "Coordonnées réelles projetées sur notre carte interactive du Kongo Central."
                    : "Votre appareil est connecté en temps réel aux satellites GPS de la province."}
                </p>

                <div className="bg-white/85 rounded-xl p-2.5 space-y-1 text-[10px] font-mono text-blue-950 border border-blue-200/50">
                  <div>Lat : {userPos.lat.toFixed(5)}°</div>
                  <div>Lng : {userPos.lng.toFixed(5)}°</div>
                  <div>Précision : ±{Math.round(userPos.accuracy || 10)} m</div>
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
                    <img src={selectedLoc.image} alt={selectedLoc.title} className="w-20 h-20 rounded-xl object-cover flex-none shadow-sm" />
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
                      alert(`Coordonnées GPS réelles :\n\n📍 ${selectedLoc.title}\n• Latitude : ${selectedLoc.lat || "N/A"}°\n• Longitude : ${selectedLoc.lng || "N/A"}°\n\nPour vous rendre sur place, contactez les guides éco-responsables régionaux.`);
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
          <div className="absolute bottom-6 left-6 z-20 max-w-sm w-[calc(100%-48px)] bg-surface-container-lowest/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-outline-variant/20 animate-slide-up">
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
              Votre position d'exploration
            </h3>
            
            <p className="text-on-surface-variant font-sans text-xs mt-1 leading-relaxed">
              Latitude : {userPos.lat.toFixed(5)}°<br />
              Longitude : {userPos.lng.toFixed(5)}°<br />
              Précision : {userPos.accuracy ? `${Math.round(userPos.accuracy)} mètres` : "simulation éco-garde"}
            </p>

            <div className="text-[10px] text-outline font-mono mt-3 border-t border-outline-variant/10 pt-2 flex justify-between items-center">
              <span>{userPos.isMocked ? "Projeté aux chutes de Zongo." : "Géolocalisation satellite active."}</span>
              <button 
                onClick={() => {
                  setUserPos(null);
                  setActiveId(null);
                }}
                className="text-red-500 font-bold hover:underline"
              >
                Désactiver
              </button>
            </div>
          </div>
        )}

        {/* Floating Controls (GPS Locate, zoom controls) */}
        <div className="absolute bottom-24 right-4 z-30 flex flex-col gap-3">
          <button 
            onClick={handleGetGPSLocation}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
              isLocating 
                ? "bg-blue-100 text-blue-600 border-blue-300 animate-pulse" 
                : userPos 
                  ? "bg-blue-600 text-white border-blue-700" 
                  : "bg-surface-container-lowest text-primary border-outline-variant/30"
            }`}
            title="Activer la géolocalisation GPS"
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

      {/* Help Modal for Google Maps API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest max-w-md w-full p-6 rounded-3xl shadow-2xl border border-outline-variant/30 text-left space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[26px]">map</span>
                <h3 className="font-sans text-headline-sm font-bold text-on-surface">Activer Google Maps Live</h3>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="material-symbols-outlined text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high cursor-pointer"
              >
                close
              </button>
            </div>

            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
              Pour afficher la véritable carte satellite et routière interactive de Google Maps, vous devez lier votre clé d'API Google Maps Platform.
            </p>

            <div className="bg-surface-container p-4 rounded-2xl space-y-2 text-xs font-sans text-on-surface">
              <p className="font-bold text-primary">Comment configurer la clé :</p>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-on-surface-variant">
                <li>Ouvrez les <strong>Paramètres</strong> (icône ⚙️ engrenage, <strong>en haut à droite</strong>).</li>
                <li>Cliquez sur la section <strong>Secrets</strong>.</li>
                <li>Ajoutez une clé nommée <code className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-primary text-[11px] font-bold">GOOGLE_MAPS_PLATFORM_KEY</code>.</li>
                <li>Collez votre clé d'API et appuyez sur <strong>Entrée</strong>.</li>
              </ol>
            </div>

            <p className="text-label-xs font-mono text-outline leading-relaxed">
              * L'application se reconstruira automatiquement en quelques secondes après l'enregistrement.
            </p>

            <div className="flex gap-3 pt-2">
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-secondary text-white py-3 rounded-full font-sans text-xs font-bold text-center hover:bg-secondary-container active:scale-95 transition-all cursor-pointer"
              >
                Obtenir une clé Google ↗
              </a>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="flex-1 bg-primary text-white py-3 rounded-full font-sans text-xs font-bold hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
              >
                Compris !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
