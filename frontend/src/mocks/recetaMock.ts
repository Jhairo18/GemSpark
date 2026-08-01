import type { RecetaResponse } from '../types/receta';

const MOCK_DELAY_MS = 1200;

const RECETAS_CANJEADAS = [
  'Con lo que tienes puedes preparar un tataki de atún con espinacas salteadas y medio aguacate en láminas: sella el atún 1 minuto por lado, saltea las espinacas con un chorrito de aceite y sirve todo junto. Alto en proteína, bajo en sodio, listo en 10 minutos.',
  'Prueba unos huevos revueltos con espinacas y atún desmenuzado, acompañados de medio aguacate en rodajas. Rápido, alto en proteína y fácil de digerir.',
  'Arma un bowl frío: atún, espinacas frescas, medio aguacate en cubos y un huevo sancochado en mitades. Sin cocción, listo en 5 minutos y bajo en sodio.',
];

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock del prototipo — sin conexión a backend. La generación real vía RAG + Gemma
 * la implementa Jhairo; esto solo sirve para navegar el flujo completo en el prototipo.
 */
export async function generarReceta(_prompt: string): Promise<RecetaResponse> {
  await esperar(MOCK_DELAY_MS);

  const indice = Math.floor(Math.random() * RECETAS_CANJEADAS.length);
  return { respuesta: RECETAS_CANJEADAS[indice] };
}
