import type { RegistroComidaResponse } from '../types/registroVoz';

const MOCK_DELAY_MS = 900;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock del prototipo — sin conexión a backend. Cuando Jhairo/Aldo definan el
 * contrato real, esta evaluación la calculará el motor de reglas del backend.
 */
export async function evaluarRegistroVoz(transcripcion: string): Promise<RegistroComidaResponse> {
  await esperar(MOCK_DELAY_MS);

  return {
    ingredientes_detectados: ['lomo', 'papa', 'sal', 'agua'],
    macros_estimados: {
      proteina_g: 28,
      carbohidratos_g: 45,
      sodio_mg: 380,
      azucar_g: 2,
    },
    evaluacion: 'OK',
    explicacion: `"${transcripcion}" está dentro de tu límite diario de sodio. Buena elección.`,
  };
}
