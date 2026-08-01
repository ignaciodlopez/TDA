import { useState } from 'react';
import type { Station } from '@/types/station';
import { STATION_STATUS_LABEL } from '@/types/station';
import { bearingDegrees, degreesToCardinal, formatAzimuth } from '@/lib/geo/azimuth';
import { formatDistanceKm, haversineDistanceKm } from '@/lib/geo/distance';
import type { Coordinates } from '@/types/geo';
import OriginPicker from '@/features/tools/OriginPicker';
import StationSelect from '@/features/tools/StationSelect';

interface Props {
  stations: Station[];
}

export default function DistanceCalculatorTool({ stations }: Props) {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);

  const station = stations.find((s) => s.id === stationId) ?? null;
  const destination: Coordinates | null = station
    ? { latitude: station.location.latitude, longitude: station.location.longitude }
    : null;

  const distanceKm = origin && destination ? haversineDistanceKm(origin, destination) : null;
  const azimuth = origin && destination ? bearingDegrees(origin, destination) : null;

  return (
    <div className="space-y-6">
      <OriginPicker
        onChange={(coords, label) => {
          setOrigin(coords);
          setOriginLabel(label);
        }}
      />
      <StationSelect stations={stations} value={stationId} onChange={setStationId} label="Estación de destino" />

      {origin && station && distanceKm !== null && azimuth !== null && (
        <div className="rounded-lg border border-border bg-bg-primary p-6">
          <p className="text-sm text-text-secondary">
            De <span className="font-medium text-text-primary">{originLabel}</span> a{' '}
            <span className="font-medium text-text-primary">{station.name}</span>
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-text-secondary">Distancia lineal</dt>
              <dd className="font-mono text-xl text-text-primary">{formatDistanceKm(distanceKm)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Azimut</dt>
              <dd className="font-mono text-xl text-text-primary">
                {formatAzimuth(azimuth)} ({degreesToCardinal(azimuth)})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Diferencia de elevación</dt>
              <dd className="text-text-primary">
                {station.location.elevationMeters !== null
                  ? `${station.location.elevationMeters} m`
                  : 'Sin información verificada'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">Estado de la estación</dt>
              <dd className="text-text-primary">{STATION_STATUS_LABEL[station.status]}</dd>
            </div>
          </dl>

          <a
            href={`/estaciones/${station.slug}`}
            className="mt-4 inline-block text-sm font-medium text-link hover:underline"
          >
            Ver ficha completa de la estación →
          </a>
        </div>
      )}
    </div>
  );
}
