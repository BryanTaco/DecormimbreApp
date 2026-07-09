import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Plus, Trash2, ChevronRight } from 'lucide-react'
import { cotizacionesApi } from '@/api/cotizaciones'
import { clientesApi } from '@/api/clientes'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Btn from '@/components/ui/Btn'
import PageHeader from '@/components/ui/PageHeader'

const TRANSICIONES: Record<string, { label: string; next: string }[]> = {
  BORRADOR: [{ label: 'Enviar al cliente', next: 'ENVIADA' }],
  ENVIADA: [
    { label: 'Aprobar', next: 'APROBADA' },
    { label: 'Rechazar', next: 'RECHAZADA' },
  ],
  APROBADA: [],
  RECHAZADA: [{ label: 'Reactivar como Borrador', next: 'BORRADOR' }],
}

export default function CotizacionDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [addItem, setAddItem] = useState(false)
  const [itemForm, setItemForm] = useState({ producto: '', cantidad: '1', precio_unitario: '', ancho_cm: '', alto_cm: '', observaciones: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['cotizacion', id],
    queryFn: () => cotizacionesApi.detail(id!),
    enabled: !!id,
  })

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: () => clientesApi.list(),
  })

  const cambiarEstado = useMutation({
    mutationFn: (nuevo: string) => cotizacionesApi.cambiarEstado(id!, nuevo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cotizacion', id] }),
  })

  const agregarItem = useMutation({
    mutationFn: () => cotizacionesApi.addItem(id!, { ...itemForm, cantidad: Number(itemForm.cantidad) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cotizacion', id] }); setAddItem(false) },
  })

  const eliminarItem = useMutation({
    mutationFn: (itemId: string) => cotizacionesApi.deleteItem(id!, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cotizacion', id] }),
  })

  if (isLoading) return <div className="p-8"><Spinner /></div>

  const cot = data?.data
  if (!cot) return null

  const esBorrador = cot.estado === 'BORRADOR'
  const transiciones = TRANSICIONES[cot.estado] ?? []
  const clientes = clientesData?.data ?? []

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <PageHeader
        title={`Cotización ${cot.numero}`}
        subtitle={cot.cliente_nombre}
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={() => navigate('/admin/cotizaciones')}>
              <ArrowLeft className="w-4 h-4" /> Volver
            </Btn>
            <a
              href={cotizacionesApi.pdfUrl(id!)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-[rgba(92,64,51,0.08)] text-[rgba(92,64,51,0.9)] hover:bg-[rgba(92,64,51,0.14)] transition-colors"
            >
              <Download className="w-4 h-4" /> PDF
            </a>
          </div>
        }
      />

      {/* Estado + acciones */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Badge value={cot.estado} type="cotizacion" />
        {transiciones.map((t) => (
          <Btn key={t.next} size="sm" variant="secondary" onClick={() => cambiarEstado.mutate(t.next)} disabled={cambiarEstado.isPending}>
            {t.label} <ChevronRight className="w-3 h-3" />
          </Btn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ítems */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(92,64,51,0.07)]">
              <span className="text-sm font-normal text-[rgba(92,64,51,0.8)]">Ítems ({cot.items?.length ?? 0})</span>
              {esBorrador && (
                <Btn size="sm" onClick={() => setAddItem(true)}><Plus className="w-3 h-3" /> Agregar</Btn>
              )}
            </div>
            {cot.items?.length === 0 ? (
              <p className="text-sm text-[rgba(92,64,51,0.4)] text-center py-8">Sin ítems aún</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(92,64,51,0.05)]">
                    {['Producto', 'Cant.', 'P.Unit', 'Subtotal', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.45)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cot.items?.map((item: { id: string; producto_nombre: string; cantidad: number; precio_unitario: string; subtotal: string }) => (
                    <tr key={item.id} className="border-b border-[rgba(92,64,51,0.04)]">
                      <td className="px-5 py-3 text-[rgba(92,64,51,0.85)]">{item.producto_nombre}</td>
                      <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{item.cantidad}</td>
                      <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">${item.precio_unitario}</td>
                      <td className="px-5 py-3 text-[rgba(92,64,51,0.8)]">${item.subtotal}</td>
                      <td className="px-5 py-3 text-right">
                        {esBorrador && (
                          <button onClick={() => eliminarItem.mutate(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-5 flex flex-col gap-3">
            <h3 className="text-sm font-normal text-[rgba(92,64,51,0.7)] mb-1">Resumen</h3>
            {[
              { label: 'Subtotal', val: `$${cot.subtotal}` },
              { label: 'IVA (15%)', val: `$${cot.iva}` },
              { label: 'Total', val: `$${cot.total}`, bold: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className={`text-sm ${row.bold ? 'text-[rgba(92,64,51,0.9)] font-normal' : 'text-[rgba(92,64,51,0.55)]'}`}>{row.label}</span>
                <span className={`text-sm ${row.bold ? 'text-[rgba(92,64,51,0.95)]' : 'text-[rgba(92,64,51,0.7)]'}`}>{row.val}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-5 flex flex-col gap-2">
            <h3 className="text-sm font-normal text-[rgba(92,64,51,0.7)] mb-1">Detalles</h3>
            <p className="text-[12px] text-[rgba(92,64,51,0.55)]">Forma de pago</p>
            <p className="text-sm text-[rgba(92,64,51,0.85)]">{cot.forma_pago?.replace('_', ' ')}</p>
            {cot.observaciones && (
              <>
                <p className="text-[12px] text-[rgba(92,64,51,0.55)] mt-2">Observaciones</p>
                <p className="text-sm text-[rgba(92,64,51,0.8)]">{cot.observaciones}</p>
              </>
            )}
          </div>

          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-5 flex flex-col gap-2">
            <h3 className="text-sm font-normal text-[rgba(92,64,51,0.7)] mb-1">Cliente</h3>
            {(() => {
              const cl = clientes.find((c: { id: string }) => c.id === cot.cliente)
              return cl ? (
                <>
                  <p className="text-sm text-[rgba(92,64,51,0.85)]">{(cl as { nombre: string; apellido: string }).nombre} {(cl as { nombre: string; apellido: string }).apellido}</p>
                  <p className="text-[12px] text-[rgba(92,64,51,0.55)]">{(cl as { email: string }).email}</p>
                  <p className="text-[12px] text-[rgba(92,64,51,0.55)]">{(cl as { telefono: string }).telefono}</p>
                </>
              ) : <p className="text-sm text-[rgba(92,64,51,0.7)]">{cot.cliente_nombre}</p>
            })()}
          </div>
        </div>
      </div>

      {/* Modal agregar ítem */}
      <Modal open={addItem} onClose={() => setAddItem(false)} title="Agregar ítem">
        <div className="flex flex-col gap-4">
          <Input label="Nombre del producto" value={itemForm.producto} onChange={(e) => setItemForm({ ...itemForm, producto: e.target.value })} placeholder="Ej: Silla Mimbre Clásica" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cantidad" type="number" min="1" value={itemForm.cantidad} onChange={(e) => setItemForm({ ...itemForm, cantidad: e.target.value })} />
            <Input label="Precio unitario ($)" type="number" value={itemForm.precio_unitario} onChange={(e) => setItemForm({ ...itemForm, precio_unitario: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ancho (cm)" type="number" value={itemForm.ancho_cm} onChange={(e) => setItemForm({ ...itemForm, ancho_cm: e.target.value })} />
            <Input label="Alto (cm)" type="number" value={itemForm.alto_cm} onChange={(e) => setItemForm({ ...itemForm, alto_cm: e.target.value })} />
          </div>
          <Input label="Observaciones" value={itemForm.observaciones} onChange={(e) => setItemForm({ ...itemForm, observaciones: e.target.value })} />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setAddItem(false)}>Cancelar</Btn>
            <Btn onClick={() => agregarItem.mutate()} disabled={agregarItem.isPending}>
              {agregarItem.isPending ? 'Agregando…' : 'Agregar ítem'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
