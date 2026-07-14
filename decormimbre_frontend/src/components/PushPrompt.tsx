import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { BellRing } from 'lucide-react'
import { pushSoportado, estaSuscrito, activarPush } from '@/lib/push'

const STORAGE_KEY = 'decormimbre_push_prompt'

// Diálogo de bienvenida que pide activar los avisos al entrar al área de
// cliente (estilo app nativa). El permiso real del navegador solo puede
// pedirse desde un gesto del usuario, por eso el botón "Permitir".
export default function PushPrompt() {
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let activo = true
    const revisar = async () => {
      if (!pushSoportado()) return
      if (localStorage.getItem(STORAGE_KEY)) return
      if (await estaSuscrito()) return
      // Pequeña pausa para no interrumpir la animación de entrada del dashboard
      setTimeout(() => { if (activo) setVisible(true) }, 900)
    }
    revisar()
    return () => { activo = false }
  }, [])

  const permitir = async () => {
    setCargando(true)
    const r = await activarPush()
    setCargando(false)
    if (r.ok) {
      localStorage.setItem(STORAGE_KEY, 'aceptado')
      setMsg(r.mensaje)
      setTimeout(() => setVisible(false), 1600)
    } else {
      setMsg(r.mensaje)
    }
  }

  const ahoraNo = () => {
    localStorage.setItem(STORAGE_KEY, 'descartado')
    setVisible(false)
  }

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(28,16,8,0.45)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              background: '#fdfaf6', borderRadius: 24, padding: '28px 24px',
              maxWidth: 420, width: '100%', textAlign: 'center',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
              marginBottom: 'env(safe-area-inset-bottom, 8px)',
            }}
          >
            <div style={{
              width: 62, height: 62, borderRadius: 18, margin: '0 auto 14px',
              background: 'rgba(196,168,130,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <BellRing size={30} color="#5C4033" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, color: '#3d2215', margin: '0 0 8px' }}>
              ¿Te avisamos del avance de tus pedidos?
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(92,64,51,0.65)', lineHeight: 1.6, margin: '0 0 6px' }}>
              Recibirás una notificación cuando tu cotización esté lista y cuando
              tu pedido cambie de estado — aunque no tengas la app abierta.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.4)', margin: '0 0 20px' }}>
              Al permitir, aceptas recibir avisos según nuestra política de privacidad.
              Puedes desactivarlos cuando quieras desde los ajustes del dispositivo.
            </p>
            {msg && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#5C4033', fontWeight: 600, margin: '0 0 14px' }}>{msg}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={permitir}
                disabled={cargando}
                style={{
                  background: '#5C4033', color: '#fff', border: 'none', borderRadius: 99,
                  padding: '14px 24px', fontFamily: 'var(--font-body)', fontSize: 15,
                  fontWeight: 600, cursor: 'pointer', opacity: cargando ? 0.7 : 1,
                }}
              >
                {cargando ? 'Activando…' : 'Permitir avisos'}
              </button>
              <button
                onClick={ahoraNo}
                style={{
                  background: 'none', color: 'rgba(92,64,51,0.55)', border: 'none',
                  padding: '8px', fontFamily: 'var(--font-body)', fontSize: 13.5,
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Ahora no
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
