import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { FileText, Package, ArrowRight, Clock, CheckCircle, Loader } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getMisCotizaciones, getMisPedidos } from '@/api/authApi'

const ESTADO_COLOR: Record<string, string> = {
  APROBADA: '#22c55e', PENDIENTE: '#f59e0b', RECHAZADA: '#ef4444',
  EN_PRODUCCION: '#3b82f6', LISTO: '#22c55e', ENTREGADO: '#6b7280',
  BORRADOR: '#94a3b8',
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada',
  EN_PRODUCCION: 'En producción', LISTO: 'Listo', ENTREGADO: 'Entregado',
  BORRADOR: 'Borrador',
}

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

  const stats = [
    { label: 'Cotizaciones', value: cotizaciones.length, icon: FileText, color: '#C4A882', to: '/cuenta/cotizaciones' },
    { label: 'Pedidos activos', value: pedidos.filter(p => !['ENTREGADO'].includes(p.estado)).length, icon: Package, color: '#7B5840', to: '/cuenta/pedidos' },
    { label: 'Pendientes', value: cotizaciones.filter(c => c.estado === 'PENDIENTE').length, icon: Clock, color: '#f59e0b', to: '/cuenta/cotizaciones' },
    { label: 'Completados', value: pedidos.filter(p => p.estado === 'ENTREGADO').length, icon: CheckCircle, color: '#22c55e', to: '/cuenta/pedidos' },
  ]

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>
          {saludo}, {user?.nombre.split(' ')[0]}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Tu panel
        </h1>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 36 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
            <Link to={s.to} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(196,168,130,0.18)', padding: '20px 20px 18px', transition: 'box-shadow 200ms, transform 200ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(92,64,51,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <s.icon size={17} color={s.color} strokeWidth={1.8} />
                </div>
                {loading
                  ? <div style={{ width: 40, height: 28, borderRadius: 6, background: 'rgba(196,168,130,0.25)', animation: 'shimmer 1.5s infinite' }} />
                  : <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: '#3d2215', margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
                }
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.55)', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {/* Recent cotizaciones */}
        <SectionCard title="Cotizaciones recientes" to="/cuenta/cotizaciones">
          {loading ? <Loader size={20} color="rgba(92,64,51,0.3)" style={{ animation: 'spin 1s linear infinite' }} /> :
            cotizaciones.length === 0
              ? <EmptyState text="No tienes cotizaciones aún" action={{ label: 'Crear cotización', to: '/personalizar' }} />
              : cotizaciones.slice(0, 4).map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(196,168,130,0.12)' }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215' }}>{c.codigo ?? `COT-${c.id?.slice(0, 6).toUpperCase()}`}</p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)' }}>{new Date(c.fecha_solicitud ?? c.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <StatusBadge estado={c.estado} />
                </div>
              ))
          }
        </SectionCard>

        {/* Recent pedidos */}
        <SectionCard title="Pedidos activos" to="/cuenta/pedidos">
          {loading ? <Loader size={20} color="rgba(92,64,51,0.3)" style={{ animation: 'spin 1s linear infinite' }} /> :
            pedidos.filter(p => p.estado !== 'ENTREGADO').length === 0
              ? <EmptyState text="No tienes pedidos activos" />
              : pedidos.filter(p => p.estado !== 'ENTREGADO').slice(0, 4).map((p: any) => (
                <Link key={p.id} to={`/cuenta/pedidos/${p.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(196,168,130,0.12)' }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215' }}>{p.numero_pedido ?? `PED-${p.id?.slice(0, 6).toUpperCase()}`}</p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)' }}>{p.items_count ?? 1} mueble{(p.items_count ?? 1) !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusBadge estado={p.estado} />
                    <ArrowRight size={12} color="rgba(92,64,51,0.35)" />
                  </div>
                </Link>
              ))
          }
        </SectionCard>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/personalizar" style={{ textDecoration: 'none' }}>
          <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5C4033', color: '#fff', padding: '12px 22px', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FileText size={15} /> Nueva cotización
          </motion.span>
        </Link>
        <Link to="/catalogo" style={{ textDecoration: 'none' }}>
          <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(92,64,51,0.08)', color: '#5C4033', padding: '12px 22px', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(92,64,51,0.15)' }}>
            Ver catálogo
          </motion.span>
        </Link>
      </div>

      <style>{`
        @keyframes shimmer { 0%,100% { opacity: 0.4 } 50% { opacity: 0.8 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function SectionCard({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(196,168,130,0.18)', padding: '22px 22px 16px' }}>
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

function EmptyState({ text, action }: { text: string; action?: { label: string; to: string } }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.45)', margin: '0 0 10px' }}>{text}</p>
      {action && <Link to={action.to} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C4033', fontWeight: 600, textDecoration: 'underline' }}>{action.label}</Link>}
    </div>
  )
}
