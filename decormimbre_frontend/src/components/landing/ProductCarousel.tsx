import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PRODUCTS = [
  {
    name: 'Silla Nido',
    collection: 'Colección Tierra',
    description: 'Forma oval que abraza el cuerpo con calidez. Tejida a mano con mimbre natural por artesanos ecuatorianos.',
    material: 'Mimbre Natural',
    price: 'Desde $185',
    src: '/products/silla-nido.jpg',
    bg: '#7B5840',
  },
  {
    name: 'Sofá Serena',
    collection: 'Colección Serena',
    description: 'Estructura de polialuminio con tejido artesanal resistente al exterior. Elegancia y durabilidad en equilibrio.',
    material: 'Polialuminio & Mimbre',
    price: 'Desde $620',
    src: '/products/sofa-serena.jpg',
    bg: '#4A6741',
  },
  {
    name: 'Silla Sierra',
    collection: 'Colección Raíz',
    description: 'Diseño clásico con tejido artesanal reforzado. Perfecta para comedor o terraza, resistente y elegante.',
    material: 'Polialuminio',
    price: 'Desde $95',
    src: '/products/silla-sierra.jpg',
    bg: '#8B6B52',
  },
  {
    name: 'Set Exterior',
    collection: 'Colección Exterior',
    description: 'Confort y tradición artesanal para jardines y terrazas. Polialuminio resistente a la intemperie, bello en todo clima.',
    material: 'Polialuminio',
    price: 'Desde $890',
    src: '/products/set-exterior.jpg',
    bg: '#5E7A5C',
  },
]

type Role = 'center' | 'left' | 'right' | 'back'

function CardItem({ product, role }: { product: (typeof PRODUCTS)[0]; role: Role }) {
  const isCenter = role === 'center'
  const isBack = role === 'back'

  const TRANSFORMS: Record<Role, React.CSSProperties> = {
    center: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(1)', width: 'min(340px, 72vw)', zIndex: 20, opacity: 1, filter: 'none' },
    left: { position: 'absolute', left: '14%', top: '50%', transform: 'translate(-50%, -50%) scale(0.78) rotate(-4deg)', width: 'min(280px, 56vw)', zIndex: 10, opacity: 0.7, filter: 'blur(1.5px)' },
    right: { position: 'absolute', left: '86%', top: '50%', transform: 'translate(-50%, -50%) scale(0.78) rotate(4deg)', width: 'min(280px, 56vw)', zIndex: 10, opacity: 0.7, filter: 'blur(1.5px)' },
    back: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(0.55)', width: 'min(260px, 50vw)', zIndex: 5, opacity: 0, filter: 'blur(4px)' },
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
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    PRODUCTS.forEach((p) => { const img = new Image(); img.src = p.src })
  }, [])

  const navigate = (dir: 'next' | 'prev') => {
    if (isAnimating) return
    setIsAnimating(true)
    setActiveIndex((prev) => (dir === 'next' ? (prev + 1) % 4 : (prev + 3) % 4))
    timerRef.current = setTimeout(() => setIsAnimating(false), 650)
  }

  const roles: Record<number, Role> = {
    [activeIndex]: 'center',
    [(activeIndex + 3) % 4]: 'left',
    [(activeIndex + 1) % 4]: 'right',
    [(activeIndex + 2) % 4]: 'back',
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

      <div style={{ position: 'relative', height: '100vh', maxHeight: 720, minHeight: 560 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          {PRODUCTS.map((product, idx) => <CardItem key={idx} product={product} role={roles[idx]} />)}
        </div>

        <div style={{ position: 'absolute', top: 28, left: 24, zIndex: 60 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Colección artesanal</p>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: 24, right: 24, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            {([{ dir: 'prev' as const, Icon: ArrowLeft }, { dir: 'next' as const, Icon: ArrowRight }]).map(({ dir, Icon }) => (
              <button key={dir} onClick={() => navigate(dir)} style={{ width: 48, height: 48, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)' }}>
                <Icon size={18} strokeWidth={2} />
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              {PRODUCTS.map((_, i) => (
                <button key={i} onClick={() => { if (!isAnimating) { setIsAnimating(true); setActiveIndex(i); setTimeout(() => setIsAnimating(false), 650) } }}
                  style={{ width: i === activeIndex ? 20 : 6, height: 4, borderRadius: 2, background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 400ms ease' }} />
              ))}
            </div>
          </div>
          <Link to="/catalogo" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2.5vw, 28px)', fontStyle: 'italic', color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              Ver colección <ArrowRight size={18} strokeWidth={2} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
