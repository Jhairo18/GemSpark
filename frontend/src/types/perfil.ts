export type Condicion = 'hipertension' | 'diabetes';
export type Genero = 'masculino' | 'femenino' | 'otro';

export interface DatosBiometricos {
  edad: number;
  genero: Genero;
  altura: number; // cm
  peso: number; // kg
}

export interface PerfilClinicoRequest {
  nombre: string;
  datos_biometricos: DatosBiometricos;
  condiciones: Condicion[];
}

export interface PerfilClinicoResponse extends PerfilClinicoRequest {
  datos_biometricos: DatosBiometricos & { imc: number }; // imc solo viene en la respuesta, lo calcula el backend
  umbrales: {
    limite_sodio_mg: number;
    limite_azucar_g: number;
    origen: 'condicion_paciente' | 'estandar_minsa';
  };
  actualizado_en: string; // ISO 8601
}

export interface CondicionesToggleState {
  hipertension: boolean;
  diabetes: boolean;
}

export function toCondicionesArray(state: CondicionesToggleState): Condicion[] {
  const condiciones: Condicion[] = [];
  if (state.hipertension) condiciones.push('hipertension');
  if (state.diabetes) condiciones.push('diabetes');
  return condiciones; // [] si el usuario no marcó ninguna
}
