import { useEffect, useMemo, useRef, useState } from 'react';
import type { Station } from '@/types/station';
import { STATION_STATUS_LABEL } from '@/types/station';
import {
  filterStations,
  filtersToSearchParams,
  hasActiveFilters,
  searchParamsToFilters,
  type MapFilters,
} from '@/lib/geo/filters';
import { stationsToFeatureCollection } from '@/lib/geo/geojson';
import { formatDistanceKm } from '@/lib/geo/distance';
import { sortStationsByDistance } from '@/lib/geo/rank';
import { searchPlaces } from '@/lib/data/geo';
import type { Coordinates } from '@/types/geo';
import MapView from '@/features/map/MapView';
import MapLegend from '@/features/map/MapLegend';
import FilterPanel from '@/features/map/FilterPanel';
import StationPanel from '@/features/map/StationPanel';
import { useGeolocation, geolocationErrorMessage } from '@/features/map/useGeolocation';
import { ICON_PATHS, ReactIcon } from '@/lib/icons';

interface Props {
  stations: Station[];
}

export default function MapExplorer({ stations }: Props) {
  // Este componente se monta con client:only="react", así que `window` ya está disponible
  // de forma síncrona en el primer render: no hace falta un efecto para hidratar desde la URL.
  const [filters, setFilters] = useState<MapFilters>(() =>
    searchParamsToFilters(new URLSearchParams(window.location.search)),
  );
  const [selectedStationId, setSelectedStationId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('estacion'),
  );
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { state: geoState, request: requestLocation } = useGeolocation();

  useEffect(() => {
    const params = filtersToSearchParams(filters);
    if (selectedStationId) params.set('estacion', selectedStationId);
    const search = params.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState(null, '', url);
  }, [filters, selectedStationId]);

  const origin: Coordinates | null = geoState.status === 'granted' ? geoState.coordinates : null;

  const filteredStations = useMemo(() => filterStations(stations, filters), [stations, filters]);

  const searchResults = useMemo(() => {
    if (query.trim().length < 2)
      return { stations: [] as Station[], places: [] as ReturnType<typeof searchPlaces> };
    const q = query.trim().toLowerCase();
    return {
      stations: stations.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6),
      places: searchPlaces(query).slice(0, 6),
    };
  }, [query, stations]);

  const featureCollection = useMemo(
    () => stationsToFeatureCollection(filteredStations),
    [filteredStations],
  );
  const selectedStation = filteredStations.find((s) => s.id === selectedStationId) ?? null;

  const listStations = useMemo(() => {
    if (origin) return sortStationsByDistance(filteredStations, origin);
    return [...filteredStations]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((station) => ({ station, distanceKm: null as number | null }));
  }, [filteredStations, origin]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-border bg-bg-primary border-b p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            ref={searchContainerRef}
            className="relative min-w-[220px] flex-1"
            onBlur={(e) => {
              // Igual que en el buscador del header: cerrar solo cuando el foco sale del widget
              // entero, no al pasar del input a un resultado de la lista — si no, el dropdown se
              // desmonta antes de que un clic/Enter en un resultado llegue a procesarse.
              if (!searchContainerRef.current?.contains(e.relatedTarget as Node | null)) {
                setSearchOpen(false);
              }
            }}
          >
            <label htmlFor="map-search" className="sr-only">
              Buscar estación, localidad o provincia
            </label>
            <span className="text-text-secondary pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <ReactIcon path={ICON_PATHS.search} size={16} />
            </span>
            <input
              id="map-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              placeholder="Buscar estación, localidad o provincia"
              className="border-border bg-bg-primary text-text-primary placeholder:text-text-secondary focus-visible:outline-brand-500 w-full rounded-md border py-2.5 pr-3 pl-9 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            {searchOpen && (searchResults.stations.length > 0 || searchResults.places.length > 0) && (
              <ul className="border-border bg-bg-primary absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border shadow-[var(--shadow-soft)]">
                {searchResults.stations.map((station) => (
                  <li key={station.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStationId(station.id);
                        setQuery('');
                        setSearchOpen(false);
                      }}
                      className="hover:bg-surface flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                    >
                      <span>{station.name}</span>
                      <span className="text-text-secondary text-xs">Estación</span>
                    </button>
                  </li>
                ))}
                {searchResults.places.map((place) => (
                  <li key={`${place.type}-${place.value.id}`}>
                    {place.type === 'province' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters((f) => ({ ...f, province: place.value.name }));
                          setQuery('');
                          setSearchOpen(false);
                        }}
                        className="hover:bg-surface flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                      >
                        <span>{place.value.name}</span>
                        <span className="text-text-secondary text-xs">Provincia</span>
                      </button>
                    ) : (
                      <a
                        href={`/localidades/${place.value.slug}`}
                        className="hover:bg-surface flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span>{place.value.name}</span>
                        <span className="text-text-secondary text-xs">Localidad</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className="border-border bg-surface text-text-secondary hover:border-brand-500 hover:text-link focus-visible:outline-brand-500 inline-flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
          >
            <ReactIcon path={ICON_PATHS.sliders} size={16} />
            Filtros
            {hasActiveFilters(filters) && (
              <span className="bg-brand-500 h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            )}
          </button>

          <div className="border-border flex overflow-hidden rounded-md border">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              aria-pressed={viewMode === 'map'}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                viewMode === 'map'
                  ? 'bg-brand-500 text-white shadow-[var(--shadow-glow-brand)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ReactIcon path={ICON_PATHS.map} size={16} />
              Mapa
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-brand-500 text-white shadow-[var(--shadow-glow-brand)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ReactIcon path={ICON_PATHS.list} size={16} />
              Listado
            </button>
          </div>

          <button
            type="button"
            onClick={() => requestLocation()}
            className="border-border bg-surface text-text-secondary hover:border-brand-500 hover:text-link focus-visible:outline-brand-500 inline-flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ReactIcon path={ICON_PATHS.pin} size={16} />
            {geoState.status === 'requesting' ? 'Buscando ubicación…' : 'Usar mi ubicación'}
          </button>
        </div>
        {geolocationErrorMessage(geoState.status) && (
          <p className="text-status-bad-text mt-2 text-xs">{geolocationErrorMessage(geoState.status)}</p>
        )}
      </div>

      <div className={filtersOpen ? 'block' : 'hidden sm:block'}>
        <FilterPanel stations={stations} filters={filters} onChange={setFilters} />
      </div>

      <div className="relative flex-1 overflow-hidden">
        {viewMode === 'map' ? (
          <div className="relative h-full w-full">
            <MapView
              stations={featureCollection}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
            <div className="pointer-events-none absolute top-3 left-3">
              <div className="pointer-events-auto">
                <MapLegend />
              </div>
            </div>

            {selectedStation && (
              <>
                <aside className="border-border bg-bg-primary absolute top-0 right-0 hidden h-full w-96 border-l shadow-xl md:block">
                  <StationPanel
                    station={selectedStation}
                    origin={origin}
                    onClose={() => setSelectedStationId(null)}
                    onRequestLocation={() => requestLocation()}
                    locationStatus={geoState.status}
                  />
                </aside>
                <div className="border-border bg-bg-primary absolute inset-x-0 bottom-0 max-h-[70vh] rounded-t-xl border-t shadow-2xl md:hidden">
                  <div className="flex justify-center pt-2" aria-hidden="true">
                    <span className="bg-border h-1 w-10 rounded-full" />
                  </div>
                  <StationPanel
                    station={selectedStation}
                    origin={origin}
                    onClose={() => setSelectedStationId(null)}
                    onRequestLocation={() => requestLocation()}
                    locationStatus={geoState.status}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <p className="text-text-secondary mb-3 text-sm">
              {listStations.length} estaci{listStations.length === 1 ? 'ón' : 'ones'} encontrada
              {listStations.length === 1 ? '' : 's'}
              {origin ? ', ordenadas por distancia.' : '.'}
            </p>
            <ul className="divide-border border-border divide-y rounded-md border">
              {listStations.map(({ station, distanceKm }) => (
                <li key={station.id}>
                  <a
                    href={`/estaciones/${station.slug}`}
                    className="hover:bg-surface flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-text-primary text-sm font-medium">{station.name}</p>
                      <p className="text-text-secondary text-xs">
                        {station.location.city}, {station.location.province} ·{' '}
                        {STATION_STATUS_LABEL[station.status]}
                      </p>
                    </div>
                    {distanceKm !== null && (
                      <span className="text-text-primary shrink-0 font-mono text-sm">
                        {formatDistanceKm(distanceKm)}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
