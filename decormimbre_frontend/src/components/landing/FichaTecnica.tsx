import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X, ArrowRight } from 'lucide-react'
import { waLink } from '@/lib/empresa'

export interface Producto {
  img: string
  name: string
  category?: string
  collection?: string
  material: string
  price: string
  desc?: string
  color?: string
  dimensiones?: string
  hecho?: string
}

const DIM_POR_CATEGORIA: Record<string, string> = {
  Sala: '≈ 180 × 85 × 75 cm',
  Comedor: '≈ 150 × 90 × 78 cm',
  Exterior: '≈ 200 × 90 × 80 cm',
  Dormitorio: '≈ 160 × 200 × 110 cm',
  Accesorios: '≈ 45 × 45 × 50 cm',
}

function specs(p: Producto) {
  const poly = p.material.toLowerCase().includes('polialuminio')
  return {
    color: p.color ?? (poly ? 'Grafito (personalizable a cualquier color)' : 'Natural miel (personalizable a cualquier color)'),
    dimensiones: p.dimensiones ?? DIM_POR_CATEGORIA[p.category ?? ''] ?? 'Personalizable a tu espacio',
    hecho:
      p.hecho ??
      `Tejido artesanal a mano sobre estructura resistente. Material: ${p.material}. ` +
        (poly
          ? 'Fibra sintética de HDPE con alma de aluminio, apta para exteriores (resiste sol, lluvia y UV).'
          : 'Fibra de mimbre natural, ideal para interiores; textura cálida y biodegradable.') +
        ' Producción bajo pedido; cada pieza es única.',
  }
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(92,64,51,0.5)', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(61,34,21,0.9)', margin: 0, lineHeight: 1.4 }}>{value}</p>
    </div>
  )
}

export default function FichaTecnica({ producto, onClose }: { producto: Producto | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {producto && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,8,2,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(920px, 100%)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 24, background: '#faf7f3', boxShadow: '0 30px 80px rgba(20,8,2,0.45)' }}
          >
            <style>{`@media (max-width: 680px){ .ficha-grid{ grid-template-columns: 1fr !important; } .ficha-grid > div:first-child{ min-height: 220px !important; } }`}</style>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', minHeight: 0, flex: 1 }} className="ficha-grid">
              {/* Imagen ampliada */}
              <div style={{ position: 'relative', background: '#000', minHeight: 280 }}>
                <img src={producto.img} alt={producto.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <span style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', padding: '5px 12px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(92,64,51,0.8)' }}>
                  Ficha técnica
                </span>
              </div>

              {/* Detalles */}
              <div style={{ padding: '28px 30px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    {(producto.collection || producto.category) && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>
                        {producto.collection ?? producto.category}
                      </p>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontStyle: 'italic', color: '#3d2215', margin: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{producto.name}</h3>
                  </div>
                  <button onClick={onClose} aria-label="Cerrar" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(92,64,51,0.15)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(92,64,51,0.6)', flexShrink: 0 }}>
                    <X size={16} />
                  </button>
                </div>

                {producto.desc && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(92,64,51,0.65)', lineHeight: 1.6, margin: '14px 0 0', fontWeight: 300 }}>{producto.desc}</p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '22px 0' }}>
                  <Fila label="Material" value={producto.material} />
                  <Fila label="Color" value={specs(producto).color} />
                  <Fila label="Dimensiones" value={specs(producto).dimensiones} />
                  <Fila label="Precio" value={producto.price} />
                </div>

                <div style={{ borderTop: '1px solid rgba(92,64,51,0.1)', paddingTop: 16 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>Cómo está hecho</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.7)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{specs(producto).hecho}</p>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <Link to="/personalizar" onClick={onClose} style={{ flex: 1, textDecoration: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#5C4033', color: '#fff', padding: '12px 18px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                      Personalizar <ArrowRight size={14} />
                    </span>
                  </Link>
                  <a href={waLink(`Hola Decormimbre, me interesa "${producto.name}". ¿Me pueden dar más información y cotización?`)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#25D366', color: '#fff', padding: '12px 18px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                      WhatsApp
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
