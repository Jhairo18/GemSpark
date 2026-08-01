const SUGERENCIAS = [
  { label: 'Desayuno rápido', prompt: 'Tengo huevos, pan y palta. Dame un desayuno rápido y saludable.' },
  { label: 'Cena ligera', prompt: 'Tengo pollo y verduras. Dame una cena ligera para la noche.' },
  { label: 'Menos de 15 min', prompt: 'Tengo atún y espinacas. Dame algo que se prepare en menos de 15 minutos.' },
];

interface FreeTextPromptProps {
  value: string;
  onChange: (value: string) => void;
}

export function FreeTextPrompt({ value, onChange }: FreeTextPromptProps) {
  return (
    <div className="flex flex-col gap-gap-component">
      <div className="flex flex-col gap-1">
        <label htmlFor="ingredientes" className="text-lg font-medium text-on-surface">
          Sus ingredientes disponibles
        </label>
        <textarea
          id="ingredientes"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Ej: Tengo atún, espinacas, huevos y medio aguacate..."
          className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 text-lg transition-colors hover:border-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-on-surface-variant">Sugerencias rápidas</p>
        <div className="flex flex-wrap gap-2">
          {SUGERENCIAS.map((sugerencia) => (
            <button
              key={sugerencia.label}
              type="button"
              onClick={() => onChange(sugerencia.prompt)}
              className="min-h-touch rounded-full border border-primary px-4 text-base font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary"
            >
              {sugerencia.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
