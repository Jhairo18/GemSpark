import type { DatosBiometricos, Genero } from '../../types/perfil';
import type { ErroresBiometricos } from '../../utils/validation';

type CampoBiometrico = 'edad' | 'altura' | 'peso';

interface BiometricsFormProps {
  value: DatosBiometricos;
  errores: ErroresBiometricos;
  camposTocados: Set<CampoBiometrico>;
  onChange: (value: DatosBiometricos) => void;
  onTocarCampo: (campo: CampoBiometrico) => void;
}

const GENEROS: { value: Genero; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
];

export function BiometricsForm({
  value,
  errores,
  camposTocados,
  onChange,
  onTocarCampo,
}: BiometricsFormProps) {
  return (
    <div className="flex flex-col gap-gap-component">
      <div className="flex flex-col gap-1">
        <label htmlFor="edad" className="text-lg font-medium text-on-surface">
          Edad (años)
        </label>
        <input
          id="edad"
          type="number"
          inputMode="numeric"
          value={Number.isNaN(value.edad) ? '' : value.edad}
          onChange={(e) => onChange({ ...value, edad: e.target.valueAsNumber })}
          onBlur={() => onTocarCampo('edad')}
          className="min-h-touch rounded-card border border-outline-variant bg-surface-container-lowest px-4 text-lg"
        />
        {camposTocados.has('edad') && errores.edad && <p className="text-error">{errores.edad}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="genero" className="text-lg font-medium text-on-surface">
          Género
        </label>
        <select
          id="genero"
          value={value.genero}
          onChange={(e) => onChange({ ...value, genero: e.target.value as Genero })}
          className="min-h-touch rounded-card border border-outline-variant bg-surface-container-lowest px-4 text-lg"
        >
          {GENEROS.map((genero) => (
            <option key={genero.value} value={genero.value}>
              {genero.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="altura" className="text-lg font-medium text-on-surface">
          Altura (cm)
        </label>
        <input
          id="altura"
          type="number"
          inputMode="numeric"
          value={Number.isNaN(value.altura) ? '' : value.altura}
          onChange={(e) => onChange({ ...value, altura: e.target.valueAsNumber })}
          onBlur={() => onTocarCampo('altura')}
          className="min-h-touch rounded-card border border-outline-variant bg-surface-container-lowest px-4 text-lg"
        />
        {camposTocados.has('altura') && errores.altura && (
          <p className="text-error">{errores.altura}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="peso" className="text-lg font-medium text-on-surface">
          Peso (kg)
        </label>
        <input
          id="peso"
          type="number"
          inputMode="decimal"
          value={Number.isNaN(value.peso) ? '' : value.peso}
          onChange={(e) => onChange({ ...value, peso: e.target.valueAsNumber })}
          onBlur={() => onTocarCampo('peso')}
          className="min-h-touch rounded-card border border-outline-variant bg-surface-container-lowest px-4 text-lg"
        />
        {camposTocados.has('peso') && errores.peso && <p className="text-error">{errores.peso}</p>}
      </div>
    </div>
  );
}
