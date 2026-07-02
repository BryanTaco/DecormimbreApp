import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Search } from 'lucide-react'
import { pedidosApi, type Pedido } from '@/api/pedidos'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Btn from '@/components/ui/Btn'

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'EN_PRODUCCION', label: 'En producción' },
  { value: 'LISTO_ENTREGA', label: 'Listo para entrega' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

export default function PedidosPage() {
  const navigate = useNavigate()
  const [estadoFilter, setEstadoFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pedidos', estadoFilter],
    queryFn: () => pedidosApi.list(estadoFilter ? { estado: estadoFilter } : undefined),
  })

  const pedidos: Pedido[] = (data?.data ?? []).filter((p: Pedido) =>
    search === '' ||
    p.numero.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Pedidos" subtitle={`${pedidos.length} encontrados`} />

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(92,64,51,0.4)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número o cliente…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[rgba(92,64,51,0.15)] bg-white text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setEstadoFilter(e.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-normal transition-colors ${
                estadoFilter === e.value
                  ? 'bg-[rgba(92,64,51,0.9)] text-white'
                  : 'bg-white border border-[rgba(92,64,51,0.15)] text-[rgba(92,64,51,0.7)] hover:bg-[rgba(92,64,51,0.05)]'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : pedidos.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Sin pedidos" description="Los pedidos se crean automáticamente al aprobar una cotización." />
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(92,64,51,0.07)]">
                {['Número', 'Cliente', 'Estado', 'Progreso', 'Total', 'Entrega', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-[rgba(92,64,51,0.05)] hover:bg-[rgba(92,64,51,0.02)] transition-colors cursor-pointer" onClick={() => navigate(`/admin/pedidos/${p.id}`)}>
                  <td className="px-5 py-3 font-normal text-[rgba(92,64,51,0.9)]">{p.numero}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.7)]">{p.cliente_nombre}</td>
                  <td className="px-5 py-3"><Badge value={p.estado} type="pedido" /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[rgba(92,64,51,0.1)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[rgba(92,64,51,0.6)] transition-all"
                          style={{ width: `${p.porcentaje_completado ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[rgba(92,64,51,0.5)]">{p.porcentaje_completado ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.8)]">${p.total}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.5)] text-xs">
                    {p.fecha_promesa_entrega ? new Date(p.fecha_promesa_entrega).toLocaleDateString('es-EC') : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Btn variant="ghost" size="sm">Ver</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
