import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import AiAssistant from '@/components/AiAssistant'
import FichaTecnica, { type Producto } from '@/components/landing/FichaTecnica'
import { catalogoPublicoApi, type ProductoWeb } from '@/api/catalogo'

const CATEGORIAS = ['Todos', 'Sala', 'Comedor', 'Exterior', 'Dormitorio', 'Accesorios']

// Respaldo si la API no responde (mantiene el catálogo visible siempre)
const PRODUCTOS_FALLBACK: ProductoWeb[] = [
  { img: '/products/sala-modular-oscura.jpg', category: 'Sala', name: 'Sofá Serena', material: 'Polialuminio & Mimbre', price: 'Desde $620', desc: 'Sala modular en tejido resistente. Estructura de polialuminio con acabado artesanal.' },
  { img: '/products/papasan-set.jpg', category: 'Sala', name: 'Silla Nido', material: 'Mimbre Natural', price: 'Desde $185', desc: 'Sillas papasan tejidas a mano. Forma que abraza el cuerpo, diseño ecuatoriano.' },
  { img: '/products/set-exterior-huevo.jpg', category: 'Exterior', name: 'Set Jardín Pacífico', material: 'Polialuminio', price: 'Desde $890', desc: 'Set completo para exteriores con sillas nido. Tejido resistente al sol y la lluvia.' },
  { img: '/products/silla-artesanal.jpg', category: 'Comedor', name: 'Silla Sierra', material: 'Polialuminio', price: 'Desde $95', desc: 'Silla artesanal tejida. Resistente y fácil de mantener, ideal para comedores.' },
  { img: '/products/colgante-huevo-azul.jpg', category: 'Sala', name: 'Butaca Andina', material: 'Mimbre Natural', price: 'Desde $180', desc: 'Silla colgante tipo huevo con cojín. Diseño ecuatoriano, cómoda y elegante.' },
  { img: '/products/cesta-mantas.jpg', category: 'Accesorios', name: 'Cestas Artesanales', material: 'Mimbre Natural', price: 'Desde $45', desc: 'Cestas tejidas a mano en mimbre natural. Perfectas para decoración y almacenaje.' },
  { img: '/products/chaise-piscina-real.jpg', category: 'Exterior', name: 'Chaise Terraza', material: 'Polialuminio', price: 'Desde $340', desc: 'Chaise longue para terrazas y piscinas. Polialuminio resistente al sol y la humedad.' },
  { img: '/products/set-sala-tejido.jpg', category: 'Dormitorio', name: 'Sala Íntima', material: 'Mimbre Natural', price: 'Desde $260', desc: 'Conjunto tejido de textura cálida y natural, perfecto para espacios de descanso.' },
  { img: '/products/comedor-tejido.jpg', category: 'Comedor', name: 'Sillas Comedor Raíz', material: 'Mimbre & Madera', price: 'Desde $120', desc: 'Juego de comedor con sillas de respaldo tejido y mesa central artesanal.' },
  { img: '/products/butacas-sunroom.jpg', category: 'Sala', name: 'Butacas Sunroom', material: 'Mimbre Natural', price: 'Desde $320', desc: 'Par de butacas tejidas para espacios luminosos. Comodidad y textura natural.' },
  { img: '/products/sillones-ventanal.jpg', category: 'Sala', name: 'Sillones Ventanal', material: 'Mimbre Natural', price: 'Desde $360', desc: 'Sillones envolventes de mimbre tejido, perfectos junto a grandes ventanales.' },
  { img: '/products/loveseat-riviera.jpg', category: 'Exterior', name: 'Loveseat Riviera', material: 'Mimbre Natural', price: 'Desde $520', desc: 'Bancada de mimbre con cojín para exteriores. Elegancia clásica y durabilidad.' },
  { img: '/products/silla-circular.jpg', category: 'Sala', name: 'Silla Orbital', material: 'Mimbre Natural', price: 'Desde $195', desc: 'Silla circular que abraza el cuerpo. Tejida a mano por artesanos ecuatorianos.' },
  { img: '/products/sala-ebano.jpg', category: 'Sala', name: 'Set Sala Ébano', material: 'Polialuminio', price: 'Desde $780', desc: 'Set de sala en polialuminio oscuro con cojines premium para interiores exigentes.' },
  { img: '/products/set-comedor.jpg', category: 'Comedor', name: 'Set Comedor Redondo', material: 'Polialuminio', price: 'Desde $890', desc: 'Mesa redonda con sillas tejidas. Ideal para comedores y terrazas techadas.' },
  { img: '/products/silla-nido.jpg', category: 'Sala', name: 'Silla Nido Tejida', material: 'Mimbre Natural', price: 'Desde $185', desc: 'Silla nido de mimbre natural con forma oval envolvente.' },
  { img: '/products/hamaca-jardin.jpg', category: 'Exterior', name: 'Hamaca Jardín', material: 'Mimbre & Polialuminio', price: 'Desde $340', desc: 'Silla colgante para terrazas y jardines. Descanso al aire libre con estilo.' },
  { img: '/products/daybeds-igloo.jpg', category: 'Dormitorio', name: 'Daybed Iglú', material: 'Mimbre Natural', price: 'Desde $760', desc: 'Daybed tejido tipo iglú con cojines. Un refugio de descanso para dormitorio o terraza.' },
]

export default function CatalogoPage() {
  const [catActiva, setCatActiva] = useState('Todos')
  const [ficha, setFicha] = useState<Producto | null>(null)

  // Catálogo desde la base (con respaldo a la lista fija si no hay respuesta)
  const { data } = useQuery({ queryKey: ['catalogo-publico'], queryFn: () => catalogoPublicoApi.productos() })
  const apiProductos: ProductoWeb[] = data?.data ?? []
  const PRODUCTOS = apiProductos.length > 0 ? apiProductos : PRODUCTOS_FALLBACK

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
              onClick={() => setFicha(item)}
              style={{ cursor: 'pointer' }}
              className="group rounded-[1.5rem] overflow-hidden bg-white border border-[rgba(92,64,51,0.07)] hover:shadow-xl transition-shadow duration-400"
            >
              <div className="relative overflow-hidden" style={{ paddingBottom: '68%' }}>
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(160deg, #efe6da, #e2d5c3)' }}>
                    <img src="/brand/icon-192.png" alt="" style={{ width: 54, opacity: 0.45, borderRadius: 12 }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)', letterSpacing: '0.05em' }}>Foto próximamente</span>
                  </div>
                )}
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
                    {typeof item.stock === 'number' && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 6,
                          fontFamily: 'var(--font-body)',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: item.stock > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(196,168,130,0.18)',
                          color: item.stock > 0 ? '#16a34a' : 'rgba(92,64,51,0.6)',
                        }}
                      >
                        {item.stock > 0 ? `En stock · ${item.stock}` : `Bajo pedido · ${item.dias_produccion ?? 15} días`}
                      </span>
                    )}
                  </div>
                  <span
                    title="Ver ficha técnica"
                    className="w-10 h-10 rounded-full bg-[rgba(92,64,51,0.07)] flex items-center justify-center group-hover:bg-[rgba(92,64,51,0.14)] transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4 text-[rgba(92,64,51,0.7)]" />
                  </span>
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
      <AiAssistant />
      <FichaTecnica producto={ficha} onClose={() => setFicha(null)} />
    </div>
  )
}
