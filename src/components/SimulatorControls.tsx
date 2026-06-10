import React from "react";
import { SIMULATION_ROUTES } from "../data";
import { Play, Pause, RotateCcw, FastForward, Gauge, ShieldAlert, Plus, Minus } from "lucide-react";

interface SimulatorControlsProps {
  isSimulating: boolean;
  activeRouteIndex: number;
  simulationSpeed: number; // km/h
  simulationSpeedRatio: number; // 1x, 2x, 5x, 10x
  onTogglePlay: () => void;
  onSelectRoute: (index: number) => void;
  onSetSpeedRatio: (ratio: number) => void;
  onReset: () => void;
  onAdjustSpeed: (delta: number) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isSimulating,
  activeRouteIndex,
  simulationSpeed,
  simulationSpeedRatio,
  onTogglePlay,
  onSelectRoute,
  onSetSpeedRatio,
  onReset,
  onAdjustSpeed,
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shrink-0 flex flex-col gap-4">
      {/* Header and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSimulating ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              {isSimulating ? "Simulação Ativa" : "Simulador Pausado"}
            </h4>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">
              Ideal para testar alertas na tela do computador
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
          title="Resetar trajeto ao ponto de partida"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </button>
      </div>

      {/* Select Traveled Path Checkpoint */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Selecionar Trajeto de Teste</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SIMULATION_ROUTES.map((route, idx) => (
            <button
              key={idx}
              onClick={() => onSelectRoute(idx)}
              className={`text-left p-2.5 rounded-xl border text-xs transition-all duration-150 cursor-pointer ${
                activeRouteIndex === idx
                  ? "bg-blue-600/20 border-blue-500 text-white font-semibold shadow-sm shadow-blue-600/10"
                  : "bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300"
              }`}
            >
              <div className="font-bold line-clamp-1">{route.name}</div>
              <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{route.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Play Pause Controls */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Controles de Movimento</label>
          <button
            onClick={onTogglePlay}
            className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-150 ${
              isSimulating
                ? "bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-600/10"
                : "bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-600/10"
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                Pausar Auto-Play
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                Iniciar Simulação
              </>
            )}
          </button>
        </div>

        {/* Speed Adjustment (+/-) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Velocidade do Carro</label>
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onAdjustSpeed(-10)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Reduzir velocidade (-10 km/h)"
              id="decelerate-btn"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-col items-center justify-center flex-grow">
              <span className="font-mono font-extrabold text-base text-slate-100 select-none">
                {simulationSpeed} <span className="text-[10px] text-slate-500 font-normal">km/h</span>
              </span>
            </div>

            <button
              onClick={() => onAdjustSpeed(10)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Acelerador (+10 km/h)"
              id="accelerate-btn"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Playback step frequency multiplier ratio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-400">Frequência/Passo</label>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1 rounded">
              {simulationSpeedRatio}x
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
            {[1, 2, 5, 10].map((ratio) => (
              <button
                key={ratio}
                onClick={() => onSetSpeedRatio(ratio)}
                className={`py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  simulationSpeedRatio === ratio
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-550 hover:text-slate-300"
                }`}
              >
                {ratio}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] md:text-xs text-slate-400 bg-slate-950/30 p-2.5 rounded-lg border border-white/5 flex items-start gap-2">
        <Gauge className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-350">Como testar:</strong> Ao iniciar, o marcador azul anda sobre as vias. Aumente a velocidade do carro no botão <strong className="text-slate-205 font-bold">+</strong> acima do limite regulamentado de 40 ou 60 (ou aproxime-se do ponto de Parada Obrigatória no Trajeto 3) para disparar alertas visuais e de voz em tempo real.
        </div>
      </div>
    </div>
  );
};
