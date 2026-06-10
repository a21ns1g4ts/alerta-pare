import React from "react";
import { RadarSite } from "../types";
import { AlertTriangle, Compass, MapPin, ShieldAlert } from "lucide-react";

interface RadarItemProps {
  radar: RadarSite;
  distance: number | null; // in meters
  isActive: boolean;
  onSelect: () => void;
  status: "safe" | "warning" | "danger";
}

export const RadarItem: React.FC<RadarItemProps> = ({
  radar,
  distance,
  isActive,
  onSelect,
  status
}) => {
  // Translate distance to user friendly text
  const formatDistance = (meters: number | null): string => {
    if (meters === null) return "Aguardando GPS...";
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Determine status color styles
  const getStatusBorder = () => {
    if (status === "danger") return "border-red-500/30 bg-red-950/20 hover:bg-red-950/30 border-l-4 border-l-red-500";
    if (status === "warning") return "border-amber-500/25 bg-amber-950/15 hover:bg-amber-950/25 border-l-4 border-l-amber-500";
    return isActive 
      ? "border-blue-500/40 bg-blue-950/10 hover:bg-blue-950/15 border-l-4 border-l-blue-500" 
      : "border-slate-800 bg-slate-900/45 hover:bg-slate-900/75 border-l-4 border-l-slate-600";
  };

  const getStatusAlertIcon = () => {
    if (status === "danger") return <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />;
    if (status === "warning") return <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />;
    return <MapPin className="w-4 h-4 text-sky-400 group-hover:text-blue-400 transition-colors" />;
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${getStatusBorder()}`}
      id={`radar-item-${radar.id}`}
    >
      <div className="flex flex-col gap-1.5 flex-[3] pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[9px] bg-slate-950 text-slate-300 font-bold px-1.5 py-0.5 rounded border border-slate-800">
            {radar.id}
          </span>
          <span className="text-xs font-semibold text-slate-250">
            {radar.tipo}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 bg-slate-950/80 text-slate-400 rounded-full flex items-center gap-1">
            <Compass className="w-2.5 h-2.5" />
            {radar.sentido.split(" ")[0]}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-blue-100 transition-colors line-clamp-1 leading-snug">
          {radar.localizacao}
        </h3>
        
        <p className="text-xs text-slate-450 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 block shrink-0" />
          <span className="line-clamp-1 font-medium">{radar.ponto_referencia}</span>
        </p>
      </div>

      <div className="flex items-center gap-3.5 flex-[1.2] justify-end shrink-0">
        <div className="text-right">
          {distance !== null ? (
            <p className={`text-sm font-mono font-bold leading-none ${
              status === "danger" ? "text-red-400 text-base" : 
              status === "warning" ? "text-amber-400" : "text-emerald-400"
            }`}>
              {formatDistance(distance)}
            </p>
          ) : (
            <p className="text-[10px] text-slate-500 font-mono">Calculando...</p>
          )}
          <span className="text-[10px] text-slate-500 block mt-0.5">Distância</span>
        </div>

        {/* Speed limit or PARE road sign standard */}
        {radar.tipo === "Parada Obrigatória" ? (
          <div className="flex flex-col items-center justify-center shrink-0">
            <div 
              style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
              className="w-11 h-11 bg-red-600 flex items-center justify-center shadow-md shadow-black/40 border border-white"
            >
              <span className="text-white font-sans font-black text-[12px] tracking-tight leading-none">
                PARE
              </span>
            </div>
            <span className="text-[9px] text-red-500 font-mono tracking-wider mt-0.5">PARAR</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="w-11 h-11 rounded-full bg-white border-4 border-red-600 flex items-center justify-center shadow-md shadow-black/40">
              <span className="text-slate-900 font-sans font-extrabold text-base tracking-tight leading-none">
                {radar.velocidade_regulamentada}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider mt-0.5">KM/H</span>
          </div>
        )}

        <div className="shrink-0 p-1 rounded-lg bg-slate-800/10 group-hover:bg-slate-800/40 transition-colors">
          {getStatusAlertIcon()}
        </div>
      </div>
    </div>
  );
};
