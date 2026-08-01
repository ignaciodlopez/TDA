export type ReceptionDifficulty = 'buena' | 'posible' | 'dificil' | 'desconocida';

export const RECEPTION_DIFFICULTY_LABEL: Record<ReceptionDifficulty, string> = {
  buena: 'Buena probabilidad de recepción',
  posible: 'Recepción posible, puede requerir ajustes',
  dificil: 'Recepción difícil o fuera del radio estimado',
  desconocida: 'No hay datos suficientes para estimarlo',
};

/**
 * Heurística orientativa (no una medición real): compara la distancia con el radio de
 * cobertura estimado de la estación. Sirve para dar una primera expectativa, no un diagnóstico.
 */
export function estimateReceptionDifficulty(
  distanceKm: number,
  estimatedRadiusKm: number | null,
): ReceptionDifficulty {
  if (estimatedRadiusKm === null) return 'desconocida';
  if (distanceKm <= estimatedRadiusKm * 0.6) return 'buena';
  if (distanceKm <= estimatedRadiusKm) return 'posible';
  return 'dificil';
}
