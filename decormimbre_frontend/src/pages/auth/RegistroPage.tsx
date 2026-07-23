import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, UserPlus, Check, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { registrarCliente, loginCliente, validarCedulaAsync } from '@/api/authApi'
import { useAuthStore } from '@/store/auth'
import BrandLogo from '@/components/BrandLogo'
import CortinaBienvenida from '@/components/CortinaBienvenida'
import { validarEmail, validarTelefono, normalizarTelefono, reglasPassword, fuerzaPassword, validarCedulaEcuador } from '@/lib/validacion'

export default function RegistroPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', cedula: '', telefono: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cortina, setCortina] = useState<string | null>(null)

  // Estado async de validación de cédula
  const [cedulaChecking, setCedulaChecking] = useState(false)
  const [cedulaAsyncMsg, setCedulaAsyncMsg] = useState('')
  const [cedulaEnUso, setCedulaEnUso] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  // Validación síncrona de cédula
  const cedulaSyncError = validarCedulaEcuador(form.cedula)

  // Comprobación async: solo cuando el formato es válido (sin error síncrono)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!form.cedula || cedulaSyncError) {
      setCedulaAsyncMsg('')
      setCedulaEnUso(false)
      return
    }
    setCedulaChecking(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await validarCedulaAsync(form.cedula)
        setCedulaAsyncMsg(res.mensaje)
        setCedulaEnUso(res.en_uso)
      } catch {
        setCedulaAsyncMsg('')
        setCedulaEnUso(false)
      } finally {
        setCedulaChecking(false)
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [form.cedula, cedulaSyncError])

  const cedulaOk = !cedulaSyncError && !cedulaChecking && !cedulaEnUso && form.cedula.length === 10

  // Validación en vivo
  const emailError = validarEmail(form.email)
  const telError = validarTelefono(form.telefono)
  const reglas = reglasPassword(form.password)
  const fuerza = fuerzaPassword(form.password)
  const passOk = reglas.every((r) => r.ok)
  const confirmError = form.confirmPassword && form.password !== form.confirmPassword ? 'Las contraseñas no coinciden.' : ''
  const listo =
    form.nombre.trim() && form.apellido.trim() &&
    form.email && !emailError &&
    cedulaOk &&
    form.telefono && !telError &&
    passOk && form.confirmPassword && !confirmError

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listo) return
    setLoading(true)
    setError('')
    try {
      await registrarCliente({
        nombre: form.nombre.trim(), apellido: form.apellido.trim(),
        email: form.email, cedula: form.cedula,
        telefono: normalizarTelefono(form.telefono), password: form.password,
      })
      const res = await loginCliente({ email: form.email, password: form.password })
      setAuth(
        { id: res.user.id, email: res.user.email, nombre: res.user.nombre, rol: res.user.rol as any, clienteId: res.user.clienteId },
        res.access, res.refresh
      )
      setCortina(form.nombre.trim())
      setTimeout(() => navigate('/cuenta'), 1100)
    } catch (err: any) {
      const data = err.response?.data
      const errores = data?.error?.details ?? data
      if (typeof errores === 'object' && errores !== null) {
        const msgs = Object.entries(errores).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · ')
        setError(msgs || 'Error al registrar. Verifica tus datos.')
      } else {
        setError('Error al registrar. Verifica tus datos.')
      }
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Fondo con foto del showroom */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img src="/products/hero-sala-naranja-mar.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(245,240,235,0.94) 0%, rgba(245,240,235,0.82) 45%, rgba(61,34,21,0.35) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'rgba(92,64,51,0.7)', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          <ArrowLeft size={16} />
          Ya tengo cuenta
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandLogo size={32} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: '0.08em', color: '#5C4033', textTransform: 'uppercase' }}>Decormimbre</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(196,168,130,0.25)', padding: 'clamp(28px, 6vw, 44px)', boxShadow: '0 20px 60px rgba(92,64,51,0.14)' }}
        >
          <div style={{ marginBottom: 26 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(92,64,51,0.5)', margin: '0 0 8px' }}>Crea tu cuenta</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Únete a Decormimbre</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.6)', margin: '10px 0 0', lineHeight: 1.55 }}>Rastrea tus cotizaciones y pedidos en un solo lugar.</p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldGroup label="Nombre">
                <input name="nombre" type="text" value={form.nombre} onChange={handle} placeholder="Tu nombre" required autoComplete="given-name" style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="Apellido">
                <input name="apellido" type="text" value={form.apellido} onChange={handle} placeholder="Tu apellido" required autoComplete="family-name" style={inputStyle} />
              </FieldGroup>
            </div>

            <FieldGroup label="Correo electrónico" error={emailError}>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="tu@correo.com" required autoComplete="email"
                style={{ ...inputStyle, borderColor: emailError ? 'rgba(220,60,40,0.55)' : undefined }} />
            </FieldGroup>

            {/* Cédula con validación en vivo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(92,64,51,0.65)' }}>
                Cédula de identidad
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="cedula" type="text" inputMode="numeric" maxLength={10}
                  value={form.cedula} onChange={handle}
                  placeholder="1712345678" required autoComplete="off"
                  style={{
                    ...inputStyle, paddingRight: 40,
                    borderColor: cedulaSyncError || cedulaEnUso
                      ? 'rgba(220,60,40,0.55)'
                      : cedulaOk
                        ? 'rgba(22,163,74,0.55)'
                        : undefined,
                  }}
                />
                {/* Icono de estado */}
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  {cedulaChecking && <Loader2 size={15} style={{ color: 'rgba(92,64,51,0.4)', animation: 'spin 1s linear infinite' }} />}
                  {!cedulaChecking && cedulaOk && <Check size={15} style={{ color: '#16a34a' }} />}
                  {!cedulaChecking && form.cedula && (cedulaSyncError || cedulaEnUso) && <X size={15} style={{ color: '#dc3c28' }} />}
                </span>
              </div>
              {/* Mensaje de error / confirmación */}
              {form.cedula && (cedulaSyncError || cedulaEnUso) && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: '#b02020' }}>
                  {cedulaSyncError || cedulaAsyncMsg}
                </span>
              )}
              {cedulaOk && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: '#16a34a' }}>
                  Cédula verificada ✓
                </span>
              )}
            </div>

            <FieldGroup label="Celular (con código de país)" error={telError}>
              <input name="telefono" type="tel" value={form.telefono} onChange={handle} placeholder="+593 99 123 4567" required autoComplete="tel"
                style={{ ...inputStyle, borderColor: telError ? 'rgba(220,60,40,0.55)' : undefined }} />
            </FieldGroup>

            <FieldGroup label="Contraseña">
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} placeholder="Mínimo 8 caracteres" required autoComplete="new-password" style={{ ...inputStyle, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(v => !v)} aria-label="Mostrar contraseña" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(92,64,51,0.45)', padding: 0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Medidor de fuerza */}
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} style={{ flex: 1, height: 4, borderRadius: 99, background: n <= fuerza.nivel ? fuerza.color : 'rgba(92,64,51,0.12)', transition: 'background 250ms' }} />
                    ))}
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: fuerza.color, marginLeft: 6, lineHeight: '4px', paddingTop: 2 }}>{fuerza.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {reglas.map((r) => (
                      <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, padding: '3px 8px', borderRadius: 99, background: r.ok ? 'rgba(22,163,74,0.1)' : 'rgba(92,64,51,0.06)', color: r.ok ? '#16a34a' : 'rgba(92,64,51,0.5)', transition: 'all 250ms' }}>
                        {r.ok ? <Check size={11} /> : <X size={11} />}{r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </FieldGroup>

            <FieldGroup label="Confirmar contraseña" error={confirmError}>
              <input name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={handle} placeholder="Repite tu contraseña" required autoComplete="new-password"
                style={{ ...inputStyle, borderColor: confirmError ? 'rgba(220,60,40,0.55)' : form.confirmPassword && !confirmError ? 'rgba(22,163,74,0.5)' : undefined }} />
            </FieldGroup>

            {error && (
              <div style={{ background: 'rgba(220,60,40,0.08)', border: '1px solid rgba(220,60,40,0.2)', borderRadius: 10, padding: '10px 14px', color: '#b02020', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                {error}
              </div>
            )}

            <motion.button
              type="submit" disabled={loading || !listo}
              whileHover={{ scale: loading || !listo ? 1 : 1.01 }} whileTap={{ scale: loading || !listo ? 1 : 0.98 }}
              style={{ marginTop: 6, background: listo ? '#5C4033' : 'rgba(92,64,51,0.35)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: loading ? 'wait' : listo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 250ms' }}
            >
              {loading ? 'Creando cuenta…' : <><UserPlus size={16} /> Crear cuenta gratis</>}
            </motion.button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.5)' }}>
            Al registrarte aceptas nuestros <a href="#" style={{ color: '#5C4033', textDecoration: 'underline' }}>términos de uso</a>.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>{cortina !== null && <CortinaBienvenida nombre={cortina} />}</AnimatePresence>

      <style>{`
        input::placeholder { color: rgba(92,64,51,0.3); }
        input:focus { outline: none; border-color: rgba(92,64,51,0.5) !important; box-shadow: 0 0 0 3px rgba(92,64,51,0.08); }
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
      `}</style>
    </div>
  )
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(92,64,51,0.65)' }}>{label}</label>
      {children}
      {error && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: '#b02020' }}>{error}</span>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(245,240,235,0.8)',
  border: '1.5px solid rgba(196,168,130,0.35)',
  borderRadius: 10, padding: '12px 14px',
  fontSize: 13, fontFamily: 'var(--font-body)',
  color: '#3d2215', transition: 'border-color 200ms, box-shadow 200ms',
}
