import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, CheckCircle2, Clock, Wrench, Truck, Package, MapPin } from 'lucide-react'
import { getMiPedido } from '@/api/authApi'

const TIMELINE_STEPS = [
  { estado: 'PENDIENTE', label: 'Pedido recibido', desc: 'Tu pedido fue confirmado', icon: Package },
  { estado: 'EN_PRODUCCION', label: 'En producción', desc: 'Nuestros artesanos están trabajando en tu mueble', icon: Wrench },
  { estado: 'LISTO', label: 'Listo', desc: 'Tu mueble está terminado y listo para entrega', icon: CheckCircle2 },
  { estado: 'EN_ENTREGA', label: 'En camino', desc: 'Tu pedido está en camino', icon: Truck },
  { estado: 'ENTREGADO', label: 'Entregado', desc: '¡Tu pedido fue entregado exitosamente!', icon: CheckCircle2 },
]

const ORDER: Record<string, number> = {
  PENDIENTE: 0, EN_PRODUCCION: 1, LISTO: 2, EN_ENTREGA: 3, ENTREGADO: 4,
}

export default function PedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const [pedido, setPedido] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    getMiPedido(id)
      .then(setPedido)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(196,168,130,0.3)', borderTopColor: '#5C4033', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error || !pedido) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', color: 'rgba(92,64,51,0.5)', margin: '0 0 12px' }}>Pedido no encontrado</p>
      <Link to="/cuenta/pedidos" style={{ color: '#5C4033', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>← Volver a pedidos</Link>
    </div>
  )

  const currentStep = ORDER[pedido.estado] ?? 0
  const logs: any[] = pedido.logs_estado ?? []

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
      <Link to="/cuenta/pedidos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'rgba(92,64,51,0.6)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, marginBottom: 28 }}>
        <ArrowLeft size={15} /> Mis pedidos
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>Detalle del pedido</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 32px', letterSpacing: '-0.02em' }}>
          {pedido.numero_pedido ?? `PED-${pedido.id?.slice(0, 6).toUpperCase()}`}
        </h1>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {/* Timeline */}
        <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 18, border: '1px solid rgba(196,168,130,0.18)', padding: '26px 28px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 24px' }}>Seguimiento</h3>
          <div style={{ position: 'relative' }}>
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = i <= currentStep
              const isCurrent = i === currentStep
              const Icon = step.icon
              const logEntry = logs.find((l: any) => l.estado_nuevo === step.estado)

              return (
                <div key={step.estado} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: i < TIMELINE_STEPS.length - 1 ? 28 : 0 }}>
                  {/* Line */}
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div style={{ position: 'absolute', left: 15, top: 32, width: 2, bottom: 0, background: isCompleted ? 'linear-gradient(to bottom, #5C4033, rgba(196,168,130,0.3))' : 'rgba(196,168,130,0.2)', zIndex: 0 }} />
                  )}
                  {/* Icon */}
                  <motion.div initial={isCurrent ? { scale: 0.8 } : {}} animate={isCurrent ? { scale: [0.9, 1.05, 1] } : {}} transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: isCompleted ? (isCurrent ? '#5C4033' : 'rgba(92,64,51,0.15)') : 'rgba(196,168,130,0.15)', border: `2px solid ${isCompleted ? (isCurrent ? '#5C4033' : '#C4A882') : 'rgba(196,168,130,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, position: 'relative' }}>
                    <Icon size={14} color={isCompleted ? (isCurrent ? '#fff' : '#5C4033') : 'rgba(196,168,130,0.5)'} strokeWidth={2} />
                  </motion.div>
                  <div style={{ paddingTop: 5 }}>
                    <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCompleted ? '#3d2215' : 'rgba(92,64,51,0.4)' }}>{step.label}</p>
                    {isCurrent && <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.6)' }}>{step.desc}</p>}
                    {logEntry && <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.4)' }}>{new Date(logEntry.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Details */}
          <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 18, border: '1px solid rgba(196,168,130,0.18)', padding: '24px 26px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 18px' }}>Detalles del pedido</h3>
            <InfoRow label="Número" value={pedido.numero_pedido ?? `PED-${pedido.id?.slice(0, 6).toUpperCase()}`} />
            <InfoRow label="Fecha" value={pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
            <InfoRow label="Entrega estimada" value={pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Por confirmar'} />
            {pedido.total && <InfoRow label="Total" value={`$${Number(pedido.total).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} bold />}
          </div>

          {/* Items */}
          {pedido.items && pedido.items.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 18, border: '1px solid rgba(196,168,130,0.18)', padding: '24px 26px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 16px' }}>Muebles ({pedido.items.length})</h3>
              {pedido.items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(196,168,130,0.12)' : 'none' }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215' }}>{item.descripcion ?? item.tipo_mueble ?? 'Mueble artesanal'}</p>
                    {item.color && <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)' }}>{item.material ?? ''} · {item.color}</p>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'rgba(92,64,51,0.6)' }}>×{item.cantidad ?? 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {pedido.observaciones && (
            <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 18, border: '1px solid rgba(196,168,130,0.18)', padding: '20px 24px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(92,64,51,0.45)', margin: '0 0 8px' }}>Notas</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.75)', margin: 0, lineHeight: 1.55 }}>{pedido.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(196,168,130,0.1)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.5)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: bold ? 'var(--font-display)' : 'var(--font-body)', fontSize: bold ? 16 : 13, fontStyle: bold ? 'italic' : 'normal', color: '#3d2215', fontWeight: bold ? 500 : 600 }}>{value}</span>
    </div>
  )
}
