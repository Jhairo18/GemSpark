import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TopBar } from '../components/layout/TopBar';
import { VoiceRecorder } from '../components/voice/VoiceRecorder';
import { ResultCard } from '../components/shared/ResultCard';
import { evaluarRegistroVoz } from '../mocks/registroVozMock';
import type { RegistroComidaResponse } from '../types/registroVoz';

const TRANSCRIPCION_SIMULADA = 'Hoy almorcé un lomo saltado con poca sal y un vaso de agua.';
const DURACION_ESCUCHA_MS = 1800;

type Estado = 'idle' | 'escuchando' | 'confirmando' | 'guardando' | 'guardado';

export function VoiceMealLogPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>('idle');
  const [transcripcion, setTranscripcion] = useState('');
  const [resultado, setResultado] = useState<RegistroComidaResponse | null>(null);

  const iniciarEscucha = () => {
    setEstado('escuchando');
    setTimeout(() => {
      setTranscripcion(TRANSCRIPCION_SIMULADA);
      setEstado('confirmando');
    }, DURACION_ESCUCHA_MS);
  };

  const volverAIntentar = () => {
    setTranscripcion('');
    setResultado(null);
    setEstado('idle');
  };

  const guardarRegistro = async () => {
    setEstado('guardando');
    const respuesta = await evaluarRegistroVoz(transcripcion);
    setResultado(respuesta);
    setEstado('guardado');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar mostrarVolver />

      <div className="flex flex-1 flex-col gap-gap-component p-page">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Contarme qué comí</h1>
          <p className="text-lg text-on-surface-variant">
            Dígame qué almorzó hoy para registrarlo en su diario.
          </p>
        </div>

        {(estado === 'idle' || estado === 'escuchando') && (
          <div className="flex flex-col items-center gap-gap-component py-8">
            <VoiceRecorder escuchando={estado === 'escuchando'} onIniciar={iniciarEscucha} />
          </div>
        )}

        {(estado === 'confirmando' || estado === 'guardando') && (
          <div className="flex flex-col gap-gap-component">
            <label htmlFor="transcripcion" className="text-lg font-medium text-on-surface">
              Lo que he entendido:
            </label>
            <textarea
              id="transcripcion"
              value={transcripcion}
              onChange={(e) => setTranscripcion(e.target.value)}
              rows={4}
              className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 text-lg transition-colors hover:border-primary"
            />
            <button
              type="button"
              disabled={estado === 'guardando' || !transcripcion.trim()}
              onClick={() => void guardarRegistro()}
              className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
            >
              {estado === 'guardando' ? 'Guardando...' : 'Guardar registro'}
            </button>
            <button
              type="button"
              onClick={volverAIntentar}
              className="min-h-touch rounded-full border-2 border-primary px-8 text-lg font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Volver a intentar
            </button>
          </div>
        )}

        {estado === 'guardado' && resultado && (
          <div className="flex flex-col gap-gap-component">
            <ResultCard
              variant={resultado.evaluacion === 'OK' ? 'ok' : 'alerta_peligro'}
              titulo="Registro guardado"
              mensaje={resultado.explicacion}
            />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90"
            >
              Volver a Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
