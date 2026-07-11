import api from './client'

export interface ItemTarea {
  producto: string
  cantidad: number
  ancho_cm: string | null
  alto_cm: string | null
  largo_cm: string | null
  color: string | null
  observaciones: string
}

export interface Material {
  nombre: string
  unidad: string
  requerido: string
  disponible: string
  faltante: string
  suficiente: boolean
}

export interface TareaArtesano {
  tarea_id: string
  tipo: string
  tipo_display: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA'
  pedido_numero: string
  pedido_id: string
  cliente: string
  fecha_promesa_entrega: string | null
  items: ItemTarea[]
  iniciada_en: string | null
  notas: string
  esperando: string | null
  bloqueada: boolean
  materiales: Material[]
  requiere_pedido: boolean
}

export const tallerApi = {
  misTareas: () => api.get('/pedidos/artesano/mis-tareas/'),
  completar: (tareaId: string, notas = '') => api.post(`/pedidos/tareas/${tareaId}/completar/`, { notas }),
  solicitarMaterial: (tareaId: string, nota = '') => api.post(`/pedidos/tareas/${tareaId}/solicitar-material/`, { nota }),
  fichaUrl: (tareaId: string) => `/api/v1/pedidos/tareas/${tareaId}/ficha/`,
}
