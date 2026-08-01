import { getCollection, getEntry } from 'astro:content';
import type { Station } from '@/types/station';
import { resolveProvinceSlug } from '@/lib/data/geo';
export { sortStationsByDistance, type StationWithDistance } from '@/lib/geo/rank';

/**
 * Única puerta de acceso a los datos de estaciones. Hoy lee de Astro Content Collections
 * (archivos JSON en src/data/stations); una futura migración a una API o base de datos
 * solo debería tocar este archivo, no los componentes que lo consumen.
 */
export async function getAllStations(): Promise<Station[]> {
  const entries = await getCollection('stations');
  return entries.map((entry) => entry.data);
}

export async function getStationBySlug(slug: string): Promise<Station | undefined> {
  const stations = await getAllStations();
  return stations.find((station) => station.slug === slug);
}

export async function getStationById(id: string): Promise<Station | undefined> {
  const entry = await getEntry('stations', id);
  return entry?.data;
}

export async function getStationsByProvince(provinceSlugOrName: string): Promise<Station[]> {
  const stations = await getAllStations();
  // resolveProvinceSlug acepta tanto un slug como un nombre completo de provincia: si no
  // encuentra una provincia cuyo `name` coincida, cae a slugify(valor), que ya es un slug idempotente.
  const targetSlug = resolveProvinceSlug(provinceSlugOrName);
  return stations.filter((station) => resolveProvinceSlug(station.location.province) === targetSlug);
}

export async function getStationsByLocality(citySlugOrName: string): Promise<Station[]> {
  const stations = await getAllStations();
  return stations.filter((station) => slugify(station.location.city) === slugify(citySlugOrName));
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
