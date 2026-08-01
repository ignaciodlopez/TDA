import type { CollectionEntry } from 'astro:content';
import type { IconName } from '@/components/common/Icon.astro';

export type Guide = CollectionEntry<'guides'>['data'];
export type GuideCategory = Guide['category'];
export type GuideLevel = Guide['level'];

export const GUIDE_LEVEL_LABEL: Record<GuideLevel, string> = {
  inicial: 'Inicial',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

/** De más básico a más avanzado, para ordenar guías dentro de una misma categoría. */
export const GUIDE_LEVEL_ORDER: Record<GuideLevel, number> = {
  inicial: 0,
  intermedio: 1,
  avanzado: 2,
};

export const GUIDE_CATEGORY_LABEL: Record<GuideCategory, string> = {
  'primeros-pasos': 'Primeros pasos',
  instalacion: 'Instalación',
  'solucion-de-problemas': 'Solución de problemas',
  'contenido-tecnico': 'Contenido técnico',
};

export const GUIDE_CATEGORY_ICON: Record<GuideCategory, IconName> = {
  'primeros-pasos': 'compass',
  instalacion: 'building',
  'solucion-de-problemas': 'activity',
  'contenido-tecnico': 'tv',
};

/** De lo básico para empezar al detalle técnico, como promete la bajada de /guias. */
export const GUIDE_CATEGORY_ORDER: GuideCategory[] = [
  'primeros-pasos',
  'instalacion',
  'solucion-de-problemas',
  'contenido-tecnico',
];
