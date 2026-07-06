import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

const CATALOG_ITEMS = [
  { img: '/products/silla-circular.jpg',    category: 'Sala',       name: 'Silla Orbital',        material: 'Mimbre Natural',        price: 'Desde $195' },
  { img: '/products/set-comedor.jpg',       category: 'Comedor',    name: 'Set Comedor',           material: 'Polialuminio',          price: 'Desde $890' },
  { img: '/products/loveseat-riviera.jpg',  category: 'Exterior',   name: 'Loveseat Riviera',      material: 'Mimbre Natural',        price: 'Desde $520' },
  { img: '/products/sala-ebano.jpg',        category: 'Sala',       name: 'Set Sala Ébano',        material: 'Polialuminio',          price: 'Desde $780' },
  { img: '/products/set-exterior-nido.jpg', category: 'Exterior',   name: 'Set Jardín Nido',       material: 'Polialuminio',          price: 'Desde $940' },
  { img: '/products/butacas-artesanales.jpg', category: 'Sala',     name: 'Butacas Artesanales',   material: 'Mimbre Natural',        price: 'Desde $320' },
]

export default function CatalogSection() {
  return (
    <section className="bg-white py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: 'rgba(92,64,51,0.55)',
              }}
            >
              Nuestra colección
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#3d2215',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                margin: '10px 0 0',
              }}
            >
              Piezas artesanales
            </h2>
          </motion.div>

          <Link to="/catalogo" style={{ textDecoration: 'none' }}>
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full px-5 py-2.5"
              style={{
                background: 'rgba(92,64,51,0.07)',
                color: 'rgba(92,64,51,0.8)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.03em',
                border: '1px solid rgba(92,64,51,0.12)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Ver catálogo completo <ArrowRight className="w-3.5 h-3.5" />
            </motion.span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATALOG_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link to="/catalogo" style={{ textDecoration: 'none', display: 'block' }}>
                <div className="group rounded-[1.5rem] overflow-hidden border border-[rgba(92,64,51,0.07)] hover:shadow-xl transition-shadow duration-400 bg-[#f5f0eb] cursor-pointer">
                  <div className="relative overflow-hidden" style={{ paddingBottom: '70%', position: 'relative' }}>
                    <img
                      src={item.img}
                      alt={item.name}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        transition: 'transform 600ms ease',
                      }}
                      className="group-hover:scale-105"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        fontFamily: 'var(--font-body)',
                        fontSize: '9px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(6px)',
                        color: 'rgba(92,64,51,0.8)',
                        padding: '4px 10px',
                        borderRadius: 999,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '20px',
                          fontWeight: 400,
                          fontStyle: 'italic',
                          color: 'rgba(92,64,51,0.95)',
                          margin: '0 0 3px',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {item.name}
                      </h3>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '11px',
                          color: 'rgba(92,64,51,0.5)',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 400,
                        }}
                      >
                        {item.material}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '16px',
                          fontStyle: 'italic',
                          color: 'rgba(92,64,51,0.75)',
                        }}
                      >
                        {item.price}
                      </span>
                      <span
                        className="w-8 h-8 rounded-full bg-[rgba(92,64,51,0.07)] flex items-center justify-center group-hover:bg-[rgba(92,64,51,0.14)] transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4 text-[rgba(92,64,51,0.7)]" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
