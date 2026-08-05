import { useEffect, useMemo, useRef, useState } from 'react';
import type { Station } from '@/types/station';
import { angularDifference, bearingDegrees, degreesToCardinal, formatAzimuth } from '@/lib/geo/azimuth';
import { formatDistanceKm, haversineDistanceKm } from '@/lib/geo/distance';
import { sortStationsByDistance } from '@/lib/geo/rank';
import type { Coordinates } from '@/types/geo';
import OriginPicker from '@/features/tools/OriginPicker';
import StationSelect from '@/features/tools/StationSelect';
import { useDeviceOrientation } from '@/features/tools/useDeviceOrientation';

interface Props {
  stations: Station[];
}

// Margen de tolerancia para considerar "alineado": el rumbo suavizado igual tiene algo de
// ruido, así que 0° exacto casi nunca ocurre y el aviso nunca dispararía con un umbral más chico.
const ALIGNMENT_TOLERANCE_DEG = 6;

export default function AntennaOrientationTool({ stations }: Props) {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  // null = sin elección explícita del usuario todavía: se usa la estación más cercana por defecto.
  const [chosenStationId, setChosenStationId] = useState<string | null>(null);
  // La brújula en vivo solo tiene sentido en un dispositivo con puntero "impreciso" (táctil): en
  // desktop, con mouse/trackpad, no hay sensor de orientación real, así que ni se ofrece el botón.
  const [isTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );
  const compass = useDeviceOrientation();

  // Mientras el usuario no elija una estación a mano, preseleccionar la más cercana al origen.
  const nearestStationId = useMemo(
    () => (origin ? (sortStationsByDistance(stations, origin)[0]?.station.id ?? null) : null),
    [origin, stations],
  );
  const stationId = chosenStationId ?? nearestStationId;

  const station = stations.find((s) => s.id === stationId) ?? null;
  const destination: Coordinates | null = station
    ? { latitude: station.location.latitude, longitude: station.location.longitude }
    : null;

  const azimuth = origin && destination ? bearingDegrees(origin, destination) : null;
  const distanceKm = origin && destination ? haversineDistanceKm(origin, destination) : null;

  // Con brújula en vivo, la rotación del disco (aro de puntos cardinales + flecha) se corre por
  // el rumbo del celular: el mismo `rotate(azimuth)` de la flecha queda igual, pero envuelto en un
  // contenedor rotado por -heading, así "arriba" en pantalla pasa a ser "hacia donde apunta el celular".
  const compassActive = compass.state.status === 'active';
  const headingOffset = compassActive && compass.state.status === 'active' ? compass.state.headingDegrees : 0;

  const isAligned =
    compassActive && azimuth !== null && Math.abs(angularDifference(azimuth, headingOffset)) <= ALIGNMENT_TOLERANCE_DEG;

  // Avisa por vibración al entrar en la zona alineada (no en cada frame mientras seguís ahí,
  // para no generar un zumbido continuo). Se resetea solo al salir de la zona. La Vibration API
  // no existe en Safari/iOS, por eso el color de la flecha abajo funciona como respaldo visual.
  const wasAlignedRef = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAlignedRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  return (
    <div className="space-y-6">
      <OriginPicker
        onChange={(coords, label) => {
          setOrigin(coords);
          setOriginLabel(label);
        }}
      />
      <StationSelect
        stations={stations}
        value={stationId}
        onChange={setChosenStationId}
        label="¿Hacia qué estación querés orientar la antena?"
      />

      {origin && station && azimuth !== null && distanceKm !== null && (
        <div className="grid gap-6 rounded-lg border border-border bg-bg-primary p-6 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-border"
              style={{ transform: `rotate(${-headingOffset}deg)` }}
              aria-hidden="true"
            >
              <span className="absolute top-1 text-xs text-text-secondary">N</span>
              <span className="absolute right-1 text-xs text-text-secondary">E</span>
              <span className="absolute bottom-1 text-xs text-text-secondary">S</span>
              <span className="absolute left-1 text-xs text-text-secondary">O</span>
              <svg
                viewBox="0 0 100 100"
                className={`absolute inset-0 h-full w-full transition-colors duration-150 ${isAligned ? 'text-status-good' : 'text-brand-500'}`}
                style={{ transform: `rotate(${azimuth}deg)` }}
              >
                <line x1="50" y1="50" x2="50" y2="32" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                <polygon points="50,18 43,32 57,32" fill="currentColor" />
              </svg>
            </div>
            <p className="sr-only">
              Orientá la antena {formatAzimuth(azimuth)}, aproximadamente hacia el {degreesToCardinal(azimuth)}.
            </p>

            {isTouchDevice && <CompassActivation compass={compass} />}
          </div>

          <div>
            <p className="text-sm text-text-secondary">
              Desde <span className="font-medium text-text-primary">{originLabel}</span> hacia{' '}
              <span className="font-medium text-text-primary">{station.name}</span>:
            </p>
            <p className="mt-2 font-mono text-3xl text-text-primary">{formatAzimuth(azimuth)}</p>
            <p className="text-text-secondary">
              Aproximadamente hacia el <strong className="text-text-primary">{degreesToCardinal(azimuth)}</strong>
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Distancia: <span className="font-mono text-text-primary">{formatDistanceKm(distanceKm)}</span>
            </p>
            {compassActive && (
              <p className="mt-2 text-sm text-status-good-text">
                {isAligned
                  ? '¡Alineado! Tu celular está mirando hacia la estación.'
                  : 'Brújula activa: cuando la flecha apunte hacia arriba, tu celular está mirando hacia la estación.'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-md border border-status-warn/40 bg-status-warn-bg p-4 text-sm text-text-secondary">
        <p>
          <strong className="text-text-primary">Antes de instalar:</strong> la brújula de tu celular puede
          tener un margen de error, sobre todo cerca de estructuras metálicas. Usá este cálculo como punto
          de partida y hacé ajustes pequeños mientras alguien observa el medidor de señal del televisor.
        </p>
        <p>
          Evitá trabajar en altura sin la protección adecuada. Más detalle en la guía{' '}
          <a href="/guias/como-orientar-antena-tda" className="text-link underline underline-offset-2">
            Cómo orientar tu antena de TDA
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function CompassActivation({ compass }: { compass: ReturnType<typeof useDeviceOrientation> }) {
  const { state, start, stop } = compass;

  if (state.status === 'unsupported') return null;

  if (state.status === 'active') {
    return (
      <button
        type="button"
        onClick={stop}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-brand-500 hover:text-link"
      >
        Desactivar brújula en vivo
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={start}
        className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-glow-brand)] transition-all duration-200 hover:bg-brand-600"
      >
        {state.status === 'requesting' ? 'Activando…' : 'Activar brújula en vivo'}
      </button>
      {state.status === 'denied' && (
        <p className="max-w-[220px] text-center text-xs text-status-bad-text">
          No autorizaste el sensor de orientación. Podés seguir usando el cálculo fijo de arriba.
        </p>
      )}
      {state.status === 'no-data' && (
        <p className="max-w-[220px] text-center text-xs text-text-secondary">
          Este dispositivo no tiene brújula disponible. Usá el cálculo fijo de arriba.
        </p>
      )}
    </div>
  );
}
