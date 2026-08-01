import { useState } from 'react';

import { BarcodeScanner } from '../components/scanner/BarcodeScanner';
import { ScanResultCard } from '../components/scanner/ScanResultCard';
import { comparar } from '../api/comparar';
import { ApiError } from '../api/client';
import type { ComparacionResponse } from '../types/comparar';

type EstadoPagina = 'inicio' | 'escaneando' | 'comparando' | 'resultado' | 'error';

export function ScanPage() {
  const [estado, setEstado] = useState<EstadoPagina>('inicio');
  const [resultado, setResultado] = useState<ComparacionResponse | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

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

  const reintentar = () => {
    setResultado(null);
    setMensajeError(null);
    setEstado('inicio');
  };

  return (
    <div className="flex flex-col gap-gap-component p-page">
      <h1 className="text-3xl font-bold text-primary">Escanear producto</h1>

      {estado === 'inicio' && (
        <button
          type="button"
          onClick={() => setEstado('escaneando')}
          className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary"
        >
          Escanear producto
        </button>
      )}

      {estado === 'escaneando' && <BarcodeScanner onDetectado={(codigo) => void manejarDeteccion(codigo)} />}

      {estado === 'comparando' && (
        <p className="text-lg text-on-surface-variant">Comparando con tu perfil clínico...</p>
      )}

      {estado === 'resultado' && resultado && <ScanResultCard resultado={resultado} />}

      {estado === 'error' && (
        <div className="flex flex-col gap-gap-component">
          <p className="text-lg text-error">{mensajeError}</p>
          <button
            type="button"
            onClick={reintentar}
            className="min-h-touch rounded-full bg-primary px-8 text-lg font-bold text-on-primary"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
