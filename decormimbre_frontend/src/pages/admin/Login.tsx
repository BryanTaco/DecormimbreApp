import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import api from '@/api/client'
import { useAuthStore } from '@/store/auth'
import BrandLogo from '@/components/BrandLogo'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1) Obtener tokens
      const { data } = await api.post('/auth/token/', form)
      const tokens = data.data ?? data
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      // 2) El endpoint de token no incluye el usuario: lo pedimos aparte
      const meRes = await api.get('/auth/me/')
      const me = meRes.data?.data ?? meRes.data
      if (me?.rol === 'CLIENTE') {
        setError('Esta cuenta es de cliente. Ingresa desde el portal de clientes.')
        return
      }
      setAuth(me, tokens.access, tokens.refresh)
      navigate('/admin')
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
      } else {
        setError('Credenciales incorrectas. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white/70 backdrop-blur-sm rounded-[2rem] p-8 border border-white/50 shadow-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <BrandLogo size={34} />
          <span className="text-[rgba(92,64,51,0.9)] font-normal tracking-tighter text-lg">
            DECORMIMBRE
          </span>
        </div>

        <h1 className="text-2xl font-normal text-[#5C4033] mb-1">Bienvenido</h1>
        <p className="text-sm text-[rgba(92,64,51,0.55)] mb-7">Accede al panel de administración</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">
              Correo
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
              placeholder="admin@decormimbre.ec"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 pr-10 text-sm text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(92,64,51,0.4)] hover:text-[rgba(92,64,51,0.7)] transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500/80 text-center">{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2 bg-[rgba(92,64,51,0.9)] text-white rounded-xl py-3 text-sm font-normal hover:bg-[rgba(92,64,51,1)] transition-colors disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
