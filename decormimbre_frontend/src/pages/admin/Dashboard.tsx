import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, ShoppingBag, Package, Users, TrendingUp, TrendingDown, Clock, Plus, Target, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { cotizacionesApi, type Cotizacion } from '@/api/cotizaciones'
import { pedidosApi, type Pedido } from '@/api/pedidos'
import { inventarioApi } from '@/api/inventario'
import { clientesApi } from '@/api/clientes'
import { crmApi, ETAPA_LABEL, type Etapa } from '@/api/crm'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

const money = (n: string | number) => '$' + Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })
const itemDate = (x: Record<string, unknown>): Date | null => {
  const v = (x.fecha_creacion || x.created_at || x.fecha_solicitud || x.fecha || x.creado_en) as string | undefined
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

// Serie diaria (conteo por día) de los últimos N días — datos reales
function dailySeries(items: Record<string, unknown>[], days: number) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const buckets = new Array(days).fill(0)
  const labels: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(today.getDate() - (days - 1 - i))
    labels.push(d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }))
  }
  for (const it of items) {
    const d = itemDate(it); if (!d) continue
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
    if (diff >= 0 && diff < days) buckets[days - 1 - diff] += 1
  }
  return { data: buckets, labels }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [rango, setRango] = useState(14)

  const { data: cotData } = useQuery({ queryKey: ['dashboard-cotizaciones'], queryFn: () => cotizacionesApi.list({ estado: 'BORRADOR,ENVIADA' }) })
  const { data: pedData } = useQuery({ queryKey: ['dashboard-pedidos'], queryFn: () => pedidosApi.list({ estado: 'EN_PRODUCCION,CONFIRMADO' }) })
  const { data: alertasData } = useQuery({ queryKey: ['dashboard-alertas'], queryFn: () => inventarioApi.alertas.list() })
  const { data: clientesData } = useQuery({ queryKey: ['dashboard-clientes'], queryFn: () => clientesApi.list() })
  const { data: ultimasCotData, isLoading: loadingCot } = useQuery({ queryKey: ['dashboard-ultimas-cot'], queryFn: () => cotizacionesApi.list() })
  const { data: ultimasPedData, isLoading: loadingPed } = useQuery({ queryKey: ['dashboard-ultimas-ped'], queryFn: () => pedidosApi.list() })
  const { data: pipeData } = useQuery({ queryKey: ['dashboard-pipeline'], queryFn: () => crmApi.pipelineResumen() })

  const cotizaciones: Cotizacion[] = cotData?.data ?? []
  const pedidos: Pedido[] = pedData?.data ?? []
  const alertas = alertasData?.data ?? []
  const clientes = clientesData?.data ?? []
  const allCot = (ultimasCotData?.data ?? []) as Record<string, unknown>[]
  const allPed = (ultimasPedData?.data ?? []) as Record<string, unknown>[]
  const ultimasCot: Cotizacion[] = (ultimasCotData?.data ?? []).slice(0, 5)
  const ultimasPed: Pedido[] = (ultimasPedData?.data ?? []).slice(0, 5)
  const porEtapa: Record<string, { total: number; valor: string }> = pipeData?.data?.por_etapa ?? {}

  const thisMonth = new Date()
  const clientesEsteMes = clientes.filter((c: { fecha_registro?: string; creado_en?: string }) => {
    const d = itemDate(c as Record<string, unknown>)
    return d && d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear()
  })

  const serieCot = useMemo(() => dailySeries(allCot, rango), [allCot, rango])
  const seriePed = useMemo(() => dailySeries(allPed, rango), [allPed, rango])

  const trend = (s: number[]) => {
    if (s.length < 4) return 0
    const h = Math.floor(s.length / 2)
    const a = s.slice(0, h).reduce((x, y) => x + y, 0)
    const b = s.slice(h).reduce((x, y) => x + y, 0)
    if (a === 0) return b > 0 ? 100 : 0
    return Math.round(((b - a) / a) * 100)
  }

  const STATS = [
    { label: 'Cotizaciones activas', value: cotizaciones.length, icon: FileText, from: '#f59e0b', spark: serieCot.data, trend: trend(serieCot.data), to: '/admin/cotizaciones' },
    { label: 'Pedidos en producción', value: pedidos.length, icon: ShoppingBag, from: '#16a34a', spark: seriePed.data, trend: trend(seriePed.data), to: '/admin/pedidos' },
    { label: 'Stock crítico', value: alertas.length, icon: Package, from: alertas.length > 0 ? '#ef4444' : '#16a34a', spark: [], trend: 0, to: '/admin/inventario' },
    { label: 'Clientes este mes', value: clientesEsteMes.length, icon: Users, from: '#3b82f6', spark: [], trend: 0, to: '/admin/clientes' },
  ]

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const fechaHoy = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.45)]">{saludo}</p>
          <h1 className="text-[26px] font-normal text-[#3d2215] mt-0.5">Dashboard</h1>
          <p className="text-sm text-[rgba(92,64,51,0.5)] mt-0.5 capitalize">{fechaHoy}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/cotizaciones')} className="inline-flex items-center gap-1.5 bg-[#5C4033] text-white text-[13px] font-medium px-4 py-2.5 rounded-full hover:bg-[#4a3229] transition-colors">
            <Plus className="w-4 h-4" /> Nueva cotización
          </button>
          <button onClick={() => navigate('/admin/clientes')} className="inline-flex items-center gap-1.5 bg-white text-[#5C4033] border border-[rgba(92,64,51,0.15)] text-[13px] font-medium px-4 py-2.5 rounded-full hover:bg-[rgba(92,64,51,0.04)] transition-colors">
            <Users className="w-4 h-4" /> Nuevo cliente
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {STATS.map((s, i) => (
          <motion.button
            key={i}
            onClick={() => navigate(s.to)}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            className="text-left bg-white rounded-[1.4rem] p-5 border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] hover:shadow-[0_14px_30px_rgba(92,64,51,0.13)] transition-shadow relative overflow-hidden group"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: `${s.from}10` }} />
            <div className="flex items-start justify-between relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${s.from}26, ${s.from}0f)` }}>
                <s.icon className="w-[18px] h-[18px]" style={{ color: s.from }} />
              </div>
              {s.spark.length > 0 && s.trend !== 0 && (
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${s.trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                  {s.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(s.trend)}%
                </span>
              )}
            </div>
            <p className="text-[30px] leading-none font-normal text-[#3d2215] mt-4">{s.value}</p>
            <div className="flex items-end justify-between mt-1.5">
              <p className="text-[12px] text-[rgba(92,64,51,0.55)]">{s.label}</p>
              {s.spark.length > 0 && <Sparkline data={s.spark} color={s.from} />}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Área */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[rgba(92,64,51,0.55)]" />
              <h2 className="text-[15px] text-[rgba(92,64,51,0.9)]">Actividad</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-[11px] text-[rgba(92,64,51,0.55)]">
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C4A882' }} /> Cotizaciones</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#5C4033' }} /> Pedidos</span>
              </div>
              <div className="flex bg-[#f5f0eb] rounded-full p-0.5">
                {[7, 14, 30].map((d) => (
                  <button key={d} onClick={() => setRango(d)} className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${rango === d ? 'bg-white text-[#5C4033] shadow-sm' : 'text-[rgba(92,64,51,0.5)]'}`}>{d}d</button>
                ))}
              </div>
            </div>
          </div>
          <AreaChart seriesA={serieCot.data} seriesB={seriePed.data} labels={serieCot.labels} />
        </motion.div>

        {/* Donut embudo */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[rgba(92,64,51,0.55)]" />
              <h2 className="text-[15px] text-[rgba(92,64,51,0.9)]">Embudo</h2>
            </div>
            <button onClick={() => navigate('/admin/pipeline')} className="text-[rgba(92,64,51,0.4)] hover:text-[#5C4033]"><ArrowUpRight className="w-4 h-4" /></button>
          </div>
          <PipelineDonut porEtapa={porEtapa} />
        </motion.div>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListCard title="Últimas cotizaciones" icon={FileText} onVer={() => navigate('/admin/cotizaciones')} loading={loadingCot} empty={ultimasCot.length === 0} emptyText="Sin cotizaciones aún">
          {ultimasCot.map((c) => (
            <Row key={c.id} onClick={() => navigate(`/admin/cotizaciones/${c.id}`)} main={c.numero} sub={c.cliente_nombre}
              right={<><Badge value={c.estado} type="cotizacion" /><span className="text-sm text-[rgba(92,64,51,0.7)]">{money(c.total)}</span></>} />
          ))}
        </ListCard>

        <ListCard title="Pedidos recientes" icon={Clock} onVer={() => navigate('/admin/pedidos')} loading={loadingPed} empty={ultimasPed.length === 0} emptyText="Sin pedidos aún">
          {ultimasPed.map((p) => (
            <Row key={p.id} onClick={() => navigate(`/admin/pedidos/${p.id}`)} main={p.numero} sub={p.cliente_nombre}
              right={<><Badge value={p.estado} type="pedido" /><div className="w-14 h-1.5 rounded-full bg-[rgba(92,64,51,0.1)] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#C4A882] to-[#5C4033]" style={{ width: `${p.porcentaje_completado ?? 0}%` }} /></div></>} />
          ))}
        </ListCard>
      </div>
    </div>
  )
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64, h = 22, max = Math.max(...data, 1)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 3) - 1}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  )
}

// ── Área con hover ─────────────────────────────────────────────────────────
function AreaChart({ seriesA, seriesB, labels }: { seriesA: number[]; seriesB: number[]; labels: string[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640, H = 200, pad = 8
  const n = seriesA.length
  const max = Math.max(...seriesA, ...seriesB, 1)
  const x = (i: number) => pad + (i / (n - 1)) * (W - pad * 2)
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2)
  const line = (s: number[]) => s.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const area = (s: number[]) => `${pad},${H - pad} ${line(s)} ${W - pad},${H - pad}`
  const vacio = seriesA.every((v) => v === 0) && seriesB.every((v) => v === 0)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGElement).getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          setHover(Math.max(0, Math.min(n - 1, Math.round((px - pad) / ((W - pad * 2) / (n - 1))))))
        }}>
        <defs>
          <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C4A882" stopOpacity="0.35" /><stop offset="100%" stopColor="#C4A882" stopOpacity="0" /></linearGradient>
          <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5C4033" stopOpacity="0.22" /><stop offset="100%" stopColor="#5C4033" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="rgba(92,64,51,0.06)" strokeWidth={1} />)}
        {!vacio && <>
          <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} points={area(seriesA)} fill="url(#gradA)" />
          <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} points={area(seriesB)} fill="url(#gradB)" />
          <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} points={line(seriesA)} fill="none" stroke="#C4A882" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.1 }} points={line(seriesB)} fill="none" stroke="#5C4033" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </>}
        {hover !== null && !vacio && <>
          <line x1={x(hover)} x2={x(hover)} y1={pad} y2={H - pad} stroke="rgba(92,64,51,0.2)" strokeDasharray="3 3" />
          <circle cx={x(hover)} cy={y(seriesA[hover])} r={4} fill="#C4A882" stroke="#fff" strokeWidth={2} />
          <circle cx={x(hover)} cy={y(seriesB[hover])} r={4} fill="#5C4033" stroke="#fff" strokeWidth={2} />
        </>}
      </svg>
      {vacio && <div className="absolute inset-0 flex items-center justify-center"><span className="text-[13px] text-[rgba(92,64,51,0.35)]">Aún no hay actividad en este período</span></div>}
      {hover !== null && !vacio && (
        <div className="absolute top-0 bg-[#3d2215] text-white text-[11px] rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg" style={{ left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <div className="opacity-60">{labels[hover]}</div>
          <div>Cotiz: {seriesA[hover]} · Ped: {seriesB[hover]}</div>
        </div>
      )}
    </div>
  )
}

// ── Donut del embudo ───────────────────────────────────────────────────────
const ETAPA_COLOR: Record<string, string> = { NUEVO: '#9ca3af', CONTACTADO: '#3b82f6', COTIZANDO: '#a855f7', NEGOCIACION: '#f59e0b', GANADO: '#16a34a', PERDIDO: '#ef4444' }
function PipelineDonut({ porEtapa }: { porEtapa: Record<string, { total: number; valor: string }> }) {
  const etapas = (Object.keys(ETAPA_COLOR) as Etapa[]).map((e) => ({ etapa: e, total: porEtapa[e]?.total ?? 0 }))
  const total = etapas.reduce((s, e) => s + e.total, 0)
  const R = 52, C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-2">
      <div className="relative">
        <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90">
          <circle cx={65} cy={65} r={R} fill="none" stroke="rgba(92,64,51,0.08)" strokeWidth={14} />
          {total > 0 && etapas.filter((e) => e.total > 0).map((e) => {
            const frac = e.total / total, len = frac * C
            const el = <circle key={e.etapa} cx={65} cy={65} r={R} fill="none" stroke={ETAPA_COLOR[e.etapa]} strokeWidth={14} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />
            offset += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-normal text-[#3d2215] rotate-0">{total}</span>
          <span className="text-[10px] text-[rgba(92,64,51,0.5)]">oportunidades</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full px-1">
        {etapas.map((e) => (
          <div key={e.etapa} className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-[rgba(92,64,51,0.6)]"><span className="w-2 h-2 rounded-full" style={{ background: ETAPA_COLOR[e.etapa] }} />{ETAPA_LABEL[e.etapa]}</span>
            <span className="text-[rgba(92,64,51,0.85)] font-medium">{e.total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card de lista + fila ───────────────────────────────────────────────────
function ListCard({ title, icon: Icon, onVer, loading, empty, emptyText, children }: { title: string; icon: React.ComponentType<{ className?: string }>; onVer: () => void; loading: boolean; empty: boolean; emptyText: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(92,64,51,0.07)]">
        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-[rgba(92,64,51,0.55)]" /><h2 className="text-[15px] text-[rgba(92,64,51,0.9)]">{title}</h2></div>
        <button onClick={onVer} className="text-xs text-[rgba(92,64,51,0.5)] hover:text-[rgba(92,64,51,0.9)] transition-colors">Ver todo →</button>
      </div>
      {loading ? <div className="p-6"><Spinner /></div> : empty ? <p className="text-sm text-[rgba(92,64,51,0.4)] text-center py-10">{emptyText}</p> : <div className="divide-y divide-[rgba(92,64,51,0.05)]">{children}</div>}
    </motion.div>
  )
}

function Row({ onClick, main, sub, right }: { onClick: () => void; main: string; sub?: string; right: React.ReactNode }) {
  return (
    <div onClick={onClick} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(92,64,51,0.02)] cursor-pointer transition-colors">
      <div><p className="text-sm text-[rgba(92,64,51,0.9)]">{main}</p>{sub && <p className="text-[11px] text-[rgba(92,64,51,0.5)]">{sub}</p>}</div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  )
}
