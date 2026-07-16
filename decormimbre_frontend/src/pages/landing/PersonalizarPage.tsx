import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, CheckCircle, ChevronRight, RotateCcw } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import AiAssistant from '@/components/AiAssistant'
import Confetti from '@/components/landing/Confetti'
import api from '@/api/client'
import { validarEmail, validarTelefonoFlexible, normalizarTelefono } from '@/lib/validacion'
import { CIUDADES_ECUADOR } from '@/lib/ciudades'

const Chair3DViewer = lazy(() => import('@/components/chair/Chair3DViewer'))

// ─── Datos ────────────────────────────────────────────────────────────────────

const TIPOS = [
  { id: 'sofa',      label: 'Sofá',              img: '/products/sala-ebano.jpg',          desc: 'Para sala de estar, terraza o jardín' },
  { id: 'silla',     label: 'Silla',             img: '/products/silla-circular.jpg',      desc: 'Individual, en pareja o en juego' },
  { id: 'mesa',      label: 'Mesa',              img: '/products/set-comedor.jpg',          desc: 'Centro, comedor o auxiliar' },
  { id: 'hamaca',    label: 'Hamaca / Pérgola',  img: '/products/hamaca-jardin.jpg',        desc: 'Descanso en exteriores e interiores' },
  { id: 'cabecera',  label: 'Cabecera de cama',  img: '/products/daybeds-igloo.jpg',        desc: 'Tejido artesanal para dormitorio' },
  { id: 'accesorio', label: 'Accesorio',         img: '/products/hamaca-nido-oscura.jpg',   desc: 'Cestas, lámparas, espejos y más' },
]

const MATERIALES = [
  {
    id: 'mimbre',
    label: 'Mimbre Natural',
    badge: 'Interior',
    img: '/products/silla-circular.jpg',
    desc: 'Fibra vegetal tejida a mano. Textura orgánica única, calidez y elegancia natural. Ideal para ambientes con humedad controlada.',
    props: ['Biodegradable', 'Hecho a mano', 'Textura única', '+20 años de vida'],
    color: '#7B5840',
    bg: '#fdf4ec',
  },
  {
    id: 'polialuminio',
    label: 'Polialuminio',
    badge: 'Exterior',
    img: '/products/set-exterior-nido.jpg',
    desc: 'Fibra de poli-aluminio reciclado de envases Tetra Pak®. Resistencia extrema al sol, lluvia y humedad sin perder la estética del tejido artesanal.',
    props: ['100% reciclado', 'Resistente UV', 'Impermeable', '+10 años exterior'],
    color: '#2C5440',
    bg: '#eef5f0',
  },
  {
    id: 'combinado',
    label: 'Combinado',
    badge: 'Versátil',
    img: '/products/loveseat-riviera.jpg',
    desc: 'La mejor elección cuando quieres la apariencia del mimbre natural con mayor durabilidad. Lo definimos juntos según tu espacio.',
    props: ['Flexible', 'Consultoría incluida', 'Bajo pedido', 'Personalizable'],
    color: '#4A3E7C',
    bg: '#f0eef5',
  },
]

function WickerIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <path d="M3 6 Q7 3.5 12 6 T21 6" />
      <path d="M3 10 Q7 12.5 12 10 T21 10" />
      <path d="M3 14 Q7 11.5 12 14 T21 14" />
      <path d="M3 18 Q7 20.5 12 18 T21 18" />
      <path d="M7 4.5 V19.5 M12 5 V19 M17 4.5 V19.5" opacity="0.45" />
    </svg>
  )
}

const COLORES = [
  { id: 'natural', label: 'Natural', hex: '#C4A882' },
  { id: 'crema', label: 'Blanco crema', hex: '#E8DDD0' },
  { id: 'oscuro', label: 'Nogal oscuro', hex: '#5A3520' },
  { id: 'gris', label: 'Gris piedra', hex: '#8A8A80' },
  { id: 'verde', label: 'Verde oliva', hex: '#5A6B4A' },
  { id: 'carbon', label: 'Carbón', hex: '#2D2620' },
]

const COJINES = [
  { id: 'beige', label: 'Beige lino', hex: '#E4D8C4' },
  { id: 'blanco', label: 'Blanco hueso', hex: '#F1EBE0' },
  { id: 'gris', label: 'Gris perla', hex: '#B9B4AC' },
  { id: 'oliva', label: 'Verde oliva', hex: '#7C8360' },
  { id: 'terracota', label: 'Terracota', hex: '#C08457' },
  { id: 'grafito', label: 'Grafito', hex: '#4A4640' },
]

// Selector de color libre (cualquier color que el cliente desee).
function ColorPersonalizado({ value, activo, onChange }: { value: string; activo: boolean; onChange: (hex: string) => void }) {
  return (
    <label
      title="Elige cualquier color"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', transition: 'all 180ms',
        background: activo ? 'rgba(92,64,51,0.09)' : 'white',
        border: activo ? '1.5px solid rgba(92,64,51,0.6)' : '1px solid rgba(92,64,51,0.12)',
        boxShadow: activo ? '0 2px 8px rgba(92,64,51,0.12)' : 'none',
      }}
    >
      <span style={{ position: 'relative', width: 16, height: 16, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1.5px solid rgba(0,0,0,0.1)', background: activo ? value : 'conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7,#ef4444)' }}>
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#C4A882'}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
        />
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.8)', fontWeight: activo ? 600 : 400 }}>Personalizado</span>
    </label>
  )
}

interface FormData {
  tipo: string
  material: string
  ancho: string
  alto: string
  profundidad: string
  color: string
  cojin: string
  descripcion: string
  nombre: string
  email: string
  telefono: string
  ciudad: string
}

const INITIAL: FormData = {
  tipo: '', material: '', ancho: '', alto: '', profundidad: '',
  color: 'natural', cojin: 'beige', descripcion: '', nombre: '', email: '', telefono: '', ciudad: '',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PersonalizarPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoRotate, setAutoRotate] = useState(true)

  const steps = ['Tipo', 'Material', 'Diseño', 'Contacto']

  const emailError = validarEmail(form.email)
  const telError = validarTelefonoFlexible(form.telefono)

  const canNext =
    step === 0 ? !!form.tipo :
    step === 1 ? !!form.material :
    step === 2 ? !!form.descripcion :
    !!(form.nombre && form.email && !emailError && !telError)

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // Si el valor guardado empieza con '#', es un color personalizado (hex directo).
  const currentColor = form.color.startsWith('#') ? form.color : (COLORES.find((c) => c.id === form.color)?.hex ?? '#C4A882')
  const currentCojin = form.cojin.startsWith('#') ? form.cojin : (COJINES.find((c) => c.id === form.cojin)?.hex ?? '#E4D8C4')
  const currentMaterial = form.material || 'mimbre'
  const currentTipoLabel = TIPOS.find((t) => t.id === form.tipo)?.label?.toLowerCase() ?? 'mueble'

  const handleSubmit = async () => {
    setLoading(true)
    const tipoLabel = TIPOS.find((t) => t.id === form.tipo)?.label ?? form.tipo
    const materialLabel = MATERIALES.find((m) => m.id === form.material)?.label ?? form.material
    const colorLabel = form.color.startsWith('#') ? `Personalizado (${form.color})` : (COLORES.find((c) => c.id === form.color)?.label ?? form.color)
    const cojinLabel = form.cojin.startsWith('#') ? `Personalizado (${form.cojin})` : (COJINES.find((c) => c.id === form.cojin)?.label ?? form.cojin)

    const mensaje = [
      `Tipo de mueble: ${tipoLabel}`,
      `Material: ${materialLabel}`,
      form.ancho ? `Dimensiones: ${form.ancho}cm ancho × ${form.alto}cm alto × ${form.profundidad}cm profundidad` : '',
      `Color / acabado: ${colorLabel}`,
      `Color del cojín: ${cojinLabel}`,
      `Descripción: ${form.descripcion}`,
      form.ciudad ? `Ciudad: ${form.ciudad}` : '',
    ].filter(Boolean).join('\n')

    setError('')
    try {
      await api.post('/public/cotizacion-rapida/', {
        nombre: form.nombre,
        email: form.email,
        telefono: normalizarTelefono(form.telefono),
        descripcion: mensaje, // el backend espera "descripcion"
      })
      setSent(true)
    } catch (err) {
      // Si el servidor rechazó un campo, mostramos su mensaje real
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      const msg = e.response?.data?.error?.message
      setError(msg ?? 'No se pudo enviar tu solicitud. Revisa tu conexión e intenta de nuevo, o escríbenos por WhatsApp al 098 057 2561.')
    } finally {
      setLoading(false)
    }
  }

  const show3D = step > 0 && !sent

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f7f2ed 0%, #f0ebe5 60%, #ebe4dc 100%)' }}>
      <div className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: 'rgba(247,242,237,0.88)', borderColor: 'rgba(92,64,51,0.07)' }}>
        <Navbar theme="light" />
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-10 py-10 pb-20">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-6"
            style={{ fontSize: 11, color: 'rgba(92,64,51,0.45)', fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
          </Link>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(92,64,51,0.45)', margin: '0 0 10px' }}>
            Diseña tu mueble
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', letterSpacing: '-0.025em', margin: '0 0 8px', lineHeight: 1.05 }}>
            Personaliza tu pieza
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(92,64,51,0.55)', margin: '0 0 32px', fontWeight: 400, lineHeight: 1.6 }}>
            Cuéntanos qué quieres y nuestros artesanos te envían una cotización en 24 h.
          </p>
        </motion.div>

        {/* Progreso */}
        {!sent && (
          <div className="flex items-center gap-0 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: i < step ? '#5C4033' : i === step ? '#fff' : 'rgba(92,64,51,0.08)',
                    border: i === step ? '2px solid rgba(92,64,51,0.75)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 350ms',
                    boxShadow: i === step ? '0 0 0 4px rgba(92,64,51,0.08)' : 'none',
                  }}>
                    {i < step
                      ? <CheckCircle className="w-4 h-4 text-white" />
                      : <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: i === step ? '#5C4033' : 'rgba(92,64,51,0.35)' }}>{i + 1}</span>
                    }
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: i === step ? 700 : 400, color: i <= step ? 'rgba(92,64,51,0.75)' : 'rgba(92,64,51,0.3)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(92,64,51,0.45)' : 'rgba(92,64,51,0.1)', margin: '0 8px', marginBottom: 20, transition: 'background 350ms' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Layout principal: formulario + visor 3D */}
        <div className={show3D ? 'grid md:grid-cols-[1fr_400px] gap-8 items-start' : ''}>

          {/* Panel izquierdo: formulario */}
          <div>
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="relative rounded-[2rem] border p-12 flex flex-col items-center text-center overflow-hidden"
                  style={{ background: '#fff', borderColor: 'rgba(92,64,51,0.08)' }}
                >
                  <Confetti />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontStyle: 'italic', color: '#3d2215', margin: '0 0 12px' }}>
                    ¡Cotización enviada!
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(92,64,51,0.6)', lineHeight: 1.65, maxWidth: 400, fontWeight: 400, margin: '0 0 10px' }}>
                    Hola <strong style={{ fontWeight: 600 }}>{form.nombre}</strong>, recibimos tu solicitud. En menos de 24 horas recibirás en <strong style={{ fontWeight: 600 }}>{form.email}</strong> la cotización de tu {currentTipoLabel}.
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.4)', margin: '0 0 28px', fontWeight: 400 }}>
                    También escríbenos a <span style={{ color: 'rgba(92,64,51,0.65)' }}>decormimbre@yahoo.com</span> o por WhatsApp al 098 057 2561
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => { setSent(false); setForm(INITIAL); setStep(0) }}
                      style={{ fontFamily: 'var(--font-body)', fontSize: 13, padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(92,64,51,0.2)', background: 'none', color: 'rgba(92,64,51,0.7)', cursor: 'pointer' }}>
                      Nueva cotización
                    </button>
                    <Link to="/catalogo" style={{ textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, padding: '10px 20px', borderRadius: 999, background: '#5C4033', color: '#fff', cursor: 'pointer', display: 'inline-block' }}>
                        Ver catálogo
                      </span>
                    </Link>
                  </div>
                </motion.div>

              ) : step === 0 ? (
                <Step key="step0">
                  <StepTitle>¿Qué tipo de mueble necesitas?</StepTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {TIPOS.map((t) => {
                      const selected = form.tipo === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => set('tipo', t.id)}
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 18,
                            border: selected ? '2px solid #C4A882' : '2px solid transparent',
                            boxShadow: selected
                              ? '0 0 0 4px rgba(196,168,130,0.2), 0 8px 32px rgba(0,0,0,0.2)'
                              : '0 2px 8px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            background: 'none',
                            padding: 0,
                            textAlign: 'left',
                            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: selected ? 'translateY(-3px)' : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.transform = 'scale(1.03)'
                            const img = e.currentTarget.querySelector('img')
                            if (img) img.style.transform = 'scale(1.08)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = selected ? 'translateY(-3px)' : 'none'
                            const img = e.currentTarget.querySelector('img')
                            if (img) img.style.transform = selected ? 'scale(1.06)' : 'scale(1)'
                          }}
                        >
                          <div style={{ paddingBottom: '66%', position: 'relative', overflow: 'hidden' }}>
                            <img
                              src={t.img}
                              alt={t.label}
                              style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%',
                                objectFit: 'cover', objectPosition: 'center',
                                transition: 'transform 400ms ease',
                                transform: selected ? 'scale(1.06)' : 'scale(1)',
                              }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,8,2,0.8) 0%, rgba(20,8,2,0.1) 55%, transparent 100%)' }} />
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: '#fff', margin: 0 }}>{t.label}</p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: '3px 0 0' }}>{t.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Step>

              ) : step === 1 ? (
                <Step key="step1">
                  <StepTitle>¿Con qué material?</StepTitle>
                  <div className="flex flex-col gap-4">
                    {MATERIALES.map((m) => {
                      const selected = form.material === m.id
                      return (
                        <motion.button
                          key={m.id}
                          onClick={() => set('material', m.id)}
                          whileHover={{ scale: 1.01, y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          style={{
                            padding: '20px 22px', borderRadius: 20, textAlign: 'left', cursor: 'pointer',
                            background: selected ? m.bg : 'white',
                            border: selected ? `2px solid ${m.color}` : '1px solid rgba(92,64,51,0.1)',
                            boxShadow: selected ? `0 4px 18px ${m.color}22` : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'background 220ms, border 220ms, box-shadow 220ms',
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 14, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                <img
                                  src={m.img}
                                  alt={m.label}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                />
                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${m.color}22, transparent 60%)` }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: m.color, background: `${m.color}18`, padding: '3px 8px', borderRadius: 99 }}>
                                    {m.badge}
                                  </span>
                                  <WickerIcon color={m.color} size={18} />
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', color: m.color, margin: '6px 0 0', letterSpacing: '-0.01em', fontWeight: 500 }}>{m.label}</h3>
                              </div>
                            </div>
                            {selected && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: m.color }} />}
                          </div>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.6)', lineHeight: 1.6, margin: '12px 0 0', fontWeight: 400 }}>{m.desc}</p>
                          <AnimatePresence initial={false}>
                            {selected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className="flex flex-wrap gap-2" style={{ paddingTop: 14 }}>
                                  {m.props.map((p) => (
                                    <span key={p} style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: m.color, background: `${m.color}12`, padding: '4px 12px', borderRadius: 99, fontWeight: 500 }}>{p}</span>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      )
                    })}
                  </div>
                </Step>

              ) : step === 2 ? (
                <Step key="step2">
                  <StepTitle>Cuéntanos el diseño</StepTitle>
                  <div className="flex flex-col gap-6">

                    {/* Color */}
                    <div>
                      <Label>Color / acabado preferido</Label>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {COLORES.map((c) => (
                          <button key={c.id} onClick={() => set('color', c.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', transition: 'all 180ms',
                              background: form.color === c.id ? 'rgba(92,64,51,0.09)' : 'white',
                              border: form.color === c.id ? '1.5px solid rgba(92,64,51,0.6)' : '1px solid rgba(92,64,51,0.12)',
                              boxShadow: form.color === c.id ? '0 2px 8px rgba(92,64,51,0.12)' : 'none',
                            }}
                          >
                            <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.hex, display: 'inline-block', flexShrink: 0, border: '1.5px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.8)', fontWeight: form.color === c.id ? 600 : 400 }}>{c.label}</span>
                          </button>
                        ))}
                        <ColorPersonalizado
                          value={currentColor}
                          activo={form.color.startsWith('#')}
                          onChange={(hex) => set('color', hex)}
                        />
                      </div>
                    </div>

                    {/* Color del cojín */}
                    <div>
                      <Label>Color del cojín</Label>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {COJINES.map((c) => (
                          <button key={c.id} onClick={() => set('cojin', c.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', transition: 'all 180ms',
                              background: form.cojin === c.id ? 'rgba(92,64,51,0.09)' : 'white',
                              border: form.cojin === c.id ? '1.5px solid rgba(92,64,51,0.6)' : '1px solid rgba(92,64,51,0.12)',
                              boxShadow: form.cojin === c.id ? '0 2px 8px rgba(92,64,51,0.12)' : 'none',
                            }}
                          >
                            <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.hex, display: 'inline-block', flexShrink: 0, border: '1.5px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.8)', fontWeight: form.cojin === c.id ? 600 : 400 }}>{c.label}</span>
                          </button>
                        ))}
                        <ColorPersonalizado
                          value={currentCojin}
                          activo={form.cojin.startsWith('#')}
                          onChange={(hex) => set('cojin', hex)}
                        />
                      </div>
                    </div>

                    {/* Dimensiones */}
                    <div>
                      <Label>Dimensiones aproximadas <span style={{ fontWeight: 400, opacity: 0.6 }}>(opcional)</span></Label>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {[
                          { k: 'ancho' as const, label: 'Ancho cm' },
                          { k: 'alto' as const, label: 'Alto cm' },
                          { k: 'profundidad' as const, label: 'Profundidad cm' },
                        ].map(({ k, label }) => (
                          <input
                            key={k} type="number" placeholder={label} value={form[k]}
                            onChange={(e) => set(k, e.target.value)}
                            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
                            style={{ fontFamily: 'var(--font-body)', color: '#3d2215', borderColor: 'rgba(92,64,51,0.15)', background: '#fff' }}
                          />
                        ))}
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.38)', margin: '6px 0 0', fontWeight: 400 }}>Si no sabes las medidas exactas, lo definimos en la consultoría.</p>
                    </div>

                    {/* Descripción */}
                    <div>
                      <Label required>Descríbenos tu idea</Label>
                      <textarea
                        rows={5} required value={form.descripcion}
                        onChange={(e) => set('descripcion', e.target.value)}
                        placeholder={`Ej: Quiero una silla de mimbre natural para mi sala, estilo rústico-moderno. El piso es de madera oscura. Los cojines en tela beige. El espacio mide 4×5 m...`}
                        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors resize-none mt-2"
                        style={{ fontFamily: 'var(--font-body)', color: '#3d2215', borderColor: 'rgba(92,64,51,0.15)', background: '#fff', lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                </Step>

              ) : (
                <Step key="step3">
                  <StepTitle>Tus datos de contacto</StepTitle>
                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border p-5 mb-1" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(92,64,51,0.08)' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'rgba(92,64,51,0.65)', margin: '0 0 10px', fontWeight: 500 }}>Resumen de tu solicitud</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          TIPOS.find((t) => t.id === form.tipo)?.label,
                          MATERIALES.find((m) => m.id === form.material)?.label,
                          COLORES.find((c) => c.id === form.color)?.label,
                        ].filter(Boolean).map((tag) => (
                          <span key={tag} style={{ fontFamily: 'var(--font-body)', fontSize: 11, padding: '4px 12px', borderRadius: 99, background: 'rgba(92,64,51,0.08)', color: 'rgba(92,64,51,0.7)', fontWeight: 500 }}>{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { k: 'nombre' as const, label: 'Nombre completo', placeholder: 'Tu nombre', required: true, type: 'text', error: '' },
                        { k: 'email' as const, label: 'Email', placeholder: 'tu@email.com', required: true, type: 'email', error: emailError },
                        { k: 'telefono' as const, label: 'WhatsApp / Teléfono', placeholder: '098 057 2561', required: false, type: 'tel', error: telError },
                      ].map(({ k, label, placeholder, required, type, error: fieldError }) => (
                        <div key={k}>
                          <Label required={required}>{label}</Label>
                          <input
                            required={required} type={type} value={form[k]}
                            onChange={(e) => set(k, e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors mt-1.5"
                            style={{ fontFamily: 'var(--font-body)', color: '#3d2215', borderColor: fieldError ? 'rgba(220,60,40,0.55)' : 'rgba(92,64,51,0.15)', background: '#fff' }}
                          />
                          {fieldError && (
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: '#a03a2a', margin: '4px 0 0' }}>{fieldError}</p>
                          )}
                        </div>
                      ))}
                      {/* Ciudad: selector para evitar lugares inexistentes */}
                      <div>
                        <Label>Ciudad</Label>
                        <select
                          value={form.ciudad}
                          onChange={(e) => set('ciudad', e.target.value)}
                          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors mt-1.5"
                          style={{ fontFamily: 'var(--font-body)', color: form.ciudad ? '#3d2215' : 'rgba(92,64,51,0.4)', borderColor: 'rgba(92,64,51,0.15)', background: '#fff', appearance: 'auto', cursor: 'pointer' }}
                        >
                          <option value="">Selecciona tu ciudad…</option>
                          {CIUDADES_ECUADOR.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="Otra ciudad del Ecuador">Otra ciudad del Ecuador</option>
                        </select>
                      </div>
                    </div>

                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.38)', lineHeight: 1.6, fontWeight: 400 }}>
                      Tus datos son confidenciales. Solo los usamos para enviarte la cotización.
                    </p>
                  </div>
                </Step>
              )}
            </AnimatePresence>

            {/* Error de envío */}
            {error && !sent && (
              <div
                role="alert"
                className="mt-6 rounded-xl border px-4 py-3"
                style={{ background: '#fdf1f0', borderColor: 'rgba(200,60,40,0.25)' }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#a03a2a', margin: 0, lineHeight: 1.5 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Navegación */}
            {!sent && (
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, padding: '10px 20px', borderRadius: 999,
                    border: '1px solid rgba(92,64,51,0.18)', background: 'white',
                    color: step === 0 ? 'rgba(92,64,51,0.25)' : 'rgba(92,64,51,0.7)',
                    cursor: step === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 200ms',
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
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '11px 26px', borderRadius: 999,
                      background: canNext ? '#5C4033' : 'rgba(92,64,51,0.15)',
                      color: canNext ? '#fff' : 'rgba(92,64,51,0.35)',
                      border: 'none', cursor: canNext ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 220ms',
                      boxShadow: canNext ? '0 4px 16px rgba(92,64,51,0.28)' : 'none',
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
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '12px 30px', borderRadius: 999,
                      background: canNext ? '#5C4033' : 'rgba(92,64,51,0.15)',
                      color: canNext ? '#fff' : 'rgba(92,64,51,0.35)',
                      border: 'none', cursor: canNext ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 220ms',
                      boxShadow: canNext ? '0 4px 16px rgba(92,64,51,0.28)' : 'none',
                    }}
                  >
                    {loading ? 'Enviando...' : 'Solicitar cotización'} <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Panel derecho: Visor 3D */}
          {show3D && (
            <div className="hidden md:block sticky top-24 self-start">
              <div style={{
                borderRadius: 28, overflow: 'hidden',
                background: 'linear-gradient(145deg, rgba(255,251,247,0.9), rgba(240,232,222,0.7))',
                border: '1px solid rgba(92,64,51,0.1)',
                boxShadow: '0 8px 40px rgba(92,64,51,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(92,64,51,0.45)', margin: '0 0 2px' }}>
                      Vista previa 3D
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: '#5C4033', margin: 0, fontWeight: 500 }}>
                      {TIPOS.find((t) => t.id === form.tipo)?.label ?? 'Tu mueble'}
                      {form.material ? ` · ${MATERIALES.find((m) => m.id === form.material)?.label}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoRotate((v) => !v)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(92,64,51,0.15)',
                      background: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'rgba(92,64,51,0.6)',
                    }}
                    title={autoRotate ? 'Detener rotación' : 'Activar rotación'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Suspense fallback={
                  <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.4)', letterSpacing: '0.05em' }}>
                      Cargando modelo 3D…
                    </div>
                  </div>
                }>
                  <Chair3DViewer
                    color={currentColor}
                    material={currentMaterial}
                    tipo={form.tipo || 'sofa'}
                    height={360}
                    autoRotate={autoRotate}
                    cushionColor={currentCojin}
                  />
                </Suspense>

                {/* Color chips en el panel 3D */}
                {step >= 2 && (
                  <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(92,64,51,0.06)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(92,64,51,0.4)', margin: '0 0 8px' }}>Color seleccionado</p>
                    <div className="flex items-center gap-2">
                      {COLORES.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => set('color', c.id)}
                          title={c.label}
                          style={{
                            width: form.color === c.id ? 26 : 20,
                            height: form.color === c.id ? 26 : 20,
                            borderRadius: '50%',
                            background: c.hex,
                            border: form.color === c.id ? '2.5px solid rgba(92,64,51,0.8)' : '2px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            boxShadow: form.color === c.id ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.12)',
                          }}
                        />
                      ))}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.55)', marginLeft: 4, fontWeight: 500 }}>
                        {COLORES.find((c) => c.id === form.color)?.label}
                      </span>
                    </div>

                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(92,64,51,0.4)', margin: '12px 0 8px' }}>Color del cojín</p>
                    <div className="flex items-center gap-2">
                      {COJINES.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => set('cojin', c.id)}
                          title={c.label}
                          style={{
                            width: form.cojin === c.id ? 26 : 20,
                            height: form.cojin === c.id ? 26 : 20,
                            borderRadius: '50%',
                            background: c.hex,
                            border: form.cojin === c.id ? '2.5px solid rgba(92,64,51,0.8)' : '2px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            boxShadow: form.cojin === c.id ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.12)',
                          }}
                        />
                      ))}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.55)', marginLeft: 4, fontWeight: 500 }}>
                        {COJINES.find((c) => c.id === form.cojin)?.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(92,64,51,0.3)', marginTop: 10, fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>
                Visualización referencial · Diseño final puede variar
              </p>
            </div>
          )}
        </div>
      </div>

      <AiAssistant />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 500, fontStyle: 'italic', color: '#3d2215', margin: '0 0 22px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
      {children}
    </h2>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(92,64,51,0.5)', display: 'block' }}>
      {children} {required && <span style={{ color: '#C4A882' }}>*</span>}
    </label>
  )
}
