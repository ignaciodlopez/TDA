import { useCallback, useState } from 'react';
import type { Coordinates } from '@/types/geo';

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; coordinates: Coordinates }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

/** Mensaje para el usuario ante un estado terminal fallido, o `null` si no hay nada que mostrar
 * (idle/requesting/granted). Centralizado acá para que el toolbar del mapa, el panel de estación y
 * el widget de la home lo muestren igual en vez de que cada consumidor invente su propio texto. */
export function geolocationErrorMessage(status: GeolocationState['status']): string | null {
  switch (status) {
    case 'denied':
      return 'No autorizaste el acceso a tu ubicación. Podés habilitarlo desde la configuración del navegador.';
    case 'unsupported':
      return 'Tu navegador no admite geolocalización.';
    case 'error':
      return 'No pudimos obtener tu ubicación. Probá de nuevo.';
    default:
      return null;
  }
}

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

  return { state, request };
}
