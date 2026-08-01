/**
 * Fase 2 (no implementado): estructura prevista para reportes comunitarios.
 * Se define ahora para no bloquear el diseño de datos futuro; sin UI ni backend en el MVP.
 */
export interface StationReport {
  id: string;
  stationId: string;
  approxLocation: {
    /** Coordenadas redondeadas (2 decimales ≈ 1.1 km) para evitar exponer ubicaciones residenciales exactas. */
    roundedLatitude: number;
    roundedLongitude: number;
    locality: string;
  };
  receivedSignalNames: string[];
  signalQuality: 'good' | 'medium' | 'bad';
  antennaType: 'indoor' | 'outdoor';
  antennaHeightMeters: number | null;
  hasObstacles: boolean;
  comment: string | null;
  reportedAt: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}
