import { useState } from 'react';
import { getAllLocalities } from '@/lib/data/geo';
import { useGeolocation } from '@/features/map/useGeolocation';
import type { Coordinates } from '@/types/geo';

interface Props {
  onChange: (origin: Coordinates | null, label: string | null) => void;
}

export default function OriginPicker({ onChange }: Props) {
  const { state, request } = useGeolocation();
  const [localityId, setLocalityId] = useState('');
  const localities = getAllLocalities();

  function handleUseLocation() {
    setLocalityId('');
    request((coordinates) => onChange(coordinates, 'Tu ubicación actual'));
  }

  function handleLocalityChange(id: string) {
    setLocalityId(id);
    if (!id) {
      onChange(null, null);
      return;
    }
    const locality = localities.find((l) => l.id === id);
    if (locality) {
      onChange({ latitude: locality.latitude, longitude: locality.longitude }, locality.name);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-bg-secondary p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleUseLocation}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {state.status === 'requesting' ? 'Buscando ubicación…' : 'Usar mi ubicación'}
        </button>
        <span className="text-sm text-text-secondary">o elegí una localidad</span>
        <select
          aria-label="Elegir localidad de origen"
          value={localityId}
          onChange={(e) => handleLocalityChange(e.target.value)}
          className="rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
        >
          <option value="">Seleccioná una localidad</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>
              {locality.name}
            </option>
          ))}
        </select>
      </div>

      {state.status === 'granted' && !localityId && (
        <p className="text-sm text-status-good-text">Usando tu ubicación actual.</p>
      )}
      {state.status === 'denied' && (
        <p className="text-sm text-status-bad-text">
          No autorizaste tu ubicación. Elegí una localidad de la lista como alternativa.
        </p>
      )}
      {state.status === 'unsupported' && (
        <p className="text-sm text-status-bad-text">
          Tu navegador no admite geolocalización. Elegí una localidad de la lista.
        </p>
      )}
    </div>
  );
}
