import { describe, expect, it } from 'vitest';
import type { Station } from '@/types/station';
import {
  EMPTY_FILTERS,
  filterStations,
  filtersToSearchParams,
  hasActiveFilters,
  matchesFilters,
  searchParamsToFilters,
  type MapFilters,
} from './filters';

function buildStation(overrides: Partial<Station> = {}): Station {
  return {
    id: 'test-station',
    slug: 'test-station',
    name: 'Estación de prueba',
    stationType: 'transmitter',
    status: 'active',
    operator: 'arsat',
    isDemoData: true,
    location: {
      country: 'Argentina',
      province: 'Córdoba',
      department: 'Capital',
      city: 'Córdoba',
      latitude: -31.4201,
      longitude: -64.1888,
      elevationMeters: null,
    },
    technicalData: {
      towerHeightMeters: 100,
      erpKw: 10,
      polarization: 'horizontal',
      standard: 'ISDB-T',
    },
    signals: [
      { physicalChannel: 24, virtualChannel: '24.1', frequencyMhz: 498, name: 'Señal A', network: 'nacional', status: 'active' },
    ],
    coverage: { estimatedRadiusKm: 50, calculationMethod: 'erp-based-estimate' },
    verification: { level: 'pending', sourceName: 'Test', sourceUrl: null, lastVerifiedAt: '2026-01-01' },
    observations: null,
    updatedAt: '2026-01-01',
    ...overrides,
  } as Station;
}

describe('filtersToSearchParams / searchParamsToFilters', () => {
  it('produce un round-trip idéntico para filtros con valores', () => {
    const filters: MapFilters = {
      province: 'Córdoba',
      operator: 'arsat',
      status: 'active',
      physicalChannel: 24,
      virtualChannel: '24.1',
      polarization: 'horizontal',
    };
    const params = filtersToSearchParams(filters);
    expect(searchParamsToFilters(params)).toEqual(filters);
  });

  it('omite claves vacías al serializar', () => {
    const params = filtersToSearchParams(EMPTY_FILTERS);
    expect(params.toString()).toBe('');
  });

  it('reconstruye EMPTY_FILTERS desde parámetros vacíos', () => {
    const filters = searchParamsToFilters(new URLSearchParams(''));
    expect(filters).toEqual(EMPTY_FILTERS);
  });

  it('descarta un status inválido en vez de dejarlo pasar', () => {
    const filters = searchParamsToFilters(new URLSearchParams('status=bogus'));
    expect(filters.status).toBeNull();
  });
});

describe('hasActiveFilters', () => {
  it('es false cuando no hay filtros activos', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('es true cuando al menos un filtro tiene valor', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, province: 'Córdoba' })).toBe(true);
  });
});

describe('matchesFilters / filterStations', () => {
  const cordobaActive = buildStation();
  const buenosAiresPlanned = buildStation({
    id: 'ba',
    slug: 'ba',
    status: 'planned',
    location: { ...cordobaActive.location, province: 'Buenos Aires', city: 'La Plata' },
  });

  it('sin filtros, todas las estaciones matchean', () => {
    expect(matchesFilters(cordobaActive, EMPTY_FILTERS)).toBe(true);
    expect(matchesFilters(buenosAiresPlanned, EMPTY_FILTERS)).toBe(true);
  });

  it('filtra por provincia', () => {
    const filters = { ...EMPTY_FILTERS, province: 'Córdoba' };
    expect(filterStations([cordobaActive, buenosAiresPlanned], filters)).toEqual([cordobaActive]);
  });

  it('filtra por estado', () => {
    const filters = { ...EMPTY_FILTERS, status: 'planned' as const };
    expect(filterStations([cordobaActive, buenosAiresPlanned], filters)).toEqual([buenosAiresPlanned]);
  });

  it('filtra por canal físico dentro de las señales', () => {
    const filters = { ...EMPTY_FILTERS, physicalChannel: 24 };
    expect(matchesFilters(cordobaActive, filters)).toBe(true);
    expect(matchesFilters(buenosAiresPlanned, { ...EMPTY_FILTERS, physicalChannel: 99 })).toBe(false);
  });

  it('un canal físico 0 explícito no se confunde con "sin filtro"', () => {
    const zeroChannelStation = buildStation({
      id: 'zero',
      slug: 'zero',
      signals: [{ physicalChannel: 0, virtualChannel: '0.1', frequencyMhz: 470, name: 'Señal Z', network: 'nacional', status: 'active' }],
    });
    expect(matchesFilters(zeroChannelStation, { ...EMPTY_FILTERS, physicalChannel: 0 })).toBe(true);
    expect(matchesFilters(cordobaActive, { ...EMPTY_FILTERS, physicalChannel: 0 })).toBe(false);
  });

  it('combina múltiples filtros con AND', () => {
    const filters = { ...EMPTY_FILTERS, province: 'Córdoba', status: 'planned' as const };
    expect(filterStations([cordobaActive, buenosAiresPlanned], filters)).toEqual([]);
  });
});
