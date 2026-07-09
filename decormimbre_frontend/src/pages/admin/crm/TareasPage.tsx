import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, Trash2 } from 'lucide-react'
import { crmApi, type Tarea } from '@/api/crm'
import { clientesApi } from '@/api/clientes'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'
import Spinner from '@/components/ui/Spinner'

const PRIO_COLOR: Record<string, string> = { ALTA: '#ef4444', MEDIA: '#f59e0b', BAJA: '#6b7280' }
const INITIAL = { titulo: '', descripcion: '', cliente: '', prioridad: 'MEDIA', fecha_vencimiento: '' }

export default function TareasPage() {
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState<'pendientes' | 'completadas' | 'todas'>('pendientes')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL)

  const { data, isLoading } = useQuery({
    queryKey: ['crm-tareas', filtro],
    queryFn: () => crmApi.tareas.list(filtro === 'todas' ? {} : { estado: filtro }),
  })
  const { data: cliData } = useQuery({ queryKey: ['crm-clientes'], queryFn: () => clientesApi.list() })
  const clientes = cliData?.data ?? []

  const tareas: Tarea[] = data?.data ?? []

  const crear = useMutation({
    mutationFn: () => crmApi.tareas.create({
      titulo: form.titulo, descripcion: form.descripcion, cliente: form.cliente || null,
      prioridad: form.prioridad as Tarea['prioridad'], fecha_vencimiento: form.fecha_vencimiento || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-tareas'] }); setOpen(false); setForm(INITIAL) },
  })
  const toggle = useMutation({
    mutationFn: (t: Tarea) => crmApi.tareas.update(t.id, { completada: !t.completada }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tareas'] }),
  })
  const borrar = useMutation({
    mutationFn: (id: string) => crmApi.tareas.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-tareas'] }),
  })

  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-normal text-[#5C4033]">Tareas y recordatorios</h1>
          <p className="text-sm text-[rgba(92,64,51,0.55)] mt-1">Seguimientos y pendientes del equipo</p>
        </div>
        <Btn onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nueva tarea</Btn>
      </div>

      <div className="flex gap-2 mb-5">
        {(['pendientes', 'completadas', 'todas'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors ${filtro === f ? 'bg-[rgba(92,64,51,0.9)] text-white border-transparent' : 'bg-white text-[rgba(92,64,51,0.7)] border-[rgba(92,64,51,0.15)]'}`}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : tareas.length === 0 ? (
        <p className="text-sm text-[rgba(92,64,51,0.4)] text-center py-10">Sin tareas.</p>
      ) : (
        <div className="flex flex-col gap-2 max-w-3xl">
          {tareas.map((t) => {
            const vencida = !t.completada && t.fecha_vencimiento && t.fecha_vencimiento < hoy
            return (
              <div key={t.id} className="bg-white/80 rounded-2xl border border-[rgba(92,64,51,0.08)] p-4 flex items-start gap-3">
                <button onClick={() => toggle.mutate(t)}
                  className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${t.completada ? 'bg-green-500 border-green-500' : 'border-[rgba(92,64,51,0.3)]'}`}>
                  {t.completada && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] ${t.completada ? 'line-through text-[rgba(92,64,51,0.4)]' : 'text-[rgba(92,64,51,0.9)]'}`}>{t.titulo}</p>
                  {t.descripcion && <p className="text-[12px] text-[rgba(92,64,51,0.5)] mt-0.5">{t.descripcion}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span style={{ color: PRIO_COLOR[t.prioridad] }} className="text-[10px] font-semibold uppercase tracking-wide">{t.prioridad}</span>
                    {t.cliente_nombre && <span className="text-[11px] text-[rgba(92,64,51,0.5)]">· {t.cliente_nombre}</span>}
                    {t.fecha_vencimiento && <span className={`text-[11px] ${vencida ? 'text-red-500 font-medium' : 'text-[rgba(92,64,51,0.5)]'}`}>· vence {t.fecha_vencimiento}{vencida ? ' (vencida)' : ''}</span>}
                  </div>
                </div>
                <button onClick={() => borrar.mutate(t.id)} className="text-[rgba(92,64,51,0.35)] hover:text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea">
        <div className="flex flex-col gap-3">
          <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Llamar para confirmar medidas" />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Prioridad" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} options={[{ value: 'ALTA', label: 'Alta' }, { value: 'MEDIA', label: 'Media' }, { value: 'BAJA', label: 'Baja' }]} />
            <Input label="Vence" type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
          </div>
          <Select label="Cliente (opcional)" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Sin cliente"
            options={clientes.map((c: { id: string; nombre?: string; nombre_completo?: string }) => ({ value: c.id, label: c.nombre_completo || c.nombre || c.id }))} />
          <div className="flex justify-end gap-2 mt-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={() => crear.mutate()} disabled={!form.titulo || crear.isPending}>{crear.isPending ? 'Guardando…' : 'Crear'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
