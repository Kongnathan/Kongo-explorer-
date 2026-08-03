import React, { useState, useEffect, useRef } from "react";
import { Location } from "../types";
import { getUserGeolocation, UserPosition, calculateDistanceKm } from "../lib/geoUtils";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  (typeof window !== "undefined" ? localStorage.getItem("kongo_google_maps_key") : null) ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface RouteDirectionsModalProps {
  location: Location;
  userPosition?: UserPosition | null;
  onClose: () => void;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  icon: string;
}

// Sub-component to compute & render Google Maps polyline route
function GoogleMapsRouteRenderer({
  origin,
  destination,
  travelMode,
  onRouteCalculated,
}: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  travelMode: "DRIVING" | "WALKING" | "BICYCLING";
  onRouteCalculated?: (distanceKm: number, durationMin: number, steps: RouteStep[]) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    // Try modern Routes API or DirectionsService fallback
    if (routesLib && routesLib.Route) {
      routesLib.Route.computeRoutes({
        origin,
        destination,
        travelMode,
        fields: ["path", "distanceMeters", "durationMillis", "viewport", "legs"],
      })
        .then(({ routes }) => {
          if (routes && routes[0]) {
            const route = routes[0];
            const polylines = route.createPolylines();
            polylines.forEach((p) => p.setMap(map));
            polylinesRef.current = polylines;

            if (route.viewport) {
              map.fitBounds(route.viewport, 60);
            }

            const distKm = Math.round((route.distanceMeters || 0) / 100) / 10;
            const durMin = Math.round((route.durationMillis || 0) / 60000);

            // Extract legs/steps if available
            const extractedSteps: RouteStep[] = [];
            if (route.legs) {
              route.legs.forEach((leg: any) => {
                if (leg.steps) {
                  leg.steps.forEach((s: any) => {
                    extractedSteps.push({
                      instruction: s.navigationInstruction?.instructions || s.instructions || "Continuer sur l'itinéraire principal",
                      distance: s.distanceMeters ? `${Math.round(s.distanceMeters / 100) / 10} km` : "",
                      duration: s.durationMillis ? `${Math.round(s.durationMillis / 60000)} min` : "",
                      icon: "directions_car",
                    });
                  });
                }
              });
            }

            if (onRouteCalculated) {
              onRouteCalculated(distKm, durMin, extractedSteps);
            }
          }
        })
        .catch((err) => {
          console.warn("Routes computeRoutes failed, attempting fallback polyline:", err);
          drawSimpleDirectPolyline();
        });
    } else if (window.google?.maps?.DirectionsService) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode[travelMode] || window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const leg = route.legs[0];

            const polyline = new window.google.maps.Polyline({
              path: route.overview_path,
              geodesic: true,
              strokeColor: "#0284c7",
              strokeOpacity: 0.85,
              strokeWeight: 6,
            });
            polyline.setMap(map);
            polylinesRef.current = [polyline];

            if (route.bounds) {
              map.fitBounds(route.bounds, 60);
            }

            const distKm = Math.round((leg.distance?.value || 0) / 100) / 10;
            const durMin = Math.round((leg.duration?.value || 0) / 60000);

            const steps: RouteStep[] = leg.steps.map((s) => ({
              instruction: s.instructions.replace(/<[^>]*>?/gm, ""),
              distance: s.distance?.text || "",
              duration: s.duration?.text || "",
              icon: "turn_right",
            }));

            if (onRouteCalculated) {
              onRouteCalculated(distKm, durMin, steps);
            }
          } else {
            drawSimpleDirectPolyline();
          }
        }
      );
    } else {
      drawSimpleDirectPolyline();
    }

    function drawSimpleDirectPolyline() {
      if (!window.google?.maps || !map) return;
      const path = [origin, destination];
      const poly = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#0284c7",
        strokeOpacity: 0.8,
        strokeWeight: 5,
      });
      poly.setMap(map);
      polylinesRef.current = [poly];

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, 80);
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin.lat, origin.lng, destination.lat, destination.lng, travelMode]);

  return null;
}

export default function RouteDirectionsModal({
  location,
  userPosition: initialUserPos,
  onClose,
}: RouteDirectionsModalProps) {
  const [userPos, setUserPos] = useState<UserPosition | null>(initialUserPos || null);
  const [isLocating, setIsLocating] = useState(false);
  const [travelMode, setTravelMode] = useState<"DRIVING" | "WALKING" | "BICYCLING">("DRIVING");
  const [simulatedProgress, setSimulatedProgress] = useState<number | null>(null);
  const [isSimulatingNav, setIsSimulatingNav] = useState(false);

  // Computed route data
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);

  // Text-to-Speech (Synthèse Vocale) State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);

  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpeakingIndex(null);
  };

  const speakStep = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }

    window.speechSynthesis.cancel();

    if (currentlySpeakingIndex === index && isSpeaking) {
      setIsSpeaking(false);
      setCurrentlySpeakingIndex(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlySpeakingIndex(index);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakAllSteps = () => {
    if (!("speechSynthesis" in window)) {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isSpeaking && currentlySpeakingIndex === null) {
      stopSpeech();
      return;
    }

    if (routeSteps.length === 0) return;

    window.speechSynthesis.cancel();

    let currentIndex = 0;

    const speakNext = () => {
      if (currentIndex >= routeSteps.length) {
        setIsSpeaking(false);
        setCurrentlySpeakingIndex(null);
        return;
      }

      const step = routeSteps[currentIndex];
      const text = `Étape ${currentIndex + 1}. ${step.instruction}. ${
        step.distance ? `Distance ${step.distance}.` : ""
      }`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentlySpeakingIndex(currentIndex);
      };

      utterance.onend = () => {
        currentIndex++;
        speakNext();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Default coordinates for destination if location.lat is undefined
  const destLat = location.lat ?? -4.7825;
  const destLng = location.lng ?? 14.3541;

  // Default origin if GPS not detected yet (Kinshasa - Departure hub)
  const defaultOriginLat = -4.3224;
  const defaultOriginLng = 15.3070;

  const currentOriginLat = userPos?.lat ?? defaultOriginLat;
  const currentOriginLng = userPos?.lng ?? defaultOriginLng;

  // Auto detect GPS on mount if missing
  useEffect(() => {
    if (!userPos) {
      setIsLocating(true);
      getUserGeolocation(
        (pos) => {
          setUserPos(pos);
          setIsLocating(false);
        },
        (_err, fallback) => {
          if (fallback) setUserPos(fallback);
          setIsLocating(false);
        }
      );
    }
  }, []);

  // Calculate straight-line or estimated route distance if Google Maps API doesn't populate steps immediately
  useEffect(() => {
    if (!routeDistanceKm) {
      const straightDist = calculateDistanceKm(currentOriginLat, currentOriginLng, destLat, destLng);
      if (straightDist !== null) {
        // Multiply by 1.35 factor to account for road curvature in Kongo Central
        const estimatedRoadDist = Math.round(straightDist * 1.35 * 10) / 10;
        setRouteDistanceKm(estimatedRoadDist);

        // Estimate speed: 50 km/h driving, 4.5 km/h walking
        const speed = travelMode === "WALKING" ? 4.5 : travelMode === "BICYCLING" ? 15 : 45;
        const estimatedHours = estimatedRoadDist / speed;
        setRouteDurationMin(Math.round(estimatedHours * 60));

        // Generate realistic default steps for Kongo Central road network
        setRouteSteps(generateKongoCentralSteps(location, estimatedRoadDist, travelMode));
      }
    }
  }, [currentOriginLat, currentOriginLng, destLat, destLng, travelMode, routeDistanceKm]);

  // Simulation timer for navigation
  useEffect(() => {
    let interval: any = null;
    if (isSimulatingNav) {
      setSimulatedProgress(0);
      interval = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev === null || prev >= 100) {
            setIsSimulatingNav(false);
            return 100;
          }
          return prev + 2;
        });
      }, 500);
    } else {
      setSimulatedProgress(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulatingNav]);

  const handleRefreshGps = () => {
    setIsLocating(true);
    getUserGeolocation(
      (pos) => {
        setUserPos(pos);
        setIsLocating(false);
        setRouteDistanceKm(null); // Recalculate
      },
      (_err, fallback) => {
        if (fallback) setUserPos(fallback);
        setIsLocating(false);
      }
    );
  };

  // Interpolated position during simulation
  const activeLat =
    simulatedProgress !== null
      ? currentOriginLat + (destLat - currentOriginLat) * (simulatedProgress / 100)
      : currentOriginLat;
  const activeLng =
    simulatedProgress !== null
      ? currentOriginLng + (destLng - currentOriginLng) * (simulatedProgress / 100)
      : currentOriginLng;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant/30 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* MODAL HEADER */}
        <div className="bg-surface-container p-4 border-b border-outline-variant/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px]">navigation</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-sm sm:text-base font-bold text-on-surface">
                  Itinéraire & Navigation In-App
                </h3>
                <span className="bg-primary/15 text-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Google Maps
                </span>
              </div>
              <p className="text-outline font-mono text-xs truncate max-w-[280px] sm:max-w-md">
                Vers : <span className="text-on-surface font-semibold">{location.title}</span> ({location.locationName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center transition-all cursor-pointer border border-outline-variant/30"
            title="Fermer et revenir à l'application"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* CONTROLS & SUMMARY BAR */}
        <div className="bg-surface-container-lowest p-3 sm:p-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Departure / Destination Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 px-3 py-1.5 rounded-xl border border-sky-500/20 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping shrink-0" />
              <span>Départ : {userPos ? (userPos.isMocked ? "Position Simulée (Zongo)" : "Votre Position GPS") : "Kinshasa (Hub)"}</span>
              <button
                onClick={handleRefreshGps}
                disabled={isLocating}
                className="ml-1 text-sky-600 hover:text-sky-800 underline font-mono text-[11px] cursor-pointer"
                title="Actualiser la géolocalisation"
              >
                {isLocating ? "…" : "GPS 🔄"}
              </button>
            </div>

            <span className="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>

            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/20 font-bold">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>Arrivée : {location.title}</span>
            </div>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/30">
            <button
              onClick={() => { setTravelMode("DRIVING"); setRouteDistanceKm(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                travelMode === "DRIVING"
                  ? "bg-primary text-white shadow-sm"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
              <span>Voiture / 4x4</span>
            </button>

            <button
              onClick={() => { setTravelMode("WALKING"); setRouteDistanceKm(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                travelMode === "WALKING"
                  ? "bg-primary text-white shadow-sm"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">directions_walk</span>
              <span>Marche</span>
            </button>

            <button
              onClick={() => { setTravelMode("BICYCLING"); setRouteDistanceKm(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                travelMode === "BICYCLING"
                  ? "bg-primary text-white shadow-sm"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">directions_bike</span>
              <span>Vélo</span>
            </button>
          </div>
        </div>

        {/* METRICS & ACCESS HIGHLIGHTS */}
        <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">straighten</span>
              <span>Distance : <strong className="text-on-surface text-sm">{routeDistanceKm ? `${routeDistanceKm} km` : "Calcul..."}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
              <span>Durée estimée : <strong className="text-on-surface text-sm">{formatDuration(routeDurationMin)}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-sans">
            {location.accessType && (
              <span className="bg-amber-500/15 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Accès recommandé : {location.accessType}
              </span>
            )}

            <button
              onClick={() => setIsSimulatingNav(!isSimulatingNav)}
              className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSimulatingNav
                  ? "bg-emerald-600 text-white border-emerald-500 animate-pulse"
                  : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>{isSimulatingNav ? `Navigation en cours (${simulatedProgress}%)` : "Simuler le trajet"}</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY: MAP & STEP-BY-STEP DIRECTIONS */}
        <div className="flex-1 min-h-[350px] sm:min-h-[420px] grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* MAP CANVAS PANEL */}
          <div className="md:col-span-7 relative h-full min-h-[260px] bg-slate-900 overflow-hidden">
            {hasValidKey ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={{ lat: currentOriginLat, lng: currentOriginLng }}
                  defaultZoom={9}
                  mapId="ROUTE_MAP_ID"
                  internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  style={{ width: "100%", height: "100%" }}
                  gestureHandling="greedy"
                >
                  {/* Origin User Marker */}
                  <AdvancedMarker position={{ lat: activeLat, lng: activeLng }} title="Départ">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
                        <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
                      </div>
                      {simulatedProgress !== null && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white font-mono text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {simulatedProgress}%
                        </div>
                      )}
                    </div>
                  </AdvancedMarker>

                  {/* Destination Location Marker */}
                  <AdvancedMarker position={{ lat: destLat, lng: destLng }} title={location.title}>
                    <Pin background="#dc2626" glyphColor="#ffffff" borderColor="#ffffff" />
                  </AdvancedMarker>

                  {/* Polyline Route Calculation */}
                  <GoogleMapsRouteRenderer
                    origin={{ lat: currentOriginLat, lng: currentOriginLng }}
                    destination={{ lat: destLat, lng: destLng }}
                    travelMode={travelMode}
                    onRouteCalculated={(dist, dur, steps) => {
                      setRouteDistanceKm(dist);
                      setRouteDurationMin(dur);
                      if (steps && steps.length > 0) setRouteSteps(steps);
                    }}
                  />
                </Map>
              </APIProvider>
            ) : (
              /* INTERACTIVE TOPOGRAPHIC CANVAS ROUTE FALLBACK WHEN API KEY IS NOT SUPPLIED */
              <div className="w-full h-full bg-slate-950 p-4 flex flex-col justify-between relative overflow-hidden text-white">
                {/* Visual Topographic Lines Decoration */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                  <span className="font-mono text-xs text-sky-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    Carte Topographique du Kongo Central
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Tracé Satellite</span>
                </div>

                {/* SVG Route Visualization */}
                <div className="relative z-10 my-auto py-6 flex items-center justify-around">
                  {/* Origin Node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 border-2 border-sky-300 flex items-center justify-center text-white shadow-xl animate-pulse">
                      <span className="material-symbols-outlined text-[24px]">my_location</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-sky-200">
                      {userPos ? "Départ GPS" : "Kinshasa (Hub)"}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {currentOriginLat.toFixed(3)}°, {currentOriginLng.toFixed(3)}°
                    </span>
                  </div>

                  {/* Route Line with Moving Arrow */}
                  <div className="flex-1 mx-4 flex flex-col items-center gap-1 relative">
                    <div className="w-full h-2 bg-gradient-to-r from-sky-500 via-emerald-400 to-red-500 rounded-full relative overflow-hidden shadow-inner">
                      <div
                        className="absolute top-0 bottom-0 bg-white transition-all duration-300 shadow-md"
                        style={{
                          left: `${simulatedProgress ?? 50}%`,
                          width: "12px",
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-emerald-300 font-bold bg-black/70 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {routeDistanceKm} km ({formatDuration(routeDurationMin)})
                    </span>
                  </div>

                  {/* Destination Node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 border-2 border-red-300 flex items-center justify-center text-white shadow-xl">
                      <span className="material-symbols-outlined text-[24px]">flag</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-red-200 truncate max-w-[100px]">
                      {location.title}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {destLat.toFixed(3)}°, {destLng.toFixed(3)}°
                    </span>
                  </div>
                </div>

                <div className="relative z-10 bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-xs font-sans text-slate-300 flex items-center justify-between">
                  <span>🗺️ Tracé interactif calculé pour le réseau routier du Kongo Central</span>
                  <span className="font-mono text-[10px] text-sky-400">RN1 / RN16</span>
                </div>
              </div>
            )}
          </div>

          {/* TURN-BY-TURN STEPS LIST PANEL */}
          <div className="md:col-span-5 bg-surface-container-low p-4 overflow-y-auto flex flex-col border-l border-outline-variant/20">
            <div className="flex items-center justify-between mb-3 shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">turn_right</span>
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface">
                  Feuille de Route ({routeSteps.length} étapes)
                </h4>
              </div>

              {/* Text-To-Speech Play All Voice Guidance Button */}
              <button
                onClick={speakAllSteps}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 shadow-sm cursor-pointer border ${
                  isSpeaking && currentlySpeakingIndex === null
                    ? "bg-amber-600 text-white border-amber-500 animate-pulse"
                    : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20"
                }`}
                title="Lire toutes les instructions à voix haute"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSpeaking && currentlySpeakingIndex === null ? "volume_off" : "volume_up"}
                </span>
                <span>
                  {isSpeaking && currentlySpeakingIndex === null ? "Arrêter la voix" : "Guidance Vocale 🔊"}
                </span>
              </button>
            </div>

            {/* Steps List */}
            <div className="space-y-2.5 flex-1">
              {routeSteps.map((step, idx) => {
                const isThisStepSpeaking = currentlySpeakingIndex === idx && isSpeaking;
                return (
                  <div
                    key={idx}
                    className={`bg-surface border rounded-xl p-3 flex items-start gap-3 transition-all shadow-sm ${
                      isThisStepSpeaking
                        ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                        : "border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-sans text-on-surface font-medium leading-relaxed">
                        {step.instruction}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-outline">
                        {step.distance && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">straighten</span>
                            {step.distance}
                          </span>
                        )}
                        {step.duration && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            {step.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Speaker Button for individual step */}
                    <button
                      onClick={() => speakStep(step.instruction, idx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                        isThisStepSpeaking
                          ? "bg-primary text-white border-primary shadow-sm animate-pulse"
                          : "bg-surface-container hover:bg-primary/10 text-outline hover:text-primary border-outline-variant/30"
                      }`}
                      title={isThisStepSpeaking ? "Mettre en pause la lecture" : "Écouter cette étape"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isThisStepSpeaking ? "volume_up" : "volume_mute"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* FOOTER ACTIONS IN MODAL */}
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary-container text-white py-2.5 px-4 rounded-xl font-sans text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Fermer & Revenir à la Fiche</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(min: number | null): string {
  if (!min || min <= 0) return "Estim en cours...";
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hrs}h ${remMin > 0 ? `${remMin}m` : ""}`;
}

function generateKongoCentralSteps(
  location: Location,
  totalKm: number,
  travelMode: "DRIVING" | "WALKING" | "BICYCLING"
): RouteStep[] {
  const steps: RouteStep[] = [];
  const modeText = travelMode === "WALKING" ? "À pied" : travelMode === "BICYCLING" ? "À vélo" : "En véhicule";

  steps.push({
    instruction: `Départ de votre position initiale (${modeText}). S'engager vers la Route Nationale RN1.`,
    distance: `${Math.round(totalKm * 0.15)} km`,
    duration: "15 min",
    icon: "directions_car",
  });

  steps.push({
    instruction: "Poursuivre sur l'axe principal RN1 reliant Kinshasa à Matadi & Boma.",
    distance: `${Math.round(totalKm * 0.6)} km`,
    duration: "1h 10min",
    icon: "straight",
  });

  steps.push({
    instruction: `Bifurquer à l'embranchement vers ${location.locationName}. Suivre le panneau signalétique local.`,
    distance: `${Math.round(totalKm * 0.15)} km`,
    duration: "20 min",
    icon: "turn_right",
  });

  steps.push({
    instruction: `S'engager sur la voie d'accès finale vers ${location.title}. ${
      location.accessType === "4X4" ? "Attention : tronçon de terre 4x4 conseillé." : "Piste dégagée."
    }`,
    distance: `${Math.round(totalKm * 0.1)} km`,
    duration: "10 min",
    icon: "terrain",
  });

  steps.push({
    instruction: `Arrivée à destination : ${location.title} (${location.locationName}). Stationnement et accueil éco-garde disponible.`,
    distance: "0 km",
    duration: "0 min",
    icon: "flag",
  });

  return steps;
}
