import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TopBar } from '../components/layout/TopBar';
import { FreeTextPrompt } from '../components/recipe/FreeTextPrompt';
import { ResultCard } from '../components/shared/ResultCard';
import { AudioPlayer } from '../components/shared/AudioPlayer';
import { generarReceta } from '../mocks/recetaMock';

type Estado = 'idle' | 'generando' | 'resultado';

export function RecipeFromIngredientsPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');
  const [respuesta, setRespuesta] = useState('');

  const generar = async () => {
    setEstado('generando');
    const resultado = await generarReceta(prompt);
    setRespuesta(resultado.respuesta);
    setEstado('resultado');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar mostrarVolver />

      <div className="flex flex-1 flex-col gap-gap-component p-page">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">¿Qué puedo cocinar?</h1>
          <p className="text-lg text-on-surface-variant">
            Díganos qué ingredientes tiene en casa y le sugeriremos opciones saludables y fáciles de
            preparar.
          </p>
        </div>

        {estado !== 'resultado' && (
          <>
            <FreeTextPrompt value={prompt} onChange={setPrompt} />
            <button
              type="button"
              disabled={!prompt.trim() || estado === 'generando'}
              onClick={() => void generar()}
              className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
            >
              {estado === 'generando' ? 'Pensando...' : 'Generar receta'}
            </button>
          </>
        )}

        {estado === 'resultado' && (
          <div className="flex flex-col gap-gap-component">
            <ResultCard variant="ok" titulo="Tu receta" mensaje={respuesta} acciones={<AudioPlayer />} />
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
