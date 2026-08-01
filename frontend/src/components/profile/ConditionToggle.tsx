import type { CondicionesToggleState } from '../../types/perfil';

interface ConditionToggleProps {
  value: CondicionesToggleState;
  onChange: (value: CondicionesToggleState) => void;
}

interface SwitchRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchRow({ label, checked, onChange }: SwitchRowProps) {
  return (
    <label className="flex min-h-touch cursor-pointer items-center justify-between rounded-card bg-surface-container p-4">
      <span className="text-lg font-medium text-on-surface">{label}</span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-8 w-14 accent-primary"
      />
    </label>
  );
}

export function ConditionToggle({ value, onChange }: ConditionToggleProps) {
  return (
    <fieldset className="flex flex-col gap-gap-component">
      <legend className="mb-2 text-lg font-bold text-on-surface">Condiciones</legend>
      <SwitchRow
        label="Tengo hipertensión"
        checked={value.hipertension}
        onChange={(hipertension) => onChange({ ...value, hipertension })}
      />
      <SwitchRow
        label="Tengo diabetes"
        checked={value.diabetes}
        onChange={(diabetes) => onChange({ ...value, diabetes })}
      />
    </fieldset>
  );
}
