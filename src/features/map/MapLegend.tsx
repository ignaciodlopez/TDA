const ITEMS: Array<{ color: string; label: string }> = [
  { color: '#16a34a', label: 'Operativa' },
  { color: '#eab308', label: 'Información incompleta' },
  { color: '#dc2626', label: 'Fuera de servicio' },
  { color: '#64748b', label: 'Planificada' },
];

export default function MapLegend() {
  return (
    <div className="max-w-56 rounded-lg border border-border bg-bg-primary/95 p-3 text-xs shadow-[var(--shadow-soft)] backdrop-blur">
      <ul className="flex flex-col gap-1.5">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-text-secondary">{item.label}</span>
          </li>
        ))}
      </ul>
      <details className="mt-2 border-t border-border pt-2">
        <summary className="cursor-pointer text-text-secondary hover:text-text-primary">
          ¿Qué significa la cobertura estimada?
        </summary>
        <p className="mt-1.5 text-text-secondary">
          Es un cálculo aproximado a partir de la potencia declarada de cada estación. La recepción real
          puede variar por relieve, edificios, árboles, altura y tipo de antena, cableado y condiciones
          atmosféricas, entre otros factores.
        </p>
      </details>
    </div>
  );
}
