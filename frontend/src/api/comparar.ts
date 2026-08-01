import { apiFetch, ApiError } from './client';
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
  if (!entrada || (entrada as { estado?: string }).estado === 'NO_ENCONTRADO') {
    throw new ApiError(404, 'Producto no encontrado en el catálogo.');
  }

  return entrada as ComparacionResponse;
}

export function comparar(codigoBarras: string): Promise<ComparacionResponse> {
  if (useMocks) {
    return compararMock(codigoBarras);
  }

  return apiFetch<ComparacionResponse>('/api/comparar', {
    method: 'POST',
    body: JSON.stringify({ codigo_barras: codigoBarras }),
  });
}
