import { useMemo } from 'react'
import { motion } from 'motion/react'

// Estallido de confeti ligero (sin dependencias) para celebrar acciones.
const COLORS = ['#C4A882', '#5C4033', '#9B6B4A', '#2C5440', '#e8ddd0', '#d98b5f']

export default function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
        const dist = 120 + Math.random() * 220
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 60,
          rot: Math.random() * 720 - 360,
          color: COLORS[i % COLORS.length],
          size: 6 + Math.random() * 7,
          delay: Math.random() * 0.15,
          round: Math.random() > 0.5,
        }
      }),
    [count],
  )

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rot, scale: 0.6 }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}
