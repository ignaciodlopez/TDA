import { useMemo, useState } from 'react';
import { CAUSES, SYMPTOMS } from '@/features/tools/diagnosticsData';

export default function ReceptionDiagnosticsTool() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const orderedCauseIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const symptom of SYMPTOMS) {
      if (!selected.has(symptom.id)) continue;
      for (const causeId of symptom.causeIds) {
        if (!seen.has(causeId)) {
          seen.add(causeId);
          result.push(causeId);
        }
      }
    }
    return result;
  }, [selected]);

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-text-primary">
          ¿Qué estás experimentando? Podés elegir más de una opción.
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SYMPTOMS.map((symptom) => (
            <label
              key={symptom.id}
              className="flex items-start gap-2 rounded-md border border-border bg-bg-primary p-3 text-sm hover:border-brand-500"
            >
              <input
                type="checkbox"
                checked={selected.has(symptom.id)}
                onChange={() => toggle(symptom.id)}
                className="mt-0.5"
              />
              <span className="text-text-primary">{symptom.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {orderedCauseIds.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Pasos sugeridos, de lo más simple a lo más técnico
          </h2>
          <ol className="space-y-2">
            {orderedCauseIds.map((causeId, index) => {
              const cause = CAUSES[causeId];
              if (!cause) return null;
              return (
                <li key={causeId} className="flex items-start gap-3 rounded-md border border-border bg-bg-primary p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-text-secondary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm text-text-primary">{cause.label}</p>
                    {cause.guideHref && (
                      <a href={cause.guideHref} className="text-xs font-medium text-link hover:underline">
                        Ver más →
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          Seleccioná al menos un síntoma para ver los pasos sugeridos.
        </p>
      )}
    </div>
  );
}
