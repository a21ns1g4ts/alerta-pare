import React, { useState } from "react";
import { RadarSite } from "../types";
import { X, Plus, ShieldCheck } from "lucide-react";

interface AddRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords: { latitude: number; longitude: number } | null;
  onAddRadar: (radar: Omit<RadarSite, "id">) => void;
}

export const AddRadarModal: React.FC<AddRadarModalProps> = ({
  isOpen,
  onClose,
  currentCoords,
  onAddRadar,
}) => {
  const [localizacao, setLocalizacao] = useState("");
  const [pontoReferencia, setPontoReferencia] = useState("");
  const [tipo, setTipo] = useState("Controlador Eletrônico");
  const [sentido, setSentido] = useState("Ambos");
  const [velocidade, setVelocidade] = useState(60);
  const [lat, setLat] = useState(currentCoords?.latitude.toString() || "-3.8400");
  const [lng, setLng] = useState(currentCoords?.longitude.toString() || "-38.6340");

  // Sync coords from props
  React.useEffect(() => {
    if (currentCoords) {
      setLat(currentCoords.latitude.toFixed(6));
      setLng(currentCoords.longitude.toFixed(6));
    }
  }, [currentCoords]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localizacao || !lat || !lng) return;

    onAddRadar({
      localizacao,
      ponto_referencia: pontoReferencia || "Ponto informado pelo usuário",
      tipo,
      sentido,
      velocidade_regulamentada: Number(velocidade),
      geolocalizacao: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      }
    });

    // Reset state
    setLocalizacao("");
    setPontoReferencia("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/80 overflow-hidden"
        id="add-radar-modal"
      >
        <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-100">Registrar Novo Alerta</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Localização (Ex: Av. Contorno Sul, km 1.5) *
            </label>
            <input
              type="text"
              required
              placeholder="Digite o nome da via ou rodovia"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Ponto de Referência (Ex: Próximo à pracinha ou supermercado)
            </label>
            <input
              type="text"
              placeholder="Digite um ponto de referência visual"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              value={pontoReferencia}
              onChange={(e) => setPontoReferencia(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Tipo do Radar
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="Controlador Eletrônico">Controlador (Fixo)</option>
                <option value="Redutor Eletrônico (Lombada)">Lombada Eletrônica</option>
                <option value="Radar Portátil / Blitz">Radar Portátil / Blitz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Velocidade Regulamentada
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                value={velocidade}
                onChange={(e) => setVelocidade(Number(e.target.value))}
              >
                <option value="30">30 km/h</option>
                <option value="40">40 km/h</option>
                <option value="50">50 km/h</option>
                <option value="60">60 km/h</option>
                <option value="80">80 km/h</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Sentido
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                value={sentido}
                onChange={(e) => setSentido(e.target.value)}
              >
                <option value="Ambos">Ambos os sentidos</option>
                <option value="Crescente">Crescente (Ida)</option>
                <option value="Decrescente">Decrescente (Volta)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <span className="text-[10px] text-slate-500 font-medium mb-1 bg-slate-950/40 p-1 rounded border border-slate-800/50 block">
                📍 Clique duplo no mapa para ajustar posição
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Latitude *
              </label>
              <input
                type="number"
                step="0.000001"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Longitude *
              </label>
              <input
                type="number"
                step="0.000001"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-grow py-2.5 px-4 rounded-xl border border-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-850 hover:text-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-grow py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Salvar Alerta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
