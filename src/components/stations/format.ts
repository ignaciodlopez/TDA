import type { Station, Signal } from '@/types/station';

/** Texto a mostrar cuando un campo técnico opcional del modelo de datos es `null`. */
export const NOT_VERIFIED = 'Sin información verificada';

/** Formatea una fecha ISO (`YYYY-MM-DD`) al formato largo en español argentino. */
export function formatDateEs(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Formatea un valor numérico o de texto que puede ser `null`, agregando un sufijo opcional (ej. " km"). */
export function formatNullable(value: string | number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') return NOT_VERIFIED;
  return `${value}${suffix}`;
}

export const STATION_TYPE_LABEL: Record<Station['stationType'], string> = {
  transmitter: 'Estación transmisora',
  repeater: 'Estación repetidora',
};

export const SIGNAL_NETWORK_LABEL: Record<Signal['network'], string> = {
  nacional: 'Nacional',
  local: 'Local',
};

export const POLARIZATION_LABEL: Record<NonNullable<Station['technicalData']['polarization']>, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  circular: 'Circular',
  elliptical: 'Elíptica',
};

export const CALCULATION_METHOD_LABEL: Record<Station['coverage']['calculationMethod'], string> = {
  'erp-based-estimate': 'Estimado a partir de la potencia ERP',
  'network-average-estimate': 'Promedio de alcance publicado por ARSAT para este tipo de estación',
  pending: 'Cálculo pendiente',
};
