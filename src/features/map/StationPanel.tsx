import { useMemo, useState } from 'react';
import type { Signal, Station } from '@/types/station';
import {
  STATION_STATUS_BADGE_CLASSES,
  STATION_STATUS_DOT_CLASSES,
  STATION_STATUS_LABEL,
} from '@/types/station';
import { formatDistanceKm, haversineDistanceKm } from '@/lib/geo/distance';
import { bearingDegrees, degreesToCardinal, formatAzimuth } from '@/lib/geo/azimuth';
import type { Coordinates } from '@/types/geo';
import { ICON_PATHS, ReactIcon } from '@/lib/icons';

interface Props {
  station: Station;
  origin: Coordinates | null;
  onClose: () => void;
  onRequestLocation: () => void;
  locationStatus: 'idle' | 'requesting' | 'denied' | 'unsupported';
}

export default function StationPanel({
  station,
  origin,
  onClose,
  onRequestLocation,
  locationStatus,
}: Props) {
  const destination: Coordinates = {
    latitude: station.location.latitude,
    longitude: station.location.longitude,
  };
  const distanceKm = origin ? haversineDistanceKm(origin, destination) : null;
  const azimuth = origin ? bearingDegrees(origin, destination) : null;
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const signalGroups = useMemo(() => {
    const groups = new Map<string, Signal[]>();
    for (const signal of station.signals) {
      const key = signal.physicalChannel !== null ? String(signal.physicalChannel) : 'sin-dato';
      const group = groups.get(key);
      if (group) group.push(signal);
      else groups.set(key, [signal]);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === 'sin-dato') return 1;
      if (b === 'sin-dato') return -1;
      return Number(a) - Number(b);
    });
  }, [station.signals]);

  async function handleShare() {
    const url = `${window.location.origin}/estaciones/${station.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, url });
        return;
      } catch {
        // El usuario canceló el diálogo nativo de compartir; se ofrece copiar el enlace como alternativa.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopyFeedback('Enlace copiado');
    window.setTimeout(() => setCopyFeedback(null), 2000);
  }

  async function handleCopyCoordinates() {
    await navigator.clipboard.writeText(`${destination.latitude}, ${destination.longitude}`);
    setCopyFeedback('Coordenadas copiadas');
    window.setTimeout(() => setCopyFeedback(null), 2000);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-brand-500/10 text-brand-500 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <ReactIcon path={ICON_PATHS.broadcast} size={18} />
          </span>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATION_STATUS_BADGE_CLASSES[station.status]}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATION_STATUS_DOT_CLASSES[station.status]}`}
              />
              {STATION_STATUS_LABEL[station.status]}
            </span>
            <h2 className="text-text-primary mt-2 text-lg font-semibold">{station.name}</h2>
            <p className="text-text-secondary text-sm">
              {station.location.city}, {station.location.province}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha de estación"
          className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-md p-1.5"
        >
          ✕
        </button>
      </div>

      {station.isDemoData && (
        <p className="border-status-warn/50 bg-status-warn-bg text-text-secondary mb-4 rounded-md border px-3 py-2 text-xs">
          <strong className="text-text-primary">Dato de ejemplo</strong> — no utilizar como
          información real.
        </p>
      )}

      <div className="border-border bg-bg-secondary mb-4 rounded-md border p-3 shadow-[var(--shadow-soft)]">
        {origin && distanceKm !== null && azimuth !== null ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-secondary">Distancia</dt>
              <dd className="text-text-primary font-mono">{formatDistanceKm(distanceKm)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Dirección</dt>
              <dd className="text-text-primary font-mono">
                {formatAzimuth(azimuth)} ({degreesToCardinal(azimuth)})
              </dd>
            </div>
          </dl>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-text-secondary text-sm">
              {locationStatus === 'denied'
                ? 'No autorizaste tu ubicación, así que no podemos calcular la distancia ni la dirección.'
                : 'Activá tu ubicación para ver distancia y dirección hacia esta estación.'}
            </p>
            {locationStatus !== 'denied' && (
              <button
                type="button"
                onClick={onRequestLocation}
                className="bg-brand-500 hover:bg-brand-600 shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-white"
              >
                {locationStatus === 'requesting' ? 'Buscando…' : 'Usar mi ubicación'}
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="text-text-primary mb-2 text-sm font-semibold">Señales</h3>
      <div className="mb-4 space-y-3">
        {signalGroups.map(([channel, signals]) => (
          <div
            key={channel}
            className="border-border overflow-hidden rounded-md border shadow-[var(--shadow-soft)]"
          >
            <p className="border-border bg-bg-secondary text-text-secondary border-b px-3 py-1.5 font-mono text-xs font-medium">
              {channel === 'sin-dato' ? 'Canal sin dato' : `Canal ${channel}`}
            </p>
            <ul className="divide-border divide-y">
              {signals.map((signal, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="text-text-primary">{signal.name}</span>
                  <span className="text-text-secondary font-mono text-xs">
                    {signal.virtualChannel ?? 'Sin dato'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="border-border text-text-secondary hover:border-brand-500 hover:text-link rounded-md border px-3 py-1.5 text-xs font-medium"
        >
          Compartir enlace
        </button>
        <button
          type="button"
          onClick={handleCopyCoordinates}
          className="border-border text-text-secondary hover:border-brand-500 hover:text-link rounded-md border px-3 py-1.5 text-xs font-medium"
        >
          Copiar coordenadas
        </button>
        <a
          href={`https://www.openstreetmap.org/?mlat=${destination.latitude}&mlon=${destination.longitude}#map=15/${destination.latitude}/${destination.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="border-border text-text-secondary hover:border-brand-500 hover:text-link rounded-md border px-3 py-1.5 text-xs font-medium"
        >
          Abrir en un mapa externo
        </a>
      </div>
      {copyFeedback && (
        <p role="status" className="text-status-good-text mb-3 text-xs">
          {copyFeedback}
        </p>
      )}

      <a
        href={`/estaciones/${station.slug}`}
        className="bg-brand-500 hover:bg-brand-600 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-white"
      >
        Ver ficha completa
      </a>
    </div>
  );
}
