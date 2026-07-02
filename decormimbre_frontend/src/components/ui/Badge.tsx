const COTIZACION: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  ENVIADA: 'bg-blue-50 text-blue-700',
  APROBADA: 'bg-green-50 text-green-700',
  RECHAZADA: 'bg-red-50 text-red-600',
  VENCIDA: 'bg-orange-50 text-orange-600',
}

const PEDIDO: Record<string, string> = {
  PENDIENTE: 'bg-gray-100 text-gray-600',
  CONFIRMADO: 'bg-blue-50 text-blue-700',
  EN_PRODUCCION: 'bg-amber-50 text-amber-700',
  LISTO_ENTREGA: 'bg-purple-50 text-purple-700',
  ENTREGADO: 'bg-green-50 text-green-700',
  CANCELADO: 'bg-red-50 text-red-600',
}

const TAREA: Record<string, string> = {
  PENDIENTE: 'bg-gray-100 text-gray-500',
  EN_PROCESO: 'bg-amber-50 text-amber-700',
  COMPLETADA: 'bg-green-50 text-green-700',
}

const ORDEN: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  ENVIADA: 'bg-blue-50 text-blue-700',
  CONFIRMADA: 'bg-indigo-50 text-indigo-700',
  EN_PROCESO: 'bg-amber-50 text-amber-700',
  RECIBIDA: 'bg-green-50 text-green-700',
  CANCELADA: 'bg-red-50 text-red-600',
}

const MAPS: Record<string, Record<string, string>> = {
  cotizacion: COTIZACION,
  pedido: PEDIDO,
  tarea: TAREA,
  orden: ORDEN,
}

const LABELS: Record<string, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada', VENCIDA: 'Vencida', PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado', EN_PRODUCCION: 'En producción',
  LISTO_ENTREGA: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
  EN_PROCESO: 'En proceso', COMPLETADA: 'Completada', CONFIRMADA: 'Confirmada',
  RECIBIDA: 'Recibida',
}

interface Props {
  value: string
  type?: 'cotizacion' | 'pedido' | 'tarea' | 'orden'
}

export default function Badge({ value, type = 'cotizacion' }: Props) {
  const cls = (MAPS[type] ?? COTIZACION)[value] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {LABELS[value] ?? value}
    </span>
  )
}
