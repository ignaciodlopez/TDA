import { useState } from 'react';
import type { Station } from '@/types/station';
import { STATION_STATUS_LABEL } from '@/types/station';
import { formatDistanceKm } from '@/lib/geo/distance';
import { degreesToCardinal, formatAzimuth, bearingDegrees } from '@/lib/geo/azimuth';
import { sortStationsByDistance } from '@/lib/geo/rank';
import { estimateReceptionDifficulty, RECEPTION_DIFFICULTY_LABEL } from '@/lib/geo/reception';
import type { Coordinates } from '@/types/geo';
import OriginPicker from '@/features/tools/OriginPicker';

interface Props {
  stations: Station[];
}

export default function NearestStationTool({ stations }: Props) {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);

  const ranked = origin ? sortStationsByDistance(stations, origin).slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <OriginPicker
        onChange={(coords, label) => {
          setOrigin(coords);
          setOriginLabel(label);
        }}
      />

      {!origin && (
        <p className="text-sm text-text-secondary">
          Elegí un origen arriba para ver las estaciones más cercanas.
        </p>
      )}

      {origin && (
        <div>
          <p className="mb-3 text-sm text-text-secondary">
            Mostrando resultados desde: <span className="font-medium text-text-primary">{originLabel}</span>
          </p>
          <ol className="space-y-3">
            {ranked.map(({ station, distanceKm }, index) => {
              const azimuth = bearingDegrees(origin, {
                latitude: station.location.latitude,
                longitude: station.location.longitude,
              });
              const difficulty = estimateReceptionDifficulty(distanceKm, station.coverage.estimatedRadiusKm);
              return (
                <li key={station.id} className="rounded-lg border border-border bg-bg-primary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-text-secondary">#{index + 1}</p>
                      <h3 className="font-semibold text-text-primary">{station.name}</h3>
                      <p className="text-sm text-text-secondary">
                        {station.location.city}, {station.location.province} · {STATION_STATUS_LABEL[station.status]}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-lg text-text-primary">
                      {formatDistanceKm(distanceKm)}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-text-secondary">Dirección</dt>
                      <dd className="font-mono text-text-primary">
                        {formatAzimuth(azimuth)} ({degreesToCardinal(azimuth)})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-secondary">Señales</dt>
                      <dd className="text-text-primary">{station.signals.length}</dd>
                    </div>
                    <div>
                      <dt className="text-text-secondary">Recepción estimada</dt>
                      <dd className="text-text-primary">{RECEPTION_DIFFICULTY_LABEL[difficulty]}</dd>
                    </div>
                  </dl>
                  <a
                    href={`/estaciones/${station.slug}`}
                    className="mt-3 inline-block text-sm font-medium text-link hover:underline"
                  >
                    Ver ficha completa →
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
