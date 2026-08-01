export type NivelRiesgo = 'Alto' | 'Moderado' | 'Bajo';

export interface ProductoEvaluado {
  codigo_barras: string;
  nombre: string;
  marca: string;
  nutriscore: string;
}

export interface InsumoAzucar {
  nivel_riesgo: NivelRiesgo;
  valor_100g: number;
  unidad: string;
  limite_paciente_g: number;
  excede_limite: boolean;
  mensaje: string;
}

export interface InsumoSalSodio {
  nivel_riesgo: NivelRiesgo;
  sodio_mg_100g: number;
  sal_g_100g: number;
  limite_sodio_paciente_mg: number;
  excede_limite: boolean;
  mensaje: string;
}

export interface InsumoGrasasSaturadas {
  nivel_riesgo: NivelRiesgo;
  valor_100g: number;
  unidad: string;
  limite_octogono_g: number;
  excede_limite: boolean;
  mensaje: string;
}

export interface InsumoGrasasTrans {
  nivel_riesgo: NivelRiesgo;
  valor_100g: number;
  unidad: string;
  excede_limite: boolean;
  mensaje: string;
}

export interface FuenteCitada {
  tema: string;
  titulo: string;
  pagina: number;
  url: string;
}

export interface MotivoRiesgo {
  nutriente: string;
  detalle: string;
}

export interface ExplicacionIA {
  producto: ProductoEvaluado;
  resultado: {
    es_seguro: boolean;
    nivel_riesgo: NivelRiesgo;
    titulo: string;
  };
  explicacion: string;
  motivos: MotivoRiesgo[];
  recomendacion: string;
  fuentes: FuenteCitada[];
}

export interface EvaluacionResponse {
  producto: ProductoEvaluado;
  es_seguro: boolean;
  nivel_riesgo_global: NivelRiesgo;
  insumos_clave: {
    azucar: InsumoAzucar;
    sal_sodio: InsumoSalSodio;
    grasas_saturadas: InsumoGrasasSaturadas;
    grasas_trans: InsumoGrasasTrans;
  };
  usuario: {
    id: number | null;
    nombre: string;
    condiciones: string[];
    umbrales: {
      limite_sodio_mg: number;
      limite_azucar_g: number;
      origen: string;
      get_kcal?: number;
      limite_grasas_saturadas_g?: number;
      limite_grasas_trans_g?: number;
    };
  };
  explicacion_ia: ExplicacionIA | null;
  explicacion_ia_error: string | null;
  alternativa: ProductoEvaluado | null;
}
