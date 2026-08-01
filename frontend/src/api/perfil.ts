import { apiFetch, ApiError } from './client';
import { useMocks } from '../config/env';
import { getPerfilMock, putPerfilMock } from '../mocks/perfilMock';
import type { PerfilClinicoRequest, PerfilClinicoResponse } from '../types/perfil';

const USUARIO_ID_KEY = 'gemspark_usuario_id';

function obtenerUsuarioIdGuardado(): number | null {
  const guardado = localStorage.getItem(USUARIO_ID_KEY);
  return guardado ? Number(guardado) : null;
}

function guardarUsuarioId(id: number): void {
  localStorage.setItem(USUARIO_ID_KEY, String(id));
}

function limpiarUsuarioId(): void {
  localStorage.removeItem(USUARIO_ID_KEY);
}

export async function getPerfil(): Promise<PerfilClinicoResponse | null> {
  if (useMocks) {
    return getPerfilMock();
  }

  const usuarioId = obtenerUsuarioIdGuardado();
  if (usuarioId === null) {
    return null;
  }

  try {
    return await apiFetch<PerfilClinicoResponse>(`/api/usuarios/${usuarioId}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      limpiarUsuarioId();
      return null;
    }
    throw err;
  }
}

export async function putPerfil(perfil: PerfilClinicoRequest): Promise<PerfilClinicoResponse> {
  if (useMocks) {
    return putPerfilMock(perfil);
  }

  const respuesta = await apiFetch<PerfilClinicoResponse>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(perfil),
  });

  if (respuesta.id !== undefined) {
    guardarUsuarioId(respuesta.id);
  }

  return respuesta;
}

export function obtenerUsuarioIdActivo(): number | null {
  return obtenerUsuarioIdGuardado();
}
