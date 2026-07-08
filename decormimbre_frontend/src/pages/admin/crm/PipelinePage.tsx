import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { crmApi, ETAPAS, ETAPA_LABEL, type Etapa, type Oportunidad } from '@/api/crm'
import { clientesApi } from '@/api/clientes'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'
import Spinner from '@/components/ui/Spinner'

const ETAPA_COLOR: Record<Etapa, string> = {
  NUEVO: '#6b7280',
  CONTACTADO: '#3b82f6',
  COTIZANDO: '#a855f7',
  NEGOCIACION: '#f59e0b',
  GANADO: '#16a34a',
  PERDIDO: '#ef4444',
}

const FUENTES = ['WEB', 'WHATSAPP', 'REFERIDO', 'REDES', 'LOCAL', 'OTRO']

const money = (n: string | number) =>
  '$' + Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })

const INITIAL = { titulo: '', cliente: '', valor_estimado: '', etapa: 'NUEVO' as Etapa, fuente: 'WEB', probabilidad: '30', contacto_nombre: '', contacto_telefono: '', descripcion: '' }

export default function PipelinePage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL)

  const { data: oppData, isLoading } = useQuery({
    queryKey: ['crm-oportunidades'],
    queryFn: () => crmApi.oportunidades.list(),
  })
  const { data: cliData } = useQuery({ queryKey: ['crm-clientes'], queryFn: () => clientesApi.list() })

  const oportunidades: Oportunidad[] = oppData?.data?.data ?? []
  const clientes = cliData?.data?.data ?? cliData?.data ?? []

  const crear = useMutation({
    mutationFn: () =>
      crmApi.oportunidades.create({
        titulo: form.titulo,
        cliente: form.cliente || null,
        valor_estimado: form.valor_estimado || '0',
        etapa: form.etapa,
        fuente: form.fuente,
        probabilidad: Number(form.probabilidad) || 0,
        contacto_nombre: form.contacto_nombre,
        contacto_telefono: form.contacto_telefono,
        descripcion: form.descripcion,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-oportunidades'] }); setOpen(false); setForm(INITIAL) },
  })

  const mover = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: Etapa }) => crmApi.oportunidades.update(id, { etapa }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-oportunidades'] }),
  })

  const porEtapa = useMemo(() => {
    const map: Record<string, Oportunidad[]> = {}
    ETAPAS.forEach((e) => (map[e] = []))
    oportunidades.forEach((o) => { (map[o.etapa] ??= []).push(o) })
    return map
  }, [oportunidades])

  const valorAbierto = oportunidades
    .filter((o) => o.etapa !== 'GANADO' && o.etapa !== 'PERDIDO')
    .reduce((s, o) => s + Number(o.valor_estimado || 0), 0)

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-normal text-[#5C4033]">Embudo de ventas</h1>
          <p className="text-sm text-[rgba(92,64,51,0.55)] mt-1">
            {oportunidades.length} oportunidades · {money(valorAbierto)} en pipeline abierto
          </p>
        </div>
        <Btn onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nueva oportunidad</Btn>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS.map((etapa) => {
            const items = porEtapa[etapa] ?? []
            const total = items.reduce((s, o) => s + Number(o.valor_estimado || 0), 0)
            return (
              <div key={etapa} className="shrink-0 w-64">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ETAPA_COLOR[etapa] }} />
                    <span className="text-[13px] font-medium text-[rgba(92,64,51,0.9)]">{ETAPA_LABEL[etapa]}</span>
                    <span className="text-[11px] text-[rgba(92,64,51,0.4)]">{items.length}</span>
                  </div>
                  <span className="text-[11px] text-[rgba(92,64,51,0.5)]">{money(total)}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {items.map((o) => (
                    <div key={o.id} className="bg-white/80 rounded-2xl border border-[rgba(92,64,51,0.08)] p-3.5">
                      <p className="text-[13px] font-medium text-[rgba(92,64,51,0.95)] leading-snug">{o.titulo}</p>
                      <p className="text-[11px] text-[rgba(92,64,51,0.5)] mt-0.5">{o.cliente_nombre || o.contacto_nombre || 'Sin cliente'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[13px] font-medium text-[#5C4033]">{money(o.valor_estimado)}</span>
                        <span className="text-[10px] text-[rgba(92,64,51,0.4)]">{o.probabilidad}%</span>
                      </div>
                      <select
                        value={o.etapa}
                        onChange={(e) => mover.mutate({ id: o.id, etapa: e.target.value as Etapa })}
                        className="mt-2 w-full text-[11px] rounded-lg border border-[rgba(92,64,51,0.15)] bg-[#faf7f4] px-2 py-1.5 text-[rgba(92,64,51,0.8)] outline-none"
                      >
                        {ETAPAS.map((e) => <option key={e} value={e}>{ETAPA_LABEL[e]}</option>)}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-[11px] text-[rgba(92,64,51,0.3)] text-center py-3">—</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva oportunidad">
        <div className="flex flex-col gap-3">
          <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Sala tejida para terraza" />
          <Select
            label="Cliente (opcional)"
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            placeholder="Sin cliente / lead"
            options={clientes.map((c: { id: string; nombre?: string; nombre_completo?: string }) => ({ value: c.id, label: c.nombre_completo || c.nombre || c.id }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor estimado ($)" type="number" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} />
            <Input label="Probabilidad (%)" type="number" value={form.probabilidad} onChange={(e) => setForm({ ...form, probabilidad: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Etapa" value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value as Etapa })} options={ETAPAS.map((e) => ({ value: e, label: ETAPA_LABEL[e] }))} />
            <Select label="Fuente" value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })} options={FUENTES.map((f) => ({ value: f, label: f }))} />
          </div>
          <Input label="Contacto (si no hay cliente)" value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} placeholder="Nombre" />
          <div className="flex justify-end gap-2 mt-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={() => crear.mutate()} disabled={!form.titulo || crear.isPending}>{crear.isPending ? 'Guardando…' : 'Crear'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
