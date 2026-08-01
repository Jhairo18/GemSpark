import type { EstadoComparacion } from './comparar';

export interface RegistroComidaRequest {
  transcripcion: string;
}

export interface RegistroComidaResponse {
  ingredientes_detectados: string[];
  macros_estimados: {
    proteina_g?: number;
    carbohidratos_g?: number;
    sodio_mg?: number;
    azucar_g?: number;
  };
  evaluacion: EstadoComparacion;
  explicacion: string;
}
