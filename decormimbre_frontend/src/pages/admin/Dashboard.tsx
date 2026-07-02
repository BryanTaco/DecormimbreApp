import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, ShoppingBag, Package, Users, TrendingUp, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { cotizacionesApi, type Cotizacion } from '@/api/cotizaciones'
import { pedidosApi, type Pedido } from '@/api/pedidos'
import { inventarioApi } from '@/api/inventario'
import { clientesApi } from '@/api/clientes'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: cotData } = useQuery({
    queryKey: ['dashboard-cotizaciones'],
    queryFn: () => cotizacionesApi.list({ estado: 'BORRADOR,ENVIADA' }),
  })

  const { data: pedData } = useQuery({
    queryKey: ['dashboard-pedidos'],
    queryFn: () => pedidosApi.list({ estado: 'EN_PRODUCCION,CONFIRMADO' }),
  })

  const { data: alertasData } = useQuery({
    queryKey: ['dashboard-alertas'],
    queryFn: () => inventarioApi.alertas.list(),
  })

  const { data: clientesData } = useQuery({
    queryKey: ['dashboard-clientes'],
    queryFn: () => clientesApi.list(),
  })

  const cotizaciones: Cotizacion[] = cotData?.data ?? []
  const pedidos: Pedido[] = pedData?.data ?? []
  const alertas = alertasData?.data ?? []
  const clientes = clientesData?.data ?? []

  // Últimas 5 cotizaciones (sorted by created_at desc from API)
  const { data: ultimasCotData, isLoading: loadingCot } = useQuery({
    queryKey: ['dashboard-ultimas-cot'],
    queryFn: () => cotizacionesApi.list(),
  })
  const { data: ultimasPedData, isLoading: loadingPed } = useQuery({
    queryKey: ['dashboard-ultimas-ped'],
    queryFn: () => pedidosApi.list(),
  })

  const ultimasCot: Cotizacion[] = (ultimasCotData?.data ?? []).slice(0, 5)
  const ultimasPed: Pedido[] = (ultimasPedData?.data ?? []).slice(0, 5)

  // Este mes
  const thisMonth = new Date()
  const clientesEsteMes = clientes.filter((c: { creado_en?: string }) => {
    if (!c.creado_en) return false
    const d = new Date(c.creado_en)
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear()
  })

  const STATS = [
    { label: 'Cotizaciones activas', value: cotizaciones.length, icon: FileText, color: 'bg-amber-50 text-amber-700' },
    { label: 'Pedidos en producción', value: pedidos.length, icon: ShoppingBag, color: 'bg-green-50 text-green-700' },
    { label: 'Materiales en stock crítico', value: alertas.length, icon: Package, color: alertas.length > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700' },
    { label: 'Clientes este mes', value: clientesEsteMes.length, icon: Users, color: 'bg-blue-50 text-blue-700' },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-[#5C4033]">Dashboard</h1>
        <p className="text-sm text-[rgba(92,64,51,0.55)] mt-1">Resumen general de Decormimbre</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] p-5 border border-[rgba(92,64,51,0.08)]"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-normal text-[#5C4033]">{stat.value}</p>
            <p className="text-[12px] text-[rgba(92,64,51,0.55)] mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas cotizaciones */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(92,64,51,0.07)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[rgba(92,64,51,0.6)]" />
              <h2 className="text-[15px] font-normal text-[rgba(92,64,51,0.9)]">Últimas cotizaciones</h2>
            </div>
            <button onClick={() => navigate('/admin/cotizaciones')} className="text-xs text-[rgba(92,64,51,0.5)] hover:text-[rgba(92,64,51,0.9)] transition-colors">Ver todas →</button>
          </div>
          {loadingCot ? (
            <div className="p-6"><Spinner /></div>
          ) : ultimasCot.length === 0 ? (
            <p className="text-sm text-[rgba(92,64,51,0.4)] text-center py-8">Sin cotizaciones aún</p>
          ) : (
            <div className="divide-y divide-[rgba(92,64,51,0.05)]">
              {ultimasCot.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(92,64,51,0.02)] cursor-pointer transition-colors" onClick={() => navigate(`/admin/cotizaciones/${c.id}`)}>
                  <div>
                    <p className="text-sm text-[rgba(92,64,51,0.9)]">{c.numero}</p>
                    <p className="text-[11px] text-[rgba(92,64,51,0.5)]">{c.cliente_nombre}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge value={c.estado} type="cotizacion" />
                    <span className="text-sm text-[rgba(92,64,51,0.7)]">${c.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pedidos recientes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(92,64,51,0.07)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[rgba(92,64,51,0.6)]" />
              <h2 className="text-[15px] font-normal text-[rgba(92,64,51,0.9)]">Pedidos recientes</h2>
            </div>
            <button onClick={() => navigate('/admin/pedidos')} className="text-xs text-[rgba(92,64,51,0.5)] hover:text-[rgba(92,64,51,0.9)] transition-colors">Ver todos →</button>
          </div>
          {loadingPed ? (
            <div className="p-6"><Spinner /></div>
          ) : ultimasPed.length === 0 ? (
            <p className="text-sm text-[rgba(92,64,51,0.4)] text-center py-8">Sin pedidos aún</p>
          ) : (
            <div className="divide-y divide-[rgba(92,64,51,0.05)]">
              {ultimasPed.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(92,64,51,0.02)] cursor-pointer transition-colors" onClick={() => navigate(`/admin/pedidos/${p.id}`)}>
                  <div>
                    <p className="text-sm text-[rgba(92,64,51,0.9)]">{p.numero}</p>
                    <p className="text-[11px] text-[rgba(92,64,51,0.5)]">{p.cliente_nombre}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge value={p.estado} type="pedido" />
                    <div className="w-14 h-1.5 rounded-full bg-[rgba(92,64,51,0.1)] overflow-hidden">
                      <div className="h-full rounded-full bg-[rgba(92,64,51,0.5)]" style={{ width: `${p.porcentaje_completado ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
