import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, Plus } from 'lucide-react'
import { crmApi, ETAPA_LABEL, type Etapa } from '@/api/crm'
import Spinner from '@/components/ui/Spinner'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'

const money = (n: string | number) => '$' + Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })
const TIPOS = ['NOTA', 'LLAMADA', 'WHATSAPP', 'EMAIL', 'REUNION']

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/70 rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[rgba(92,64,51,0.07)]">
        <h2 className="text-[14px] font-normal text-[rgba(92,64,51,0.9)]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function ClienteDetalle() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tipo, setTipo] = useState('NOTA')
  const [texto, setTexto] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['cliente-360', id],
    queryFn: () => crmApi.cliente360(id),
    enabled: !!id,
  })

  const agregar = useMutation({
    mutationFn: () => crmApi.interacciones.create({ cliente: id, tipo, descripcion: texto }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cliente-360', id] }); setTexto('') },
  })

  if (isLoading) return <div className="p-8"><Spinner /></div>
  const d = data?.data?.data
  if (!d) return <div className="p-8 text-sm text-[rgba(92,64,51,0.5)]">Cliente no encontrado.</div>

  const c = d.cliente
  const nombre = c.nombre_completo || c.nombre || 'Cliente'

  const KPIS = [
    { label: 'Cotizaciones', value: d.resumen.cotizaciones },
    { label: 'Pedidos', value: d.resumen.pedidos },
    { label: 'Oport. abiertas', value: d.resumen.oportunidades_abiertas },
    { label: 'Total en pedidos', value: money(d.resumen.valor_total_pedidos) },
  ]

  return (
    <div className="p-6 md:p-8">
      <button onClick={() => navigate('/admin/clientes')} className="flex items-center gap-1.5 text-xs text-[rgba(92,64,51,0.55)] hover:text-[rgba(92,64,51,0.9)] mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Clientes
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-normal text-[#5C4033]">{nombre}</h1>
          <div className="flex items-center gap-4 mt-1.5 text-[13px] text-[rgba(92,64,51,0.6)]">
            {c.cedula_ruc && <span>{c.cedula_ruc}</span>}
            {c.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.telefono}</span>}
            {c.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {c.email}</span>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <div key={k.label} className="bg-white/70 rounded-2xl border border-[rgba(92,64,51,0.08)] p-4">
            <p className="text-xl font-normal text-[#5C4033]">{k.value}</p>
            <p className="text-[11px] text-[rgba(92,64,51,0.55)] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          <Card title={`Oportunidades (${d.oportunidades.length})`}>
            {d.oportunidades.length === 0 ? <p className="text-[12px] text-[rgba(92,64,51,0.4)]">Sin oportunidades.</p> : (
              <div className="flex flex-col gap-2">
                {d.oportunidades.map((o: { id: string; titulo: string; etapa: Etapa; valor_estimado: string }) => (
                  <div key={o.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-[rgba(92,64,51,0.85)]">{o.titulo}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-[rgba(92,64,51,0.45)]">{ETAPA_LABEL[o.etapa]}</span>
                      <span className="text-[rgba(92,64,51,0.7)]">{money(o.valor_estimado)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Cotizaciones (${d.cotizaciones.length})`}>
            {d.cotizaciones.length === 0 ? <p className="text-[12px] text-[rgba(92,64,51,0.4)]">Sin cotizaciones.</p> : (
              <div className="flex flex-col gap-2">
                {d.cotizaciones.slice(0, 8).map((q: { id: string; numero?: string; estado?: string; total?: string }) => (
                  <div key={q.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-[rgba(92,64,51,0.85)]">{q.numero || q.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-2"><span className="text-[10px] uppercase text-[rgba(92,64,51,0.45)]">{q.estado}</span><span className="text-[rgba(92,64,51,0.7)]">{money(q.total || 0)}</span></span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Pedidos (${d.pedidos.length})`}>
            {d.pedidos.length === 0 ? <p className="text-[12px] text-[rgba(92,64,51,0.4)]">Sin pedidos.</p> : (
              <div className="flex flex-col gap-2">
                {d.pedidos.slice(0, 8).map((p: { id: string; numero?: string; estado?: string; total?: string }) => (
                  <div key={p.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-[rgba(92,64,51,0.85)]">{p.numero || p.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-2"><span className="text-[10px] uppercase text-[rgba(92,64,51,0.45)]">{p.estado}</span><span className="text-[rgba(92,64,51,0.7)]">{money(p.total || 0)}</span></span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="Interacciones">
            {/* Alta rápida */}
            <div className="flex flex-col gap-2 mb-4">
              <Select label="" value={tipo} onChange={(e) => setTipo(e.target.value)} options={TIPOS.map((t) => ({ value: t, label: t[0] + t.slice(1).toLowerCase() }))} />
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Registrar llamada, WhatsApp, nota…" rows={2}
                className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-3 py-2 text-sm outline-none focus:border-[rgba(92,64,51,0.4)]" />
              <div className="flex justify-end">
                <Btn size="sm" onClick={() => agregar.mutate()} disabled={!texto.trim() || agregar.isPending}><Plus className="w-3.5 h-3.5" /> Registrar</Btn>
              </div>
            </div>
            {/* Timeline */}
            {d.interacciones.length === 0 ? <p className="text-[12px] text-[rgba(92,64,51,0.4)]">Sin interacciones aún.</p> : (
              <div className="flex flex-col gap-3">
                {d.interacciones.map((it: { id: string; tipo_display: string; descripcion: string; usuario_nombre: string | null; fecha: string }) => (
                  <div key={it.id} className="border-l-2 border-[rgba(92,64,51,0.12)] pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(92,64,51,0.6)]">{it.tipo_display}</span>
                      <span className="text-[10px] text-[rgba(92,64,51,0.4)]">{new Date(it.fecha).toLocaleDateString('es-EC')}</span>
                    </div>
                    <p className="text-[13px] text-[rgba(92,64,51,0.8)] mt-0.5 whitespace-pre-line">{it.descripcion}</p>
                    {it.usuario_nombre && <p className="text-[10px] text-[rgba(92,64,51,0.4)] mt-0.5">— {it.usuario_nombre}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Tareas (${d.tareas.length})`}>
            {d.tareas.length === 0 ? <p className="text-[12px] text-[rgba(92,64,51,0.4)]">Sin tareas.</p> : (
              <div className="flex flex-col gap-2">
                {d.tareas.map((t: { id: string; titulo: string; completada: boolean; fecha_vencimiento: string | null }) => (
                  <div key={t.id} className="flex items-center justify-between text-[13px]">
                    <span className={t.completada ? 'line-through text-[rgba(92,64,51,0.4)]' : 'text-[rgba(92,64,51,0.85)]'}>{t.titulo}</span>
                    {t.fecha_vencimiento && <span className="text-[11px] text-[rgba(92,64,51,0.5)]">{t.fecha_vencimiento}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
