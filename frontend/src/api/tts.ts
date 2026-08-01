import { apiBaseUrl } from '../config/env';

export async function sintetizarVoz(texto: string): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}/api/hablar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo generar el audio (${response.status}).`);
  }

  return response.blob();
}
