import { useMemo, useState } from 'react';
import type { Station, StationStatus } from '@/types/station';
import {
  STATION_STATUS_BADGE_CLASSES,
  STATION_STATUS_DOT_CLASSES,
  STATION_STATUS_LABEL,
} from '@/types/station';
import { ICON_PATHS, ReactIcon } from '@/lib/icons';

interface Props {
  stations: Station[];
  /** id de operador -> nombre para mostrar, resuelto en el servidor (src/lib/data/geo.ts). */
  operatorNames: Record<string, string>;
}

type SortKey = 'name' | 'province' | 'signals';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 30;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function StationsExplorer({ stations, operatorNames }: Props) {
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState([search, province, status]);

  // Volver a la página 1 cuando cambian los filtros, ajustando el estado durante el render en vez
  // de en un efecto (ver "Adjusting state based on props" en la doc de React).
  if (appliedFilters[0] !== search || appliedFilters[1] !== province || appliedFilters[2] !== status) {
    setAppliedFilters([search, province, status]);
    setPage(1);
  }

  const provinces = useMemo(
    () =>
      Array.from(new Set(stations.map((s) => s.location.province))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [stations],
  );

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return stations.filter((station) => {
      if (province && station.location.province !== province) return false;
      if (status && station.status !== status) return false;
      if (q && !normalize(station.name).includes(q) && !normalize(station.location.city).includes(q)) {
        return false;
      }
      return true;
    });
  }, [stations, search, province, status]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name, 'es');
      } else if (sortKey === 'province') {
        cmp =
          a.location.province.localeCompare(b.location.province, 'es') ||
          a.name.localeCompare(b.name, 'es');
      } else {
        cmp = a.signals.length - b.signals.length;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const hasActiveFilters = search !== '' || province !== '' || status !== '';

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sorted.length);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return <span aria-hidden="true">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="text-text-secondary pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
            <ReactIcon path={ICON_PATHS.search} size={16} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por estación o localidad"
            aria-label="Buscar por estación o localidad"
            className="border-border bg-bg-primary text-text-primary hover:border-brand-500 focus-visible:outline-brand-500 rounded-md border py-2 pl-8 pr-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>

        <select
          aria-label="Filtrar por provincia"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="border-border bg-bg-primary text-text-primary hover:border-brand-500 focus-visible:outline-brand-500 rounded-md border px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <option value="">Todas las provincias</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border-border bg-bg-primary text-text-primary hover:border-brand-500 focus-visible:outline-brand-500 rounded-md border px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATION_STATUS_LABEL) as StationStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATION_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setProvince('');
              setStatus('');
            }}
            className="text-link text-sm font-medium hover:underline"
          >
            Restablecer filtros
          </button>
        )}

        <span className="text-text-secondary ml-auto text-sm">
          {sorted.length} {sorted.length === 1 ? 'estación' : 'estaciones'}
        </span>
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-bg-secondary text-text-secondary text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort('name')}
                  className="hover:text-text-primary flex items-center uppercase tracking-wide"
                >
                  Estación
                  {sortIndicator('name')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort('province')}
                  className="hover:text-text-primary flex items-center uppercase tracking-wide"
                >
                  Provincia
                  {sortIndicator('province')}
                </button>
              </th>
              <th className="px-4 py-3">Localidad</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('signals')}
                  className="hover:text-text-primary ml-auto flex items-center uppercase tracking-wide"
                >
                  Señales
                  {sortIndicator('signals')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {paginated.map((station) => (
              <tr key={station.slug}>
                <td className="px-4 py-3">
                  <a
                    href={`/estaciones/${station.slug}`}
                    className="text-text-primary hover:text-link font-medium hover:underline"
                  >
                    {station.name}
                  </a>
                  {station.isDemoData && (
                    <span className="bg-status-warn-bg text-status-warn-text ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium">
                      Demo
                    </span>
                  )}
                </td>
                <td className="text-text-secondary px-4 py-3">{station.location.province}</td>
                <td className="text-text-secondary px-4 py-3">{station.location.city}</td>
                <td className="text-text-secondary px-4 py-3">
                  {operatorNames[station.operator] ?? station.operator}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATION_STATUS_BADGE_CLASSES[station.status]}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATION_STATUS_DOT_CLASSES[station.status]}`}
                    />
                    {STATION_STATUS_LABEL[station.status]}
                  </span>
                </td>
                <td className="text-text-secondary px-4 py-3 text-right font-mono">
                  {station.signals.length}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="text-text-secondary px-4 py-6 text-center">
                  No hay estaciones que coincidan con los filtros elegidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-text-secondary text-sm">
            Mostrando {rangeStart}–{rangeEnd} de {sorted.length}{' '}
            {sorted.length === 1 ? 'estación' : 'estaciones'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-border bg-surface text-text-secondary hover:border-brand-500 hover:text-link rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-text-secondary text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-border bg-surface text-text-secondary hover:border-brand-500 hover:text-link rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
