export type EstadoComparacion = 'OK' | 'ALERTA_PELIGRO';

export interface ComparacionResponse {
  estado: EstadoComparacion;
  alimento: {
    nombre: string;
    categoria: string;
    sodio_mg: number;
    azucar_g?: number;
  };
  exceso_mg?: number;
  alternativa?: {
    nombre: string;
    sodio_mg: number;
  };
  explicacion?: string; // texto ya generado por Gemma, listo para mostrar/leer
}
