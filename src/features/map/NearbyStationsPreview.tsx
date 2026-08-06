import type { Station } from '@/types/station';
import { STATION_STATUS_LABEL } from '@/types/station';
import { formatDistanceKm } from '@/lib/geo/distance';
import { sortStationsByDistance } from '@/lib/geo/rank';
import { useGeolocation, geolocationErrorMessage } from '@/features/map/useGeolocation';

interface Props {
  stations: Station[];
}

export default function NearbyStationsPreview({ stations }: Props) {
  const { state, request } = useGeolocation();

  if (state.status !== 'granted') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-bg-primary p-5">
        <p className="text-sm text-text-secondary">
          Activá tu ubicación para ver qué estaciones tenés más cerca. No la guardamos: se usa solo en tu
          navegador para este cálculo.
        </p>
        <button
          type="button"
          onClick={() => request()}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {state.status === 'requesting' ? 'Buscando ubicación…' : 'Buscar mi ubicación'}
        </button>
        {geolocationErrorMessage(state.status) && (
          <p className="text-xs text-status-bad-text">
            {geolocationErrorMessage(state.status)} También podés buscar tu localidad manualmente en el
            mapa.
          </p>
        )}
      </div>
    );
  }

  const nearest = sortStationsByDistance(stations, state.coordinates).slice(0, 3);

  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {nearest.map(({ station, distanceKm }) => (
        <li key={station.id} className="rounded-lg border border-border bg-bg-primary p-4">
          <p className="text-sm font-semibold text-text-primary">{station.name}</p>
          <p className="text-xs text-text-secondary">
            {station.location.city}, {station.location.province}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-mono text-text-primary">{formatDistanceKm(distanceKm)}</span>
            <span className="text-text-secondary">{STATION_STATUS_LABEL[station.status]}</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">{station.signals.length} señales</p>
          <a href={`/estaciones/${station.slug}`} className="mt-2 inline-block text-xs font-medium text-link hover:underline">
            Ver ficha completa →
          </a>
        </li>
      ))}
    </ul>
  );
}
