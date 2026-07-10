import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import Navbar from './Navbar'
import { EMPRESA } from '@/lib/empresa'

const BG_IMAGES = [
  '/products/hero-sala-quito.jpg',
  '/products/hero-chaise-piscina.jpg',
  '/products/hero-sala-naranja-mar.jpg',
  '/products/hero-sala-gris-mar.jpg',
]

const SLIDES = [
  { line1: 'Tejidos', line2: 'a mano.' },
  { line1: 'Arte', line2: 'en mimbre.' },
  { line1: 'Tradición', line2: 'ecuatoriana.' },
  { line1: 'Diseño', line2: 'sostenible.' },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    // Preload all images
    BG_IMAGES.forEach((src) => { const img = new Image(); img.src = src })

    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % BG_IMAGES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center p-3 md:p-5 bg-[#1a0f0a]">
      <section className="relative w-full max-w-[1536px] h-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden flex flex-col">

        {/* Ken Burns backgrounds */}
        <div className="absolute inset-0">
          {BG_IMAGES.map((src, i) => (
            <AnimatePresence key={i}>
              {i === current && (
                <motion.div
                  key={`bg-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover hero-kb"
                    style={{ animationDuration: '7s', objectPosition: 'center' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Gradientes sobre la imagen */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(20,10,5,0.55) 0%, rgba(20,10,5,0.2) 40%, rgba(20,10,5,0.65) 100%)',
            zIndex: 5,
          }}
        />

        {/* Grano cinematográfico */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 6,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Contenido */}
        <div className="relative flex flex-col h-full" style={{ zIndex: 10 }}>
          <Navbar theme="dark" />

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex items-center gap-3 mb-6"
            >
              <span
                className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/60"
              >
                Artesanía ecuatoriana
              </span>
              <span className="w-8 h-px bg-white/40" />
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/60">
                Desde 1999
              </span>
            </motion.div>

            <div className="overflow-hidden mb-4">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={current}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(56px, 9vw, 120px)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#fff',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  {SLIDES[current].line1}
                  <br />
                  {SLIDES[current].line2}
                </motion.h1>
              </AnimatePresence>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(14px, 1.5vw, 17px)',
                color: 'rgba(255,255,255,0.72)',
                maxWidth: '440px',
                lineHeight: 1.65,
                marginBottom: '40px',
                fontWeight: 300,
              }}
            >
              Muebles artesanales de mimbre y polialuminio, tejidos a mano por maestros artesanos
              del Ecuador. Cada pieza es única, duradera y diseñada para tu espacio.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="flex items-center gap-4 flex-wrap"
            >
              <Link to="/catalogo" style={{ textDecoration: 'none' }}>
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 rounded-full px-6 py-3.5"
                  style={{
                    background: '#fff',
                    color: '#3d2215',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                  }}
                >
                  Ver catálogo
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>

              <Link to="/contacto" style={{ textDecoration: 'none' }}>
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-full px-6 py-3.5"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: '0.03em',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                  }}
                >
                  Solicitar cotización
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Indicadores de slide */}
          <div
            className="absolute bottom-8 right-8 md:right-14 flex items-center gap-2"
            style={{ zIndex: 20 }}
          >
            {BG_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? 28 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 400ms ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Stat strip inferior */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-8 left-8 md:left-14 flex items-center gap-8 flex-wrap"
            style={{ zIndex: 20 }}
          >
            {[
              { num: `+${new Date().getFullYear() - EMPRESA.fundacion}`, label: 'años de experiencia' },
              { num: '+2000', label: 'piezas entregadas' },
              { num: '100%', label: 'artesanía ecuatoriana' },
            ].map((s) => (
              <div key={s.label}>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 500,
                    color: '#fff',
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  {s.num}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: '3px 0 0',
                    fontWeight: 300,
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
