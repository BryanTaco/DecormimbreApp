import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, UserCheck, CheckCircle, ChevronRight } from 'lucide-react'
import { pedidosApi, type TareaProduccion } from '@/api/pedidos'
import { usuariosApi } from '@/api/usuarios'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'
import PageHeader from '@/components/ui/PageHeader'

const TRANSICIONES: Record<string, { label: string; next: string }[]> = {
  PENDIENTE: [{ label: 'Confirmar pedido', next: 'CONFIRMADO' }],
  CONFIRMADO: [{ label: 'Iniciar producción', next: 'EN_PRODUCCION' }],
  EN_PRODUCCION: [],
  LISTO_ENTREGA: [{ label: 'Marcar entregado', next: 'ENTREGADO' }],
  ENTREGADO: [],
  CANCELADO: [],
}

export default function PedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [asignarModal, setAsignarModal] = useState<TareaProduccion | null>(null)
  const [artesanoId, setArtesanoId] = useState('')
  const [completarModal, setCompletarModal] = useState<TareaProduccion | null>(null)
  const [notas, setNotas] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => pedidosApi.detail(id!),
    enabled: !!id,
  })

  const { data: artesanosData } = useQuery({
    queryKey: ['artesanos'],
    queryFn: () => usuariosApi.artesanos(),
    enabled: !!asignarModal,
  })

  const cambiarEstado = useMutation({
    mutationFn: (s: string) => pedidosApi.cambiarEstado(id!, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedido', id] }),
  })

  const asignar = useMutation({
    mutationFn: () => pedidosApi.asignarArtesano(asignarModal!.id, artesanoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pedido', id] }); setAsignarModal(null) },
  })

  const completar = useMutation({
    mutationFn: () => pedidosApi.completarTarea(completarModal!.id, notas),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pedido', id] }); setCompletarModal(null); setNotas('') },
  })

  if (isLoading) return <div className="p-8"><Spinner /></div>
  const pedido = data?.data
  if (!pedido) return null

  const transiciones = TRANSICIONES[pedido.estado] ?? []
  const artesanos = (artesanosData?.data ?? []) as { id: string; nombre: string }[]

  const etapas: Record<string, string> = {
    ESTRUCTURA: 'Estructura', TEJIDO: 'Tejido', COJINES: 'Cojines',
    ACABADOS: 'Acabados', CONTROL_CALIDAD: 'Control de calidad',
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <PageHeader
        title={`Pedido ${pedido.numero}`}
        subtitle={pedido.cliente_nombre}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Btn variant="secondary" onClick={() => navigate('/admin/pedidos')}>
              <ArrowLeft className="w-4 h-4" /> Volver
            </Btn>
            <a href={pedidosApi.fichaUrl(id!)} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-[rgba(92,64,51,0.08)] text-[rgba(92,64,51,0.9)] hover:bg-[rgba(92,64,51,0.14)] transition-colors">
              <Download className="w-4 h-4" /> Ficha Admin
            </a>
          </div>
        }
      />

      {/* Estado + progreso */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Badge value={pedido.estado} type="pedido" />
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 rounded-full bg-[rgba(92,64,51,0.1)] overflow-hidden">
            <div className="h-full rounded-full bg-[rgba(92,64,51,0.6)] transition-all" style={{ width: `${pedido.porcentaje_completado ?? 0}%` }} />
          </div>
          <span className="text-xs text-[rgba(92,64,51,0.55)]">{pedido.porcentaje_completado ?? 0}% producción</span>
        </div>
        {transiciones.map((t) => (
          <Btn key={t.next} size="sm" variant="secondary" onClick={() => cambiarEstado.mutate(t.next)} disabled={cambiarEstado.isPending}>
            {t.label} <ChevronRight className="w-3 h-3" />
          </Btn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tareas de producción */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(92,64,51,0.07)]">
              <span className="text-sm font-normal text-[rgba(92,64,51,0.8)]">Etapas de producción</span>
            </div>
            {!pedido.tareas?.length ? (
              <p className="text-sm text-[rgba(92,64,51,0.4)] text-center py-8">Se crearán al iniciar la producción</p>
            ) : (
              <div className="divide-y divide-[rgba(92,64,51,0.05)]">
                {pedido.tareas.map((t: TareaProduccion) => (
                  <div key={t.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        t.estado === 'COMPLETADA' ? 'bg-green-400' :
                        t.estado === 'EN_PROCESO' ? 'bg-amber-400' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm text-[rgba(92,64,51,0.9)]">{etapas[t.tipo] ?? t.tipo}</p>
                        <p className="text-[11px] text-[rgba(92,64,51,0.5)]">
                          {t.artesano_nombre ?? 'Sin artesano asignado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge value={t.estado} type="tarea" />
                      {t.estado !== 'COMPLETADA' && (
                        <>
                          <Btn size="sm" variant="ghost" onClick={() => { setAsignarModal(t); setArtesanoId(t.artesano ?? '') }}>
                            <UserCheck className="w-3 h-3" /> Asignar
                          </Btn>
                          {t.estado === 'EN_PROCESO' && (
                            <Btn size="sm" variant="secondary" onClick={() => setCompletarModal(t)}>
                              <CheckCircle className="w-3 h-3" /> Completar
                            </Btn>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ítems del pedido */}
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(92,64,51,0.07)]">
              <span className="text-sm font-normal text-[rgba(92,64,51,0.8)]">Ítems ({pedido.items?.length ?? 0})</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(92,64,51,0.05)]">
                  {['Producto', 'Cant.', 'Dims.', 'Subtotal'].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.45)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedido.items?.map((item: { id: string; producto_nombre: string; cantidad: number; ancho_cm?: string; alto_cm?: string; subtotal: string }) => (
                  <tr key={item.id} className="border-b border-[rgba(92,64,51,0.04)]">
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.85)]">{item.producto_nombre}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{item.cantidad}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.5)] text-xs">
                      {item.ancho_cm ? `${item.ancho_cm}×${item.alto_cm} cm` : '—'}
                    </td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.8)]">${item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar resumen */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-5 flex flex-col gap-3">
            <h3 className="text-sm font-normal text-[rgba(92,64,51,0.7)]">Resumen</h3>
            {[
              { label: 'Subtotal', val: `$${pedido.subtotal}` },
              { label: 'IVA (15%)', val: `$${pedido.iva}` },
              { label: 'Total', val: `$${pedido.total}`, bold: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className={`text-sm ${row.bold ? 'text-[rgba(92,64,51,0.9)]' : 'text-[rgba(92,64,51,0.55)]'}`}>{row.label}</span>
                <span className={`text-sm ${row.bold ? 'text-[rgba(92,64,51,0.95)]' : 'text-[rgba(92,64,51,0.7)]'}`}>{row.val}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-5 flex flex-col gap-2">
            <h3 className="text-sm font-normal text-[rgba(92,64,51,0.7)] mb-1">Fichas técnicas</h3>
            {[{ rol: 'TEJIDO', label: 'Ficha Tejedor' }, { rol: 'ESTRUCTURA', label: 'Ficha Estructurista' }].map((f) => (
              <a key={f.rol} href={pedidosApi.fichaUrl(id!, f.rol)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-[rgba(92,64,51,0.7)] hover:text-[rgba(92,64,51,0.95)] transition-colors">
                <Download className="w-3 h-3" /> {f.label}
              </a>
            ))}
          </div>

          {pedido.fecha_promesa_entrega && (
            <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] p-5">
              <h3 className="text-sm font-normal text-[rgba(92,64,51,0.7)] mb-2">Fecha de entrega</h3>
              <p className="text-sm text-[rgba(92,64,51,0.9)]">{new Date(pedido.fecha_promesa_entrega).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal asignar artesano */}
      <Modal open={!!asignarModal} onClose={() => setAsignarModal(null)} title="Asignar artesano">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[rgba(92,64,51,0.6)]">
            Etapa: <strong className="text-[rgba(92,64,51,0.9)]">{etapas[asignarModal?.tipo ?? ''] ?? asignarModal?.tipo}</strong>
          </p>
          <Select
            label="Artesano"
            value={artesanoId}
            onChange={(e) => setArtesanoId(e.target.value)}
            options={artesanos.map((a) => ({ value: a.id, label: a.nombre }))}
            placeholder="Selecciona un artesano"
          />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setAsignarModal(null)}>Cancelar</Btn>
            <Btn onClick={() => asignar.mutate()} disabled={!artesanoId || asignar.isPending}>
              {asignar.isPending ? 'Asignando…' : 'Asignar'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Modal completar tarea */}
      <Modal open={!!completarModal} onClose={() => setCompletarModal(null)} title="Completar etapa">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[rgba(92,64,51,0.6)]">
            Etapa: <strong className="text-[rgba(92,64,51,0.9)]">{etapas[completarModal?.tipo ?? ''] ?? completarModal?.tipo}</strong>
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">Notas (opcional)</label>
            <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)}
              className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)] resize-none transition-colors"
              placeholder="Observaciones sobre la etapa completada…" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setCompletarModal(null)}>Cancelar</Btn>
            <Btn onClick={() => completar.mutate()} disabled={completar.isPending}>
              {completar.isPending ? 'Completando…' : 'Marcar como completada'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
