import type { DatosBiometricos } from '../types/perfil';

export interface ErroresBiometricos {
  edad?: string;
  altura?: string;
  peso?: string;
}

const RANGOS = {
  edad: { min: 0, max: 120 },
  altura: { min: 50, max: 250 },
  peso: { min: 2, max: 300 },
} as const;

export function validarBiometricos(
  datos: Partial<Pick<DatosBiometricos, 'edad' | 'altura' | 'peso'>>,
): ErroresBiometricos {
  const errores: ErroresBiometricos = {};

  if (datos.edad === undefined || Number.isNaN(datos.edad)) {
    errores.edad = 'Ingresa la edad.';
  } else if (datos.edad < RANGOS.edad.min || datos.edad > RANGOS.edad.max) {
    errores.edad = `La edad debe estar entre ${RANGOS.edad.min} y ${RANGOS.edad.max} años.`;
  }

  if (datos.altura === undefined || Number.isNaN(datos.altura)) {
    errores.altura = 'Ingresa la altura.';
  } else if (datos.altura < RANGOS.altura.min || datos.altura > RANGOS.altura.max) {
    errores.altura = `La altura debe estar entre ${RANGOS.altura.min} y ${RANGOS.altura.max} cm.`;
  }

  if (datos.peso === undefined || Number.isNaN(datos.peso)) {
    errores.peso = 'Ingresa el peso.';
  } else if (datos.peso < RANGOS.peso.min || datos.peso > RANGOS.peso.max) {
    errores.peso = `El peso debe estar entre ${RANGOS.peso.min} y ${RANGOS.peso.max} kg.`;
  }

  return errores;
}
