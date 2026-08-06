import { useMemo, useState } from 'react';
import { summarizeSignals, type SignalRow } from './signalRows';
import {
  STATION_STATUS_BADGE_CLASSES,
  STATION_STATUS_DOT_CLASSES,
  STATION_STATUS_LABEL,
} from '@/types/station';
import { ICON_PATHS, ReactIcon } from '@/lib/icons';

interface Props {
  rows: SignalRow[];
  /** Orden inicial de la tabla: por canal virtual (usado en /canales) o por frecuencia (usado en /frecuencias). */
  initialSort: 'channel' | 'frequency';
}

const NETWORK_LABEL: Record<SignalRow['network'], string> = {
  nacional: 'Nacional',
  local: 'Local',
};

const PAGE_SIZE = 30;

type SortKey = 'signal' | 'virtualChannel' | 'physicalChannel' | 'frequency' | 'station' | 'province';
type SortDir = 'asc' | 'desc';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Compara dos valores posiblemente nulos: los nulos siempre quedan al final, sin importar la dirección. */
function compareNullable<T>(a: T | null, b: T | null, compare: (a: T, b: T) => number): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return compare(a, b);
}

export default function ChannelsExplorer({ rows, initialSort }: Props) {
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(initialSort === 'frequency' ? 'frequency' : 'virtualChannel');
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
    () => Array.from(new Set(rows.map((r) => r.province))).sort((a, b) => a.localeCompare(b, 'es')),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return rows.filter((row) => {
      if (province && row.province !== province) return false;
      if (status && row.status !== status) return false;
      if (q && !normalize(row.signalName).includes(q) && !normalize(row.stationName).includes(q)) {
        return false;
      }
      return true;
    });
  }, [rows, search, province, status]);

  const summary = useMemo(() => summarizeSignals(filtered), [filtered]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'signal':
          cmp = a.signalName.localeCompare(b.signalName, 'es');
          break;
        case 'virtualChannel':
          cmp = compareNullable(a.virtualChannel, b.virtualChannel, (x, y) =>
            x.localeCompare(y, 'es', { numeric: true }),
          );
          break;
        case 'physicalChannel':
          cmp = compareNullable(a.physicalChannel, b.physicalChannel, (x, y) => x - y);
          break;
        case 'frequency':
          cmp = compareNullable(a.frequencyMhz, b.frequencyMhz, (x, y) => x - y);
          break;
        case 'station':
          cmp = a.stationName.localeCompare(b.stationName, 'es');
          break;
        case 'province':
          cmp = a.province.localeCompare(b.province, 'es') || a.stationName.localeCompare(b.stationName, 'es');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

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

  const hasActiveFilters = search !== '' || province !== '' || status !== '';

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sorted.length);

  return (
    <div>
      <section aria-labelledby="channels-summary-heading">
        <div className="mb-3 flex items-start gap-3">
          <span className="bg-brand-500/10 text-brand-500 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <ReactIcon path={ICON_PATHS.layers} size={18} />
          </span>
          <div>
            <h2 id="channels-summary-heading" className="text-text-primary text-base font-semibold">
              Catálogo: {summary.length} {summary.length === 1 ? 'señal única' : 'señales únicas'}
            </h2>
            <p className="text-text-secondary text-sm">
              Cada señal, una sola vez, con la cantidad de estaciones que la transmiten. Es un
              resumen — para ver estación por estación usá la tabla de abajo.
            </p>
          </div>
        </div>
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-bg-secondary text-text-secondary text-left text-xs font-medium tracking-wide uppercase">
                <tr>
                  <th className="px-4 py-2.5">Señal</th>
                  <th className="px-4 py-2.5">Canal virtual</th>
                  <th className="px-4 py-2.5">Canal físico</th>
                  <th className="px-4 py-2.5">Red</th>
                  <th className="px-4 py-2.5 text-right">Estaciones</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {summary.map((signal) => (
                  <tr key={signal.key}>
                    <td className="text-text-primary px-4 py-2">{signal.signalName}</td>
                    <td className="text-text-primary px-4 py-2 font-mono">
                      {signal.virtualChannel ?? 'Sin dato'}
                    </td>
                    <td className="text-text-primary px-4 py-2 font-mono">
                      {signal.physicalChannel ?? 'Sin dato'}
                    </td>
                    <td className="text-text-secondary px-4 py-2">
                      {NETWORK_LABEL[signal.network]}
                    </td>
                    <td className="text-text-secondary px-4 py-2 text-right font-mono">
                      {signal.stationCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="border-border my-8" />

      <section aria-labelledby="channels-detail-heading">
        <div className="mb-4 flex items-start gap-3">
          <span className="bg-brand-500/10 text-brand-500 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <ReactIcon path={ICON_PATHS.tv} size={18} />
          </span>
          <div>
            <h2 id="channels-detail-heading" className="text-text-primary text-base font-semibold">
              Detalle por estación
            </h2>
            <p className="text-text-secondary text-sm">
              Las {rows.length.toLocaleString('es-AR')} señales cargadas, una fila por estación.
              Buscá por señal o estación, o filtrá por provincia y estado para acotar la búsqueda.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="text-text-secondary pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
              <ReactIcon path={ICON_PATHS.search} size={16} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por señal o estación"
              aria-label="Buscar por señal o estación"
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
            {(['active', 'inactive', 'planned'] as const).map((s) => (
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
            {sorted.length} {sorted.length === 1 ? 'señal' : 'señales'}
          </span>
        </div>

        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-bg-secondary text-text-secondary text-left text-xs font-medium tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('signal')}
                    className="hover:text-text-primary flex items-center uppercase tracking-wide"
                  >
                    Señal
                    {sortIndicator('signal')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('virtualChannel')}
                    className="hover:text-text-primary flex items-center uppercase tracking-wide"
                  >
                    Canal virtual
                    {sortIndicator('virtualChannel')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('physicalChannel')}
                    className="hover:text-text-primary flex items-center uppercase tracking-wide"
                  >
                    Canal físico
                    {sortIndicator('physicalChannel')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('frequency')}
                    className="hover:text-text-primary flex items-center uppercase tracking-wide"
                  >
                    Frecuencia
                    {sortIndicator('frequency')}
                  </button>
                </th>
                <th className="px-4 py-3">Red</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('station')}
                    className="hover:text-text-primary flex items-center uppercase tracking-wide"
                  >
                    Estación
                    {sortIndicator('station')}
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
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {paginated.map((row) => (
                <tr key={row.key}>
                  <td className="text-text-primary px-4 py-3">{row.signalName}</td>
                  <td className="text-text-primary px-4 py-3 font-mono">
                    {row.virtualChannel ?? 'Sin dato'}
                  </td>
                  <td className="text-text-primary px-4 py-3 font-mono">
                    {row.physicalChannel ?? 'Sin dato'}
                  </td>
                  <td className="text-text-primary px-4 py-3 font-mono">
                    {row.frequencyMhz !== null ? `${row.frequencyMhz} MHz` : 'Sin dato'}
                  </td>
                  <td className="text-text-secondary px-4 py-3">{NETWORK_LABEL[row.network]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATION_STATUS_BADGE_CLASSES[row.status]}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STATION_STATUS_DOT_CLASSES[row.status]}`}
                      />
                      {STATION_STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/estaciones/${row.stationSlug}`}
                      className="text-link hover:underline"
                    >
                      {row.stationName}
                    </a>
                  </td>
                  <td className="text-text-secondary px-4 py-3">{row.province}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-text-secondary px-4 py-6 text-center">
                    No hay señales que coincidan con los filtros elegidos.
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
              {sorted.length === 1 ? 'señal' : 'señales'}
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
      </section>
    </div>
  );
}
