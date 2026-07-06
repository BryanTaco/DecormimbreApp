import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, X } from 'lucide-react'

// ─── FAQs pre-escritas ────────────────────────────────────────────────────────

const FAQS = [
  { q: '¿Cuál material elijo?', a: 'Si es para interior y quieres textura natural, elige Mimbre. Para exterior o zonas húmedas, el Polialuminio es perfecto — resiste lluvia, sol y años sin decolorarse.' },
  { q: '¿Cuánto demora un pedido?', a: 'Los muebles personalizados tardan entre 15 y 25 días hábiles. Depende de la complejidad del diseño y los materiales disponibles.' },
  { q: '¿Hacen envíos?', a: 'Sí, enviamos a todo Ecuador. En Quito la entrega es directa con nuestro equipo. Para otras ciudades coordinamos con transportistas de confianza.' },
  { q: '¿Cómo pido una cotización?', a: 'Usa el configurador en la página Personalizar — define el tipo, material, color y dimensiones. En menos de 24 horas recibirás la cotización por email.' },
  { q: '¿Se puede personalizar el color?', a: 'Sí. Tenemos 6 acabados estándar pero también aceptamos colores personalizados bajo pedido. El polialuminio tiene mayor variedad de colores.' },
]

interface Message {
  id: number
  from: 'bot' | 'user'
  text: string
}

// ─── Icono de tejido de mimbre ────────────────────────────────────────────────

function WickerIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 7 Q7 4.5 12 7 T21 7" />
      <path d="M3 12 Q7 14.5 12 12 T21 12" />
      <path d="M3 17 Q7 14.5 12 17 T21 17" />
      <path d="M7.5 5.5 V18.5 M16.5 5.5 V18.5" opacity="0.5" />
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const idRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const nextId = () => ++idRef.current

  // Saludo al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: nextId(), from: 'bot', text: 'Hola, soy el asistente de Decormimbre. ¿En qué puedo ayudarte?' }])
    }
  }, [open, messages.length])

  // Autoscroll al fondo
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const ask = (faq: (typeof FAQS)[number]) => {
    if (typing) return
    setMessages((m) => [...m, { id: nextId(), from: 'user', text: faq.q }])
    setTyping(true)
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId(), from: 'bot', text: faq.a }])
      setTyping(false)
    }, 650)
  }

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 100 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 72,
              width: 360,
              maxWidth: 'calc(100vw - 48px)',
              height: 480,
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 24,
              overflow: 'hidden',
              background: 'rgba(247,242,237,0.92)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(92,64,51,0.14)',
              boxShadow: '0 24px 64px rgba(20,8,2,0.28), 0 4px 16px rgba(20,8,2,0.12)',
              transformOrigin: 'bottom right',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #3d2215 0%, #5C4033 100%)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <WickerIcon color="#C4A882" size={18} />
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                    Asistente Decormimbre
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>
                    Siempre disponible
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    alignSelf: msg.from === 'bot' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.from === 'bot' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    background: msg.from === 'bot' ? '#fff' : '#5C4033',
                    color: msg.from === 'bot' ? 'rgba(61,34,21,0.85)' : '#fff',
                    border: msg.from === 'bot' ? '1px solid rgba(92,64,51,0.1)' : 'none',
                    boxShadow: '0 1px 4px rgba(20,8,2,0.06)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {msg.text}
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '4px 16px 16px 16px',
                    background: '#fff', border: '1px solid rgba(92,64,51,0.1)',
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.45)',
                  }}
                >
                  Escribiendo…
                </motion.div>
              )}

              {/* Chips de FAQ */}
              {!typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}
                >
                  {FAQS.map((faq) => (
                    <button
                      key={faq.q}
                      onClick={() => ask(faq)}
                      style={{
                        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                        padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                        background: 'rgba(92,64,51,0.06)', color: 'rgba(92,64,51,0.8)',
                        border: '1px solid rgba(92,64,51,0.16)',
                        transition: 'background 180ms, border 180ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(92,64,51,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(92,64,51,0.35)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(92,64,51,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(92,64,51,0.16)'
                      }}
                    >
                      {faq.q}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '10px 16px',
                borderTop: '1px solid rgba(92,64,51,0.1)',
                background: 'rgba(255,255,255,0.55)',
                flexShrink: 0,
              }}
            >
              <Link
                to="/catalogo"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600, color: '#5C4033',
                }}
              >
                Ver catálogo <ArrowRight size={12} />
              </Link>
              <Link
                to="/personalizar"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600, color: '#5C4033',
                }}
              >
                Personalizar mueble <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        style={{
          position: 'relative',
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #5C4033 0%, #3d2215 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(20,8,2,0.35), 0 2px 8px rgba(20,8,2,0.2)',
        }}
      >
        {/* Anillo de pulso */}
        {!open && (
          <motion.span
            animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid #C4A882', pointerEvents: 'none',
            }}
          />
        )}
        {open ? <X size={22} color="#f5f0eb" /> : <WickerIcon color="#f5f0eb" size={26} />}
      </motion.button>
    </div>
  )
}
