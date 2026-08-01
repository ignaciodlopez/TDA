import type { Station, StationStatus } from '@/types/station';

export interface MapFilters {
  province: string | null;
  locality: string | null;
  operator: string | null;
  status: StationStatus | null;
  physicalChannel: number | null;
  virtualChannel: string | null;
  polarization: string | null;
  radiusKm: number | null;
}

export const EMPTY_FILTERS: MapFilters = {
  province: null,
  locality: null,
  operator: null,
  status: null,
  physicalChannel: null,
  virtualChannel: null,
  polarization: null,
  radiusKm: null,
};

const FILTER_KEYS: (keyof MapFilters)[] = [
  'province',
  'locality',
  'operator',
  'status',
  'physicalChannel',
  'virtualChannel',
  'polarization',
  'radiusKm',
];

/** Serializa los filtros activos a un `URLSearchParams`, omitiendo los valores vacíos. */
export function filtersToSearchParams(filters: MapFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  return params;
}

/** Reconstruye los filtros desde `URLSearchParams` (o un `location.search`). */
export function searchParamsToFilters(params: URLSearchParams): MapFilters {
  const province = params.get('province');
  const locality = params.get('locality');
  const operator = params.get('operator');
  const status = params.get('status') as StationStatus | null;
  const physicalChannelRaw = params.get('physicalChannel');
  const virtualChannel = params.get('virtualChannel');
  const polarization = params.get('polarization');
  const radiusKmRaw = params.get('radiusKm');

  return {
    province,
    locality,
    operator,
    status,
    physicalChannel: physicalChannelRaw ? Number(physicalChannelRaw) : null,
    virtualChannel,
    polarization,
    radiusKm: radiusKmRaw ? Number(radiusKmRaw) : null,
  };
}

export function hasActiveFilters(filters: MapFilters): boolean {
  return FILTER_KEYS.some((key) => filters[key] !== null && filters[key] !== '');
}

export function matchesFilters(station: Station, filters: MapFilters): boolean {
  if (filters.province && station.location.province !== filters.province) return false;
  if (filters.locality && station.location.city !== filters.locality) return false;
  if (filters.operator && station.operator !== filters.operator) return false;
  if (filters.status && station.status !== filters.status) return false;
  if (filters.polarization && station.technicalData.polarization !== filters.polarization) return false;
  if (
    filters.physicalChannel &&
    !station.signals.some((signal) => signal.physicalChannel === filters.physicalChannel)
  ) {
    return false;
  }
  if (
    filters.virtualChannel &&
    !station.signals.some((signal) => signal.virtualChannel === filters.virtualChannel)
  ) {
    return false;
  }
  return true;
}

export function filterStations(stations: Station[], filters: MapFilters): Station[] {
  return stations.filter((station) => matchesFilters(station, filters));
}
