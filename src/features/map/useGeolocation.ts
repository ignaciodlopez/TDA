import { useCallback, useState } from 'react';
import type { Coordinates } from '@/types/geo';

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; coordinates: Coordinates }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

/**
 * Geolocalización opt-in: solo se consulta cuando el usuario llama a `request()`.
 * No persiste la ubicación en ningún almacenamiento; vive únicamente en el estado del componente.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' });

  const request = useCallback((onGranted?: (coordinates: Coordinates) => void) => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported' });
      return;
    }
    setState({ status: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setState({ status: 'granted', coordinates });
        onGranted?.(coordinates);
      },
      (error) => {
        setState(error.code === error.PERMISSION_DENIED ? { status: 'denied' } : { status: 'error', message: error.message });
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, request, reset };
}
