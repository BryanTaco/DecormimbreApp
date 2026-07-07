import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import MaterialsSection from '@/components/landing/MaterialsSection'
import MapEmbed from '@/components/landing/MapEmbed'
import AiAssistant from '@/components/AiAssistant'

const VALORES = [
  { num: '+25', label: 'Años de experiencia', desc: 'Tejiendo muebles artesanales desde 1999 en el Ecuador.' },
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
          src="/products/hero-sala-quito.jpg"
          alt="Muebles artesanales Decormimbre"
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
              Fundada en 1999, Decormimbre es una empresa quiteña de fabricación, venta y
              decoración de muebles, especializada en el arte del tejido de mimbre. Con más
              de dos décadas de trayectoria, desde su taller y showroom en el sector de
              Versalles, cerca del Mercado Santa Clara, ofrece muebles de mimbre y madera,
              sofás, salas, comedores y complementos de decoración para el hogar.
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
              Cada pieza pasa por las manos de maestros artesanos que combinan la técnica
              ancestral del tejido con diseños contemporáneos. No hay dos muebles iguales:
              las variaciones mínimas del tejido son la firma de que algo fue hecho por una
              persona, no por una máquina.
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

      {/* Qué hacemos + info de la empresa */}
      <div className="bg-white py-20 px-6 md:px-10 border-t border-[rgba(92,64,51,0.06)]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 max-w-2xl"
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
              Qué hacemos
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#3d2215',
                letterSpacing: '-0.02em',
                margin: '10px 0 0',
                lineHeight: 1.15,
              }}
            >
              Muebles y decoración hechos a mano
            </h2>
          </motion.div>

          {/* Especialidades */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-14">
            {[
              { t: 'Muebles de mimbre', d: 'Tejido artesanal de fibra natural para interiores.' },
              { t: 'Muebles de madera', d: 'Estructuras sólidas con acabados a medida.' },
              { t: 'Sofás y salas', d: 'Juegos de sala cómodos y a la medida de tu espacio.' },
              { t: 'Comedores', d: 'Mesas y sillas para el comedor, en mimbre o madera.' },
              { t: 'Muebles de exterior', d: 'Polialuminio resistente al sol, la lluvia y el tiempo.' },
              { t: 'Decoración del hogar', d: 'Cestas, accesorios y complementos artesanales.' },
            ].map((s) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="rounded-[1.25rem] p-5 border border-[rgba(92,64,51,0.08)] bg-[#f5f0eb]"
              >
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(92,64,51,0.9)',
                    margin: '0 0 4px',
                  }}
                >
                  {s.t}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(92,64,51,0.55)',
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: 300,
                  }}
                >
                  {s.d}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Datos de la empresa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[1.5rem] p-8 md:p-10 border border-[rgba(92,64,51,0.1)] bg-[#1e1008]"
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)',
                margin: '0 0 20px',
              }}
            >
              Decormimbre — Decoraciones
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { label: 'Dónde estamos', value: 'Versalles N23-56, entre Mercadillo y Marchena, cerca del Mercado Santa Clara — Quito, Ecuador.' },
                { label: 'Contacto', value: 'WhatsApp 098 057 2561\n(02) 256 4256\ndecormimbre@yahoo.com' },
                { label: 'Especialidad', value: 'Muebles de mimbre y madera, sofás, salas, comedores y decoración para el hogar.' },
              ].map((c) => (
                <div key={c.label}>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      color: 'rgba(255,255,255,0.45)',
                      margin: '0 0 8px',
                    }}
                  >
                    {c.label}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1.6,
                      margin: 0,
                      fontWeight: 300,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mapa de ubicación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-6"
          >
            <MapEmbed height={340} />
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
      <AiAssistant />
    </div>
  )
}
