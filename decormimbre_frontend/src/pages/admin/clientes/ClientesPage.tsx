import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Search, Mail, Phone, Check } from 'lucide-react'
import { clientesApi, type Cliente } from '@/api/clientes'
import { validarCedulaORuc } from '@/lib/cedula'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Btn from '@/components/ui/Btn'

const EMPTY: Partial<Cliente> = { nombre_completo: '', cedula_ruc: '', email: '', telefono: '', direccion: '' }

export default function ClientesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Cliente>>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: () => clientesApi.list(search ? { q: search } : undefined),
  })

  const save = useMutation({
    mutationFn: () =>
      editing ? clientesApi.update(editing, form) : clientesApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); closeModal() },
  })

  const openCreate = () => { setForm(EMPTY); setEditing(null); setModal(true) }
  const openEdit = (c: Cliente) => { setForm(c); setEditing(c.id); setModal(true) }
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditing(null) }
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const clientes: Cliente[] = data?.data ?? []

  // Validación de cédula/RUC en tiempo real (Módulo 10) — el backend re-valida por seguridad
  const cedulaVal = form.cedula_ruc ?? ''
  const cedulaTocada = cedulaVal.length > 0
  const cedulaCheck = validarCedulaORuc(cedulaVal)

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Directorio"
        title="Clientes"
        subtitle={`${clientes.length} registrados`}
        action={<Btn onClick={openCreate}><Plus className="w-4 h-4" /> Nuevo cliente</Btn>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl">
        <StatCard label="Clientes" value={clientes.length} icon={Users} color="#5C4033" delay={0} />
        <StatCard label="Con correo" value={clientes.filter((c) => c.email).length} icon={Mail} color="#3b82f6" delay={0.06} />
        <StatCard label="Con teléfono" value={clientes.filter((c) => c.telefono).length} icon={Phone} color="#16a34a" delay={0.12} />
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(92,64,51,0.4)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o cédula…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[rgba(92,64,51,0.15)] bg-white text-sm outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
        />
      </div>

      {isLoading ? <Spinner /> : clientes.length === 0 ? (
        <EmptyState icon={Users} title="Sin clientes aún" action={<Btn onClick={openCreate}><Plus className="w-4 h-4" /> Agregar cliente</Btn>} />
      ) : (
        <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(92,64,51,0.07)]">
                {['Nombre', 'Cédula / RUC', 'Email', 'Teléfono', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-[rgba(92,64,51,0.05)] hover:bg-[rgba(92,64,51,0.02)] transition-colors">
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.9)] font-normal">{c.nombre_completo || `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim() || '—'}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{c.cedula_ruc}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{c.email}</td>
                  <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{c.telefono}</td>
                  <td className="px-5 py-3 text-right">
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(c)}>Editar</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre completo" value={form.nombre_completo ?? ''} onChange={(e) => set('nombre_completo', e.target.value)} />
          <div>
            <Input label="Cédula / RUC" value={form.cedula_ruc ?? ''} inputMode="numeric"
              onChange={(e) => set('cedula_ruc', e.target.value.replace(/\D/g, ''))}
              error={cedulaTocada && !cedulaCheck.valido ? cedulaCheck.mensaje : undefined} />
            {cedulaTocada && cedulaCheck.valido && (
              <p className="mt-1 text-[11px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {cedulaCheck.mensaje}</p>
            )}
          </div>
          <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          <Input label="Teléfono" value={form.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} />
          <Input label="Dirección" value={form.direccion ?? ''} onChange={(e) => set('direccion', e.target.value)} />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={() => save.mutate()} disabled={save.isPending || (cedulaTocada && !cedulaCheck.valido)}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
