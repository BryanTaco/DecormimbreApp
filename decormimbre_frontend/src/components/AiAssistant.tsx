import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, X, Send } from 'lucide-react'
import api from '@/api/client'
import { waLink } from '@/lib/empresa'

// ─── Sugerencias rápidas ───────────────────────────────────────────────────────
const SUGERENCIAS = [
  '¿Qué es el mimbre?',
  '¿Cuánto demora un pedido?',
  '¿Hacen envíos?',
  '¿Dónde están ubicados?',
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

// Icono WhatsApp
function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.256.59 4.46 1.712 6.402L3.2 28.8l6.57-1.72A12.74 12.74 0 0016 28.66c7.06 0 12.8-5.74 12.8-12.8S23.06 3.2 16 3.2zm5.834 15.392c-.32-.16-1.892-.933-2.185-1.04-.293-.107-.507-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.498-2.573-1.587-.95-.848-1.593-1.895-1.78-2.215-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.735-.987-2.375-.26-.624-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.146 3.093 1.306 3.307.16.213 2.253 3.44 5.46 4.826.763.33 1.36.527 1.824.674.767.244 1.465.21 2.017.127.615-.092 1.892-.774 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373z" />
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [input, setInput] = useState('')
  const idRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const nextId = () => ++idRef.current

  // Burbuja de invitación
  useEffect(() => {
    if (open) { setNudge(false); return }
    const show = window.setTimeout(() => setNudge(true), 3500)
    const hide = window.setTimeout(() => setNudge(false), 11000)
    return () => { window.clearTimeout(show); window.clearTimeout(hide) }
  }, [open])

  // Saludo al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: nextId(), from: 'bot', text: 'Hola, soy el asistente de Decormimbre 🌿 Pregúntame lo que quieras sobre nuestros muebles, materiales, tiempos, envíos o cómo personalizar tu pieza.' }])
    }
  }, [open, messages.length])

  // Autoscroll
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const enviar = async (texto: string) => {
    const t = texto.trim()
    if (!t || typing) return
    const historial = messages.slice(-6).map((m) => ({ rol: m.from === 'bot' ? 'assistant' : 'user', texto: m.text }))
    setMessages((m) => [...m, { id: nextId(), from: 'user', text: t }])
    setInput('')
    setTyping(true)
    try {
      const { data } = await api.post('/public/asistente/', { mensaje: t, historial })
      const respuesta = data?.data?.respuesta ?? 'Perdona, no pude procesar eso. Escríbenos por WhatsApp y te ayudamos enseguida.'
      setMessages((m) => [...m, { id: nextId(), from: 'bot', text: respuesta }])
    } catch {
      setMessages((m) => [...m, { id: nextId(), from: 'bot', text: 'Estoy teniendo problemas para responder ahora. Escríbenos por WhatsApp al 098 057 2561 y te atendemos de inmediato.' }])
    } finally {
      setTyping(false)
    }
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
              position: 'absolute', right: 0, bottom: 72,
              width: 370, maxWidth: 'calc(100vw - 48px)',
              height: 520, maxHeight: 'calc(100vh - 120px)',
              display: 'flex', flexDirection: 'column',
              borderRadius: 24, overflow: 'hidden',
              background: 'rgba(247,242,237,0.94)',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(92,64,51,0.14)',
              boxShadow: '0 24px 64px rgba(20,8,2,0.28), 0 4px 16px rgba(20,8,2,0.12)',
              transformOrigin: 'bottom right',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(135deg, #3d2215 0%, #5C4033 100%)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WickerIcon color="#C4A882" size={18} />
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: '#fff', margin: 0, lineHeight: 1.1 }}>Asistente Decormimbre</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>En línea · responde al instante</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={waLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  style={{ width: 30, height: 30, borderRadius: '50%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WaIcon size={16} />
                </a>
                <button onClick={() => setOpen(false)} aria-label="Cerrar asistente"
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  style={{
                    alignSelf: msg.from === 'bot' ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '10px 14px',
                    borderRadius: msg.from === 'bot' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    background: msg.from === 'bot' ? '#fff' : '#5C4033',
                    color: msg.from === 'bot' ? 'rgba(61,34,21,0.85)' : '#fff',
                    border: msg.from === 'bot' ? '1px solid rgba(92,64,51,0.1)' : 'none',
                    boxShadow: '0 1px 4px rgba(20,8,2,0.06)', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-line',
                  }}>
                  {msg.text}
                </motion.div>
              ))}

              {typing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: '#fff', border: '1px solid rgba(92,64,51,0.1)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#9B6B4A', display: 'block' }} />
                  ))}
                </motion.div>
              )}

              {/* Sugerencias — solo al inicio */}
              {!typing && messages.length <= 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.15 }} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                  {SUGERENCIAS.map((s) => (
                    <button key={s} onClick={() => enviar(s)}
                      style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', background: 'rgba(92,64,51,0.06)', color: 'rgba(92,64,51,0.8)', border: '1px solid rgba(92,64,51,0.16)' }}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); enviar(input) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: '1px solid rgba(92,64,51,0.1)', background: 'rgba(255,255,255,0.55)', flexShrink: 0 }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta…"
                aria-label="Escribe tu pregunta"
                style={{ flex: 1, border: '1px solid rgba(92,64,51,0.16)', borderRadius: 99, padding: '9px 14px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(61,34,21,0.9)', background: '#fff', outline: 'none' }}
              />
              <button type="submit" disabled={!input.trim() || typing} aria-label="Enviar"
                style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: input.trim() && !typing ? 'pointer' : 'not-allowed', background: input.trim() && !typing ? '#5C4033' : 'rgba(92,64,51,0.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} />
              </button>
            </form>

            {/* Footer con accesos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 16px', borderTop: '1px solid rgba(92,64,51,0.08)', background: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600, color: '#128C3E' }}>
                <WaIcon size={13} /> WhatsApp
              </a>
              <Link to="/personalizar" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 600, color: '#5C4033' }}>
                Personalizar mueble <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burbuja de invitación */}
      <AnimatePresence>
        {nudge && !open && (
          <motion.button key="nudge" onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            style={{ position: 'absolute', right: 66, bottom: 8, whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', cursor: 'pointer', background: '#fff', border: '1px solid rgba(92,64,51,0.14)', boxShadow: '0 8px 24px rgba(20,8,2,0.18)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, color: 'rgba(61,34,21,0.9)' }}>
            👋 ¿Te ayudo a elegir tu mueble?
          </motion.button>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.div animate={open ? { y: 0 } : { y: [0, -7, 0] }} transition={open ? { duration: 0.2 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'relative', width: 56, height: 56 }}>
        <motion.button onClick={() => setOpen((v) => !v)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
          style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #5C4033 0%, #3d2215 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(20,8,2,0.35), 0 2px 8px rgba(20,8,2,0.2)' }}>
          {!open && [0, 1].map((i) => (
            <motion.span key={i} animate={{ scale: [1, 1.5], opacity: [0.4, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: i * 1.1 }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #C4A882', pointerEvents: 'none' }} />
          ))}
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} style={{ display: 'flex' }}>
                <X size={22} color="#f5f0eb" />
              </motion.span>
            ) : (
              <motion.span key="icon" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [1, 1.12, 1], opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }} style={{ display: 'flex' }}>
                <WickerIcon color="#f5f0eb" size={26} />
              </motion.span>
            )}
          </AnimatePresence>
          {!open && (
            <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 3, right: 3, width: 12, height: 12, borderRadius: '50%', background: '#25D366', border: '2px solid #3d2215' }} />
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}
