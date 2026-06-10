import { RadarSite } from "./types";

export const INITIAL_RADAR_SITES: RadarSite[] = [
  {
    "id": "SITE_1332",
    "localizacao": "Rodovia CE-065, km 7.6",
    "ponto_referencia": "Maracanaú",
    "tipo": "Controlador Eletrônico",
    "sentido": "Crescente (Leste > Oeste)",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.840028,
      "longitude": -38.634833,
      "format_dms": "3°50'24.1\"S 38°38'05.4\"O"
    }
  },
  {
    "id": "SITE_1185",
    "localizacao": "Rodovia CE-065, km 7.6",
    "ponto_referencia": "Maracanaú",
    "tipo": "Controlador Eletrônico",
    "sentido": "Decrescente (Oeste > Leste)",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.840667,
      "longitude": -38.635583,
      "format_dms": "3°50'26.4\"S 38°38'08.1\"O"
    }
  },
  {
    "id": "SITE_1087",
    "localizacao": "Rodovia CE-065, km 8.5",
    "ponto_referencia": "Maracanaú",
    "tipo": "Controlador Eletrônico",
    "sentido": "Crescente (Leste > Oeste)",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.845167,
      "longitude": -38.641583,
      "format_dms": "3°50'42.6\"S 38°38'29.7\"O"
    }
  },
  {
    "id": "SITE_1106",
    "localizacao": "Rodovia CE-065, km 8.5",
    "ponto_referencia": "Maracanaú",
    "tipo": "Controlador Eletrônico",
    "sentido": "Decrescente (Oeste > Leste)",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.845722,
      "longitude": -38.641889,
      "format_dms": "3°50'44.6\"S 38°38'30.8\"O"
    }
  },
  {
    "id": "URB_01",
    "localizacao": "Av. Padre José Holanda do Vale x Rua Belém",
    "ponto_referencia": "Cruzamento",
    "tipo": "Controlador Eletrônico",
    "sentido": "Ambos (Sul/Norte e Norte/Sul)",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.871142,
      "longitude": -38.618635,
      "obs": "Coordenada aproximada via logradouro"
    }
  },
  {
    "id": "URB_02",
    "localizacao": "Av. Padre José Holanda do Vale, 1301",
    "ponto_referencia": "Piratininga",
    "tipo": "Controlador Eletrônico",
    "sentido": "Ambos",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.864389,
      "longitude": -38.625121
    }
  },
  {
    "id": "URB_03",
    "localizacao": "Av. Padre José Holanda do Vale, 600",
    "ponto_referencia": "Em frente ao Condomínio Jardins da Serra",
    "tipo": "Controlador Eletrônico",
    "sentido": "Ambos",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.877884,
      "longitude": -38.612089
    }
  },
  {
    "id": "URB_04",
    "localizacao": "Av. Contorno Norte",
    "ponto_referencia": "Em frente ao IFCE Maracanaú",
    "tipo": "Redutor Eletrônico (Lombada)",
    "sentido": "Oeste / Leste",
    "velocidade_regulamentada": 40,
    "geolocalizacao": {
      "latitude": -3.861775,
      "longitude": -38.634125
    }
  },
  {
    "id": "URB_05",
    "localizacao": "Av. Presidente José de Alencar",
    "ponto_referencia": "Próximo a Rua Central 3 e 5",
    "tipo": "Controlador Eletrônico",
    "sentido": "Ambos",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.851211,
      "longitude": -38.599728
    }
  },
  {
    "id": "URB_06",
    "localizacao": "Av. Radialista João Ramos x Av. 24 de Maio",
    "ponto_referencia": "Cruzamento",
    "tipo": "Controlador Eletrônico",
    "sentido": "Ambos",
    "velocidade_regulamentada": 60,
    "geolocalizacao": {
      "latitude": -3.855214,
      "longitude": -38.589887
    }
  },
  {
    "id": "STOP_01",
    "localizacao": "R. Cap. Valdemar de Lima, 33-348 - Centro",
    "ponto_referencia": "Maracanaú - CE, 61900-025",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos (Todas direções)",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.877395,
      "longitude": -38.624290
    }
  },
  {
    "id": "STOP_ADD_01",
    "localizacao": "Centro",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.877547,
      "longitude": -38.626125
    }
  },
  {
    "id": "STOP_ADD_02",
    "localizacao": "Centro",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.872952,
      "longitude": -38.622276
    }
  },
  {
    "id": "STOP_ADD_03",
    "localizacao": "Praça Henrique Mendes, 26 - Pqe Antonio Justa",
    "ponto_referencia": "Maracanaú - CE, 61900-161",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.877382,
      "longitude": -38.625997
    }
  },
  {
    "id": "STOP_ADD_04",
    "localizacao": "R. João de Alencar, 37-35 - Centro",
    "ponto_referencia": "Maracanaú - CE, 61900-020",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.878864,
      "longitude": -38.624681
    }
  },
  {
    "id": "STOP_ADD_05",
    "localizacao": "Av. Cinco -B, 1 - Jereissati II",
    "ponto_referencia": "Maracanaú - CE, 61901-085",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.879446,
      "longitude": -38.622303
    }
  },
  {
    "id": "STOP_ADD_06",
    "localizacao": "Av. Padre José Holanda do Vale, 10 - Centro",
    "ponto_referencia": "Maracanaú - CE, 61932-670",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.876180,
      "longitude": -38.626570
    }
  },
  {
    "id": "STOP_ADD_07",
    "localizacao": "Av. Padre José Holanda do Vale, 3-1 - Cágado",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.850705,
      "longitude": -38.645348
    }
  },
  {
    "id": "STOP_ADD_08",
    "localizacao": "Luzardo Viana",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.851394,
      "longitude": -38.646536
    }
  },
  {
    "id": "STOP_ADD_09",
    "localizacao": "Maracanaú Agora, Av. Jaime Paulino - Centro",
    "ponto_referencia": "Maracanaú - CE, 61905-155",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.881741,
      "longitude": -38.627588
    }
  },
  {
    "id": "STOP_ADD_10",
    "localizacao": "Jereissati - Setor A",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.868807,
      "longitude": -38.618618
    }
  },
  {
    "id": "STOP_ADD_11",
    "localizacao": "Jereissati - Setor A",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.868769,
      "longitude": -38.618984
    }
  },
  {
    "id": "STOP_ADD_12",
    "localizacao": "Boa Vista",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.885252,
      "longitude": -38.626137
    }
  },
  {
    "id": "STOP_ADD_13",
    "localizacao": "Av. IX, 704-734 - Jereissati - Setor D",
    "ponto_referencia": "Maracanaú - CE, 61901-120",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.882493,
      "longitude": -38.615130
    }
  },
  {
    "id": "STOP_ADD_14",
    "localizacao": "Av. 4 de Julho, 387-6 - Jereissati - Setor D",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.882688,
      "longitude": -38.614575
    }
  },
  {
    "id": "STOP_ADD_15",
    "localizacao": "Boa Vista",
    "ponto_referencia": "Maracanaú - CE",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.889219,
      "longitude": -38.625619
    }
  },
  {
    "id": "STOP_ADD_16",
    "localizacao": "R. 51, 12-98 - Jereissati II",
    "ponto_referencia": "Maracanaú - CE, 61901-130",
    "tipo": "Parada Obrigatória",
    "sentido": "Ambos",
    "velocidade_regulamentada": 0,
    "geolocalizacao": {
      "latitude": -3.880640,
      "longitude": -38.622331
    }
  }
];

/**
 * Calculates the distance between two sets of GPS coordinates using the Haversine formula.
 * @returns Distance in meters.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Predefined simulation checkpoints to generate smooth paths for testing.
 * Path 1: Rodovia CE-065 (passing through km 7.6 and 8.5 radars)
 * Path 2: Av. Padre José Holanda do Vale (passing thru URB_03, URB_01, URB_02 and URB_04)
 * Path 3: Centro de Maracanaú (passing directly through the R. Cap. Valdemar de Lima mandatory stop point)
 */
export const SIMULATION_ROUTES = [
  {
    name: "Trajeto 1: Rodovia CE-065 (Radares de Rodovia)",
    description: "Inicia antes do km 7.6 e segue rumo ao km 8.5 na Rodovia CE-065, simulando velocidade constante de 70 km/h.",
    baseSpeedKmh: 70,
    checkpoints: [
      { latitude: -3.834000, longitude: -38.628000 }, // Start before km 7.6
      { latitude: -3.840028, longitude: -38.634833 }, // Near SITE_1332 km 7.6
      { latitude: -3.840667, longitude: -38.635583 }, // Near SITE_1185
      { latitude: -3.845167, longitude: -38.641583 }, // Near SITE_1087 km 8.5
      { latitude: -3.845722, longitude: -38.641889 }, // Near SITE_1106
      { latitude: -3.850000, longitude: -38.648000 }  // End
    ]
  },
  {
    name: "Trajeto 2: Av. Padre José Holanda (Radares Urbanos)",
    description: "Trajeto urbano que passa pelo Condomínio Jardins da Serra, subindo pela avenida até próximo ao IFCE.",
    baseSpeedKmh: 50,
    checkpoints: [
      { latitude: -3.882000, longitude: -38.608000 }, // Start before URB_03
      { latitude: -3.877884, longitude: -38.612089 }, // URB_03
      { latitude: -3.871142, longitude: -38.618635 }, // URB_01
      { latitude: -3.864389, longitude: -38.625121 }, // URB_02
      { latitude: -3.861775, longitude: -38.634125 }, // URB_04 (IFCE)
      { latitude: -3.858000, longitude: -38.638000 }  // End
    ]
  },
  {
    name: "Trajeto 3: Centro de Maracanaú (Parada Obrigatória)",
    description: "Trajeto urbano pelo Centro com aproximação e parada no ponto de controle obrigatório.",
    baseSpeedKmh: 35,
    checkpoints: [
      { latitude: -3.885000, longitude: -38.626000 }, // Start
      { latitude: -3.880000, longitude: -38.625000 }, // Center
      { latitude: -3.877395, longitude: -38.624290 }, // R. Cap. Valdemar de Lima STOP_01 - MUST STOP!
      { latitude: -3.870000, longitude: -38.623000 }, // Moving forward
      { latitude: -3.864389, longitude: -38.625121 }  // Merge towards URB_02
    ]
  }
];

/**
 * Simple linear interpolation of path nodes to create high-frequency smooth coords.
 */
export function generateSmoothedRoute(waypoints: { latitude: number; longitude: number }[], stepsPerSegment: number = 30) {
  const points: { latitude: number; longitude: number; heading: number }[] = [];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    
    // Calculate heading in degrees from start to end
    const dLon = (end.longitude - start.longitude) * Math.PI / 180;
    const lat1 = start.latitude * Math.PI / 180;
    const lat2 = end.latitude * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    heading = (heading + 360) % 360;

    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const latitude = start.latitude + (end.latitude - start.latitude) * t;
      const longitude = start.longitude + (end.longitude - start.longitude) * t;
      points.push({ latitude, longitude, heading });
    }
  }
  
  // Add final point
  if (waypoints.length > 0) {
    const final = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2] || final;
    const dLon = (final.longitude - prev.longitude) * Math.PI / 180;
    const lat1 = prev.latitude * Math.PI / 180;
    const lat2 = final.latitude * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    heading = (heading + 360) % 360;

    points.push({ latitude: final.latitude, longitude: final.longitude, heading });
  }

  return points;
}
