import { motion } from 'motion/react'

// Telón que baja al iniciar sesión (efecto cortina) mientras se navega al portal.
export default function CortinaBienvenida({ nombre }: { nombre?: string }) {
  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'linear-gradient(180deg, #2a170c 0%, #5C4033 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
      }}
    >
      {/* Flecos de la cortina */}
      <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ width: '4.2%', height: 28, borderRadius: '0 0 999px 999px', background: '#5C4033' }} />
        ))}
      </div>
      <motion.img
        src="/brand/icon-192.png"
        alt=""
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
        style={{ width: 76, height: 76, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(24px, 4vw, 34px)', color: '#fdfaf6', margin: 0, textAlign: 'center', padding: '0 24px' }}
      >
        {nombre ? `Bienvenido, ${nombre}` : 'Bienvenido'}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 0.55 }}
        style={{ fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E8DDD0', margin: 0 }}
      >
        Preparando tu espacio…
      </motion.p>
    </motion.div>
  )
}
