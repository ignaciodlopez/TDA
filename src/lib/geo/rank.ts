import type { Station } from '@/types/station';
import type { Coordinates } from '@/types/geo';
import { haversineDistanceKm } from '@/lib/geo/distance';

export interface StationWithDistance {
  station: Station;
  distanceKm: number;
}

/**
 * Módulo sin dependencias de `astro:content`: es seguro importarlo tanto desde código de
 * servidor (páginas .astro) como desde islas de cliente (componentes React con client:*).
 */
export function sortStationsByDistance(
  stations: Station[],
  origin: Coordinates,
): StationWithDistance[] {
  return stations
    .map((station) => ({
      station,
      distanceKm: haversineDistanceKm(origin, {
        latitude: station.location.latitude,
        longitude: station.location.longitude,
      }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
