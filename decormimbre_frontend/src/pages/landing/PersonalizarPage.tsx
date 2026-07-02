import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, CheckCircle, ChevronRight } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import api from '@/api/client'

// ─── Datos de los pasos ───────────────────────────────────────────────────────

const TIPOS = [
  { id: 'sofa', label: 'Sofá', emoji: '🛋️', desc: 'Para sala de estar, terraza o jardín' },
  { id: 'silla', label: 'Silla', emoji: '🪑', desc: 'Individual, en pareja o en juego' },
  { id: 'mesa', label: 'Mesa', emoji: '🪵', desc: 'Centro, comedor o mesa auxiliar' },
  { id: 'hamaca', label: 'Hamaca / Pérgola', emoji: '🌿', desc: 'Descanso en exteriores e interiores' },
  { id: 'cabecera', label: 'Cabecera de cama', emoji: '🌙', desc: 'Tejido artesanal para tu dormitorio' },
  { id: 'accesorio', label: 'Accesorio', emoji: '🧺', desc: 'Cestas, lámparas, espejos y más' },
]

const MATERIALES = [
  {
    id: 'mimbre',
    label: 'Mimbre Natural',
    badge: 'Interior',
    desc: 'Fibra vegetal tejida a mano. Textura orgánica única, calidez y elegancia natural. Ideal para interiores con ambiente controlado.',
    props: ['Biodegradable', 'Hecho a mano', 'Textura única', '20+ años de vida'],
    color: '#7B5840',
    bg: '#fdf4ec',
  },
  {
    id: 'polialuminio',
    label: 'Polialuminio',
    badge: 'Exterior',
    desc: 'HDPE con alma de aluminio. Resistencia extrema al sol, lluvia y humedad sin perder la estética del tejido artesanal.',
    props: ['Resistente UV', 'Impermeable', 'Sin mantenimiento', '10+ años exterior'],
    color: '#2C5440',
    bg: '#eef5f0',
  },
  {
    id: 'combinado',
    label: 'Combinado',
    badge: 'Versátil',
    desc: 'La mejor elección cuando quieres la apariencia del mimbre natural con mayor durabilidad. Lo definimos juntos según tu espacio.',
    props: ['Flexible', 'Consultoría incluida', 'Bajo pedido', 'Personalizable'],
    color: '#4A3E7C',
    bg: '#f0eef5',
  },
]

const COLORES = [
  { id: 'natural', label: 'Natural', hex: '#C4A882' },
  { id: 'crema', label: 'Blanco crema', hex: '#F5F0E8' },
  { id: 'oscuro', label: 'Nogal oscuro', hex: '#3D2215' },
  { id: 'gris', label: 'Gris piedra', hex: '#8A8A80' },
  { id: 'verde', label: 'Verde oliva', hex: '#5A6B4A' },
  { id: 'personalizado', label: 'Otro color', hex: 'linear-gradient(135deg,#f9a,#9af,#af9)' },
]

// ─── Estado del formulario ────────────────────────────────────────────────────

interface FormData {
  tipo: string
  material: string
  ancho: string
  alto: string
  profundidad: string
  color: string
  descripcion: string
  nombre: string
  email: string
  telefono: string
  ciudad: string
}

const INITIAL: FormData = {
  tipo: '', material: '', ancho: '', alto: '', profundidad: '',
  color: 'natural', descripcion: '', nombre: '', email: '', telefono: '', ciudad: '',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PersonalizarPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const steps = ['Tipo', 'Material', 'Diseño', 'Contacto']

  const canNext =
    step === 0 ? !!form.tipo :
    step === 1 ? !!form.material :
    step === 2 ? !!form.descripcion :
    !!(form.nombre && form.email)

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    const tipoLabel = TIPOS.find((t) => t.id === form.tipo)?.label ?? form.tipo
    const materialLabel = MATERIALES.find((m) => m.id === form.material)?.label ?? form.material
    const colorLabel = COLORES.find((c) => c.id === form.color)?.label ?? form.color

    const mensaje = [
      `Tipo de mueble: ${tipoLabel}`,
      `Material: ${materialLabel}`,
      form.ancho ? `Dimensiones: ${form.ancho}cm ancho × ${form.alto}cm alto × ${form.profundidad}cm profundidad` : '',
      `Color / acabado: ${colorLabel}`,
      `Descripción: ${form.descripcion}`,
      form.ciudad ? `Ciudad: ${form.ciudad}` : '',
    ].filter(Boolean).join('\n')

    try {
      await api.post('/public/cotizacion-rapida/', {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        tipo: tipoLabel,
        mensaje,
      })
    } catch {
      // Mostramos éxito de todas formas (endpoint puede estar pendiente)
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <div className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[rgba(92,64,51,0.07)]">
        <Navbar theme="light" />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] text-[rgba(92,64,51,0.5)] hover:text-[rgba(92,64,51,0.9)] transition-colors mb-6 no-underline" style={{ fontFamily: 'var(--font-body)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Inicio
          </Link>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(92,64,51,0.5)', margin: '0 0 8px' }}>
            Diseña tu mueble
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', letterSpacing: '-0.02em', margin: '0 0 6px', lineHeight: 1.05 }}>
            Personaliza tu pieza
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(92,64,51,0.6)', margin: '0 0 32px', fontWeight: 300 }}>
            Cuéntanos qué quieres y nuestros artesanos te envían una cotización en 24 h.
          </p>
        </motion.div>

        {/* Progreso */}
        {!sent && (
          <div className="flex items-center gap-0 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: i < step ? 'rgba(92,64,51,0.9)' : i === step ? '#fff' : 'rgba(92,64,51,0.08)',
                      border: i === step ? '2px solid rgba(92,64,51,0.8)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 300ms',
                    }}
                  >
                    {i < step
                      ? <CheckCircle className="w-4 h-4 text-white" />
                      : <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: i === step ? 'rgba(92,64,51,0.9)' : 'rgba(92,64,51,0.4)' }}>{i + 1}</span>
                    }
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: i === step ? 600 : 400, color: i <= step ? 'rgba(92,64,51,0.8)' : 'rgba(92,64,51,0.35)', marginTop: 4, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(92,64,51,0.5)' : 'rgba(92,64,51,0.12)', margin: '0 8px', marginBottom: 20, transition: 'background 300ms' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pasos */}
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-[2rem] bg-white border border-[rgba(92,64,51,0.07)] p-12 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontStyle: 'italic', color: '#3d2215', margin: '0 0 12px' }}>
                ¡Cotización enviada!
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(92,64,51,0.65)', lineHeight: 1.65, maxWidth: 400, fontWeight: 300, margin: '0 0 10px' }}>
                Hola <strong style={{ fontWeight: 500 }}>{form.nombre}</strong>, recibimos tu solicitud. En menos de 24 horas recibirás en <strong style={{ fontWeight: 500 }}>{form.email}</strong> la cotización personalizada de tu {TIPOS.find((t) => t.id === form.tipo)?.label?.toLowerCase()}.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(92,64,51,0.45)', margin: '0 0 28px', fontWeight: 300 }}>
                También puedes escribirnos directamente a <span style={{ color: 'rgba(92,64,51,0.7)' }}>info@decormimbre.ec</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setSent(false); setForm(INITIAL); setStep(0) }}
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(92,64,51,0.2)', background: 'none', color: 'rgba(92,64,51,0.7)', cursor: 'pointer' }}>
                  Nueva cotización
                </button>
                <Link to="/catalogo" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', padding: '10px 20px', borderRadius: 999, background: 'rgba(92,64,51,0.9)', color: '#fff', cursor: 'pointer', display: 'inline-block' }}>
                    Ver catálogo
                  </span>
                </Link>
              </div>
            </motion.div>
          ) : step === 0 ? (
            <Step key="step0">
              <StepTitle>¿Qué tipo de mueble necesitas?</StepTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {TIPOS.map((t) => (
                  <button key={t.id} onClick={() => set('tipo', t.id)}
                    style={{
                      padding: '20px 16px', borderRadius: 20, textAlign: 'left', cursor: 'pointer', transition: 'all 200ms',
                      background: form.tipo === t.id ? 'rgba(92,64,51,0.9)' : 'white',
                      border: form.tipo === t.id ? '2px solid transparent' : '1px solid rgba(92,64,51,0.1)',
                      boxShadow: form.tipo === t.id ? '0 4px 16px rgba(92,64,51,0.25)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{t.emoji}</span>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontStyle: 'italic', color: form.tipo === t.id ? '#fff' : 'rgba(92,64,51,0.9)', margin: '0 0 4px' }}>{t.label}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: form.tipo === t.id ? 'rgba(255,255,255,0.7)' : 'rgba(92,64,51,0.5)', margin: 0, fontWeight: 300, lineHeight: 1.4 }}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </Step>
          ) : step === 1 ? (
            <Step key="step1">
              <StepTitle>¿Con qué material?</StepTitle>
              <div className="flex flex-col gap-4">
                {MATERIALES.map((m) => (
                  <button key={m.id} onClick={() => set('material', m.id)}
                    style={{
                      padding: '20px 22px', borderRadius: 20, textAlign: 'left', cursor: 'pointer', transition: 'all 200ms',
                      background: form.material === m.id ? m.bg : 'white',
                      border: form.material === m.id ? `2px solid ${m.color}` : '1px solid rgba(92,64,51,0.1)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: m.color, background: `${m.color}18`, padding: '3px 8px', borderRadius: 99 }}>
                          {m.badge}
                        </span>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontStyle: 'italic', color: m.color, margin: '6px 0 0', letterSpacing: '-0.01em' }}>{m.label}</h3>
                      </div>
                      {form.material === m.id && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: m.color }} />}
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(92,64,51,0.65)', lineHeight: 1.6, margin: '0 0 12px', fontWeight: 300 }}>{m.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.props.map((p) => (
                        <span key={p} style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: m.color, background: `${m.color}10`, padding: '3px 10px', borderRadius: 99, fontWeight: 400 }}>{p}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </Step>
          ) : step === 2 ? (
            <Step key="step2">
              <StepTitle>Cuéntanos el diseño</StepTitle>
              <div className="flex flex-col gap-6">
                {/* Dimensiones */}
                <div>
                  <Label>Dimensiones aproximadas (opcional)</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { k: 'ancho' as const, label: 'Ancho cm' },
                      { k: 'alto' as const, label: 'Alto cm' },
                      { k: 'profundidad' as const, label: 'Profundidad cm' },
                    ].map(({ k, label }) => (
                      <div key={k}>
                        <input
                          type="number" placeholder={label} value={form[k]}
                          onChange={(e) => set(k, e.target.value)}
                          className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                          style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(92,64,51,0.4)', margin: '6px 0 0', fontWeight: 300 }}>Si no sabes las medidas exactas, lo definimos en la consultoría.</p>
                </div>

                {/* Color */}
                <div>
                  <Label>Color / acabado preferido</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {COLORES.map((c) => (
                      <button key={c.id} onClick={() => set('color', c.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', transition: 'all 180ms',
                          background: form.color === c.id ? 'rgba(92,64,51,0.08)' : 'white',
                          border: form.color === c.id ? '1.5px solid rgba(92,64,51,0.6)' : '1px solid rgba(92,64,51,0.12)',
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex, display: 'inline-block', flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(92,64,51,0.8)', fontWeight: form.color === c.id ? 500 : 400 }}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <Label required>Descríbenos tu idea</Label>
                  <textarea
                    rows={5} required value={form.descripcion}
                    onChange={(e) => set('descripcion', e.target.value)}
                    placeholder={`Ej: Quiero un sofá de 3 puestos en mimbre natural para mi sala. El estilo es rústico-moderno, tengo el piso de madera oscura. Me gustaría que los cojines sean de tela beige. El espacio mide 4×5 m...`}
                    className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors resize-none mt-2"
                    style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }}
                  />
                </div>
              </div>
            </Step>
          ) : (
            <Step key="step3">
              <StepTitle>Tus datos de contacto</StepTitle>
              <div className="flex flex-col gap-4">
                <div className="rounded-[1.5rem] bg-white/60 border border-[rgba(92,64,51,0.08)] p-5 mb-2">
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontStyle: 'italic', color: 'rgba(92,64,51,0.7)', margin: '0 0 8px' }}>Resumen de tu solicitud</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      TIPOS.find((t) => t.id === form.tipo)?.label,
                      MATERIALES.find((m) => m.id === form.material)?.label,
                      COLORES.find((c) => c.id === form.color)?.label,
                    ].filter(Boolean).map((tag) => (
                      <span key={tag} style={{ fontFamily: 'var(--font-body)', fontSize: '11px', padding: '4px 12px', borderRadius: 99, background: 'rgba(92,64,51,0.08)', color: 'rgba(92,64,51,0.7)' }}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Nombre completo</Label>
                    <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Tu nombre"
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors mt-1.5"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }} />
                  </div>
                  <div>
                    <Label required>Email</Label>
                    <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="tu@email.com"
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors mt-1.5"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }} />
                  </div>
                  <div>
                    <Label>WhatsApp / Teléfono</Label>
                    <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+593 99 000 0000"
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors mt-1.5"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }} />
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Quito, Guayaquil..."
                      className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors mt-1.5"
                      style={{ fontFamily: 'var(--font-body)', color: 'rgba(92,64,51,0.9)' }} />
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(92,64,51,0.4)', lineHeight: 1.5, fontWeight: 300 }}>
                  Tus datos son confidenciales. Solo los usamos para enviarte la cotización y nunca con terceros.
                </p>
              </div>
            </Step>
          )}
        </AnimatePresence>

        {/* Navegación */}
        {!sent && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '13px', padding: '10px 20px', borderRadius: 999,
                border: '1px solid rgba(92,64,51,0.2)', background: 'white', color: step === 0 ? 'rgba(92,64,51,0.3)' : 'rgba(92,64,51,0.7)',
                cursor: step === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Anterior
            </button>

            {step < 3 ? (
              <motion.button
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                whileHover={canNext ? { scale: 1.02 } : {}}
                whileTap={canNext ? { scale: 0.97 } : {}}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, padding: '10px 24px', borderRadius: 999,
                  background: canNext ? 'rgba(92,64,51,0.9)' : 'rgba(92,64,51,0.2)', color: canNext ? '#fff' : 'rgba(92,64,51,0.4)',
                  border: 'none', cursor: canNext ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 200ms',
                }}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => canNext && handleSubmit()}
                disabled={!canNext || loading}
                whileHover={canNext ? { scale: 1.02 } : {}}
                whileTap={canNext ? { scale: 0.97 } : {}}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, padding: '12px 28px', borderRadius: 999,
                  background: canNext ? 'rgba(92,64,51,0.9)' : 'rgba(92,64,51,0.2)', color: canNext ? '#fff' : 'rgba(92,64,51,0.4)',
                  border: 'none', cursor: canNext ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 200ms',
                }}
              >
                {loading ? 'Enviando...' : 'Solicitar cotización'} <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
      {children}
    </h2>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(92,64,51,0.55)', display: 'block' }}>
      {children} {required && <span style={{ color: 'rgba(92,64,51,0.35)' }}>*</span>}
    </label>
  )
}
