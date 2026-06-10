export interface Geolocalizacao {
  latitude: number;
  longitude: number;
  format_dms?: string;
  obs?: string;
}

export interface RadarSite {
  id: string;
  localizacao: string;
  ponto_referencia: string;
  tipo: string;
  sentido: string;
  velocidade_regulamentada: number;
  geolocalizacao: Geolocalizacao;
}

export interface SimulationRoutePoint {
  latitude: number;
  longitude: number;
  heading: number; // in degrees
}

export interface AppState {
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number | null; // m/s
    heading?: number | null; // degrees
  } | null;
  selectedRadarId: string | null;
  warningDistanceThreshold1: number; // yellow alert (e.g., 500m)
  warningDistanceThreshold2: number; // red alert (e.g., 200m)
  customRadars: RadarSite[];
  isSimulating: boolean;
  simulationSpeedRatio: number; // e.g. 1x, 2x, 5x
  soundEnabled: boolean;
  voiceAlertsEnabled: boolean;
}
