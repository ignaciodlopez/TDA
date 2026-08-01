import { useMemo } from 'react';
import type { Station } from '@/types/station';
import { STATION_STATUS_LABEL } from '@/types/station';
import { EMPTY_FILTERS, type MapFilters } from '@/lib/geo/filters';
import { getAllOperators } from '@/lib/data/geo';

interface Props {
  stations: Station[];
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
}

export default function FilterPanel({ stations, filters, onChange }: Props) {
  const operators = getAllOperators();

  const provinces = useMemo(
    () => Array.from(new Set(stations.map((s) => s.location.province))).sort(),
    [stations],
  );
  const polarizations = useMemo(
    () =>
      Array.from(
        new Set(
          stations
            .map((s) => s.technicalData.polarization)
            .filter((p): p is NonNullable<typeof p> => p !== null),
        ),
      ).sort(),
    [stations],
  );

  function set<K extends keyof MapFilters>(key: K, value: MapFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const selectClass =
    'rounded-md border border-border bg-bg-primary px-2.5 py-2 text-sm text-text-primary transition-colors hover:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

  const chips: Array<{ key: keyof MapFilters; label: string }> = [
    filters.province ? { key: 'province', label: `Provincia: ${filters.province}` } : null,
    filters.operator
      ? { key: 'operator', label: `Operador: ${operators.find((o) => o.id === filters.operator)?.name ?? filters.operator}` }
      : null,
    filters.status ? { key: 'status', label: `Estado: ${STATION_STATUS_LABEL[filters.status]}` } : null,
    filters.polarization ? { key: 'polarization', label: `Polarización: ${filters.polarization}` } : null,
    filters.physicalChannel ? { key: 'physicalChannel', label: `Canal físico: ${filters.physicalChannel}` } : null,
  ].filter((chip): chip is { key: keyof MapFilters; label: string } => chip !== null);

  return (
    <div className="space-y-3 border-b border-border p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select
          aria-label="Filtrar por provincia"
          value={filters.province ?? ''}
          onChange={(e) => set('province', e.target.value || null)}
          className={selectClass}
        >
          <option value="">Provincia</option>
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por operador"
          value={filters.operator ?? ''}
          onChange={(e) => set('operator', e.target.value || null)}
          className={selectClass}
        >
          <option value="">Operador</option>
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado"
          value={filters.status ?? ''}
          onChange={(e) => set('status', (e.target.value || null) as MapFilters['status'])}
          className={selectClass}
        >
          <option value="">Estado</option>
          {(Object.keys(STATION_STATUS_LABEL) as Array<keyof typeof STATION_STATUS_LABEL>).map((status) => (
            <option key={status} value={status}>
              {STATION_STATUS_LABEL[status]}
            </option>
          ))}
        </select>

        {polarizations.length > 0 && (
          <select
            aria-label="Filtrar por polarización"
            value={filters.polarization ?? ''}
            onChange={(e) => set('polarization', e.target.value || null)}
            className={selectClass}
          >
            <option value="">Polarización</option>
            {polarizations.map((pol) => (
              <option key={pol} value={pol}>
                {pol}
              </option>
            ))}
          </select>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => set(chip.key, null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-text-primary hover:bg-border"
            >
              {chip.label}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs font-medium text-link hover:underline"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
}
