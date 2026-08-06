import { useMemo, useRef, useState } from 'react';
import { searchPlaces } from '@/lib/data/geo';

export interface StationSearchItem {
  id: string;
  slug: string;
  name: string;
  city: string;
}

interface Props {
  placeholder?: string;
  /** Estaciones cargadas, resueltas en el servidor (src/lib/data/stations.ts) — searchPlaces() solo
   * conoce las 17 localidades principales de src/data/provinces/localities.json, muchas menos que las
   * estaciones reales, así que se buscan por separado y se combinan acá. */
  stations?: StationSearchItem[];
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function searchStations(stations: StationSearchItem[], query: string): StationSearchItem[] {
  const q = normalize(query.trim());
  return stations.filter((s) => normalize(s.name).includes(q) || normalize(s.city).includes(q));
}

export default function GlobalSearch({
  placeholder = 'Ingresá tu localidad, provincia o código postal',
  stations = [],
}: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const places = searchPlaces(query);
    const stationResults = searchStations(stations, query).map((value) => ({
      type: 'station' as const,
      value,
    }));
    return [...places, ...stationResults].slice(0, 8);
  }, [query, stations]);

  function resultHref(result: (typeof results)[number]): string {
    if (result.type === 'locality') return `/localidades/${result.value.slug}`;
    if (result.type === 'province') return `/provincias/${result.value.slug}`;
    return `/estaciones/${result.value.slug}`;
  }

  function resultTypeLabel(result: (typeof results)[number]): string {
    if (result.type === 'locality') return 'Localidad';
    if (result.type === 'province') return 'Provincia';
    return 'Estación';
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results.length > 0 && results[0]) {
      window.location.href = resultHref(results[0]);
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    }
  }

  function handleItemKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      itemRefs.current[index + 1]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else itemRefs.current[index - 1]?.focus();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.focus();
    }
  }

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={handleSubmit}
      onBlur={(event) => {
        // Cerrar solo cuando el foco sale del widget entero (input + lista de resultados), no al
        // pasar de uno a otro con flecha arriba/abajo — evita que la lista se desmonte antes de que
        // un Enter en un resultado llegue a procesarse.
        if (!formRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
      className="relative w-full"
    >
      <label htmlFor="global-search-input" className="sr-only">
        Buscar localidad, provincia o código postal
      </label>
      <input
        id="global-search-input"
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-md border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-primary shadow-lg">
          {results.map((result, index) => (
            <li key={`${result.type}-${result.value.id}`}>
              <a
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                href={resultHref(result)}
                onKeyDown={(event) => handleItemKeyDown(event, index)}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-text-primary hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
              >
                <span>{result.value.name}</span>
                <span className="text-xs text-text-secondary">{resultTypeLabel(result)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
