import { useMemo } from 'react';
import type { Station } from '@/types/station';

interface Props {
  stations: Station[];
  value: string | null;
  onChange: (stationId: string | null) => void;
  label?: string;
}

export default function StationSelect({ stations, value, onChange, label = 'Elegí una estación' }: Props) {
  const byProvince = useMemo(() => {
    const groups = new Map<string, Station[]>();
    for (const station of stations) {
      const list = groups.get(station.location.province) ?? [];
      list.push(station);
      groups.set(station.location.province, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [stations]);

  return (
    <div>
      <label htmlFor="station-select" className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id="station-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
      >
        <option value="">Seleccioná una estación</option>
        {byProvince.map(([province, list]) => (
          <optgroup key={province} label={province}>
            {list.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
