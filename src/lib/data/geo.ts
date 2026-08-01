import provincesData from '@/data/provinces/provinces.json';
import localitiesData from '@/data/provinces/localities.json';
import operatorsData from '@/data/operators/operators.json';
import type { Locality, Operator, Province } from '@/types/geo';

const provinces = provincesData as Province[];
const localities = localitiesData as Locality[];
const operators = operatorsData as Operator[];

export function getAllProvinces(): Province[] {
  return provinces;
}

export function getProvinceBySlug(slug: string): Province | undefined {
  return provinces.find((province) => province.slug === slug);
}

export function getAllLocalities(): Locality[] {
  return localities;
}

export function getLocalityBySlug(slug: string): Locality | undefined {
  return localities.find((locality) => locality.slug === slug);
}

export function getLocalitiesByProvince(provinceId: string): Locality[] {
  return localities.filter((locality) => locality.provinceId === provinceId);
}

export function getLocalityByPostalCode(postalCode: string): Locality | undefined {
  return localities.find(
    (locality) => locality.postalCode?.toLowerCase() === postalCode.trim().toLowerCase(),
  );
}

export function getAllOperators(): Operator[] {
  return operators;
}

export function getOperatorById(id: string): Operator | undefined {
  return operators.find((operator) => operator.id === id);
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Slug canónico de una provincia a partir de su nombre tal como aparece en `location.province`
 * de una estación. Resuelve contra `provinces.json` por nombre exacto en vez de confiar en que
 * `slugify(nombre completo)` coincida con el slug elegido para la URL — no coincide para
 * "Tierra del Fuego, Antártida e Islas del Atlántico Sur", cuyo slug es el más corto
 * "tierra-del-fuego". Fallback a slugify si no hay coincidencia exacta (dato inesperado).
 */
export function resolveProvinceSlug(provinceName: string): string {
  const match = provinces.find((province) => province.name === provinceName);
  return match ? match.slug : slugify(provinceName);
}

/** Búsqueda simple por texto libre entre localidades y provincias (nombre o código postal). */
export function searchPlaces(query: string): Array<
  | { type: 'locality'; value: Locality }
  | { type: 'province'; value: Province }
> {
  const q = normalize(query);
  if (!q) return [];

  const localityMatches = localities
    .filter((locality) => normalize(locality.name).includes(q) || locality.postalCode?.toLowerCase() === query.trim().toLowerCase())
    .map((value) => ({ type: 'locality' as const, value }));

  const provinceMatches = provinces
    .filter((province) => normalize(province.name).includes(q))
    .map((value) => ({ type: 'province' as const, value }));

  return [...localityMatches, ...provinceMatches];
}
