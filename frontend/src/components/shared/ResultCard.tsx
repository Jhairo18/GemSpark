import type { ReactNode } from 'react';

export type ResultCardVariant = 'ok' | 'alerta_peligro';

interface ResultCardProps {
  variant: ResultCardVariant;
  titulo: string;
  mensaje: string;
  acciones?: ReactNode;
}

/**
 * Mapeo de color (decisión de diseño, ver DESIGN.md vs TAREAS_FRONTEND.md):
 * - "alerta_peligro" usa los tokens `error`/`error-container`: es un evento de seguridad
 *   clínica real (umbral de sodio/azúcar superado), más severo que una advertencia leve.
 * - "ok" usa los tokens `primary`/`primary-container` (verde).
 * - Los tokens `warning`/`warning-container` quedan reservados para una futura variante de
 *   aviso no clínico, fuera de alcance del MVP.
 */
const VARIANT_STYLES: Record<ResultCardVariant, { container: string; title: string; icon: string }> = {
  ok: {
    container: 'bg-primary-container border-primary',
    title: 'text-on-primary-container',
    icon: '✓',
  },
  alerta_peligro: {
    container: 'bg-error-container border-error',
    title: 'text-on-error-container',
    icon: '⚠',
  },
};

export function ResultCard({ variant, titulo, mensaje, acciones }: ResultCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      className={`rounded-card border-2 p-page ${styles.container} flex flex-col gap-gap-component`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-2xl">
          {styles.icon}
        </span>
        <h3 className={`text-xl font-bold ${styles.title}`}>{titulo}</h3>
      </div>
      <p className="text-lg">{mensaje}</p>
      {acciones}
    </div>
  );
}
