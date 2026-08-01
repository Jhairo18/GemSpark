import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ScanResultCard } from '../components/scanner/ScanResultCard';
import { comparar } from '../api/comparar';
import { ApiError } from '../api/client';
import type { EvaluacionResponse } from '../types/comparar';

type EstadoPagina = 'escaneando' | 'comparando' | 'resultado' | 'error';

export function ScanPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoPagina>('escaneando');
  const [resultado, setResultado] = useState<EvaluacionResponse | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [codigoEscaneado, setCodigoEscaneado] = useState<string | null>(null);

  const manejarDeteccion = async (codigoBarras: string) => {
    setCodigoEscaneado(codigoBarras);
    setEstado('comparando');
    try {
      const respuesta = await comparar(codigoBarras);
      setResultado(respuesta);
      setEstado('resultado');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMensajeError(`No encontramos el producto con código ${codigoBarras} en el catálogo.`);
      } else {
        setMensajeError(`Error con el código ${codigoBarras}. Verifica tu conexión.`);
      }
      setEstado('error');
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setMensajeError(null);
    setCodigoManual('');
    setCodigoEscaneado(null);
    setEstado('escaneando');
  };

  return (
    <div className="flex flex-col gap-gap-component p-page">
      <h1 className="text-3xl font-bold text-primary">Escaneo de Producto</h1>

      {estado === 'escaneando' && (
        <form
          className="flex flex-col gap-gap-component"
          onSubmit={(e) => {
            e.preventDefault();
            if (codigoManual.trim()) void manejarDeteccion(codigoManual.trim());
          }}
        >
          <label htmlFor="codigo-manual" className="text-lg font-medium text-on-surface">
            Código de barras
          </label>
          <input
            id="codigo-manual"
            type="text"
            inputMode="numeric"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            className="min-h-touch rounded-card border border-outline-variant bg-surface-container-lowest px-4 text-lg transition-colors hover:border-primary"
          />
          <button
            type="submit"
            disabled={!codigoManual.trim()}
            className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
          >
            Buscar
          </button>
        </form>
      )}

      {codigoEscaneado && (
        <div className="flex items-center justify-between rounded-card bg-surface-container-high p-4 text-on-surface border border-outline-variant shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Código Ingresado</p>
            <p className="font-mono text-2xl font-black text-primary tracking-widest">{codigoEscaneado}</p>
          </div>
        </div>
      )}

      {estado === 'comparando' && (
        <p className="text-lg text-on-surface-variant">Comparando con tu perfil clínico...</p>
      )}

      {estado === 'resultado' && resultado && (
        <div className="flex flex-col gap-gap-component">
          <ScanResultCard resultado={resultado} />
          <button
            type="button"
            onClick={reiniciar}
            className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90"
          >
            Escanear otro producto
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-touch rounded-full border-2 border-primary px-8 text-lg font-bold text-primary transition-colors hover:bg-primary/10"
          >
            Volver a Inicio
          </button>
        </div>
      )}

      {estado === 'error' && (
        <div className="flex flex-col gap-gap-component">
          <p className="text-lg text-error">{mensajeError}</p>
          <button
            type="button"
            onClick={reiniciar}
            className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
