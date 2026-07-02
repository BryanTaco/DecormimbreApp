import api from './client'

export interface TareaProduccion {
  id: string
  tipo: string
  tipo_display: string
  estado: string
  estado_display: string
  artesano: string | null
  artesano_nombre: string | null
  orden: number
  notas: string
  iniciada_en: string | null
  completada_en: string | null
}

export interface ItemPedido {
  id: string
  producto: string
  producto_nombre: string
  cantidad: number
  precio_unitario: string
  subtotal: string
  ancho_cm?: string
  alto_cm?: string
  colores?: string[]
  observaciones?: string
}

export interface Pedido {
  id: string
  numero: string
  cliente: string
  cliente_nombre: string
  estado: string
  etapa_produccion: string
  forma_pago: string
  subtotal: string
  iva: string
  total: string
  fecha_promesa_entrega: string | null
  creado_en: string
  items: ItemPedido[]
  tareas: TareaProduccion[]
  porcentaje_completado: number
}

export const pedidosApi = {
  list: (params?: Record<string, string>) => api.get('/pedidos/', { params }),
  detail: (id: string) => api.get(`/pedidos/${id}/`),
  cambiarEstado: (id: string, nuevo_estado: string) =>
    api.post(`/pedidos/${id}/estado/`, { nuevo_estado }),
  tareas: (id: string) => api.get(`/pedidos/${id}/tareas/`),
  asignarArtesano: (tareaId: string, artesanoId: string) =>
    api.patch(`/pedidos/tareas/${tareaId}/asignar/`, { artesano: artesanoId }),
  completarTarea: (tareaId: string, notas?: string) =>
    api.post(`/pedidos/tareas/${tareaId}/completar/`, { notas }),
  fichaUrl: (id: string, rol?: string) =>
    `/api/v1/pedidos/${id}/ficha/${rol ? `?rol=${rol}` : ''}`,
}
