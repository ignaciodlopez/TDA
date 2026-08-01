import { describe, expect, it } from 'vitest';
import { bearingDegrees, degreesToCardinal, formatAzimuth } from './azimuth';

describe('bearingDegrees', () => {
  it('da 0° cuando el destino está directamente al norte', () => {
    const from = { latitude: -40, longitude: -60 };
    const to = { latitude: -30, longitude: -60 };
    expect(bearingDegrees(from, to)).toBeCloseTo(0, 0);
  });

  it('da ~90° cuando el destino está directamente al este, sobre el ecuador', () => {
    const from = { latitude: 0, longitude: -60 };
    const to = { latitude: 0, longitude: -50 };
    expect(bearingDegrees(from, to)).toBeCloseTo(90, 0);
  });

  it('da 180° cuando el destino está directamente al sur', () => {
    const from = { latitude: -30, longitude: -60 };
    const to = { latitude: -40, longitude: -60 };
    expect(bearingDegrees(from, to)).toBeCloseTo(180, 0);
  });

  it('siempre devuelve un valor en el rango [0, 360)', () => {
    const from = { latitude: -34.6, longitude: -58.4 };
    const to = { latitude: -31.4, longitude: -64.2 };
    const bearing = bearingDegrees(from, to);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});

describe('degreesToCardinal', () => {
  it.each([
    [0, 'N'],
    [22.5, 'NNE'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SO'],
    [270, 'O'],
    [315, 'NO'],
    [359, 'N'],
  ])('convierte %s° a %s', (degrees, expected) => {
    expect(degreesToCardinal(degrees)).toBe(expected);
  });

  it('normaliza ángulos negativos o mayores a 360', () => {
    expect(degreesToCardinal(-90)).toBe(degreesToCardinal(270));
    expect(degreesToCardinal(400)).toBe(degreesToCardinal(40));
  });
});

describe('formatAzimuth', () => {
  it('redondea y agrega el símbolo de grados', () => {
    expect(formatAzimuth(311.6)).toBe('312°');
  });
});
