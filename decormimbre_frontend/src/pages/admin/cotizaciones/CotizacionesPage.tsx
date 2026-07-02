import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Search } from 'lucide-react'
import { cotizacionesApi, type Cotizacion } from '@/api/cotizaciones'
import { clientesApi } from '@/api/clientes'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
]

const FORMAS_PAGO = [
  { value: '50_50', label: '50% anticipo / 50% entrega' },
  { value: '100_ANTICIPO', label: '100% anticipo' },
  { value: '100_ENTREGA', label: '100% a la entrega' },
]

export default function CotizacionesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [estadoFilter, setEstadoFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente: '', forma_pago: '50_50', observaciones: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['cotizaciones', estadoFilter],
    queryFn: () => cotizacionesApi.list(estadoFilter ? { estado: estadoFilter } : undefined),
  })

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: () => clientesApi.list(),
    enabled: modal,
  })

  const crear = useMutation({
    mutationFn: () => cotizacionesApi.create(form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      setModal(false)
      navigate(`/admin/cotizaciones/${res.data.id}`)
    },
  })

  const cotizaciones: Cotizacion[] = (data?.data ?? []).filter((c: Cotizacion) =>
    search === '' ||
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    c.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
  )

  const clientes = clientesData?.data ?? []

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Cotizaciones"
        subtitle={`${cotizaciones.length} encontradas`}
        action={<Btn onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Nueva cotización</Btn>}
      />

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
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] outline-none"
        >
          {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      {isLoading ? <Spinner /> : cotizaciones.length === 0 ? (
        <EmptyState icon={FileText} title="Sin cotizaciones" action={<Btn onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Crear cotización</Btn>} />
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(92,64,51,0.07)]">
                {['Número', 'Cliente', 'Estado', 'Total', 'Fecha', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c) => (
                <tr key={c.id} className="border-b border-[rgba(92,64,51,0.05)] hover:bg-[rgba(92,64,51,0.02)] transition-colors cursor-pointer" onClick={() => navigate(`/admin/cotizaciones/${c.id}`)}>
                  <td className="px-5 py-3 font-normal text-[rgba(92,64,51,0.9)]">{c.numero}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.7)]">{c.cliente_nombre}</td>
                  <td className="px-5 py-3"><Badge value={c.estado} type="cotizacion" /></td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.8)]">${c.total}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.5)] text-xs">{new Date(c.creado_en).toLocaleDateString('es-EC')}</td>
                  <td className="px-5 py-3 text-right">
                    <Btn variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/admin/cotizaciones/${c.id}`) }}>Ver</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva cotización */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva cotización">
        <div className="flex flex-col gap-4">
          <Select
            label="Cliente"
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            options={clientes.map((c: { id: string; nombre: string; apellido: string }) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))}
            placeholder="Selecciona un cliente"
          />
          <Select
            label="Forma de pago"
            value={form.forma_pago}
            onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
            options={FORMAS_PAGO}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">Observaciones</label>
            <textarea
              rows={3}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={() => crear.mutate()} disabled={!form.cliente || crear.isPending}>
              {crear.isPending ? 'Creando…' : 'Crear cotización'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
