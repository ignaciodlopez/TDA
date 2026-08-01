import type { Station } from '@/types/station';

export interface StationFeatureProperties {
  id: string;
  slug: string;
  name: string;
  status: Station['status'];
  stationType: Station['stationType'];
  province: string;
  city: string;
  operator: string;
  isDemoData: boolean;
  isHighPower: boolean;
  signalCount: number;
}

export type StationFeature = GeoJSON.Feature<GeoJSON.Point, StationFeatureProperties>;
export type StationFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, StationFeatureProperties>;

const HIGH_POWER_THRESHOLD_KW = 10;

export function stationToFeature(station: Station): StationFeature {
  const erpKw = station.technicalData.erpKw;
  return {
    type: 'Feature',
    id: station.id,
    geometry: {
      type: 'Point',
      coordinates: [station.location.longitude, station.location.latitude],
    },
    properties: {
      id: station.id,
      slug: station.slug,
      name: station.name,
      status: station.status,
      stationType: station.stationType,
      province: station.location.province,
      city: station.location.city,
      operator: station.operator,
      isDemoData: station.isDemoData,
      isHighPower: erpKw !== null && erpKw >= HIGH_POWER_THRESHOLD_KW,
      signalCount: station.signals.length,
    },
  };
}

export function stationsToFeatureCollection(stations: Station[]): StationFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stations.map(stationToFeature),
  };
}
