import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Hammer, Ruler, Palette, Package, Calendar, CheckCircle2, FileText, LogOut, Clock, Hourglass, Boxes, AlertTriangle, Truck } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { tallerApi, type TareaArtesano } from '@/api/taller'
import BrandLogo from '@/components/BrandLogo'
import Modal from '@/components/ui/Modal'
import Btn from '@/components/ui/Btn'
import Spinner from '@/components/ui/Spinner'

const TIPO_COLOR: Record<string, string> = { ESTRUCTURA: '#7B5840', TEJIDO: '#C4A882', ACABADO: '#a855f7', COJINES: '#3b82f6', EMPAQUE: '#16a34a' }
const hexDe = (s: string | null) => { const m = s?.match(/#([0-9a-fA-F]{3,8})/); return m ? m[0] : null }
const dims = (t: TareaArtesano['items'][0]) => [t.ancho_cm && `${t.ancho_cm}`, t.alto_cm && `${t.alto_cm}`, t.largo_cm && `${t.largo_cm}`].filter(Boolean).join(' × ')

export default function TallerPage() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [completando, setCompletando] = useState<TareaArtesano | null>(null)
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (!user) { navigate('/admin/login'); return }
    if (user.rol === 'CLIENTE') navigate('/cuenta')
  }, [user])

  const { data, isLoading } = useQuery({ queryKey: ['mis-tareas'], queryFn: () => tallerApi.misTareas(), enabled: !!user })
  const tareas: TareaArtesano[] = data?.data ?? []

  const completar = useMutation({
    mutationFn: () => tallerApi.completar(completando!.tarea_id, notas),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mis-tareas'] }); setCompletando(null); setNotas('') },
  })

  const [solicitado, setSolicitado] = useState<Record<string, boolean>>({})
  const solicitar = useMutation({
    mutationFn: (tareaId: string) => tallerApi.solicitarMaterial(tareaId),
    onSuccess: (_r, tareaId) => setSolicitado((s) => ({ ...s, [tareaId]: true })),
  })

  if (!user) return null
  const logout = () => { clearAuth(); navigate('/admin/login') }

  const enProceso = tareas.filter((t) => t.estado === 'EN_PROCESO')
  const pendientes = tareas.filter((t) => t.estado === 'PENDIENTE')

  return (
    <div className="min-h-screen relative">
      {/* Fondo cinematográfico */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <img src="/products/comedor-tejido.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#f5f0eb]/[0.9] backdrop-blur-[3px]" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-8 h-16 bg-white/70 backdrop-blur-md border-b border-[rgba(92,64,51,0.1)]">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={30} />
          <div>
            <p className="text-[13px] font-medium text-[#5C4033] leading-none">Taller</p>
            <p className="text-[11px] text-[rgba(92,64,51,0.5)] mt-0.5">{user.nombre} · Artesano</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-[rgba(92,64,51,0.6)] hover:text-red-500 transition-colors">
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      <div className="p-5 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.45)]">Mis tareas</p>
          <h1 className="text-[26px] font-normal text-[#3d2215] mt-0.5">Órdenes de trabajo</h1>
          <p className="text-sm text-[rgba(92,64,51,0.55)] mt-1">{enProceso.length} en proceso · {pendientes.length} pendientes</p>
        </div>

        {isLoading ? <Spinner /> : tareas.length === 0 ? (
          <div className="text-center py-20">
            <Hammer className="w-8 h-8 text-[rgba(92,64,51,0.25)] mx-auto mb-3" />
            <p className="text-[rgba(92,64,51,0.5)]">No tienes tareas asignadas por ahora.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tareas.map((t, i) => {
              const activa = t.estado === 'EN_PROCESO'
              return (
                <motion.div key={t.tarea_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`bg-white rounded-[1.5rem] border shadow-[0_1px_3px_rgba(92,64,51,0.05)] overflow-hidden ${activa ? 'border-[#C4A882]/60' : 'border-[rgba(92,64,51,0.09)]'}`}>
                  {/* Cabecera */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(92,64,51,0.07)] flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${TIPO_COLOR[t.tipo] ?? '#5C4033'}1f` }}>
                        <Hammer className="w-[18px] h-[18px]" style={{ color: TIPO_COLOR[t.tipo] ?? '#5C4033' }} />
                      </span>
                      <div>
                        <p className="text-[15px] font-medium text-[#3d2215]">{t.tipo_display} · {t.pedido_numero}</p>
                        <p className="text-[12px] text-[rgba(92,64,51,0.55)]">Cliente: {t.cliente}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.fecha_promesa_entrega && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[rgba(92,64,51,0.6)]">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(t.fecha_promesa_entrega).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${activa ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {activa ? <Clock className="w-3 h-3" /> : null}{activa ? 'En proceso' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Espera de la etapa previa (ej. el tejedor espera la estructura) */}
                  {t.bloqueada && (
                    <div className="mx-5 mt-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200/70 rounded-xl px-4 py-3">
                      <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[13px] text-amber-800">Esperando <b>{t.esperando?.toLowerCase()}</b>. Puedes preparar el material y verificar el inventario mientras tanto.</p>
                    </div>
                  )}

                  {/* Especificaciones del mueble */}
                  <div className="p-5 flex flex-col gap-3">
                    {t.items.map((it, j) => {
                      const hex = hexDe(it.color)
                      return (
                        <div key={j} className="rounded-2xl bg-[#faf7f4] border border-[rgba(92,64,51,0.07)] p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-[rgba(92,64,51,0.5)]" />
                            <span className="text-[14px] font-medium text-[rgba(92,64,51,0.9)]">{it.cantidad}× {it.producto}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[13px]">
                            <div className="flex items-center gap-2 text-[rgba(92,64,51,0.7)]">
                              <Ruler className="w-4 h-4 text-[rgba(92,64,51,0.4)]" />
                              <span>Medidas: <b className="font-medium text-[rgba(92,64,51,0.9)]">{dims(it) ? `${dims(it)} cm` : 'estándar'}</b></span>
                            </div>
                            <div className="flex items-center gap-2 text-[rgba(92,64,51,0.7)]">
                              <Palette className="w-4 h-4 text-[rgba(92,64,51,0.4)]" />
                              <span className="flex items-center gap-1.5">Color:
                                {hex && <span className="inline-block w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: hex }} />}
                                <b className="font-medium text-[rgba(92,64,51,0.9)]">{it.color || 'a definir'}</b>
                              </span>
                            </div>
                          </div>
                          {it.observaciones && (
                            <p className="mt-2 text-[12px] text-[rgba(92,64,51,0.6)] bg-white rounded-lg px-3 py-2 border border-[rgba(92,64,51,0.06)]">
                              <b>Nota del cliente:</b> {it.observaciones}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Materiales e inventario (preparación del tejedor) */}
                  {t.materiales.length > 0 && (
                    <div className="px-5 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Boxes className="w-4 h-4 text-[rgba(92,64,51,0.5)]" />
                        <span className="text-[13px] font-medium text-[rgba(92,64,51,0.85)]">Materiales e inventario</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {t.materiales.map((m, k) => (
                          <div key={k} className="flex items-center justify-between gap-3 text-[13px] bg-[#faf7f4] rounded-lg px-3 py-2 border border-[rgba(92,64,51,0.06)]">
                            <span className="text-[rgba(92,64,51,0.8)]">{m.nombre} <span className="text-[rgba(92,64,51,0.5)]">· requiere {m.requerido} {m.unidad.toLowerCase()}</span></span>
                            {m.suficiente
                              ? <span className="inline-flex items-center gap-1 text-[12px] text-green-600 font-medium shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> En stock</span>
                              : <span className="inline-flex items-center gap-1 text-[12px] text-red-500 font-medium shrink-0"><AlertTriangle className="w-3.5 h-3.5" /> Faltan {m.faltante} {m.unidad.toLowerCase()}</span>}
                          </div>
                        ))}
                      </div>
                      {t.requiere_pedido && (
                        <button onClick={() => solicitar.mutate(t.tarea_id)} disabled={solicitado[t.tarea_id] || solicitar.isPending}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-xl px-3.5 py-2 transition-colors disabled:opacity-60 bg-[rgba(220,60,40,0.08)] text-red-600 hover:bg-[rgba(220,60,40,0.14)]">
                          <Truck className="w-4 h-4" /> {solicitado[t.tarea_id] ? 'Solicitud enviada al admin' : 'Solicitar al proveedor'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-2 px-5 pb-5">
                    <a href={tallerApi.fichaUrl(t.tarea_id)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-[rgba(92,64,51,0.6)] hover:text-[#5C4033] px-3 py-2 rounded-xl hover:bg-[rgba(92,64,51,0.05)] transition-colors">
                      <FileText className="w-4 h-4" /> Ficha PDF
                    </a>
                    <Btn onClick={() => { setCompletando(t); setNotas('') }} disabled={!activa}>
                      <CheckCircle2 className="w-4 h-4" /> Completar
                    </Btn>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal completar */}
      <Modal open={!!completando} onClose={() => setCompletando(null)} title={`Completar: ${completando?.tipo_display}`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[rgba(92,64,51,0.65)]">Confirmas que terminaste la tarea de <b>{completando?.tipo_display.toLowerCase()}</b> del pedido {completando?.pedido_numero}. El pedido avanzará a la siguiente etapa.</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">Notas (opcional)</label>
            <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones del trabajo realizado…"
              className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[rgba(92,64,51,0.4)] resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setCompletando(null)}>Cancelar</Btn>
            <Btn onClick={() => completar.mutate()} disabled={completar.isPending}>{completar.isPending ? 'Guardando…' : 'Marcar completada'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
