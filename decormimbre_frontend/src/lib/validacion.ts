// Validaciones de formularios de autenticación (mismas reglas que el backend).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export function validarEmail(v: string): string {
  if (!v) return ''
  return EMAIL_RE.test(v) ? '' : 'Escribe un correo válido, ej: nombre@dominio.com'
}

export function normalizarTelefono(v: string): string {
  return v.replace(/[\s\-().]/g, '')
}

export function validarTelefono(v: string): string {
  if (!v) return ''
  const n = normalizarTelefono(v)
  return /^\+\d{8,15}$/.test(n) ? '' : 'Incluye el código de país, ej: +593 99 123 4567'
}

/** Para formularios públicos: acepta formato local (098…) o internacional (+593…). */
export function validarTelefonoFlexible(v: string): string {
  if (!v) return ''
  const n = normalizarTelefono(v)
  return /^(\+\d{8,15}|0\d{8,9})$/.test(n)
    ? ''
    : 'Escribe un celular válido, ej: 098 057 2561 o +593 99 123 4567'
}

export interface ReglaPassword { ok: boolean; label: string }

export function reglasPassword(p: string): ReglaPassword[] {
  return [
    { ok: p.length >= 8, label: '8+ caracteres' },
    { ok: /[A-ZÁÉÍÓÚÑ]/.test(p), label: 'Una mayúscula' },
    { ok: /[a-záéíóúñ]/.test(p), label: 'Una minúscula' },
    { ok: /\d/.test(p), label: 'Un número' },
  ]
}

/** 0–4 reglas cumplidas → nivel y color para el medidor de fuerza. */
export function fuerzaPassword(p: string): { nivel: number; label: string; color: string } {
  const ok = reglasPassword(p).filter((r) => r.ok).length
  if (!p) return { nivel: 0, label: '', color: 'transparent' }
  if (ok <= 1) return { nivel: 1, label: 'Débil', color: '#dc3c28' }
  if (ok === 2) return { nivel: 2, label: 'Regular', color: '#e8930c' }
  if (ok === 3) return { nivel: 3, label: 'Buena', color: '#c4a882' }
  return { nivel: 4, label: 'Fuerte', color: '#16a34a' }
}
