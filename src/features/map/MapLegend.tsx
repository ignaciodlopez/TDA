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
    </div>
  );
}
