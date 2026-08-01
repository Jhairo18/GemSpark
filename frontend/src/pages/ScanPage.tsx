import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BarcodeScanner } from '../components/scanner/BarcodeScanner';
import { ScanResultCard } from '../components/scanner/ScanResultCard';
import { comparar } from '../api/comparar';
import { ApiError } from '../api/client';
import type { ComparacionResponse } from '../types/comparar';

type EstadoPagina = 'escaneando' | 'comparando' | 'resultado' | 'error';

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoLinterna({ activa }: { activa: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={activa ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      className="h-6 w-6"
    >
      <path
        d="M9 2h6l1.2 4.5L15 8v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V8L7.8 6.5 9 2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 8h8" strokeLinecap="round" />
    </svg>
  );
}

export function ScanPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoPagina>('escaneando');
  const [resultado, setResultado] = useState<ComparacionResponse | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [linternaActiva, setLinternaActiva] = useState(false);

  const manejarDeteccion = async (codigoBarras: string) => {
    setEstado('comparando');
    try {
      const respuesta = await comparar(codigoBarras);
      setResultado(respuesta);
      setEstado('resultado');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMensajeError('No encontramos este producto en nuestro catálogo.');
      } else {
        setMensajeError('No se pudo comparar el producto. Verifica tu conexión.');
      }
      setEstado('error');
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setMensajeError(null);
    setModoManual(false);
    setCodigoManual('');
    setLinternaActiva(false);
    setEstado('escaneando');
  };

  if (estado === 'escaneando' && !modoManual) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-on-surface">
        <div className="flex min-h-touch items-center justify-between px-page text-on-primary">
          <button
            type="button"
            aria-label="Cancelar escaneo"
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <IconoCerrar />
          </button>
          <span className="text-lg font-bold">Escanear Producto</span>
          <button
            type="button"
            aria-label="Linterna"
            onClick={() => setLinternaActiva((activa) => !activa)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <IconoLinterna activa={linternaActiva} />
          </button>
        </div>

        <div className="relative flex-1">
          <BarcodeScanner onDetectado={(codigo) => void manejarDeteccion(codigo)} />
        </div>

        <div className="flex flex-col gap-gap-component rounded-t-card bg-surface p-page">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-on-surface">Escaneo de Producto</h2>
            <p className="text-lg text-on-surface-variant">Apunta al código de barras del producto</p>
          </div>
          <button
            type="button"
            onClick={() => setModoManual(true)}
            className="min-h-touch rounded-full bg-primary text-lg font-bold text-on-primary transition-colors hover:bg-primary/90"
          >
            Ingresar código manualmente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gap-component p-page">
      <h1 className="text-3xl font-bold text-primary">Escaneo de Producto</h1>

      {estado === 'escaneando' && modoManual && (
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
          <button
            type="button"
            onClick={() => setModoManual(false)}
            className="min-h-touch text-lg font-bold text-primary underline transition-colors hover:text-primary/80"
          >
            Volver a usar la cámara
          </button>
        </form>
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
