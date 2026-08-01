import { apiFetch } from './client';
import { obtenerUsuarioIdActivo } from './perfil';
import type { EvaluacionResponse } from '../types/comparar';

export async function comparar(codigoBarras: string): Promise<EvaluacionResponse> {
  const usuarioId = obtenerUsuarioIdActivo();

  return apiFetch<EvaluacionResponse>('/api/explicar', {
    method: 'POST',
    body: JSON.stringify({
      codigo_barras: codigoBarras,
      usuario_id: usuarioId ?? undefined,
    }),
  });
}
