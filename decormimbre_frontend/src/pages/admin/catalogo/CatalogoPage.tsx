import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Armchair, Plus, Package, CheckCircle, EyeOff } from 'lucide-react'
import { catalogoAdminApi, type ProductoAdmin, type Categoria } from '@/api/catalogo'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Btn from '@/components/ui/Btn'

const MATERIALES = [
  { value: 'MIMBRE', label: 'Mimbre (natural)' },
  { value: 'POLIALUMINIO', label: 'Polialuminio (Tetrapack reciclado)' },
  { value: 'COMBINADO', label: 'Combinado (mimbre y polialuminio)' },
  { value: 'TOTORA', label: 'Totora (fibra natural)' },
]
const MATERIAL_LABEL: Record<string, string> = Object.fromEntries(MATERIALES.map((m) => [m.value, m.label.split(' (')[0]]))

const EMPTY: Partial<ProductoAdmin> = {
  nombre: '', descripcion: '', precio_base: '0', stock_actual: 0, stock_minimo: 0,
  imagen_url: '', categoria: '', material: 'COMBINADO', tiempo_produccion_dias: 7,
  personalizable: true, activo: true,
}

export default function CatalogoPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<ProductoAdmin>>(EMPTY)
  const [editando, setEditando] = useState<string | null>(null)
  const [borrar, setBorrar] = useState<ProductoAdmin | null>(null)
  const [error, setError] = useState('')

  const { data: prodData, isLoading } = useQuery({
    queryKey: ['admin-productos'],
    queryFn: () => catalogoAdminApi.productos.list({ por_pagina: '100' }),
  })
  const { data: catData } = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: () => catalogoAdminApi.categorias.list(),
  })

  const productos: ProductoAdmin[] = prodData?.data ?? []
  const categorias: Categoria[] = catData?.data ?? []

  const save = useMutation({
    mutationFn: () => editando
      ? catalogoAdminApi.productos.update(editando, form)
      : catalogoAdminApi.productos.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-productos'] })
      qc.invalidateQueries({ queryKey: ['catalogo-publico'] })
      setModal(false); setEditando(null); setForm(EMPTY); setError('')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: { message?: string } } } }
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar el producto.')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => catalogoAdminApi.productos.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-productos'] })
      qc.invalidateQueries({ queryKey: ['catalogo-publico'] })
      setBorrar(null)
    },
  })

  const openNew = () => { setForm(EMPTY); setEditando(null); setError(''); setModal(true) }
  const openEdit = (p: ProductoAdmin) => { setForm(p); setEditando(p.id!); setError(''); setModal(true) }
  const set = (k: keyof ProductoAdmin, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Tienda"
        title="Catálogo"
        subtitle="Productos que se muestran en el sitio"
        action={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Nuevo producto</Btn>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-2xl">
        <StatCard label="Productos" value={productos.length} icon={Package} color="#5C4033" delay={0} />
        <StatCard label="Activos" value={productos.filter((p) => p.activo).length} icon={CheckCircle} color="#22c55e" delay={0.06} />
        <StatCard label="Inactivos" value={productos.filter((p) => !p.activo).length} icon={EyeOff} color="#9ca3af" delay={0.12} />
      </div>

      {isLoading ? <Spinner /> : productos.length === 0 ? (
        <EmptyState icon={Armchair} title="Sin productos" action={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Nuevo producto</Btn>} />
      ) : (
        <div className="bg-white rounded-[1.5rem] border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[rgba(92,64,51,0.07)]">
                {['', 'Producto', 'Categoría', 'Material', 'Precio', 'Stock', 'Estado', ''].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.5)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-[rgba(92,64,51,0.05)] hover:bg-[rgba(92,64,51,0.02)]">
                  <td className="px-5 py-2.5">
                    <div className="w-11 h-11 rounded-lg bg-[rgba(92,64,51,0.05)] overflow-hidden flex items-center justify-center">
                      {p.imagen_url
                        ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : <Armchair className="w-4 h-4 text-[rgba(92,64,51,0.3)]" />}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-[rgba(92,64,51,0.9)] font-medium">{p.nombre}</td>
                  <td className="px-5 py-2.5 text-[rgba(92,64,51,0.6)]">{p.categoria_nombre ?? '—'}</td>
                  <td className="px-5 py-2.5 text-[rgba(92,64,51,0.6)]">{MATERIAL_LABEL[p.material] ?? p.material}</td>
                  <td className="px-5 py-2.5 text-[rgba(92,64,51,0.8)]">${Number(p.precio_base).toLocaleString('es-EC')}</td>
                  <td className="px-5 py-2.5 text-[rgba(92,64,51,0.7)]">{p.stock_actual}</td>
                  <td className="px-5 py-2.5">
                    {p.activo
                      ? <span className="text-green-600 text-xs">Activo</span>
                      : <span className="text-[rgba(92,64,51,0.4)] text-xs">Inactivo</span>}
                  </td>
                  <td className="px-5 py-2.5 text-right flex items-center justify-end gap-2">
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setBorrar(p)}>Desactivar</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar producto' : 'Nuevo producto'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={form.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} />
          <div>
            <label className="block text-xs font-medium text-[rgba(92,64,51,0.6)] mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion ?? ''}
              onChange={(e) => set('descripcion', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-3.5 py-2.5 text-sm text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)] resize-none"
              placeholder="Descripción del producto…"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Categoría" value={form.categoria ?? ''} onChange={(e) => set('categoria', e.target.value)} options={categorias.map((c) => ({ value: c.id, label: c.nombre }))} placeholder="Seleccionar" />
            <Select label="Material" value={form.material ?? 'COMBINADO'} onChange={(e) => set('material', e.target.value)} options={MATERIALES} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Precio base ($)" type="number" value={String(form.precio_base ?? 0)} onChange={(e) => set('precio_base', e.target.value)} />
            <Input label="Stock actual" type="number" value={String(form.stock_actual ?? 0)} onChange={(e) => set('stock_actual', Number(e.target.value))} />
            <Input label="Stock mínimo" type="number" value={String(form.stock_minimo ?? 0)} onChange={(e) => set('stock_minimo', Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Días de producción" type="number" value={String(form.tiempo_produccion_dias ?? 7)} onChange={(e) => set('tiempo_produccion_dias', Number(e.target.value))} />
            <Input label="Imagen (ruta)" value={form.imagen_url ?? ''} onChange={(e) => set('imagen_url', e.target.value)} placeholder="/products/mi-foto.jpg" />
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-[rgba(92,64,51,0.8)] cursor-pointer">
              <input type="checkbox" checked={!!form.personalizable} onChange={(e) => set('personalizable', e.target.checked)} /> Personalizable
            </label>
            <label className="flex items-center gap-2 text-sm text-[rgba(92,64,51,0.8)] cursor-pointer">
              <input type="checkbox" checked={!!form.activo} onChange={(e) => set('activo', e.target.checked)} /> Activo (visible en el sitio)
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 mt-2">
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={() => save.mutate()} disabled={save.isPending || !form.nombre || !form.categoria || !form.descripcion}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Confirmar desactivar */}
      <Modal open={!!borrar} onClose={() => setBorrar(null)} title="Desactivar producto">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[rgba(92,64,51,0.8)]">
            ¿Seguro que quieres desactivar <strong>{borrar?.nombre}</strong>? Dejará de mostrarse en el sitio, pero no se borra (puedes reactivarlo editándolo).
          </p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setBorrar(null)}>Cancelar</Btn>
            <Btn onClick={() => borrar?.id && remove.mutate(borrar.id)} disabled={remove.isPending}>
              {remove.isPending ? 'Desactivando…' : 'Desactivar'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
