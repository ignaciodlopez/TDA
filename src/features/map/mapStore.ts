import { atom } from 'nanostores';
import { EMPTY_FILTERS, type MapFilters } from '@/lib/geo/filters';

export const $selectedStationId = atom<string | null>(null);
export const $mapFilters = atom<MapFilters>(EMPTY_FILTERS);
export const $viewMode = atom<'map' | 'list'>('map');
