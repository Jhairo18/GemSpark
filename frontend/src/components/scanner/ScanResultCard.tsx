import { ResultCard } from '../shared/ResultCard';
import { AudioPlayer } from '../shared/AudioPlayer';
import type { ComparacionResponse } from '../../types/comparar';

interface ScanResultCardProps {
  resultado: ComparacionResponse;
}

export function ScanResultCard({ resultado }: ScanResultCardProps) {
  const { estado, alimento, exceso_mg, alternativa, explicacion } = resultado;

  const mensaje =
    estado === 'OK'
      ? `${alimento.nombre} está dentro de tu límite de sodio (${alimento.sodio_mg} mg).`
      : `${alimento.nombre} supera tu límite de sodio en ${exceso_mg ?? '—'} mg.`;

  return (
    <ResultCard
      variant={estado === 'OK' ? 'ok' : 'alerta_peligro'}
      titulo={estado === 'OK' ? 'Producto seguro' : 'Alerta de producto'}
      mensaje={mensaje}
      acciones={
        <div className="flex flex-col gap-3">
          {estado === 'ALERTA_PELIGRO' && alternativa && (
            <div className="flex items-center gap-3 rounded-card bg-surface-container-lowest p-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-card bg-secondary-container text-2xl">
                🥣
              </div>
              <div>
                <p className="font-bold text-on-surface">{alternativa.nombre}</p>
                <p className="text-sm text-on-surface-variant">Bajo en sodio ({alternativa.sodio_mg} mg)</p>
                <span className="text-xs font-bold text-primary">Opción segura</span>
              </div>
            </div>
          )}
          {explicacion && <p className="text-base">{explicacion}</p>}
          <AudioPlayer />
        </div>
      }
    />
  );
}
