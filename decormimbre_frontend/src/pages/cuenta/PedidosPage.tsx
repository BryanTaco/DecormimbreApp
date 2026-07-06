import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Package, ArrowRight, Truck, Wrench, CheckCircle2, Clock } from 'lucide-react'
import { getMisPedidos } from '@/api/authApi'

const PROGRESO: Record<string, number> = {
  PENDIENTE: 0, EN_PRODUCCION: 40, LISTO: 80, EN_ENTREGA: 90, ENTREGADO: 100,
}
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', EN_PRODUCCION: 'En producción', LISTO: 'Listo', EN_ENTREGA: 'En camino', ENTREGADO: 'Entregado',
}
const ESTADO_ICON: Record<string, React.ElementType> = {
  PENDIENTE: Clock, EN_PRODUCCION: Wrench, LISTO: CheckCircle2, EN_ENTREGA: Truck, ENTREGADO: CheckCircle2,
}

export default function PedidosPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMisPedidos()
      .then((d) => setData(d.results ?? d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activos = data.filter(p => p.estado !== 'ENTREGADO')
  const completados = data.filter(p => p.estado === 'ENTREGADO')

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>Mi portal</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 28px', letterSpacing: '-0.02em' }}>Mis pedidos</h1>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 64 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(196,168,130,0.3)', borderTopColor: '#5C4033', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 64 }}>
          <Package size={40} color="rgba(196,168,130,0.5)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', color: 'rgba(92,64,51,0.5)', margin: 0 }}>Sin pedidos todavía</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.4)', marginTop: 8 }}>Solicita una cotización y conviértela en pedido.</p>
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(92,64,51,0.5)', marginBottom: 14 }}>Activos ({activos.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activos.map((p, i) => <PedidoCard key={p.id} pedido={p} index={i} />)}
              </div>
            </div>
          )}
          {completados.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(92,64,51,0.5)', marginBottom: 14 }}>Historial ({completados.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completados.map((p, i) => <PedidoCard key={p.id} pedido={p} index={i} />)}
              </div>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function PedidoCard({ pedido, index }: { pedido: any; index: number }) {
  const progreso = PROGRESO[pedido.estado] ?? 0
  const Icon = ESTADO_ICON[pedido.estado] ?? Clock

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: index * 0.06 }}>
      <Link to={`/cuenta/pedidos/${pedido.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(196,168,130,0.18)', padding: '20px 22px', transition: 'box-shadow 200ms, transform 200ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(92,64,51,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#3d2215' }}>{pedido.numero_pedido ?? `PED-${pedido.id?.slice(0, 6).toUpperCase()}`}</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.5)' }}>
                {pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha pendiente'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${pedido.estado === 'ENTREGADO' ? '#22c55e' : '#3b82f6'}18`, padding: '6px 12px', borderRadius: 99 }}>
              <Icon size={13} color={pedido.estado === 'ENTREGADO' ? '#22c55e' : '#3b82f6'} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: pedido.estado === 'ENTREGADO' ? '#22c55e' : '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {pedido.estado !== 'ENTREGADO' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(196,168,130,0.2)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progreso}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #C4A882, #5C4033)', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {['Confirmado', 'Producción', 'Listo', 'Entrega'].map((step, i) => (
                  <span key={step} style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: i * 33 <= progreso ? 'rgba(92,64,51,0.7)' : 'rgba(92,64,51,0.3)', fontWeight: i * 33 <= progreso ? 600 : 400 }}>{step}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.5)' }}>
              {pedido.items_count ?? 1} mueble{(pedido.items_count ?? 1) !== 1 ? 's' : ''}
              {pedido.total && ` · $${Number(pedido.total).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
            </p>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C4033', fontWeight: 600 }}>
              Ver detalle <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
