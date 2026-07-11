import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { CheckCircle2, Circle, Loader2, Package, Calendar, MapPin } from 'lucide-react'
import api from '@/api/client'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import Badge from '@/components/ui/Badge'
import { EMPRESA } from '@/lib/empresa'

interface TareaP { tarea_id?: string; id?: string; tipo_display: string; estado: string }
interface ItemP { id: string; producto_nombre?: string; producto?: string; cantidad: number; ancho_cm?: string | null; alto_cm?: string | null; color_nombre?: string | null; color?: string | null }
interface Seguimiento {
  numero: string
  estado: string
  etapa_produccion_display: string | null
  porcentaje_completado: number
  cliente_nombre: string
  fecha_promesa_entrega: string | null
  fecha_entrega_real: string | null
  items: ItemP[]
  tareas: TareaP[]
}

const fecha = (v?: string | null) => v ? new Date(v).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

export default function SeguimientoPage() {
  const { token = '' } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seguimiento', token],
    queryFn: () => api.get(`/pedidos/seguimiento/${token}/`),
    enabled: !!token,
    retry: false,
  })
  const p: Seguimiento | undefined = data?.data

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <div className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[rgba(92,64,51,0.07)]">
        <Navbar theme="light" />
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.45)] mb-2">Seguimiento de pedido</p>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-[rgba(92,64,51,0.35)]" /></div>
        ) : isError || !p ? (
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] p-10 text-center">
            <Package className="w-8 h-8 text-[rgba(92,64,51,0.25)] mx-auto mb-3" />
            <h1 className="text-xl text-[#3d2215] mb-1">Enlace no válido</h1>
            <p className="text-sm text-[rgba(92,64,51,0.55)]">Este enlace de seguimiento no existe o expiró. Verifica el enlace o <Link to="/contacto" className="text-[#5C4033] underline">contáctanos</Link>.</p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-6 md:p-8 mb-6">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                <div>
                  <h1 className="text-[26px] font-normal text-[#3d2215]" style={{ fontFamily: 'var(--font-display)' }}>{p.numero}</h1>
                  <p className="text-sm text-[rgba(92,64,51,0.6)] mt-0.5">{p.cliente_nombre}</p>
                </div>
                <Badge value={p.estado} type="pedido" />
              </div>

              {/* Progreso */}
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="text-[rgba(92,64,51,0.7)]">{p.etapa_produccion_display || 'En preparación'}</span>
                <span className="text-[rgba(92,64,51,0.55)]">{p.porcentaje_completado}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[rgba(92,64,51,0.1)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${p.porcentaje_completado}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#C4A882] to-[#5C4033]" />
              </div>

              <div className="flex items-center gap-6 mt-5 text-[13px] text-[rgba(92,64,51,0.65)] flex-wrap">
                <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[rgba(92,64,51,0.45)]" /> Entrega estimada: <b className="font-medium text-[rgba(92,64,51,0.85)]">{fecha(p.fecha_promesa_entrega)}</b></span>
                {p.fecha_entrega_real && <span className="inline-flex items-center gap-1.5 text-green-600"><CheckCircle2 className="w-4 h-4" /> Entregado el {fecha(p.fecha_entrega_real)}</span>}
              </div>
            </motion.div>

            {/* Etapas de producción */}
            {p.tareas?.length > 0 && (
              <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-6 mb-6">
                <h2 className="text-sm font-medium text-[rgba(92,64,51,0.8)] mb-4">Etapas de fabricación</h2>
                <div className="flex flex-col gap-3">
                  {p.tareas.map((t, i) => {
                    const done = t.estado === 'COMPLETADA'
                    const active = t.estado === 'EN_PROCESO'
                    return (
                      <div key={t.tarea_id || t.id || i} className="flex items-center gap-3">
                        {done ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          : active ? <Loader2 className="w-5 h-5 text-[#C4A882] animate-spin shrink-0" />
                          : <Circle className="w-5 h-5 text-[rgba(92,64,51,0.25)] shrink-0" />}
                        <span className={`text-[14px] ${done ? 'text-[rgba(92,64,51,0.55)]' : active ? 'text-[#3d2215] font-medium' : 'text-[rgba(92,64,51,0.5)]'}`}>
                          {t.tipo_display}{active && ' · en proceso'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ítems */}
            {p.items?.length > 0 && (
              <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-6">
                <h2 className="text-sm font-medium text-[rgba(92,64,51,0.8)] mb-3">Tu pedido</h2>
                <div className="flex flex-col gap-2">
                  {p.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-[14px] border-b border-[rgba(92,64,51,0.05)] last:border-0 pb-2 last:pb-0">
                      <span className="text-[rgba(92,64,51,0.85)]">{it.cantidad}× {it.producto_nombre || it.producto}</span>
                      <span className="text-[12px] text-[rgba(92,64,51,0.5)]">
                        {it.ancho_cm ? `${it.ancho_cm}×${it.alto_cm} cm` : ''}{(it.color_nombre || it.color) ? ` · ${it.color_nombre || it.color}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-[12px] text-[rgba(92,64,51,0.45)] inline-flex items-center gap-1.5 w-full justify-center">
              <MapPin className="w-3.5 h-3.5" /> {EMPRESA.direccion} — {EMPRESA.ciudad}
            </p>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
