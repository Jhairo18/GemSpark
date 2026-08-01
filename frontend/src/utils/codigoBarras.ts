/**
 * Valida el dígito verificador de EAN-13 (13 dígitos, pesos 1/3 alternados)
 * o UPC-A (12 dígitos, pesos 3/1 alternados) con la misma fórmula genérica.
 */
export function esCodigoValido(digitos: string): boolean {
  if (!/^\d{12}$|^\d{13}$/.test(digitos)) return false;

  const esEan13 = digitos.length === 13;
  const cuerpo = digitos.slice(0, -1).split('').map(Number);
  const verificadorEsperado = Number(digitos.slice(-1));

  const suma = cuerpo.reduce((acumulado, digito, indice) => {
    const posicionImpar = indice % 2 === 0;
    const peso = esEan13 ? (posicionImpar ? 1 : 3) : posicionImpar ? 3 : 1;
    return acumulado + digito * peso;
  }, 0);

  const verificadorCalculado = (10 - (suma % 10)) % 10;
  return verificadorCalculado === verificadorEsperado;
}

/**
 * Busca dentro de un texto de OCR (ruidoso) la primera subcadena contigua de
 * 13 o 12 dígitos que pase la validación de EAN-13/UPC-A.
 */
export function extraerCodigoValido(textoOcr: string): string | null {
  const soloDigitos = textoOcr.replace(/\D/g, '');

  for (const longitud of [13, 12]) {
    for (let inicio = 0; inicio + longitud <= soloDigitos.length; inicio++) {
      const candidato = soloDigitos.slice(inicio, inicio + longitud);
      if (esCodigoValido(candidato)) return candidato;
    }
  }

  return null;
}
