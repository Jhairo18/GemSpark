import { ResultCard } from '../shared/ResultCard';
import { AudioPlayer } from '../shared/AudioPlayer';
import type { EvaluacionResponse, NivelRiesgo } from '../../types/comparar';

interface ScanResultCardProps {
  resultado: EvaluacionResponse;
}

const ETIQUETA_INSUMO: Record<string, string> = {
  azucar: 'Azúcar',
  sal_sodio: 'Sal / Sodio',
  grasas_saturadas: 'Grasas saturadas',
  grasas_trans: 'Grasas trans',
};

const ESTILO_NIVEL: Record<NivelRiesgo, string> = {
  Alto: 'bg-error-container text-on-error-container',
  Moderado: 'bg-secondary-container text-on-secondary-container',
  Bajo: 'bg-primary-container text-on-primary-container',
};

export function ScanResultCard({ resultado }: ScanResultCardProps) {
  const { producto, es_seguro, nivel_riesgo_global, insumos_clave } = resultado;

  return (
    <ResultCard
      variant={es_seguro ? 'ok' : 'alerta_peligro'}
      titulo={es_seguro ? 'Producto seguro' : 'Alerta de producto'}
      mensaje={`${producto.nombre} (${producto.marca}) — riesgo global: ${nivel_riesgo_global}.`}
      acciones={
        <div className="flex flex-col gap-3">
          {Object.entries(insumos_clave).map(([clave, insumo]) => (
            <div
              key={clave}
              className="flex items-center justify-between gap-3 rounded-card bg-surface-container-lowest p-3"
            >
              <div>
                <p className="font-bold text-on-surface">{ETIQUETA_INSUMO[clave] ?? clave}</p>
                <p className="text-sm text-on-surface-variant">{insumo.mensaje}</p>
              </div>
              <span
                className={`flex-none rounded-full px-3 py-1 text-xs font-bold ${ESTILO_NIVEL[insumo.nivel_riesgo]}`}
              >
                {insumo.nivel_riesgo}
              </span>
            </div>
          ))}
          <AudioPlayer />
        </div>
      }
    />
  );
}
