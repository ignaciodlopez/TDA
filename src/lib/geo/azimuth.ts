import type { Coordinates } from '@/types/geo';

const CARDINAL_POINTS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSO',
  'SO',
  'OSO',
  'O',
  'ONO',
  'NO',
  'NNO',
] as const;

export type CardinalPoint = (typeof CARDINAL_POINTS)[number];

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Rumbo inicial (azimut) desde `from` hacia `to`, en grados [0, 360). */
export function bearingDegrees(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = toDegrees(Math.atan2(y, x));

  return (bearing + 360) % 360;
}

/** Convierte un azimut en grados al punto cardinal más cercano de los 16 puntos, en español. */
export function degreesToCardinal(degrees: number): CardinalPoint {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return CARDINAL_POINTS[index] as CardinalPoint;
}

export function formatAzimuth(degrees: number): string {
  return `${Math.round(degrees)}°`;
}

/** Diferencia angular con signo entre dos rumbos, normalizada al rango (-180, 180]. */
export function angularDifference(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}
