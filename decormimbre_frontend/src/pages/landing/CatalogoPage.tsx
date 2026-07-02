import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'

const CATEGORIAS = ['Todos', 'Sala', 'Comedor', 'Exterior', 'Dormitorio', 'Accesorios']

const PRODUCTOS = [
  { img: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=700&q=85&auto=format&fit=crop', category: 'Sala', name: 'Sofá Serena', material: 'Polialuminio & Mimbre', price: 'Desde $620', desc: 'Estructura de polialuminio con tejido artesanal de mimbre. Resistente al exterior.' },
  { img: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=700&q=85&auto=format&fit=crop', category: 'Sala', name: 'Silla Nido', material: 'Mimbre Natural', price: 'Desde $185', desc: 'Forma oval que abraza el cuerpo. Tejida a mano por artesanos ecuatorianos.' },
  { img: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?w=700&q=85&auto=format&fit=crop', category: 'Exterior', name: 'Set Jardín Pacífico', material: 'Polialuminio', price: 'Desde $890', desc: 'Set completo para exteriores: sofá, 2 sillas y mesa. Tejido resistente al sol y lluvia.' },
  { img: 'https://images.unsplash.com/photo-1613052440827-2f5a9a48f5b4?w=700&q=85&auto=format&fit=crop', category: 'Comedor', name: 'Silla Sierra', material: 'Polialuminio', price: 'Desde $95', desc: 'Diseño artesanal en polialuminio. Resistente, fácil de mantener. Ideal para comedores.' },
  { img: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=700&q=85&auto=format&fit=crop', category: 'Sala', name: 'Butaca Andina', material: 'Mimbre Natural', price: 'Desde $180', desc: 'Silla colgante de mimbre natural. Diseño ecuatoriano, cómoda y elegante.' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=85&auto=format&fit=crop', category: 'Accesorios', name: 'Cestas Artesanales', material: 'Mimbre Natural', price: 'Desde $45', desc: 'Cestas tejidas a mano en mimbre natural. Perfectas para decoración y almacenaje.' },
  { img: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?w=700&q=85&auto=format&fit=crop&crop=bottom', category: 'Exterior', name: 'Hamaca Terraza', material: 'Mimbre & Polialuminio', price: 'Desde $340', desc: 'Hamaca colgante para terrazas y jardines. Combinación de materiales para máxima durabilidad.' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=85&auto=format&fit=crop&crop=top', category: 'Dormitorio', name: 'Cabecera Tejida', material: 'Mimbre Natural', price: 'Desde $260', desc: 'Cabecera artesanal que transforma el dormitorio. Calidez y textura natural única.' },
  { img: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=700&q=85&auto=format&fit=crop&crop=right', category: 'Comedor', name: 'Sillas Comedor Raíz', material: 'Mimbre & Madera', price: 'Desde $120', desc: 'Sillas de comedor con estructura en madera y respaldo de mimbre artesanal.' },
]

export default function CatalogoPage() {
  const [catActiva, setCatActiva] = useState('Todos')

  const filtrados = catActiva === 'Todos'
    ? PRODUCTOS
    : PRODUCTOS.filter((p) => p.category === catActiva)

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Navbar sobre fondo claro */}
      <div className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[rgba(92,64,51,0.07)]">
        <Navbar theme="light" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[12px] text-[rgba(92,64,51,0.55)] hover:text-[rgba(92,64,51,0.9)] transition-colors mb-6 no-underline"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}
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
              color: 'rgba(92,64,51,0.5)',
              margin: '0 0 10px',
            }}
          >
            Colección completa
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 64px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#3d2215',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Catálogo Decormimbre
          </h1>
        </motion.div>

        {/* Filtro categorías */}
        <div className="flex gap-2 flex-wrap mb-10">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatActiva(cat)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: catActiva === cat ? 500 : 400,
                padding: '8px 18px',
                borderRadius: 999,
                border: catActiva === cat ? '1px solid rgba(92,64,51,0.8)' : '1px solid rgba(92,64,51,0.15)',
                background: catActiva === cat ? 'rgba(92,64,51,0.9)' : 'white',
                color: catActiva === cat ? '#fff' : 'rgba(92,64,51,0.7)',
                cursor: 'pointer',
                transition: 'all 200ms',
                letterSpacing: '0.02em',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((item, i) => (
            <motion.div
              key={`${item.name}-${i}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group rounded-[1.5rem] overflow-hidden bg-white border border-[rgba(92,64,51,0.07)] hover:shadow-xl transition-shadow duration-400"
            >
              <div className="relative overflow-hidden" style={{ paddingBottom: '68%' }}>
                <img
                  src={item.img}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
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
              <div className="p-5">
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: 'rgba(92,64,51,0.95)',
                    margin: '0 0 4px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.name}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(92,64,51,0.55)',
                    margin: '0 0 10px',
                    lineHeight: 1.5,
                    fontWeight: 300,
                  }}
                >
                  {item.desc}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: 'rgba(92,64,51,0.45)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: '0 0 2px',
                      }}
                    >
                      {item.material}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        fontStyle: 'italic',
                        color: 'rgba(92,64,51,0.8)',
                        margin: 0,
                      }}
                    >
                      {item.price}
                    </p>
                  </div>
                  <Link to="/contacto" style={{ textDecoration: 'none' }}>
                    <span
                      className="w-10 h-10 rounded-full bg-[rgba(92,64,51,0.07)] flex items-center justify-center hover:bg-[rgba(92,64,51,0.14)] transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4 text-[rgba(92,64,51,0.7)]" />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontStyle: 'italic',
              color: 'rgba(92,64,51,0.7)',
              marginBottom: '16px',
            }}
          >
            ¿No encontraste lo que buscas?
          </p>
          <Link to="/personalizar" style={{ textDecoration: 'none' }}>
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
              Diseñar pieza personalizada <ArrowUpRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </div>
      </div>
    </div>
  )
}
