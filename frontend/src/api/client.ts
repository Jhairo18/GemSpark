import { apiBaseUrl } from '../config/env';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica tu conexión.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Error del servidor (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
