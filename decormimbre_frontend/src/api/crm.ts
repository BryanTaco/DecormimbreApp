import api from './client'

export const ETAPAS = ['NUEVO', 'CONTACTADO', 'COTIZANDO', 'NEGOCIACION', 'GANADO', 'PERDIDO'] as const
export type Etapa = (typeof ETAPAS)[number]

export const ETAPA_LABEL: Record<Etapa, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  COTIZANDO: 'Cotizando',
  NEGOCIACION: 'Negociación',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
}

export interface Oportunidad {
  id: string
  titulo: string
  cliente: string | null
  cliente_nombre: string | null
  contacto_nombre: string
  contacto_telefono: string
  contacto_email: string
  etapa: Etapa
  etapa_display: string
  valor_estimado: string
  probabilidad: number
  fuente: string
  responsable: string | null
  responsable_nombre: string | null
  descripcion: string
  fecha_cierre_estimada: string | null
  fecha_creacion: string
  cerrada_en: string | null
}

export interface Interaccion {
  id: string
  cliente: string | null
  oportunidad: string | null
  tipo: string
  tipo_display: string
  descripcion: string
  usuario_nombre: string | null
  fecha: string
}

export interface Tarea {
  id: string
  titulo: string
  descripcion: string
  cliente: string | null
  cliente_nombre: string | null
  oportunidad: string | null
  oportunidad_titulo: string | null
  responsable: string | null
  responsable_nombre: string | null
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  fecha_vencimiento: string | null
  completada: boolean
  completada_en: string | null
  fecha_creacion: string
}

export const crmApi = {
  oportunidades: {
    list: (params?: Record<string, string>) => api.get('/crm/oportunidades/', { params }),
    create: (data: Partial<Oportunidad>) => api.post('/crm/oportunidades/', data),
    update: (id: string, data: Partial<Oportunidad>) => api.put(`/crm/oportunidades/${id}/`, data),
    remove: (id: string) => api.delete(`/crm/oportunidades/${id}/`),
  },
  interacciones: {
    list: (params?: Record<string, string>) => api.get('/crm/interacciones/', { params }),
    create: (data: Partial<Interaccion>) => api.post('/crm/interacciones/', data),
  },
  tareas: {
    list: (params?: Record<string, string>) => api.get('/crm/tareas/', { params }),
    create: (data: Partial<Tarea>) => api.post('/crm/tareas/', data),
    update: (id: string, data: Partial<Tarea>) => api.put(`/crm/tareas/${id}/`, data),
    remove: (id: string) => api.delete(`/crm/tareas/${id}/`),
  },
  cliente360: (id: string) => api.get(`/crm/clientes/${id}/360/`),
  pipelineResumen: () => api.get('/crm/pipeline/resumen/'),
}
