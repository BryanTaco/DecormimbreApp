import api from './client'

export interface Cliente {
  id: string
  nombre_completo: string
  // compat con formularios antiguos
  nombre?: string
  apellido?: string
  tipo?: string
  notas?: string
  cedula_ruc: string
  email: string
  telefono: string
  direccion: string
  activo: boolean
  fecha_registro: string
}

export const clientesApi = {
  list: (params?: Record<string, string>) => api.get('/clientes/', { params }),
  detail: (id: string) => api.get(`/clientes/${id}/`),
  create: (data: Partial<Cliente>) => api.post('/clientes/', data),
  update: (id: string, data: Partial<Cliente>) => api.put(`/clientes/${id}/`, data),
}
