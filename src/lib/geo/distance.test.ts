import { describe, expect, it } from 'vitest';
import { formatDistanceKm, haversineDistanceKm } from './distance';

describe('haversineDistanceKm', () => {
  it('devuelve 0 para el mismo punto', () => {
    const point = { latitude: -34.6037, longitude: -58.3816 };
    expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 5);
  });

  it('calcula la distancia aproximada entre CABA y Córdoba (~650-700 km en línea recta)', () => {
    const caba = { latitude: -34.6037, longitude: -58.3816 };
    const cordoba = { latitude: -31.4201, longitude: -64.1888 };
    const distance = haversineDistanceKm(caba, cordoba);
    expect(distance).toBeGreaterThan(600);
    expect(distance).toBeLessThan(700);
  });

  it('es simétrica: distancia(A, B) === distancia(B, A)', () => {
    const a = { latitude: -32.9468, longitude: -60.6393 };
    const b = { latitude: -26.8241, longitude: -65.2226 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 9);
  });
});

describe('formatDistanceKm', () => {
  it('formatea distancias menores a 1 km en metros', () => {
    expect(formatDistanceKm(0.45)).toBe('450 m');
  });

  it('formatea distancias menores a 10 km con un decimal', () => {
    expect(formatDistanceKm(4.567)).toBe('4.6 km');
  });

  it('redondea distancias mayores o iguales a 10 km sin decimales', () => {
    expect(formatDistanceKm(123.4)).toBe('123 km');
  });
});
