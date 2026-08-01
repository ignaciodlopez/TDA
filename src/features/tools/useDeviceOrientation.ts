import { useCallback, useEffect, useRef, useState } from 'react';

export type DeviceOrientationState =
  | { status: 'idle' }
  | { status: 'unsupported' }
  | { status: 'requesting' }
  | { status: 'denied' }
  /** El navegador soporta el sensor y dio permiso, pero no llegó ningún evento (típico en desktop). */
  | { status: 'no-data' }
  | { status: 'active'; headingDegrees: number };

const NO_DATA_TIMEOUT_MS = 3000;

interface DeviceOrientationEventIOS {
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventConstructorIOS {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * Brújula del dispositivo vía DeviceOrientationEvent. Opt-in: no se suscribe hasta llamar a
 * `start()` desde un gesto del usuario (obligatorio en iOS Safari, que exige
 * `requestPermission()` disparado por un click, no se puede pedir de entrada).
 */
export function useDeviceOrientation() {
  const [state, setState] = useState<DeviceOrientationState>({ status: 'idle' });
  const handlerRef = useRef<((event: Event) => void) | null>(null);
  const eventNameRef = useRef<'deviceorientationabsolute' | 'deviceorientation' | null>(null);
  const noDataTimerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (handlerRef.current && eventNameRef.current) {
      window.removeEventListener(eventNameRef.current, handlerRef.current);
    }
    handlerRef.current = null;
    eventNameRef.current = null;
    if (noDataTimerRef.current !== null) {
      window.clearTimeout(noDataTimerRef.current);
      noDataTimerRef.current = null;
    }
    setState({ status: 'idle' });
  }, []);

  const subscribe = useCallback(() => {
    const handler = (rawEvent: Event) => {
      const event = rawEvent as DeviceOrientationEvent & DeviceOrientationEventIOS;
      let heading: number | null = null;

      if (typeof event.webkitCompassHeading === 'number') {
        // iOS Safari ya entrega un rumbo absoluto (0 = norte), sin invertir.
        heading = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        // Android/Chrome: alpha crece en sentido antihorario desde el eje Y del dispositivo;
        // el rumbo de brújula (horario desde el norte) es su complemento.
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== null) {
        if (noDataTimerRef.current !== null) {
          window.clearTimeout(noDataTimerRef.current);
          noDataTimerRef.current = null;
        }
        setState({ status: 'active', headingDegrees: heading });
      }
    };

    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    handlerRef.current = handler;
    eventNameRef.current = eventName;
    window.addEventListener(eventName, handler);

    noDataTimerRef.current = window.setTimeout(() => {
      setState((prev) => (prev.status === 'requesting' ? { status: 'no-data' } : prev));
    }, NO_DATA_TIMEOUT_MS);
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setState({ status: 'unsupported' });
      return;
    }

    setState({ status: 'requesting' });

    const DeviceOrientationEventCtor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorIOS;
    if (typeof DeviceOrientationEventCtor.requestPermission === 'function') {
      DeviceOrientationEventCtor.requestPermission()
        .then((result) => {
          if (result === 'granted') subscribe();
          else setState({ status: 'denied' });
        })
        .catch(() => setState({ status: 'denied' }));
    } else {
      subscribe();
    }
  }, [subscribe]);

  useEffect(() => stop, [stop]);

  return { state, start, stop };
}
