import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, Plus, CheckCircle2, ClipboardList } from 'lucide-react'
import { proveedoresApi, type Proveedor, type OrdenTrabajo } from '@/api/proveedores'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'

const TABS = ['Proveedores', 'Órdenes de trabajo'] as const
type Tab = typeof TABS[number]

const TIPOS = [
  { value: 'MATERIA_PRIMA', label: 'Materia prima' },
  { value: 'SERVICIO', label: 'Servicio' },
  { value: 'AMBOS', label: 'Ambos' },
]

const ESTADOS_ORDEN = [
  { value: 'BORRADOR', label: 'Borrador' }, { value: 'ENVIADA', label: 'Enviada' },
  { value: 'CONFIRMADA', label: 'Confirmada' }, { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'RECIBIDA', label: 'Recibida' }, { value: 'CANCELADA', label: 'Cancelada' },
]

const EMPTY_PROV: Partial<Proveedor> = { nombre: '', ruc: '', tipo: 'MATERIA_PRIMA', contacto_nombre: '', contacto_telefono: '', contacto_email: '' }
const EMPTY_ORDEN: Partial<OrdenTrabajo> = { proveedor: '', descripcion: '', monto_acordado: '', estado: 'BORRADOR' }

export default function ProveedoresPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('Proveedores')
  const [modalProv, setModalProv] = useState(false)
  const [modalOrden, setModalOrden] = useState(false)
  const [formProv, setFormProv] = useState<Partial<Proveedor>>(EMPTY_PROV)
  const [formOrden, setFormOrden] = useState<Partial<OrdenTrabajo>>(EMPTY_ORDEN)
  const [editando, setEditando] = useState<string | null>(null)

  const { data: provData, isLoading: loadingProv } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => proveedoresApi.list(),
  })

  const { data: ordenesData, isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => proveedoresApi.ordenes.list(),
    enabled: tab === 'Órdenes de trabajo',
  })

  const saveProv = useMutation({
    mutationFn: () => editando ? proveedoresApi.update(editando, formProv) : proveedoresApi.create(formProv),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); setModalProv(false); setEditando(null); setFormProv(EMPTY_PROV) },
  })

  const saveOrden = useMutation({
    mutationFn: () => proveedoresApi.ordenes.create(formOrden),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ordenes'] }); setModalOrden(false); setFormOrden(EMPTY_ORDEN) },
  })

  const proveedores: Proveedor[] = provData?.data ?? []
  const ordenes: OrdenTrabajo[] = ordenesData?.data ?? []

  const openEdit = (p: Proveedor) => { setFormProv(p); setEditando(p.id); setModalProv(true) }
  const setP = (k: string, v: string) => setFormProv((f) => ({ ...f, [k]: v }))
  const setO = (k: string, v: string) => setFormOrden((f) => ({ ...f, [k]: v }))

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Compras"
        title="Proveedores"
        subtitle={`${proveedores.length} registrados`}
        action={
          <div className="flex gap-2">
            {tab === 'Proveedores' && <Btn onClick={() => { setFormProv(EMPTY_PROV); setEditando(null); setModalProv(true) }}><Plus className="w-4 h-4" /> Nuevo proveedor</Btn>}
            {tab === 'Órdenes de trabajo' && <Btn onClick={() => setModalOrden(true)}><Plus className="w-4 h-4" /> Nueva orden</Btn>}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl">
        <StatCard label="Proveedores" value={proveedores.length} icon={Truck} color="#5C4033" delay={0} onClick={() => setTab('Proveedores')} />
        <StatCard label="Activos" value={proveedores.filter((p) => p.activo).length} icon={CheckCircle2} color="#16a34a" delay={0.06} />
        <StatCard label="Órdenes de trabajo" value={ordenes.length} icon={ClipboardList} color="#3b82f6" delay={0.12} onClick={() => setTab('Órdenes de trabajo')} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/50 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? 'bg-white shadow-sm text-[rgba(92,64,51,0.9)]' : 'text-[rgba(92,64,51,0.55)] hover:text-[rgba(92,64,51,0.8)]'}`}
          >{t}</button>
        ))}
      </div>

      {/* Proveedores */}
      {tab === 'Proveedores' && (
        loadingProv ? <Spinner /> : proveedores.length === 0 ? (
          <EmptyState icon={Truck} title="Sin proveedores" />
        ) : (
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(92,64,51,0.07)]">
                  {['Proveedor', 'RUC', 'Tipo', 'Contacto', 'Email', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(92,64,51,0.05)] hover:bg-[rgba(92,64,51,0.02)]">
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.9)]">{p.nombre}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{p.ruc}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.6)] text-xs">{p.tipo}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{p.contacto_nombre}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.5)] text-xs">{p.contacto_email}</td>
                    <td className="px-5 py-3 text-right"><Btn variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Órdenes */}
      {tab === 'Órdenes de trabajo' && (
        loadingOrdenes ? <Spinner /> : ordenes.length === 0 ? (
          <EmptyState icon={Truck} title="Sin órdenes de trabajo" action={<Btn onClick={() => setModalOrden(true)}><Plus className="w-4 h-4" /> Nueva orden</Btn>} />
        ) : (
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(92,64,51,0.07)]">
                  {['Número', 'Proveedor', 'Estado', 'Monto', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o.id} className="border-b border-[rgba(92,64,51,0.05)]">
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.9)]">{o.numero}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.7)]">{o.proveedor_nombre}</td>
                    <td className="px-5 py-3"><Badge value={o.estado} type="orden" /></td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.8)]">${o.monto_acordado}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.5)] text-xs">{new Date(o.creado_en).toLocaleDateString('es-EC')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal proveedor */}
      <Modal open={modalProv} onClose={() => setModalProv(false)} title={editando ? 'Editar proveedor' : 'Nuevo proveedor'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={formProv.nombre ?? ''} onChange={(e) => setP('nombre', e.target.value)} />
          <Input label="RUC / Cédula" value={formProv.ruc ?? ''} onChange={(e) => setP('ruc', e.target.value)} />
          <Select label="Tipo" value={formProv.tipo ?? 'MATERIA_PRIMA'} onChange={(e) => setP('tipo', e.target.value)} options={TIPOS} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contacto" value={formProv.contacto_nombre ?? ''} onChange={(e) => setP('contacto_nombre', e.target.value)} />
            <Input label="Teléfono" value={formProv.contacto_telefono ?? ''} onChange={(e) => setP('contacto_telefono', e.target.value)} />
          </div>
          <Input label="Email contacto" type="email" value={formProv.contacto_email ?? ''} onChange={(e) => setP('contacto_email', e.target.value)} />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModalProv(false)}>Cancelar</Btn>
            <Btn onClick={() => saveProv.mutate()} disabled={saveProv.isPending}>{saveProv.isPending ? 'Guardando…' : 'Guardar'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal orden */}
      <Modal open={modalOrden} onClose={() => setModalOrden(false)} title="Nueva orden de trabajo">
        <div className="flex flex-col gap-4">
          <Select label="Proveedor" value={formOrden.proveedor ?? ''} onChange={(e) => setO('proveedor', e.target.value)} options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))} placeholder="Seleccionar proveedor" />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">Descripción</label>
            <textarea rows={3} value={formOrden.descripcion ?? ''} onChange={(e) => setO('descripcion', e.target.value)} className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] resize-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto acordado ($)" type="number" value={formOrden.monto_acordado ?? ''} onChange={(e) => setO('monto_acordado', e.target.value)} />
            <Select label="Estado inicial" value={formOrden.estado ?? 'BORRADOR'} onChange={(e) => setO('estado', e.target.value)} options={ESTADOS_ORDEN} />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModalOrden(false)}>Cancelar</Btn>
            <Btn onClick={() => saveOrden.mutate()} disabled={saveOrden.isPending}>{saveOrden.isPending ? 'Creando…' : 'Crear orden'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
