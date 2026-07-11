import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, CheckCheck } from 'lucide-react'
import { getNotificaciones, marcarNotificacionLeida } from '@/api/authApi'

interface Noti { id: string; tipo: string; titulo: string; mensaje: string; leida: boolean; fecha_creacion: string }

function hace(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return new Date(fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

export default function NotificationsBell({ placement = 'up' }: { placement?: 'up' | 'down' }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({ queryKey: ['notificaciones'], queryFn: getNotificaciones, refetchInterval: 60000 })
  const notis: Noti[] = Array.isArray(data) ? data : (data?.results ?? [])
  const noLeidas = notis.filter((n) => !n.leida)

  const marcar = useMutation({
    mutationFn: (id: string) => marcarNotificacionLeida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  })
  const marcarTodas = () => noLeidas.forEach((n) => marcar.mutate(n.id))

  const panelPos = placement === 'down'
    ? 'top-full mt-2 right-0'
    : 'bottom-full mb-2 left-0'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-[rgba(92,64,51,0.6)] hover:bg-[rgba(92,64,51,0.06)] hover:text-[rgba(92,64,51,0.9)] transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {noLeidas.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {noLeidas.length > 9 ? '9+' : noLeidas.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: placement === 'down' ? -6 : 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placement === 'down' ? -6 : 6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className={`absolute ${panelPos} z-[61] w-80 max-w-[86vw] bg-white rounded-2xl border border-[rgba(92,64,51,0.12)] shadow-[0_18px_50px_rgba(61,34,21,0.22)] overflow-hidden`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(92,64,51,0.08)]">
                <span className="text-sm font-medium text-[rgba(92,64,51,0.9)]">Notificaciones</span>
                {noLeidas.length > 0 && (
                  <button onClick={marcarTodas} className="inline-flex items-center gap-1 text-[11px] text-[rgba(92,64,51,0.55)] hover:text-[#5C4033]">
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-auto">
                {notis.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-6 h-6 text-[rgba(92,64,51,0.25)] mx-auto mb-2" />
                    <p className="text-[13px] text-[rgba(92,64,51,0.45)]">Sin notificaciones</p>
                  </div>
                ) : (
                  notis.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => !n.leida && marcar.mutate(n.id)}
                      className={`w-full text-left flex gap-3 px-4 py-3 border-b border-[rgba(92,64,51,0.05)] last:border-0 transition-colors hover:bg-[rgba(196,168,130,0.06)] ${n.leida ? 'opacity-60' : ''}`}
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.leida ? 'bg-transparent' : 'bg-[#C4A882]'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-[rgba(92,64,51,0.9)] truncate">{n.titulo}</span>
                        <span className="block text-[12px] text-[rgba(92,64,51,0.6)] line-clamp-2">{n.mensaje}</span>
                        <span className="block text-[10px] text-[rgba(92,64,51,0.4)] mt-0.5">{hace(n.fecha_creacion)}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
