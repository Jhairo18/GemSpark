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
  const { producto, es_seguro, nivel_riesgo_global, insumos_clave, explicacion_ia, alternativa } = resultado;
  const mensaje = `${producto.nombre} (${producto.marca}) — riesgo global: ${nivel_riesgo_global}.`;
  const textoParaVoz = explicacion_ia?.explicacion ?? mensaje;

  return (
    <ResultCard
      variant={es_seguro ? 'ok' : 'alerta_peligro'}
      titulo={es_seguro ? 'Producto seguro' : 'Alerta de producto'}
      mensaje={mensaje}
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

          {alternativa && (
            <div className="flex items-center gap-3 rounded-card bg-surface-container-lowest p-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-card bg-secondary-container text-2xl">
                🥣
              </div>
              <div>
                <p className="font-bold text-on-surface">{alternativa.nombre}</p>
                <p className="text-sm text-on-surface-variant">{alternativa.marca}</p>
                <span className="text-xs font-bold text-primary">Opción segura</span>
              </div>
            </div>
          )}

          {explicacion_ia && (
            <div className="flex flex-col gap-2 rounded-card bg-secondary-container p-3 text-on-secondary-container">
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">Explicación de Gemma</p>
              <p className="text-base">{explicacion_ia.explicacion}</p>
              <p className="text-sm font-medium">{explicacion_ia.recomendacion}</p>
              {explicacion_ia.fuentes.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-on-secondary-container/20 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wide opacity-80">Fuentes</p>
                  {explicacion_ia.fuentes.map((fuente) => (
                    <a
                      key={`${fuente.titulo}-${fuente.pagina}`}
                      href={fuente.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline hover:opacity-80"
                    >
                      {fuente.titulo} (pág. {fuente.pagina})
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <AudioPlayer texto={textoParaVoz} />
        </div>
      }
    />
  );
}
