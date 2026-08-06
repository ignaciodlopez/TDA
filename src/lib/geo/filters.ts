import { STATION_STATUS_LABEL, type Station, type StationStatus } from '@/types/station';

export interface MapFilters {
  province: string | null;
  operator: string | null;
  status: StationStatus | null;
  physicalChannel: number | null;
  virtualChannel: string | null;
  polarization: string | null;
}

export const EMPTY_FILTERS: MapFilters = {
  province: null,
  operator: null,
  status: null,
  physicalChannel: null,
  virtualChannel: null,
  polarization: null,
};

const FILTER_KEYS: (keyof MapFilters)[] = [
  'province',
  'operator',
  'status',
  'physicalChannel',
  'virtualChannel',
  'polarization',
];

function isStationStatus(value: string): value is StationStatus {
  return value in STATION_STATUS_LABEL;
}

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
  const operator = params.get('operator');
  // Se valida contra STATION_STATUS_LABEL: un valor inválido en la URL (editada a mano o vieja)
  // cae a `null` en vez de convertirse en un filtro que nunca matchea ninguna estación sin avisar.
  const statusRaw = params.get('status');
  const status = statusRaw !== null && isStationStatus(statusRaw) ? statusRaw : null;
  const physicalChannelRaw = params.get('physicalChannel');
  const virtualChannel = params.get('virtualChannel');
  const polarization = params.get('polarization');

  return {
    province,
    operator,
    status,
    physicalChannel: physicalChannelRaw ? Number(physicalChannelRaw) : null,
    virtualChannel,
    polarization,
  };
}

export function hasActiveFilters(filters: MapFilters): boolean {
  return FILTER_KEYS.some((key) => filters[key] !== null && filters[key] !== '');
}

export function matchesFilters(station: Station, filters: MapFilters): boolean {
  if (filters.province && station.location.province !== filters.province) return false;
  if (filters.operator && station.operator !== filters.operator) return false;
  if (filters.status && station.status !== filters.status) return false;
  if (filters.polarization && station.technicalData.polarization !== filters.polarization) return false;
  if (
    filters.physicalChannel !== null &&
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
