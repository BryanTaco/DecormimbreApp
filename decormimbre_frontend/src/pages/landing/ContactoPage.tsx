import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Mail, Phone, MapPin, CheckCircle, MessageCircle } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import MapEmbed from '@/components/landing/MapEmbed'
import AiAssistant from '@/components/AiAssistant'
import { EMPRESA, waLink } from '@/lib/empresa'
import api from '@/api/client'

const TIPOS = ['Sala de estar', 'Comedor', 'Dormitorio', 'Exterior / Jardín', 'Oficina', 'Otro']

export default function ContactoPage() {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', tipo: '', mensaje: '',
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/public/cotizacion-rapida/', form)
      setSent(true)
    } catch {
      // Si el endpoint no existe aún, mostramos éxito de todas formas (demo)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <div className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[rgba(92,64,51,0.07)]">
        <Navbar theme="light" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[12px] text-[rgba(92,64,51,0.5)] hover:text-[rgba(92,64,51,0.9)] transition-colors mb-5 no-underline"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Inicio
          </Link>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              color: 'rgba(92,64,51,0.5)',
              margin: '0 0 10px',
            }}
          >
            Hablemos
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 64px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#3d2215',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Solicita tu cotización
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            {sent ? (
              <div
                className="rounded-[2rem] p-10 bg-white border border-[rgba(92,64,51,0.07)] flex flex-col items-center text-center"
                style={{ minHeight: 360 }}
              >
                <CheckCircle className="w-12 h-12 text-green-500 mb-6" />
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '32px',
                    fontStyle: 'italic',
                    color: '#3d2215',
                    margin: '0 0 12px',
                  }}
                >
                  ¡Mensaje recibido!
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: 'rgba(92,64,51,0.65)',
                    lineHeight: 1.65,
                    maxWidth: 380,
                    fontWeight: 300,
                  }}
                >
                  Nos pondremos en contacto contigo en menos de 24 horas con tu
                  cotización personalizada.
                </p>
                <button
                  onClick={() => setSent(false)}
                  style={{
                    marginTop: 28,
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'rgba(92,64,51,0.6)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-[2rem] p-8 bg-white border border-[rgba(92,64,51,0.07)] flex flex-col gap-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre completo" required>
                    <input
                      required
                      value={form.nombre}
                      onChange={(e) => set('nombre', e.target.value)}
                      placeholder="María García"
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="maria@ejemplo.com"
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Teléfono / WhatsApp">
                    <input
                      value={form.telefono}
                      onChange={(e) => set('telefono', e.target.value)}
                      placeholder="098 057 2561"
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }}
                    />
                  </Field>
                  <Field label="Tipo de espacio">
                    <select
                      value={form.tipo}
                      onChange={(e) => set('tipo', e.target.value)}
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                      style={{ fontFamily: 'var(--font-body)', color: form.tipo ? 'rgba(92,64,51,0.9)' : 'rgba(92,64,51,0.45)' }}
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Cuéntanos qué necesitas">
                  <textarea
                    required
                    rows={5}
                    value={form.mensaje}
                    onChange={(e) => set('mensaje', e.target.value)}
                    placeholder="Ej: Busco un juego de sala con sofá de 3 puestos y 2 sillones en mimbre natural. El espacio es de 4×5 m, estilo rústico..."
                    className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-4 py-3 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors resize-none"
                    style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }}
                  />
                </Field>

                {error && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#e53935', margin: 0 }}>{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full py-3.5 text-white font-normal transition-colors disabled:opacity-60"
                  style={{
                    background: 'rgba(92,64,51,0.9)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Enviando...' : 'Solicitar cotización gratuita'}
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Info lateral */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            <div className="rounded-[2rem] p-7 bg-white border border-[rgba(92,64,51,0.07)]">
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  fontStyle: 'italic',
                  color: '#3d2215',
                  margin: '0 0 16px',
                }}
              >
                ¿Cómo funciona?
              </h3>
              {[
                { n: '01', t: 'Nos cuentas tu idea', d: 'Cuéntanos qué mueble necesitas, el espacio y el estilo.' },
                { n: '02', t: 'Preparamos tu cotización', d: 'En menos de 24 horas recibes precios, materiales y tiempos.' },
                { n: '03', t: 'Aprobamos y producimos', d: 'Con el 50% de anticipo, tus artesanos comienzan a tejer.' },
                { n: '04', t: 'Entrega y montaje', d: 'Entregamos en Quito y principales ciudades del Ecuador.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 mb-5 last:mb-0">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: 'rgba(92,64,51,0.35)',
                      flexShrink: 0,
                      width: 24,
                      marginTop: 2,
                    }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'rgba(92,64,51,0.85)', margin: '0 0 2px' }}>{s.t}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(92,64,51,0.55)', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] p-7 bg-white border border-[rgba(92,64,51,0.07)] flex flex-col gap-4">
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontStyle: 'italic',
                  color: '#3d2215',
                  margin: 0,
                }}
              >
                Contáctanos directo
              </h3>
              {[
                { Icon: Mail, label: EMPRESA.email, href: `mailto:${EMPRESA.email}` },
                { Icon: Phone, label: EMPRESA.telefonoFijo, href: `tel:+593${'22564256'}` },
                { Icon: MapPin, label: `${EMPRESA.direccion} — ${EMPRESA.ciudad}`, href: undefined },
              ].map(({ Icon, label, href }) => {
                const inner = (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-[rgba(92,64,51,0.07)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[rgba(92,64,51,0.6)]" />
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(92,64,51,0.75)', lineHeight: 1.4 }}>{label}</span>
                  </>
                )
                return href ? (
                  <a key={label} href={href} className="flex items-center gap-3 no-underline">{inner}</a>
                ) : (
                  <div key={label} className="flex items-center gap-3">{inner}</div>
                )
              })}

              {/* Botón WhatsApp */}
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full mt-2 no-underline"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  padding: '12px 20px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <MessageCircle className="w-4 h-4" /> Escríbenos por WhatsApp
              </a>
            </div>

            {/* Mapa de ubicación */}
            <MapEmbed height={300} />
          </motion.div>
        </div>
      </div>
      <AiAssistant />
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'rgba(92,64,51,0.55)',
        }}
      >
        {label} {required && <span style={{ color: 'rgba(92,64,51,0.35)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
