import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { inventarioApi, type MateriaPrima, type AlertaStock } from '@/api/inventario'
import PageHeader from '@/components/ui/PageHeader'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'

const UNIDADES = [
  { value: 'METRO', label: 'Metro lineal' }, { value: 'METRO2', label: 'Metro cuadrado' },
  { value: 'KG', label: 'Kilogramo' }, { value: 'UNIDAD', label: 'Unidad' },
  { value: 'ROLLO', label: 'Rollo' }, { value: 'ATADO', label: 'Atado' },
  { value: 'PLANCHA', label: 'Plancha' },
]

const TABS = ['Materias primas', 'Lotes', 'Alertas'] as const
type Tab = typeof TABS[number]

const EMPTY_MATERIA = { nombre: '', unidad: 'ROLLO', stock_actual: '0', stock_minimo: '0', costo_unitario: '0' }
const EMPTY_LOTE = { materia_prima: '', numero_lote: '', cantidad_inicial: '', cantidad_disponible: '', costo_unitario: '', fecha_recepcion: '' }
const EMPTY_AJUSTE = { materia_prima: '', tipo: 'AJUSTE_POSITIVO', cantidad: '', justificacion: '' }

export default function InventarioPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('Materias primas')
  const [modalMateria, setModalMateria] = useState(false)
  const [modalLote, setModalLote] = useState(false)
  const [modalAjuste, setModalAjuste] = useState<string | null>(null)
  const [formMateria, setFormMateria] = useState<Partial<MateriaPrima>>(EMPTY_MATERIA)
  const [formLote, setFormLote] = useState(EMPTY_LOTE)
  const [formAjuste, setFormAjuste] = useState(EMPTY_AJUSTE)
  const [editando, setEditando] = useState<string | null>(null)

  const { data: materiasData, isLoading: loadingMaterias } = useQuery({
    queryKey: ['materias'],
    queryFn: () => inventarioApi.materias.list(),
  })
  const { data: lotesData, isLoading: loadingLotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: () => inventarioApi.lotes.list(),
    enabled: tab === 'Lotes',
  })
  const { data: alertasData, isLoading: loadingAlertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => inventarioApi.alertas.list(),
    enabled: tab === 'Alertas',
  })

  const saveMat = useMutation({
    mutationFn: () => editando
      ? inventarioApi.materias.update(editando, formMateria)
      : inventarioApi.materias.create(formMateria),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materias'] }); setModalMateria(false); setEditando(null); setFormMateria(EMPTY_MATERIA) },
  })

  const saveLote = useMutation({
    mutationFn: () => inventarioApi.lotes.create({ ...formLote, cantidad_disponible: formLote.cantidad_inicial }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes', 'materias'] }); setModalLote(false); setFormLote(EMPTY_LOTE) },
  })

  const saveAjuste = useMutation({
    mutationFn: () => inventarioApi.ajuste(formAjuste),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materias'] }); setModalAjuste(null); setFormAjuste(EMPTY_AJUSTE) },
  })

  const revisarAlerta = useMutation({
    mutationFn: (id: number) => inventarioApi.alertas.revisar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas'] }),
  })

  const materias: MateriaPrima[] = materiasData?.data ?? []
  const lotes = lotesData?.data ?? []
  const alertas: AlertaStock[] = alertasData?.data ?? []

  const openEdit = (m: MateriaPrima) => { setFormMateria(m); setEditando(m.id); setModalMateria(true) }

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Inventario"
        subtitle="Materias primas y stock"
        action={
          <div className="flex gap-2">
            {tab === 'Materias primas' && (
              <Btn onClick={() => { setFormMateria(EMPTY_MATERIA); setEditando(null); setModalMateria(true) }}>
                <Plus className="w-4 h-4" /> Nueva materia
              </Btn>
            )}
            {tab === 'Lotes' && <Btn onClick={() => setModalLote(true)}><Plus className="w-4 h-4" /> Nuevo lote</Btn>}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/50 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? 'bg-white shadow-sm text-[rgba(92,64,51,0.9)]' : 'text-[rgba(92,64,51,0.55)] hover:text-[rgba(92,64,51,0.8)]'}`}
          >{t}{t === 'Alertas' && alertas.length > 0 && <span className="ml-1.5 bg-red-400 text-white text-[10px] rounded-full px-1.5 py-0.5">{alertas.length}</span>}</button>
        ))}
      </div>

      {/* Tab: Materias primas */}
      {tab === 'Materias primas' && (
        loadingMaterias ? <Spinner /> : materias.length === 0 ? (
          <EmptyState icon={Package} title="Sin materias primas" />
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(92,64,51,0.07)]">
                  {['Material', 'Unidad', 'Stock actual', 'Stock mínimo', 'Estado', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materias.map((m) => (
                  <tr key={m.id} className="border-b border-[rgba(92,64,51,0.05)] hover:bg-[rgba(92,64,51,0.02)]">
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.9)]">{m.nombre}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{m.unidad}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.8)]">{m.stock_actual}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.5)]">{m.stock_minimo}</td>
                    <td className="px-5 py-3">
                      {m.en_stock_critico
                        ? <span className="flex items-center gap-1 text-red-500 text-xs"><AlertTriangle className="w-3 h-3" /> Crítico</span>
                        : <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" /> OK</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                      <Btn variant="ghost" size="sm" onClick={() => { setFormAjuste({ ...EMPTY_AJUSTE, materia_prima: m.id }); setModalAjuste(m.nombre) }}>Ajustar</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(m)}>Editar</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab: Lotes */}
      {tab === 'Lotes' && (
        loadingLotes ? <Spinner /> : lotes.length === 0 ? (
          <EmptyState icon={Package} title="Sin lotes registrados" action={<Btn onClick={() => setModalLote(true)}><Plus className="w-4 h-4" /> Nuevo lote</Btn>} />
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(92,64,51,0.07)]">
                  {['Lote', 'Materia prima', 'Cant. inicial', 'Cant. disponible', 'Recepción'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lotes.map((l: { id: string; numero_lote: string; materia_prima: string; cantidad_inicial: string; cantidad_disponible: string; fecha_recepcion: string }) => (
                  <tr key={l.id} className="border-b border-[rgba(92,64,51,0.05)]">
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.9)]">{l.numero_lote}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.6)]">{materias.find((m) => m.id === l.materia_prima)?.nombre ?? l.materia_prima}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.7)]">{l.cantidad_inicial}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.7)]">{l.cantidad_disponible}</td>
                    <td className="px-5 py-3 text-[rgba(92,64,51,0.5)] text-xs">{new Date(l.fecha_recepcion).toLocaleDateString('es-EC')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab: Alertas */}
      {tab === 'Alertas' && (
        loadingAlertas ? <Spinner /> : alertas.length === 0 ? (
          <EmptyState icon={CheckCircle} title="Sin alertas pendientes" description="El stock de todas las materias primas está en niveles normales." />
        ) : (
          <div className="flex flex-col gap-3">
            {alertas.map((a) => (
              <div key={a.id} className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-red-100 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[rgba(92,64,51,0.9)]">{a.materia_prima_nombre}</p>
                    <p className="text-xs text-[rgba(92,64,51,0.55)]">Stock: {a.stock_al_momento} {a.unidad} · Mínimo: {a.stock_minimo}</p>
                  </div>
                </div>
                <Btn variant="ghost" size="sm" onClick={() => revisarAlerta.mutate(a.id)} disabled={revisarAlerta.isPending}>
                  Marcar revisada
                </Btn>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal materia prima */}
      <Modal open={modalMateria} onClose={() => setModalMateria(false)} title={editando ? 'Editar materia prima' : 'Nueva materia prima'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={formMateria.nombre ?? ''} onChange={(e) => setFormMateria({ ...formMateria, nombre: e.target.value })} />
          <Select label="Unidad" value={formMateria.unidad ?? 'ROLLO'} onChange={(e) => setFormMateria({ ...formMateria, unidad: e.target.value })} options={UNIDADES} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stock actual" type="number" value={String(formMateria.stock_actual ?? 0)} onChange={(e) => setFormMateria({ ...formMateria, stock_actual: e.target.value })} />
            <Input label="Stock mínimo" type="number" value={String(formMateria.stock_minimo ?? 0)} onChange={(e) => setFormMateria({ ...formMateria, stock_minimo: e.target.value })} />
          </div>
          <Input label="Costo unitario ($)" type="number" value={String(formMateria.costo_unitario ?? 0)} onChange={(e) => setFormMateria({ ...formMateria, costo_unitario: e.target.value })} />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModalMateria(false)}>Cancelar</Btn>
            <Btn onClick={() => saveMat.mutate()} disabled={saveMat.isPending}>{saveMat.isPending ? 'Guardando…' : 'Guardar'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal lote */}
      <Modal open={modalLote} onClose={() => setModalLote(false)} title="Registrar lote">
        <div className="flex flex-col gap-4">
          <Select label="Materia prima" value={formLote.materia_prima} onChange={(e) => setFormLote({ ...formLote, materia_prima: e.target.value })} options={materias.map((m) => ({ value: m.id, label: m.nombre }))} placeholder="Seleccionar" />
          <Input label="Número de lote" value={formLote.numero_lote} onChange={(e) => setFormLote({ ...formLote, numero_lote: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cantidad inicial" type="number" value={formLote.cantidad_inicial} onChange={(e) => setFormLote({ ...formLote, cantidad_inicial: e.target.value })} />
            <Input label="Costo unitario ($)" type="number" value={formLote.costo_unitario} onChange={(e) => setFormLote({ ...formLote, costo_unitario: e.target.value })} />
          </div>
          <Input label="Fecha de recepción" type="date" value={formLote.fecha_recepcion} onChange={(e) => setFormLote({ ...formLote, fecha_recepcion: e.target.value })} />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModalLote(false)}>Cancelar</Btn>
            <Btn onClick={() => saveLote.mutate()} disabled={saveLote.isPending}>{saveLote.isPending ? 'Registrando…' : 'Registrar lote'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal ajuste */}
      <Modal open={!!modalAjuste} onClose={() => setModalAjuste(null)} title={`Ajuste de inventario: ${modalAjuste}`}>
        <div className="flex flex-col gap-4">
          <Select label="Tipo de ajuste" value={formAjuste.tipo} onChange={(e) => setFormAjuste({ ...formAjuste, tipo: e.target.value })} options={[{ value: 'AJUSTE_POSITIVO', label: 'Ajuste positivo (aumentar)' }, { value: 'AJUSTE_NEGATIVO', label: 'Ajuste negativo (reducir)' }]} />
          <Input label="Cantidad" type="number" value={formAjuste.cantidad} onChange={(e) => setFormAjuste({ ...formAjuste, cantidad: e.target.value })} />
          <Input label="Justificación" value={formAjuste.justificacion} onChange={(e) => setFormAjuste({ ...formAjuste, justificacion: e.target.value })} placeholder="Motivo del ajuste…" />
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModalAjuste(null)}>Cancelar</Btn>
            <Btn onClick={() => saveAjuste.mutate()} disabled={saveAjuste.isPending}>{saveAjuste.isPending ? 'Registrando…' : 'Aplicar ajuste'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
