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
      : `${alimento.nombre} supera tu límite de sodio en ${exceso_mg ?? '—'} mg.${
          alternativa ? ` Alternativa sugerida: ${alternativa.nombre} (${alternativa.sodio_mg} mg de sodio).` : ''
        }`;

  return (
    <ResultCard
      variant={estado === 'OK' ? 'ok' : 'alerta_peligro'}
      titulo={estado === 'OK' ? 'Producto seguro' : 'Alerta de sodio'}
      mensaje={mensaje}
      acciones={
        <div className="flex flex-col gap-2">
          {explicacion && <p className="text-base">{explicacion}</p>}
          <AudioPlayer />
        </div>
      }
    />
  );
}
