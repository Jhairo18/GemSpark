import type { PerfilClinicoRequest, PerfilClinicoResponse } from '../types/perfil';

const STORAGE_KEY = 'gemspark_mock_perfil';
const MOCK_DELAY_MS = 500;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Umbrales aproximados solo para el mock del frontend (ver tabla de CONTEXT.md).
 * El cálculo clínico real y definitivo lo hace el backend de Aldo.
 */
function calcularUmbrales(condiciones: PerfilClinicoRequest['condiciones']) {
  const tieneHipertension = condiciones.includes('hipertension');
  const tieneDiabetes = condiciones.includes('diabetes');

  if (tieneHipertension && tieneDiabetes) {
    return { limite_sodio_mg: 350, limite_azucar_g: 5, origen: 'condicion_paciente' as const };
  }
  if (tieneHipertension) {
    return { limite_sodio_mg: 400, limite_azucar_g: 50, origen: 'condicion_paciente' as const };
  }
  if (tieneDiabetes) {
    return { limite_sodio_mg: 2000, limite_azucar_g: 5, origen: 'condicion_paciente' as const };
  }
  return { limite_sodio_mg: 2000, limite_azucar_g: 50, origen: 'estandar_minsa' as const };
}

function calcularImc(alturaCm: number, pesoKg: number): number {
  const alturaM = alturaCm / 100;
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10;
}

export async function getPerfilMock(): Promise<PerfilClinicoResponse | null> {
  await esperar(MOCK_DELAY_MS);
  const guardado = localStorage.getItem(STORAGE_KEY);
  return guardado ? (JSON.parse(guardado) as PerfilClinicoResponse) : null;
}

export async function putPerfilMock(
  request: PerfilClinicoRequest,
): Promise<PerfilClinicoResponse> {
  await esperar(MOCK_DELAY_MS);

  const respuesta: PerfilClinicoResponse = {
    ...request,
    datos_biometricos: {
      ...request.datos_biometricos,
      imc: calcularImc(request.datos_biometricos.altura, request.datos_biometricos.peso),
    },
    umbrales: calcularUmbrales(request.condiciones),
    actualizado_en: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(respuesta));
  return respuesta;
}
