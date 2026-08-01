import { describe, expect, it } from 'vitest';
import { estimateReceptionDifficulty } from './reception';

describe('estimateReceptionDifficulty', () => {
  it('devuelve "desconocida" cuando no hay radio de cobertura estimado', () => {
    expect(estimateReceptionDifficulty(10, null)).toBe('desconocida');
  });

  it('devuelve "buena" dentro del 60% del radio estimado', () => {
    expect(estimateReceptionDifficulty(20, 50)).toBe('buena');
  });

  it('devuelve "posible" entre el 60% y el 100% del radio estimado', () => {
    expect(estimateReceptionDifficulty(45, 50)).toBe('posible');
  });

  it('devuelve "dificil" más allá del radio estimado', () => {
    expect(estimateReceptionDifficulty(60, 50)).toBe('dificil');
  });
});
