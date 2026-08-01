import type { CollectionEntry } from 'astro:content';

export type Station = CollectionEntry<'stations'>['data'];
export type Signal = Station['signals'][number];
export type StationStatus = Station['status'];
export type VerificationLevel = Station['verification']['level'];

export const STATION_STATUS_LABEL: Record<StationStatus, string> = {
  active: 'Operativa',
  incomplete: 'Información incompleta',
  inactive: 'Fuera de servicio',
  planned: 'Planificada',
};

export const STATION_STATUS_BADGE_CLASSES: Record<StationStatus, string> = {
  active: 'bg-status-good-bg text-status-good-text',
  incomplete: 'bg-status-warn-bg text-status-warn-text',
  inactive: 'bg-status-bad-bg text-status-bad-text',
  planned: 'bg-surface text-text-secondary',
};

export const STATION_STATUS_DOT_CLASSES: Record<StationStatus, string> = {
  active: 'bg-status-good',
  incomplete: 'bg-status-warn',
  inactive: 'bg-status-bad',
  planned: 'bg-text-secondary',
};

export const VERIFICATION_LEVEL_LABEL: Record<VerificationLevel, string> = {
  official: 'Verificado mediante fuente oficial',
  'multi-source': 'Confirmado mediante múltiples fuentes',
  community: 'Reportado por la comunidad',
  pending: 'Pendiente de verificación',
  outdated: 'Desactualizado',
  insufficient: 'Sin información suficiente',
};
