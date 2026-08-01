import type { Station, Signal } from '@/types/station';

/**
 * Una fila combina una señal individual con los datos de su estación transmisora, para poder
 * listar/filtrar/ordenar señales de todas las estaciones en una sola tabla (usado por
 * /canales y /frecuencias).
 */
export interface SignalRow {
  key: string;
  signalName: string;
  virtualChannel: string | null;
  physicalChannel: number | null;
  frequencyMhz: number | null;
  network: Signal['network'];
  status: Signal['status'];
  stationId: string;
  stationSlug: string;
  stationName: string;
  province: string;
}

export interface SignalSummary {
  key: string;
  signalName: string;
  virtualChannel: string | null;
  physicalChannel: number | null;
  frequencyMhz: number | null;
  network: Signal['network'];
  stationCount: number;
}

/**
 * Agrupa filas señal+estación por señal única (mismo nombre/canal/red), para mostrar un catálogo
 * compacto en vez de repetir la misma fila una vez por cada estación que la transmite — útil
 * mientras casi todas las señales cargadas son nacionales e idénticas en todas las estaciones.
 */
export function summarizeSignals(rows: SignalRow[]): SignalSummary[] {
  const groups = new Map<string, SignalSummary>();
  for (const row of rows) {
    const key = `${row.network}-${row.physicalChannel}-${row.virtualChannel}-${row.signalName}`;
    const existing = groups.get(key);
    if (existing) {
      existing.stationCount += 1;
    } else {
      groups.set(key, {
        key,
        signalName: row.signalName,
        virtualChannel: row.virtualChannel,
        physicalChannel: row.physicalChannel,
        frequencyMhz: row.frequencyMhz,
        network: row.network,
        stationCount: 1,
      });
    }
  }
  return [...groups.values()].sort((a, b) =>
    (a.virtualChannel ?? '').localeCompare(b.virtualChannel ?? '', 'es', { numeric: true }),
  );
}

/** Aplana `station.signals` de todas las estaciones en filas señal+estación. */
export function buildSignalRows(stations: Station[]): SignalRow[] {
  const rows: SignalRow[] = [];
  for (const station of stations) {
    station.signals.forEach((signal, index) => {
      rows.push({
        key: `${station.id}-${index}`,
        signalName: signal.name,
        virtualChannel: signal.virtualChannel,
        physicalChannel: signal.physicalChannel,
        frequencyMhz: signal.frequencyMhz,
        network: signal.network,
        status: signal.status,
        stationId: station.id,
        stationSlug: station.slug,
        stationName: station.name,
        province: station.location.province,
      });
    });
  }
  return rows;
}
