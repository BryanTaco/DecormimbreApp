import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { registrarCliente, loginCliente } from '@/api/authApi'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/landing/Logo'

export default function RegistroPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      await registrarCliente({ nombre: form.nombre, email: form.email, telefono: form.telefono || undefined, password: form.password })
      const res = await loginCliente({ email: form.email, password: form.password })
      setAuth(
        { id: res.user.id, email: res.user.email, nombre: res.user.nombre, rol: res.user.rol as any, clienteId: res.user.clienteId },
        res.access, res.refresh
      )
      navigate('/cuenta')
    } catch (err: any) {
      const data = err.response?.data
      if (typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · ')
        setError(msgs)
      } else {
        setError('Error al registrar. Verifica tus datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f0eb 0%, #e8ddd0 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '70vw', height: '70vw', maxWidth: 600, maxHeight: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,168,130,0.15) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'rgba(92,64,51,0.7)', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          <ArrowLeft size={16} />
          Ya tengo cuenta
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo color="#5C4033" size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: '0.08em', color: '#5C4033', textTransform: 'uppercase' }}>Decormimbre</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(196,168,130,0.25)', padding: 'clamp(28px, 6vw, 48px)', boxShadow: '0 20px 60px rgba(92,64,51,0.08)' }}
        >
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(92,64,51,0.5)', margin: '0 0 8px' }}>Crea tu cuenta</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Únete a Decormimbre</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.6)', margin: '10px 0 0', lineHeight: 1.55 }}>Rastrea tus cotizaciones y pedidos en un solo lugar.</p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldGroup label="Nombre completo">
              <input name="nombre" type="text" value={form.nombre} onChange={handle} placeholder="Tu nombre" required style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Correo electrónico">
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="tu@correo.com" required autoComplete="email" style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Teléfono (opcional)">
              <input name="telefono" type="tel" value={form.telefono} onChange={handle} placeholder="+593 99 999 9999" style={inputStyle} />
            </FieldGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldGroup label="Contraseña">
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} placeholder="Min. 8 car." required style={{ ...inputStyle, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(92,64,51,0.45)', padding: 0 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FieldGroup>
              <FieldGroup label="Confirmar">
                <input name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={handle} placeholder="Repite" required style={inputStyle} />
              </FieldGroup>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,60,40,0.08)', border: '1px solid rgba(220,60,40,0.2)', borderRadius: 10, padding: '10px 14px', color: '#b02020', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                {error}
              </div>
            )}

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ marginTop: 6, background: '#5C4033', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.75 : 1 }}
            >
              {loading ? 'Creando cuenta…' : <><UserPlus size={16} /> Crear cuenta gratis</>}
            </motion.button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.5)' }}>
            Al registrarte aceptas nuestros <a href="#" style={{ color: '#5C4033', textDecoration: 'underline' }}>términos de uso</a>.
          </p>
        </motion.div>
      </div>

      <style>{`
        input::placeholder { color: rgba(92,64,51,0.3); }
        input:focus { outline: none; border-color: rgba(92,64,51,0.5) !important; box-shadow: 0 0 0 3px rgba(92,64,51,0.08); }
      `}</style>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(92,64,51,0.65)' }}>{label}</label>
      {children}
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
