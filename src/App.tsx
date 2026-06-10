import { useEffect, useRef, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import mapboxgl from "mapbox-gl";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_RADAR_SITES, getDistance, SIMULATION_ROUTES, generateSmoothedRoute } from "./data";
import { RadarSite } from "./types";
import { playAlertSound } from "./utils/audio";
import { 
  AlertOctagon, 
  Map, 
  Volume2, 
  VolumeX, 
  Navigation, 
  Play, 
  Pause,
  RotateCcw,
  Sliders,
  X,
  Compass,
  FileVideo,
  Info,
  ShieldAlert,
  MapPin,
  Eye,
  EyeOff
} from "lucide-react";

const mapboxAccessToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN ?? "";
mapboxgl.accessToken = mapboxAccessToken;

const isProduction = !!(import.meta as any).env?.PROD || (import.meta as any).env?.VITE_APP_ENV === "production";
const defaultWarningVideoAspect = {
  cssRatio: "9 / 16",
  widthRatio: 9 / 16,
};
const warningVideoDistanceMeters = 100;
const warningVideoResetDistanceMeters = 140;

type LocationStatus = "idle" | "requesting" | "tracking" | "error" | "unsupported";

const getBearing = (startLat: number, startLng: number, endLat: number, endLng: number) => {
  const startLatRad = startLat * Math.PI / 180;
  const endLatRad = endLat * Math.PI / 180;
  const lngDiffRad = (endLng - startLng) * Math.PI / 180;

  const y = Math.sin(lngDiffRad) * Math.cos(endLatRad);
  const x = Math.cos(startLatRad) * Math.sin(endLatRad) -
    Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(lngDiffRad);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const getLocationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return "Permissão de localização negada.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Localização atual indisponível.";
  }

  if (error.code === error.TIMEOUT) {
    return "Tempo esgotado ao buscar localização.";
  }

  return "Não foi possível obter a localização atual.";
};

export default function App() {
  // 1. Core Simple States
  const [radars] = useState<RadarSite[]>(INITIAL_RADAR_SITES.filter(r => r.tipo === "Parada Obrigatória"));
  
  // Choose Route 3 (Centro - precisely loops through the STOP Sign) as the beautiful simulation defaults
  const activeRoute = SIMULATION_ROUTES[2]; // Index 2 is "Trajeto 3: Centro de Maracanaú"
  const smoothedRoutePoints = generateSmoothedRoute(activeRoute.checkpoints, 65);
  const [routeStepIndex, setRouteStepIndex] = useState(0);

  // Standard Driver Geographic State
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  }>({
    latitude: smoothedRoutePoints[0].latitude,
    longitude: smoothedRoutePoints[0].longitude,
    speed: 35, // Average cruising km/h
    heading: smoothedRoutePoints[0].heading,
  });

  // Simplified Configuration Options
  const [isSimulating, setIsSimulating] = useState(!isProduction);
  const [mapStyle, setMapStyle] = useState<string>("mapbox://styles/mapbox/dark-v11");
  const [isWarningVideoOpen, setIsWarningVideoOpen] = useState(false);
  const [dismissedWarningId, setDismissedWarningId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // High quality default warning video URL to ensure perfect immediate playability!
  const [stopSignVideoSrc] = useState("https://prefmara.s3.sa-east-1.amazonaws.com/pref.mp4");
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [warningVideoAspect, setWarningVideoAspect] = useState(defaultWarningVideoAspect);

  // Refs for tracking map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const radarMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const lastAutoTriggeredRef = useRef<string | null>(null);
  const previousClosestRadarRef = useRef<{ id: string; distance: number } | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);

  // 2. Compute dynamic distance and warning state relative to stop sign
  const stopSignRadar = radars.find(r => r.tipo === "Parada Obrigatória") || radars[radars.length - 1];
  const warningVideoFrameStyle = {
    "--warning-video-aspect": warningVideoAspect.cssRatio,
    "--warning-video-width-ratio": warningVideoAspect.widthRatio,
  } as CSSProperties & {
    "--warning-video-aspect": string;
    "--warning-video-width-ratio": number;
  };

  const handleWarningVideoMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;

    if (!video.videoWidth || !video.videoHeight) return;

    const widthRatio = video.videoWidth / video.videoHeight;
    if (!Number.isFinite(widthRatio) || widthRatio <= 0) return;

    setWarningVideoAspect({
      cssRatio: `${video.videoWidth} / ${video.videoHeight}`,
      widthRatio,
    });
  };

  const clearLocationWatch = () => {
    if (locationWatchIdRef.current === null || !("geolocation" in navigator)) return;

    navigator.geolocation.clearWatch(locationWatchIdRef.current);
    locationWatchIdRef.current = null;
  };

  const centerMapOnCurrentLocation = () => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 16,
      pitch: 50,
      bearing: currentLocation.heading,
      duration: 900,
    });
  };

  const beginLocationTracking = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      setLocationError("Este navegador não suporta localização.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationStatus("error");
      setLocationError("A localização atual exige HTTPS ou localhost.");
      return;
    }

    if (locationWatchIdRef.current !== null) {
      centerMapOnCurrentLocation();
      return;
    }

    setLocationStatus("requesting");
    setLocationError(null);

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;

        setIsSimulating(false);
        setLocationStatus("tracking");
        setLocationError(null);

        setCurrentLocation((previousLocation) => {
          const movedDistance = getDistance(
            previousLocation.latitude,
            previousLocation.longitude,
            latitude,
            longitude
          );
          const measuredHeading = typeof heading === "number" && Number.isFinite(heading)
            ? heading
            : null;
          const inferredHeading = movedDistance > 2
            ? getBearing(previousLocation.latitude, previousLocation.longitude, latitude, longitude)
            : previousLocation.heading;
          const measuredSpeed = typeof speed === "number" && Number.isFinite(speed) && speed >= 0
            ? Math.round(speed * 3.6)
            : 0;

          return {
            latitude,
            longitude,
            speed: measuredSpeed,
            heading: measuredHeading ?? inferredHeading,
          };
        });
      },
      (error) => {
        setLocationStatus("error");
        setLocationError(getLocationErrorMessage(error));
        clearLocationWatch();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );
  };

  const handleUseCurrentLocation = () => {
    setIsSimulating(false);
    previousClosestRadarRef.current = null;
    beginLocationTracking();
  };

  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }

    clearLocationWatch();
    setLocationStatus("idle");
    setLocationError(null);
    previousClosestRadarRef.current = null;
    setIsSimulating(true);
  };

  const radarsWithDistance = radars.map((radar) => {
    const dist = getDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      radar.geolocalizacao.latitude,
      radar.geolocalizacao.longitude
    );
    
    let status: "safe" | "warning" | "danger" = "safe";
    if (dist <= 180) {
      status = "danger";
    } else if (dist <= 400) {
      status = "warning";
    }

    return {
      ...radar,
      distance: dist,
      status,
    };
  }).sort((a, b) => a.distance - b.distance);

  const closestRadar = radarsWithDistance[0] || stopSignRadar;
  const closestStatus = closestRadar.status;

  // Teleport helper to quickly test warnings without waiting
  const handleTeleportToApproaching = () => {
    clearLocationWatch();
    setLocationStatus("idle");
    setLocationError(null);
    previousClosestRadarRef.current = null;

    // Find the step on the route that is about 150m from the stop sign
    // Let's find index that is closest to -3.878000, -38.624500 (approx 120-150m away)
    const targetIndex = smoothedRoutePoints.findIndex(pt => {
      const d = getDistance(pt.latitude, pt.longitude, stopSignRadar.geolocalizacao.latitude, stopSignRadar.geolocalizacao.longitude);
      return d < 185 && d > 120;
    });

    const indexToSet = targetIndex !== -1 ? targetIndex : 12;
    setRouteStepIndex(indexToSet);
    const targetPoint = smoothedRoutePoints[indexToSet];

    setCurrentLocation({
      latitude: targetPoint.latitude,
      longitude: targetPoint.longitude,
      speed: 38,
      heading: targetPoint.heading,
    });

    setDismissedWarningId(null);
    setIsSimulating(true);
    setIsWarningVideoOpen(true);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [targetPoint.longitude, targetPoint.latitude],
        zoom: 16.5,
        pitch: 55,
        bearing: targetPoint.heading,
        duration: 1000
      });
    }
  };

  // 3. Simple Silent Simulation Runner
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isSimulating && !isProduction) {
      interval = setInterval(() => {
        setRouteStepIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % smoothedRoutePoints.length;
          const point = smoothedRoutePoints[nextIndex];
          
          if (point) {
            // Stop sign is at -3.877395, -38.624290. If close, slow down to simulate careful driving
            const distToStopSign = getDistance(
              point.latitude,
              point.longitude,
              stopSignRadar.geolocalizacao.latitude,
              stopSignRadar.geolocalizacao.longitude
            );

            let simulatedSpeed = 40;
            if (distToStopSign < 40) {
              simulatedSpeed = 0; // Simulated stop!
            } else if (distToStopSign < 160) {
              simulatedSpeed = 18; // Slow down
            }

            setCurrentLocation({
              latitude: point.latitude,
              longitude: point.longitude,
              speed: simulatedSpeed,
              heading: point.heading,
            });
          }
          return nextIndex;
        });
      }, 700);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, smoothedRoutePoints]);

  useEffect(() => {
    if (isProduction) {
      beginLocationTracking();
    }

    return () => clearLocationWatch();
  }, []);

  // 4. Trigger Video pop up automatically on stop sign approach
  useEffect(() => {
    if (!closestRadar) return;

    const isStopSign = closestRadar.tipo === "Parada Obrigatória";
    const isLocationActive = isSimulating || locationStatus === "tracking";
    const previousClosestRadar = previousClosestRadarRef.current;

    if (!isStopSign || !isLocationActive) {
      previousClosestRadarRef.current = null;
      return;
    }

    const enteredWarningZone = !!previousClosestRadar &&
      previousClosestRadar.id === closestRadar.id &&
      previousClosestRadar.distance > warningVideoDistanceMeters &&
      closestRadar.distance <= warningVideoDistanceMeters;
    const startedInsideLiveWarningZone = !previousClosestRadar &&
      locationStatus === "tracking" &&
      closestRadar.distance <= warningVideoDistanceMeters;

    if ((enteredWarningZone || startedInsideLiveWarningZone) && dismissedWarningId !== closestRadar.id) {
      if (lastAutoTriggeredRef.current !== closestRadar.id) {
        setIsWarningVideoOpen(true);
        lastAutoTriggeredRef.current = closestRadar.id;
      }
    }

    // Reset auto-trigger memory when driving far away
    if (closestRadar.distance > warningVideoResetDistanceMeters) {
      lastAutoTriggeredRef.current = null;
      if (dismissedWarningId === closestRadar.id) {
        setDismissedWarningId(null);
      }
    }

    previousClosestRadarRef.current = {
      id: closestRadar.id,
      distance: closestRadar.distance,
    };
  }, [closestRadar?.id, closestRadar?.distance, dismissedWarningId, isSimulating, locationStatus]);

  // 5. Initialize Full Screen Mapbox
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapboxAccessToken) {
      console.error("Missing VITE_MAPBOX_ACCESS_TOKEN environment variable.");
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 15.5,
      pitch: 50,
      bearing: currentLocation.heading,
      antialias: true
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    // Add glowing custom Driver Pointer
    const driverEl = document.createElement("div");
    driverEl.className = "relative flex items-center justify-center w-9 h-9 pointer-events-none";
    driverEl.innerHTML = `
      <div class="absolute w-9 h-9 rounded-full bg-blue-500/25 border border-blue-400 animate-pulse"></div>
      <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-xl text-white transform transition-all duration-200" style="transform: rotate(${currentLocation.heading}deg);">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="lucide lucide-navigation rotate-45"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>
    `;

    const driverMarker = new mapboxgl.Marker({ element: driverEl })
      .setLngLat([currentLocation.longitude, currentLocation.latitude])
      .addTo(map);

    driverMarkerRef.current = driverMarker;

    // Populate all radar points immediately onto the style map
    radars.forEach((radar) => {
      const isStop = radar.tipo === "Parada Obrigatória";
      const radarEl = document.createElement("div");
      
      if (isStop) {
        radarEl.className = "w-9 h-9 flex items-center justify-center cursor-pointer transition-transform hover:scale-115 shadow-xl rounded-full";
        radarEl.innerHTML = `
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <polygon points="29,4 71,4 96,29 96,71 71,96 29,96 4,71 4,29" fill="#dc2626" stroke="white" stroke-width="6" stroke-linejoin="round"/>
            <text x="50" y="55" fill="white" font-family="sans-serif" font-weight="900" font-size="25" text-anchor="middle" dominant-baseline="middle">PARE</text>
          </svg>
        `;
      } else {
        radarEl.className = "w-9 h-9 rounded-full bg-white border-4 border-red-600 flex items-center justify-center shadow-xl text-slate-950 font-sans font-black text-[13px] cursor-pointer transition-transform hover:scale-115";
        radarEl.innerText = String(radar.velocidade_regulamentada);
      }

      // Quick fly to point when clicking a radar marker on the map
      radarEl.onclick = () => {
        map.flyTo({
          center: [radar.geolocalizacao.longitude, radar.geolocalizacao.latitude],
          zoom: 17,
          pitch: 60,
          speed: 1.2
        });
      };

      const m = new mapboxgl.Marker({ element: radarEl })
        .setLngLat([radar.geolocalizacao.longitude, radar.geolocalizacao.latitude])
        .addTo(map);

      radarMarkersRef.current[radar.id] = m;
    });

    // Mount 3D buildings layer for aesthetic depth
    map.on("load", () => {
      const layers = map.getStyle()?.layers;
      if (layers) {
        const labelLayerId = layers.find(
          (layer) => layer.type === "symbol" && layer.layout && layer.layout["text-field"]
        )?.id;

        if (map.getSource("composite")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": "#1e293b",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "height"]
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.45
              }
            },
            labelLayerId
          );
        }
      }
    });

    return () => {
      Object.values(radarMarkersRef.current).forEach((m: any) => m.remove());
      radarMarkersRef.current = {};
      if (driverMarkerRef.current) driverMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle]);

  // 6. Smoothly track active driver movement on the map canvas
  useEffect(() => {
    if (!mapRef.current || !driverMarkerRef.current) return;

    const currentLngLat: [number, number] = [currentLocation.longitude, currentLocation.latitude];
    driverMarkerRef.current.setLngLat(currentLngLat);

    // Dynamic rotation of driver pointer
    const needleEl = driverMarkerRef.current.getElement().querySelector(".relative") as HTMLElement;
    if (needleEl) {
      needleEl.style.transform = `rotate(${currentLocation.heading}deg)`;
    }

    // Keep camera following the active driver source smoothly
    if (isSimulating || locationStatus === "tracking") {
      mapRef.current.easeTo({
        center: currentLngLat,
        bearing: currentLocation.heading,
        duration: 250,
        pitch: 50,
      });
    }
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.heading, isSimulating, locationStatus]);

  return (
    <main className="w-full h-screen bg-[#0f172a] text-[#f8fafc] flex flex-col font-sans relative overflow-hidden" id="radar-monitoring-app">
      
      {/* Background Main Mapbox Workspace */}
      <section className="absolute inset-0 w-full h-full z-10" id="central-split">
        <div ref={mapContainerRef} className="w-full h-full" id="mapbox-canvas" />
      </section>

      {/* Floating Header Overlay: Location Badge & Simplified Style Selector */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 max-w-[calc(100%-2rem)] xs:max-w-md pointer-events-none">
        
        {/* Header Badge */}
        {!isProduction && (
          <div className="bg-slate-950/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800/80 shadow-2xl flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded font-black text-[9px] uppercase tracking-wide">
                COCKPIT
              </span>
              <div className="text-left font-sans">
                <span className="text-xs font-black text-white block">SafeDrive Maracanaú</span>
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  R. Cap. Valdemar de Lima • Centro
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-white/10" />

            {/* Quick Simulation Trigger Button */}
            <button
              onClick={handleToggleSimulation}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                isSimulating 
                  ? "bg-slate-900 border border-[#22c55e]/20 text-[#22c55e]" 
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30"
              }`}
            >
              {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isSimulating ? "Simulação Ativa" : "Ativar Trajeto"}
            </button>
          </div>
        )}

        {/* Dynamic Map Layers Controller */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-2 self-start pointer-events-auto">
          <span className="text-slate-400 p-0.5" title="Visualização">
            <Map className="w-3.5 h-3.5 text-blue-400" />
          </span>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex gap-1 bg-slate-900/50 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setMapStyle("mapbox://styles/mapbox/dark-v11")}
              className={`px-2 py-0.5 text-[9px] font-extrabold rounded transition-all cursor-pointer ${
                mapStyle.includes("dark") ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle("mapbox://styles/mapbox/satellite-streets-v12")}
              className={`px-2 py-0.5 text-[9px] font-extrabold rounded transition-all cursor-pointer ${
                mapStyle.includes("satellite") ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Satélite
            </button>
            <button
              onClick={() => setMapStyle("mapbox://styles/mapbox/streets-v12")}
              className={`px-2 py-0.5 text-[9px] font-extrabold rounded transition-all cursor-pointer ${
                mapStyle.includes("streets") && !mapStyle.includes("satellite") ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ruas
            </button>
          </div>
        </div>

        <button
          onClick={handleUseCurrentLocation}
          className={`bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border shadow-lg flex items-center gap-2 self-start pointer-events-auto transition-colors cursor-pointer ${
            locationStatus === "tracking"
              ? "border-emerald-500/30 text-emerald-300"
              : locationStatus === "error" || locationStatus === "unsupported"
                ? "border-red-500/30 text-red-300"
                : "border-slate-800/80 text-slate-200 hover:border-slate-700"
          }`}
          title={locationError || "Usar localização atual"}
        >
          <Navigation className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] font-extrabold uppercase tracking-wide">
            {locationStatus === "requesting"
              ? "Localizando"
              : locationStatus === "tracking"
                ? "GPS Atual"
                : "Usar GPS"}
          </span>
        </button>

        {locationError && (
          <div className="bg-red-950/90 border border-red-500/30 text-red-100 px-3 py-2 rounded-xl shadow-lg max-w-xs pointer-events-auto">
            <p className="text-[10px] font-bold leading-snug">{locationError}</p>
          </div>
        )}
      </div>

      {/* Immersive warning video modal */}
      <AnimatePresence>
        {isWarningVideoOpen && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="warning-video-stage relative bg-black shadow-2xl"
              id="stop-sign-video-modal"
              style={warningVideoFrameStyle}
            >
              <video
                src={stopSignVideoSrc}
                autoPlay
                loop
                muted={isVideoMuted}
                playsInline
                onLoadedMetadata={handleWarningVideoMetadata}
                className="warning-video-player"
                key={stopSignVideoSrc}
              />

              <div className="warning-video-topbar absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/85 via-black/45 to-transparent px-3 pb-12 pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 bg-red-600/95 border border-red-500/20 text-white font-black text-[10px] sm:text-xs px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 tracking-widest uppercase pointer-events-auto">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                    <span className="truncate">Parada Obrigatória</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
                    <button
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className="w-10 h-10 bg-black/65 hover:bg-black text-white rounded-full border border-white/10 transition-colors cursor-pointer flex items-center justify-center shadow-2xl"
                      title={isVideoMuted ? "Ativar Áudio" : "Mutar Áudio"}
                      aria-label={isVideoMuted ? "Ativar Áudio" : "Mutar Áudio"}
                    >
                      {!isVideoMuted ? <Volume2 className="w-5 h-5 text-blue-400 font-bold" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                    </button>

                    <button 
                      onClick={() => {
                        setIsWarningVideoOpen(false);
                        setDismissedWarningId(stopSignRadar.id);
                      }}
                      className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full border border-white/10 cursor-pointer transition-colors shadow-2xl flex items-center justify-center"
                      title="Fechar Vídeo e Voltar ao Mapa"
                      aria-label="Fechar Vídeo e Voltar ao Mapa"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="warning-video-bottombar absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pt-16 pointer-events-none">
                <div className="bg-slate-950/80 border border-white/10 backdrop-blur px-4 py-3 rounded-xl shadow-2xl pointer-events-auto">
                  <p className="text-[11px] sm:text-xs leading-snug font-bold text-slate-200">
                    Avanço de Parada Obrigatória gera multa de <strong className="text-red-400">R$ 293,47</strong> e <strong className="text-red-400">7 pontos</strong> na CNH.
                  </p>
                  <button
                    onClick={() => {
                      setIsWarningVideoOpen(false);
                      setDismissedWarningId(stopSignRadar.id);
                    }}
                    className="mt-2.5 w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
                  >
                    Entendido, Voltar ao Mapa
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom MONITORAMENTO Banner - Fixed & Highlighted for Premium Navigation Priority */}
      <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-800/90 p-4 pb-5 sm:pb-4 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 z-30 transition-all duration-300 pointer-events-auto">
        
        {/* Proximity / Radar Approach details */}
        <div className="flex items-center gap-3.5">
          {/* Hexagon/Circle stop sign or Speed Badge icon */}
          <div className="shrink-0 flex items-center justify-center">
            {closestRadar.tipo === "Parada Obrigatória" ? (
              <div className="w-11 h-11 flex items-center justify-center shadow-lg rounded-full animate-pulse">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  <polygon points="29,4 71,4 96,29 96,71 71,96 29,96 4,71 4,29" fill="#dc2626" stroke="white" strokeWidth="6" strokeLinejoin="round"/>
                  <text x="50" y="55" fill="white" fontFamily="sans-serif" fontWeight="900" fontSize="25" textAnchor="middle" dominantBaseline="middle">PARE</text>
                </svg>
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-white border-4 border-red-600 flex items-center justify-center shadow-md">
                <span className="text-slate-950 font-sans font-black text-sm leading-none">
                  {closestRadar.velocidade_regulamentada}
                </span>
              </div>
            )}
          </div>

          <div className="text-left leading-tight min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-red-500 font-mono">
                DISTÂNCIA: {closestRadar.distance < 1000 
                  ? `${Math.round(closestRadar.distance)}m`
                  : `${(closestRadar.distance / 1000).toFixed(1)}km`
                }
              </span>
            </div>
            
            <h4 className="text-sm font-black text-white mt-1 leading-tight truncate">
              {closestRadar.tipo === "Parada Obrigatória" ? "Parada Obrigatória de Trânsito" : closestRadar.tipo}
            </h4>
            
            <span className="text-[10px] text-slate-400 mt-1 block truncate max-w-[180px] xs:max-w-xs sm:max-w-md md:max-w-lg">
              📍 {closestRadar.localizacao} ({closestRadar.ponto_referencia})
            </span>
          </div>
        </div>

        {/* Quick manual simulation buttons stack (Development Only) */}
        {!isProduction && (
          <div className="flex items-center gap-1.5 font-mono shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
            <button
              onClick={handleTeleportToApproaching}
              className="py-1.5 px-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
              title="Aproximar o veículo imediatamente"
            >
              <RotateCcw className="w-3 h-3 text-slate-400 shrink-0" />
              Simular Aproximação
            </button>

            <button
              onClick={() => {
                setIsWarningVideoOpen(true);
              }}
              className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-lg shadow-red-750/35 animate-shake"
              title="Reproduzir o vídeo de prejuízo financeiro e pontuação CNH"
            >
              <FileVideo className="w-3.5 h-3.5 text-white shrink-0" />
              Reproduzir Vídeo Alerta
            </button>
          </div>
        )}

      </div>

    </main>
  );
}
