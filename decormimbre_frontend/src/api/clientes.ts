import api from './client'

export interface Cliente {
  id: string
  nombre: string
  apellido: string
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
