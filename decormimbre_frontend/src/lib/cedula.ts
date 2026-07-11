// Validación de cédula y RUC ecuatorianos (algoritmo Módulo 10) — espejo del backend.
// Se usa para validar en tiempo real en el frontend; el backend re-valida por seguridad.

const PROVINCIAS_VALIDAS = new Set<number>([...Array(24)].map((_, i) => i + 1).concat(30)) // 1-24 y 30

export interface CedulaResult {
  valido: boolean
  mensaje: string
}

export function validarCedula(cedula: string): CedulaResult {
  if (!/^\d{10}$/.test(cedula)) return { valido: false, mensaje: 'La cédula debe tener 10 dígitos numéricos.' }
  const d = cedula.split('').map(Number)

  const provincia = d[0] * 10 + d[1]
  if (!PROVINCIAS_VALIDAS.has(provincia)) return { valido: false, mensaje: 'Código de provincia no válido (01-24 o 30).' }

  if (d[2] >= 6) return { valido: false, mensaje: 'El tercer dígito debe ser menor a 6.' }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0
  for (let i = 0; i < 9; i++) {
    const producto = d[i] * coeficientes[i]
    suma += producto >= 10 ? producto - 9 : producto
  }
  const verificador = (10 - (suma % 10)) % 10
  if (verificador !== d[9]) return { valido: false, mensaje: 'El dígito verificador no coincide.' }

  return { valido: true, mensaje: 'Cédula válida.' }
}

export function validarRucNatural(ruc: string): CedulaResult {
  if (!/^\d{13}$/.test(ruc)) return { valido: false, mensaje: 'El RUC debe tener 13 dígitos numéricos.' }
  if (!ruc.endsWith('001')) return { valido: false, mensaje: "El RUC de persona natural debe terminar en '001'." }
  return validarCedula(ruc.slice(0, 10)).valido
    ? { valido: true, mensaje: 'RUC válido.' }
    : { valido: false, mensaje: 'RUC inválido: la cédula base no es correcta.' }
}

// Punto de entrada: hasta 10 dígitos → cédula; más → RUC.
export function validarCedulaORuc(valor: string): CedulaResult {
  const v = (valor || '').trim()
  return v.length > 10 ? validarRucNatural(v) : validarCedula(v)
}
