import { useEffect, useRef, useState } from "react";
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
  
  // High quality default warning video URL to ensure perfect immediate playability!
  const [stopSignVideoSrc] = useState("https://prefmara.s3.sa-east-1.amazonaws.com/pref.mp4");
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Refs for tracking map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const radarMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const lastAutoTriggeredRef = useRef<string | null>(null);

  // 2. Compute dynamic distance and warning state relative to stop sign
  const stopSignRadar = radars.find(r => r.tipo === "Parada Obrigatória") || radars[radars.length - 1];

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

  // 4. Trigger Video pop up automatically on stop sign approach
  useEffect(() => {
    if (!closestRadar) return;

    const isStopSign = closestRadar.tipo === "Parada Obrigatória";
    const isClose = closestRadar.distance <= 180;

    if (isStopSign && isClose && dismissedWarningId !== closestRadar.id) {
      if (lastAutoTriggeredRef.current !== closestRadar.id) {
        // Open video automatically without voice or sound
        setIsWarningVideoOpen(true);
        lastAutoTriggeredRef.current = closestRadar.id;
      }
    }

    // Reset auto-trigger memory when driving far away
    if (closestRadar.distance > 250) {
      lastAutoTriggeredRef.current = null;
    }
  }, [closestRadar?.id, closestRadar?.distance, dismissedWarningId]);

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

    // Keep camera following driver smoothly in simulation mode
    if (isSimulating) {
      mapRef.current.easeTo({
        center: currentLngLat,
        bearing: currentLocation.heading,
        duration: 250,
        pitch: 50,
      });
    }
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.heading, isSimulating]);

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
              onClick={() => setIsSimulating(!isSimulating)}
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
      </div>

      {/* Immersive Centered Warning Video Modal Overlay - Configured as fullscreen vertical-optimized display */}
      <AnimatePresence>
        {isWarningVideoOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative w-full h-full flex flex-col justify-center items-center bg-black"
              id="stop-sign-video-modal"
            >
              {/* Elegant floating header controls atop vertical view */}
              <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
                {/* Active alert indicator */}
                <div className="bg-red-600/95 border border-red-500/20 text-white font-black text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 tracking-widest uppercase pointer-events-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  ALERTA EM TEMPO REAL: PARADA OBRIGATÓRIA
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                  {/* Speaker Mute/Unmute Float Tool */}
                  <button
                    onClick={() => setIsVideoMuted(!isVideoMuted)}
                    className="p-3 bg-black/60 hover:bg-black text-white rounded-full border border-white/10 transition-colors cursor-pointer flex items-center justify-center shadow-2xl"
                    title={isVideoMuted ? "Ativar Áudio" : "Mutar Áudio"}
                  >
                    {!isVideoMuted ? <Volume2 className="w-5 h-5 text-blue-400 font-bold" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                  </button>

                  {/* Accessible Close Button */}
                  <button 
                    onClick={() => {
                      setIsWarningVideoOpen(false);
                      setDismissedWarningId(stopSignRadar.id);
                    }}
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full border border-white/10 cursor-pointer transition-colors shadow-2xl flex items-center justify-center"
                    title="Fechar Vídeo e Voltar ao Mapa"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Vertical live video player capturing full bounds height */}
              <div className="w-full h-full max-h-screen flex items-center justify-center bg-black">
                <video
                  src={stopSignVideoSrc}
                  autoPlay
                  loop
                  muted={isVideoMuted}
                  controls
                  playsInline
                  className="h-full w-auto max-w-full object-contain shadow-2xl"
                  key={stopSignVideoSrc}
                />
              </div>

              {/* Action notice helper at bottom */}
              <div className="absolute bottom-6 left-6 right-6 z-40 text-center pointer-events-none">
                <div className="bg-slate-900/90 border border-slate-800 backdrop-blur px-5 py-3 rounded-2xl max-w-md mx-auto shadow-2xl pointer-events-auto">
                  <p className="text-xs font-bold text-slate-300">
                    Avanço de Parada Obrigatória gera multa de <strong className="text-red-400">R$ 293,47</strong> e <strong className="text-red-400">7 pontos</strong> na CNH.
                  </p>
                  <button
                    onClick={() => {
                      setIsWarningVideoOpen(false);
                      setDismissedWarningId(stopSignRadar.id);
                    }}
                    className="mt-2.5 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
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
