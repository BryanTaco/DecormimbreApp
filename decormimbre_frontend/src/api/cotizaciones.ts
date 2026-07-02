import api from './client'

export interface ItemCotizacion {
  id: string
  producto: string
  producto_nombre: string
  cantidad: number
  precio_unitario: string
  descuento: number
  subtotal: string
  ancho_cm?: string
  alto_cm?: string
  observaciones?: string
}

export interface Cotizacion {
  id: string
  numero: string
  cliente: string
  cliente_nombre: string
  estado: string
  forma_pago: string
  subtotal: string
  iva: string
  total: string
  observaciones: string
  fecha_expiracion: string | null
  creado_en: string
  items: ItemCotizacion[]
}

export const cotizacionesApi = {
  list: (params?: Record<string, string>) => api.get('/cotizaciones/', { params }),
  detail: (id: string) => api.get(`/cotizaciones/${id}/`),
  create: (data: Partial<Cotizacion>) => api.post('/cotizaciones/', data),
  update: (id: string, data: Partial<Cotizacion>) => api.put(`/cotizaciones/${id}/`, data),
  cambiarEstado: (id: string, nuevo_estado: string) =>
    api.post(`/cotizaciones/${id}/estado/`, { nuevo_estado }),
  versiones: (id: string) => api.get(`/cotizaciones/${id}/versiones/`),
  addItem: (id: string, data: Partial<ItemCotizacion>) =>
    api.post(`/cotizaciones/${id}/items/`, data),
  updateItem: (id: string, itemId: string, data: Partial<ItemCotizacion>) =>
    api.put(`/cotizaciones/${id}/items/${itemId}/`, data),
  deleteItem: (id: string, itemId: string) =>
    api.delete(`/cotizaciones/${id}/items/${itemId}/`),
  pdfUrl: (id: string) => `/api/v1/cotizaciones/${id}/pdf/`,
}
