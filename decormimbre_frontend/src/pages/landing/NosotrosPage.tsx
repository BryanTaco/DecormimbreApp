import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import MaterialsSection from '@/components/landing/MaterialsSection'

const VALORES = [
  { num: '+15', label: 'Años de experiencia', desc: 'Tejiendo muebles artesanales desde 2009 en el Ecuador.' },
  { num: '+2000', label: 'Piezas entregadas', desc: 'Cada una única, diseñada y tejida para un cliente específico.' },
  { num: '100%', label: 'Artesanía manual', desc: 'Ningún mueble sale de una máquina. Todo pasa por manos expertas.' },
  { num: '0', label: 'Piezas en stock', desc: 'Producimos bajo pedido. Tu mueble es exclusivo, no seriado.' },
]

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <div className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[rgba(92,64,51,0.07)]">
        <Navbar theme="light" />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: '55vh', minHeight: 400 }}>
        <img
          src="https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=1920&q=85&auto=format&fit=crop"
          alt="Artesanos Decormimbre"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(20,8,4,0.5) 0%, rgba(20,8,4,0.7) 100%)' }}
        />
        <div className="relative h-full flex flex-col justify-end p-8 md:p-16" style={{ zIndex: 10 }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] text-white/60 hover:text-white transition-colors mb-4 no-underline"
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
              color: 'rgba(255,255,255,0.55)',
              margin: '0 0 8px',
            }}
          >
            Quiénes somos
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#fff',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Artesanía con alma<br />ecuatoriana
          </h1>
        </div>
      </div>

      {/* Historia */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(92,64,51,0.5)',
              }}
            >
              Nuestra historia
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(30px, 4vw, 44px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#3d2215',
                letterSpacing: '-0.02em',
                margin: '10px 0 20px',
                lineHeight: 1.15,
              }}
            >
              De taller familiar a marca artesanal
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'rgba(92,64,51,0.68)',
                lineHeight: 1.75,
                fontWeight: 300,
                margin: '0 0 16px',
              }}
            >
              Decormimbre nació en 2009 como un taller familiar en la sierra ecuatoriana.
              Lo que empezó como un oficio transmitido de generación en generación se
              convirtió en una empresa que respeta la técnica ancestral del tejido de mimbre
              mientras la adapta a los espacios contemporáneos.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'rgba(92,64,51,0.68)',
                lineHeight: 1.75,
                fontWeight: 300,
                margin: 0,
              }}
            >
              Cada pieza pasa por las manos de maestros artesanos que dedican entre 8 y 40
              horas a su creación. No hay dos muebles iguales: las variaciones mínimas del
              tejido son la firma de que algo fue hecho por una persona, no por una máquina.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-4"
          >
            {VALORES.map((v, i) => (
              <div
                key={i}
                className="rounded-[1.5rem] p-6 bg-white border border-[rgba(92,64,51,0.07)] flex items-start gap-5"
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '32px',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: 'rgba(92,64,51,0.6)',
                    lineHeight: 1,
                    flexShrink: 0,
                    width: '80px',
                    textAlign: 'right',
                  }}
                >
                  {v.num}
                </span>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'rgba(92,64,51,0.9)',
                      margin: '0 0 3px',
                    }}
                  >
                    {v.label}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'rgba(92,64,51,0.55)',
                      margin: 0,
                      lineHeight: 1.5,
                      fontWeight: 300,
                    }}
                  >
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Sección materiales */}
      <MaterialsSection />

      {/* CTA */}
      <div className="bg-white py-20 px-6 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#3d2215',
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}
          >
            ¿Listo para tu mueble personalizado?
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'rgba(92,64,51,0.6)',
              margin: '0 0 32px',
              fontWeight: 300,
            }}
          >
            Cuéntanos tu idea y nuestros artesanos la hacen realidad.
          </p>
          <Link to="/contacto" style={{ textDecoration: 'none' }}>
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5"
              style={{
                background: 'rgba(92,64,51,0.9)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Solicitar cotización <ArrowUpRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
