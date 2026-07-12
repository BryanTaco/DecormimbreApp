import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { FileText, Package, ArrowRight, Clock, CheckCircle, Loader, Sparkles, Headphones } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getMisCotizaciones, getMisPedidos } from '@/api/authApi'
import { waLink } from '@/lib/empresa'
import BrandLogo from '@/components/BrandLogo'
import PushToggle from '@/components/PushToggle'

const ESTADO_COLOR: Record<string, string> = {
  APROBADA: '#22c55e', PENDIENTE: '#f59e0b', RECHAZADA: '#ef4444',
  EN_PRODUCCION: '#3b82f6', LISTO: '#22c55e', LISTO_ENTREGA: '#22c55e',
  EN_ENTREGA: '#3b82f6', ENTREGADO: '#6b7280', BORRADOR: '#94a3b8', CONFIRMADO: '#3b82f6',
}
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada',
  EN_PRODUCCION: 'En producción', LISTO: 'Listo', LISTO_ENTREGA: 'Listo',
  EN_ENTREGA: 'En camino', ENTREGADO: 'Entregado', BORRADOR: 'Borrador', CONFIRMADO: 'Confirmado',
}
const PROGRESO: Record<string, number> = {
  PENDIENTE: 10, CONFIRMADO: 25, EN_PRODUCCION: 55, LISTO: 85, LISTO_ENTREGA: 85, EN_ENTREGA: 92, ENTREGADO: 100,
}

const INSPIRACION = [
  { img: '/products/papasan-set.jpg', name: 'Sillas Nido', cat: 'Sala' },
  { img: '/products/set-sala-tejido.jpg', name: 'Sala Tejida', cat: 'Sala' },
  { img: '/products/comedor-tejido.jpg', name: 'Comedor Raíz', cat: 'Comedor' },
  { img: '/products/colgante-huevo-azul.jpg', name: 'Butaca Colgante', cat: 'Exterior' },
]

export default function CuentaDashboard() {
  const user = useAuthStore((s) => s.user)
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMisCotizaciones(), getMisPedidos()])
      .then(([c, p]) => { setCotizaciones(c.results ?? c); setPedidos(p.results ?? p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = user?.nombre?.split(' ')[0] ?? ''
  const activos = pedidos.filter((p) => p.estado !== 'ENTREGADO')

  const stats = [
    { label: 'Cotizaciones', value: cotizaciones.length, icon: FileText, color: '#C4A882', to: '/cuenta/cotizaciones' },
    { label: 'Pedidos activos', value: activos.length, icon: Package, color: '#7B5840', to: '/cuenta/pedidos' },
    { label: 'Pendientes', value: cotizaciones.filter((c) => c.estado === 'PENDIENTE').length, icon: Clock, color: '#f59e0b', to: '/cuenta/cotizaciones' },
    { label: 'Completados', value: pedidos.filter((p) => p.estado === 'ENTREGADO').length, icon: CheckCircle, color: '#22c55e', to: '/cuenta/pedidos' },
  ]

  return (
    <div style={{ padding: 'clamp(20px, 3.5vw, 44px)' }}>
      {/* Hero cinematográfico con imagen real de ambiente */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, marginBottom: 26, minHeight: 'clamp(320px, 42vh, 440px)', display: 'flex', alignItems: 'flex-end', boxShadow: '0 24px 60px rgba(61,34,21,0.32)' }}>
        {/* Fondo: foto real con leve zoom (efecto cine) */}
        <motion.img
          src="/products/set-sala-tejido.jpg"
          alt=""
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Degradado envolvente para legibilidad */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,8,4,0.9) 0%, rgba(20,8,4,0.68) 42%, rgba(20,8,4,0.2) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,8,4,0.7) 0%, transparent 55%)' }} />

        {/* Logo arriba */}
        <div style={{ position: 'absolute', top: 22, left: 'clamp(20px, 4vw, 40px)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <BrandLogo size={34} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, letterSpacing: '0.14em', color: '#fff', textTransform: 'uppercase' }}>Decormimbre</span>
        </div>

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(24px, 4vw, 44px)', maxWidth: 620 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.65)', margin: '0 0 8px' }}>
            {saludo}, {nombre}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 400, fontStyle: 'italic', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Bienvenido a tu espacio
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, margin: '0 0 22px', fontWeight: 300, maxWidth: 440 }}>
            Sigue tus cotizaciones y pedidos, y diseña tu próximo mueble artesanal hecho a tu medida.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/personalizar" style={{ textDecoration: 'none' }}>
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#3d2215', padding: '12px 24px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700 }}>
                <Sparkles size={15} /> Personaliza tu mueble
              </motion.span>
            </Link>
            <Link to="/catalogo" style={{ textDecoration: 'none' }}>
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(6px)', padding: '12px 24px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                Ver catálogo <ArrowRight size={14} />
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 26 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }} whileHover={{ y: -3 }}>
            <Link to={s.to} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ position: 'relative', overflow: 'hidden', background: '#fff', borderRadius: 18, border: '1px solid rgba(196,168,130,0.2)', padding: '18px 18px 16px', transition: 'box-shadow 220ms', boxShadow: '0 1px 3px rgba(92,64,51,0.05)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(92,64,51,0.14)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(92,64,51,0.05)')}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `${s.color}12` }} />
                <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${s.color}28, ${s.color}12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <s.icon size={18} color={s.color} strokeWidth={1.9} />
                </div>
                {loading
                  ? <div style={{ width: 40, height: 30, borderRadius: 6, background: 'rgba(196,168,130,0.25)', animation: 'shimmer 1.5s infinite' }} />
                  : <p style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: '#3d2215', margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.55)', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Cotizaciones + Pedidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18, marginBottom: 26 }}>
        <SectionCard title="Cotizaciones recientes" to="/cuenta/cotizaciones">
          {loading ? <Loader size={20} color="rgba(92,64,51,0.3)" style={{ animation: 'spin 1s linear infinite' }} /> :
            cotizaciones.length === 0
              ? <EmptyState icon={FileText} text="Aún no tienes cotizaciones" action={{ label: 'Crear cotización', to: '/personalizar' }} />
              : cotizaciones.slice(0, 4).map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(196,168,130,0.12)' }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215' }}>{c.codigo ?? c.numero ?? `COT-${c.id?.slice(0, 6).toUpperCase()}`}</p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)' }}>{fecha(c.fecha_solicitud ?? c.fecha_creacion ?? c.created_at)}</p>
                  </div>
                  <StatusBadge estado={c.estado} />
                </div>
              ))}
        </SectionCard>

        <SectionCard title="Pedidos activos" to="/cuenta/pedidos">
          {loading ? <Loader size={20} color="rgba(92,64,51,0.3)" style={{ animation: 'spin 1s linear infinite' }} /> :
            activos.length === 0
              ? <EmptyState icon={Package} text="No tienes pedidos activos" action={{ label: 'Ver catálogo', to: '/catalogo' }} />
              : activos.slice(0, 4).map((p: any) => {
                const pct = p.porcentaje_completado ?? PROGRESO[p.estado] ?? 0
                return (
                  <Link key={p.id} to={`/cuenta/pedidos/${p.id}`} style={{ textDecoration: 'none', display: 'block', padding: '12px 0', borderBottom: '1px solid rgba(196,168,130,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215' }}>{p.numero_pedido ?? p.numero ?? `PED-${p.id?.slice(0, 6).toUpperCase()}`}</p>
                        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)' }}>{p.items_count ?? 1} mueble{(p.items_count ?? 1) !== 1 ? 's' : ''}</p>
                      </div>
                      <StatusBadge estado={p.estado} />
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(196,168,130,0.2)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C4A882, #5C4033)' }} />
                    </div>
                  </Link>
                )
              })}
        </SectionCard>
      </div>

      {/* Inspiración */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', color: '#3d2215', margin: 0 }}>Inspírate</h3>
          <Link to="/catalogo" style={{ textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.55)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver colección <ArrowRight size={12} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {INSPIRACION.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 + i * 0.06 }} whileHover={{ y: -4 }}>
              <Link to="/catalogo" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid rgba(196,168,130,0.2)' }} className="group">
                  <div style={{ position: 'relative', paddingBottom: '78%', overflow: 'hidden' }}>
                    <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms' }} className="group-hover:scale-105" />
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: '#3d2215' }}>{p.name}</p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(92,64,51,0.45)' }}>{p.cat}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Avisos push al celular */}
      <div style={{ marginBottom: 16 }}><PushToggle /></div>

      {/* Ayuda / soporte */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.35 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(196,168,130,0.2)', borderRadius: 18, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headphones size={20} color="#128C3E" />
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#3d2215' }}>¿Necesitas ayuda?</p>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.55)' }}>Escríbenos por WhatsApp y te asesoramos.</p>
          </div>
        </div>
        <a href={waLink()} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', padding: '10px 20px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>WhatsApp</span>
        </a>
      </motion.div>

      <style>{`
        @keyframes shimmer { 0%,100% { opacity: 0.4 } 50% { opacity: 0.8 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function fecha(v?: string) {
  if (!v) return ''
  try { return new Date(v).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '' }
}

function SectionCard({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderRadius: 18, border: '1px solid rgba(196,168,130,0.2)', padding: '22px 22px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: 0 }}>{title}</h3>
        <Link to={to} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)', fontWeight: 600 }}>
          Ver todo <ArrowRight size={11} />
        </Link>
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ estado }: { estado: string }) {
  const color = ESTADO_COLOR[estado] ?? '#94a3b8'
  const label = ESTADO_LABEL[estado] ?? estado
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, background: `${color}18`, padding: '3px 8px', borderRadius: 99 }}>
      {label}
    </span>
  )
}

function EmptyState({ text, action, icon: Icon }: { text: string; action?: { label: string; to: string }; icon?: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <div style={{ textAlign: 'center', padding: '22px 0' }}>
      {Icon && <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(196,168,130,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><Icon size={20} color="rgba(92,64,51,0.4)" /></div>}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.5)', margin: '0 0 10px' }}>{text}</p>
      {action && (
        <Link to={action.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 12, color: '#fff', background: '#5C4033', padding: '8px 16px', borderRadius: 99, fontWeight: 600, textDecoration: 'none' }}>
          {action.label} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}
