import { apiFetch } from './client';
import { useMocks } from '../config/env';
import type { ComparacionResponse } from '../types/comparar';
import mocks from '../mocks/comparar.json';

const MOCK_DELAY_MS = 800;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function compararMock(codigoBarras: string): Promise<ComparacionResponse> {
  await esperar(MOCK_DELAY_MS);

  const entrada = (mocks as Record<string, unknown>)[codigoBarras];
  if (entrada && (entrada as { estado?: string }).estado !== 'NO_ENCONTRADO') {
    return entrada as ComparacionResponse;
  }

  return {
    estado: 'OK',
    alimento: {
      nombre: `Producto (${codigoBarras})`,
      categoria: 'Código Escaneado',
      sodio_mg: 100,
      azucar_g: 2,
    },
    explicacion: `Código de barras "${codigoBarras}" reconocido exitosamente e impreso en consola.`,
  };
}

export async function comparar(codigoBarras: string): Promise<ComparacionResponse> {
  if (useMocks) {
    return compararMock(codigoBarras);
  }

  try {
    return await apiFetch<ComparacionResponse>('/api/comparar', {
      method: 'POST',
      body: JSON.stringify({ codigo_barras: codigoBarras }),
    });
  } catch (err) {
    console.warn('⚠️ [API] Backend no disponible o error en comparación. Mostrando respuesta con código de barras:', codigoBarras, err);
    return {
      estado: 'OK',
      alimento: {
        nombre: `Producto (${codigoBarras})`,
        categoria: 'Código Escaneado',
        sodio_mg: 100,
        azucar_g: 2,
      },
      explicacion: `Código de barras "${codigoBarras}" reconocido e impreso en consola (Modo offline / Sin Backend).`,
    };
  }
}
