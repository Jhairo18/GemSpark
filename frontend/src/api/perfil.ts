import { apiFetch, ApiError } from './client';
import { useMocks } from '../config/env';
import { getPerfilMock, putPerfilMock } from '../mocks/perfilMock';
import type { PerfilClinicoRequest, PerfilClinicoResponse } from '../types/perfil';

export async function getPerfil(): Promise<PerfilClinicoResponse | null> {
  if (useMocks) {
    return getPerfilMock();
  }

  try {
    return await apiFetch<PerfilClinicoResponse>('/api/perfil');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export function putPerfil(perfil: PerfilClinicoRequest): Promise<PerfilClinicoResponse> {
  if (useMocks) {
    return putPerfilMock(perfil);
  }

  return apiFetch<PerfilClinicoResponse>('/api/perfil', {
    method: 'PUT',
    body: JSON.stringify(perfil),
  });
}
