import api from './client'

export interface Proveedor {
  id: string
  nombre: string
  ruc: string
  tipo: string
  contacto_nombre: string
  contacto_telefono: string
  contacto_email: string
  direccion: string
  activo: boolean
}

export interface OrdenTrabajo {
  id: string
  numero: string
  proveedor: string
  proveedor_nombre: string
  estado: string
  descripcion: string
  monto_acordado: string
  creado_en: string
}

export const proveedoresApi = {
  list: (params?: Record<string, string>) => api.get('/proveedores/', { params }),
  detail: (id: string) => api.get(`/proveedores/${id}/`),
  create: (data: Partial<Proveedor>) => api.post('/proveedores/', data),
  update: (id: string, data: Partial<Proveedor>) => api.put(`/proveedores/${id}/`, data),
  ordenes: {
    list: (params?: Record<string, string>) => api.get('/proveedores/ordenes/', { params }),
    create: (data: Partial<OrdenTrabajo>) => api.post('/proveedores/ordenes/', data),
    update: (id: string, data: Partial<OrdenTrabajo>) => api.put(`/proveedores/ordenes/${id}/`, data),
  },
}
