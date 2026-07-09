import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShoppingBag, Search, Hammer, Truck, DollarSign } from 'lucide-react'
import { pedidosApi, type Pedido } from '@/api/pedidos'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'EN_PRODUCCION', label: 'En producción' },
  { value: 'LISTO_ENTREGA', label: 'Listo para entrega' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]
const money = (n: string | number) => '$' + Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })

export default function PedidosPage() {
  const navigate = useNavigate()
  const [estadoFilter, setEstadoFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['pedidos'], queryFn: () => pedidosApi.list() })

  const todos: Pedido[] = data?.data ?? []
  const pedidos = todos.filter((p) =>
    (!estadoFilter || p.estado === estadoFilter) &&
    (search === '' || p.numero?.toLowerCase().includes(search.toLowerCase()) || p.cliente_nombre?.toLowerCase().includes(search.toLowerCase()))
  )
  const by = (e: string) => todos.filter((p) => p.estado === e).length
  const activos = todos.filter((p) => !['ENTREGADO', 'CANCELADO'].includes(p.estado)).length
  const valorActivo = todos.filter((p) => !['ENTREGADO', 'CANCELADO'].includes(p.estado)).reduce((s, p) => s + Number(p.total || 0), 0)

  return (
    <div className="p-6 md:p-8">
      <PageHeader eyebrow="Producción" title="Pedidos" subtitle={`${pedidos.length} de ${todos.length}`} />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pedidos activos" value={activos} icon={ShoppingBag} color="#5C4033" delay={0} onClick={() => setEstadoFilter('')} />
        <StatCard label="En producción" value={by('EN_PRODUCCION')} icon={Hammer} color="#f59e0b" delay={0.06} onClick={() => setEstadoFilter('EN_PRODUCCION')} />
        <StatCard label="Listos para entrega" value={by('LISTO_ENTREGA')} icon={Truck} color="#a855f7" delay={0.12} onClick={() => setEstadoFilter('LISTO_ENTREGA')} />
        <StatCard label="Valor en curso" value={money(valorActivo)} icon={DollarSign} color="#C4A882" delay={0.18} />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(92,64,51,0.4)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número o cliente…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[rgba(92,64,51,0.15)] bg-white text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ESTADOS.map((e) => (
            <button key={e.value} onClick={() => setEstadoFilter(e.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-normal transition-colors ${estadoFilter === e.value ? 'bg-[#5C4033] text-white' : 'bg-white border border-[rgba(92,64,51,0.15)] text-[rgba(92,64,51,0.7)] hover:bg-[rgba(92,64,51,0.05)]'}`}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : pedidos.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Sin pedidos" description="Los pedidos se crean automáticamente al aprobar una cotización." />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(92,64,51,0.07)] bg-[rgba(92,64,51,0.015)]">
                {['Número', 'Cliente', 'Estado', 'Progreso', 'Total', 'Entrega', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-[rgba(92,64,51,0.05)] last:border-0 hover:bg-[rgba(196,168,130,0.06)] transition-colors cursor-pointer group" onClick={() => navigate(`/admin/pedidos/${p.id}`)}>
                  <td className="px-5 py-3.5 font-medium text-[rgba(92,64,51,0.9)]">{p.numero}</td>
                  <td className="px-5 py-3.5 text-[rgba(92,64,51,0.7)]">{p.cliente_nombre || '—'}</td>
                  <td className="px-5 py-3.5"><Badge value={p.estado} type="pedido" /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[rgba(92,64,51,0.1)] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#C4A882] to-[#5C4033] transition-all" style={{ width: `${p.porcentaje_completado ?? 0}%` }} />
                      </div>
                      <span className="text-[11px] text-[rgba(92,64,51,0.5)]">{p.porcentaje_completado ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[rgba(92,64,51,0.85)] font-medium">{money(p.total)}</td>
                  <td className="px-5 py-3.5 text-[rgba(92,64,51,0.5)] text-xs">{p.fecha_promesa_entrega ? new Date(p.fecha_promesa_entrega).toLocaleDateString('es-EC') : '—'}</td>
                  <td className="px-5 py-3.5 text-right"><span className="text-xs text-[rgba(92,64,51,0.4)] group-hover:text-[#5C4033] transition-colors">Ver →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
