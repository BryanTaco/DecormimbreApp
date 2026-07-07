import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import FichaTecnica, { type Producto } from './FichaTecnica'

const PRODUCTS = [
  {
    name: 'Silla Orbital',
    collection: 'Colección Tierra',
    description: 'Forma circular que abraza el cuerpo con calidez. Tejida a mano con mimbre natural por artesanos ecuatorianos.',
    material: 'Mimbre Natural',
    price: 'Desde $195',
    src: '/products/silla-circular.jpg',
    bg: '#7B5840',
  },
  {
    name: 'Set Sala Ébano',
    collection: 'Colección Ébano',
    description: 'Set de sala en polialuminio oscuro. Estructura resistente, tejido artesanal y cojines premium para interiores exigentes.',
    material: 'Polialuminio',
    price: 'Desde $780',
    src: '/products/sala-ebano.jpg',
    bg: '#2A2A2A',
  },
  {
    name: 'Loveseat Riviera',
    collection: 'Colección Riviera',
    description: 'Bancada de mimbre natural con cojín rayado para exteriores mediterráneos. Elegancia clásica y durabilidad artesanal.',
    material: 'Mimbre Natural',
    price: 'Desde $520',
    src: '/products/loveseat-riviera.jpg',
    bg: '#8B6B52',
  },
  {
    name: 'Set Jardín Nido',
    collection: 'Colección Jardín',
    description: 'Juego de exterior en polialuminio trenzado oscuro. Sofá + 2 sillones + mesa. Resistente a lluvia, UV y temperatura.',
    material: 'Polialuminio',
    price: 'Desde $940',
    src: '/products/set-exterior-huevo.jpg',
    bg: '#3D5A40',
  },
  {
    name: 'Sillones Ventanal',
    collection: 'Colección Luz',
    description: 'Sillones de mimbre tejido junto al ventanal. Textura natural y curvas envolventes para espacios luminosos.',
    material: 'Mimbre Natural',
    price: 'Desde $360',
    src: '/products/sillones-ventanal.jpg',
    bg: '#9B7B5A',
  },
]

type Role = 'center' | 'left' | 'right' | 'back'

function CardItem({ product, role, onExpand }: { product: (typeof PRODUCTS)[0]; role: Role; onExpand?: () => void }) {
  const isCenter = role === 'center'
  const isBack = role === 'back'

  // Tarjetas laterales más separadas del borde y más difuminadas → el producto
  // central queda claramente en foco (padding visual en el fondo).
  const TRANSFORMS: Record<Role, React.CSSProperties> = {
    center: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(1)', width: 'min(360px, 74vw)', zIndex: 20, opacity: 1, filter: 'none' },
    left: { position: 'absolute', left: '20%', top: '50%', transform: 'translate(-50%, -50%) scale(0.66) rotate(-4deg)', width: 'min(240px, 50vw)', zIndex: 10, opacity: 0.4, filter: 'blur(3px)' },
    right: { position: 'absolute', left: '80%', top: '50%', transform: 'translate(-50%, -50%) scale(0.66) rotate(4deg)', width: 'min(240px, 50vw)', zIndex: 10, opacity: 0.4, filter: 'blur(3px)' },
    back: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(0.5)', width: 'min(240px, 46vw)', zIndex: 5, opacity: 0, filter: 'blur(5px)' },
  }

  return (
    <div style={{
      ...TRANSFORMS[role],
      transition: 'all 650ms cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform, opacity',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: isCenter ? '0 32px 80px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.25)',
      background: '#1a100a',
      pointerEvents: isBack ? 'none' : 'auto',
    }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '65%', overflow: 'hidden' }}>
        <img src={product.src} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} draggable={false} />
      </div>
      <div style={{ padding: isCenter ? '20px 22px 22px' : '14px 16px 16px', background: 'rgba(20,10,4,0.92)', backdropFilter: 'blur(12px)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: isCenter ? 10 : 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 4px' }}>{product.collection}</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: isCenter ? 26 : 20, fontWeight: 500, fontStyle: 'italic', color: '#fff', margin: '0 0 6px', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{product.name}</h3>
        {isCenter && (
          <>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, margin: '0 0 14px', fontWeight: 300 }}>{product.description}</p>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.material}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>{product.price}</span>
            </div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onExpand?.() }}
              style={{ marginTop: 14, width: '100%', padding: '10px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}
            >
              Ver ficha técnica
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductCarousel() {
  const N = PRODUCTS.length
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [ficha, setFicha] = useState<Producto | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragX = useRef<number | null>(null)

  const toFicha = (p: (typeof PRODUCTS)[0]): Producto => ({
    img: p.src, name: p.name, collection: p.collection, material: p.material, price: p.price, desc: p.description,
  })

  useEffect(() => {
    PRODUCTS.forEach((p) => { const img = new Image(); img.src = p.src })
  }, [])

  const navigate = (dir: 'next' | 'prev') => {
    if (isAnimating) return
    setIsAnimating(true)
    setActiveIndex((prev) => (dir === 'next' ? (prev + 1) % N : (prev - 1 + N) % N))
    timerRef.current = setTimeout(() => setIsAnimating(false), 650)
  }

  const goTo = (i: number) => {
    if (isAnimating || i === activeIndex) return
    setIsAnimating(true)
    setActiveIndex(i)
    setTimeout(() => setIsAnimating(false), 650)
  }

  // Arrastrar / deslizar para cambiar de producto
  const onPointerDown = (e: React.PointerEvent) => {
    dragX.current = e.clientX
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragX.current === null) return
    const dx = e.clientX - dragX.current
    dragX.current = null
    if (Math.abs(dx) > 45) navigate(dx < 0 ? 'next' : 'prev')
  }

  const roleFor = (idx: number): Role => {
    if (idx === activeIndex) return 'center'
    if (idx === (activeIndex - 1 + N) % N) return 'left'
    if (idx === (activeIndex + 1) % N) return 'right'
    return 'back'
  }

  const activeProd = PRODUCTS[activeIndex]

  return (
    <section style={{ backgroundColor: activeProd.bg, transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)', position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* Grain */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`, backgroundSize: '200px', pointerEvents: 'none', zIndex: 50, opacity: 0.5 }} />
      {/* Ghost text */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(80px, 22vw, 320px)', fontWeight: 700, fontStyle: 'italic', color: 'rgba(255,255,255,0.05)', lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap', filter: 'blur(2px)', userSelect: 'none' }}>DECORMIMBRE</span>
      </div>
      {/* Viñeta radial: oscurece los bordes para enfocar el producto central */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />

      <div style={{ position: 'relative', height: '100vh', maxHeight: 720, minHeight: 560 }}>
        {/* Zona de arrastre para deslizar entre productos */}
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'grab', touchAction: 'pan-y' }}
        >
          {PRODUCTS.map((product, idx) => (
            <CardItem key={idx} product={product} role={roleFor(idx)} onExpand={() => setFicha(toFicha(product))} />
          ))}
        </div>

        <div style={{ position: 'absolute', top: 28, left: 24, zIndex: 60 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Colección artesanal</p>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: 24, right: 24, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            {/* Indicadores (puntos) — clic o desliza para cambiar */}
            <div className="flex items-center gap-1.5">
              {PRODUCTS.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Producto ${i + 1}`}
                  style={{ width: i === activeIndex ? 22 : 7, height: 5, borderRadius: 3, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 400ms ease' }} />
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginLeft: 6, userSelect: 'none' }}>
              ← Desliza para explorar →
            </span>
          </div>
          <Link to="/catalogo" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2.5vw, 28px)', fontStyle: 'italic', color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              Ver colección <ArrowRight size={18} strokeWidth={2} />
            </span>
          </Link>
        </div>
      </div>

      <FichaTecnica producto={ficha} onClose={() => setFicha(null)} />
    </section>
  )
}
