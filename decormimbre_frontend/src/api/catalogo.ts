import api from './client'

export interface ProductoWeb {
  id?: string
  img: string
  category: string
  name: string
  material: string
  price: string
  desc: string
  stock?: number
  dias_produccion?: number
  dimensiones?: string
}

export const catalogoPublicoApi = {
  productos: () => api.get('/public/productos/'),
}

// ── Admin: CRUD de catálogo ───────────────────────────────────────────────────
export interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  imagen_url?: string
  orden?: number
  activo?: boolean
}

export interface ProductoAdmin {
  id?: string
  nombre: string
  descripcion: string
  precio_base: string
  stock_actual: number
  stock_minimo: number
  imagen_url: string
  categoria: string
  categoria_nombre?: string
  material: string
  tiempo_produccion_dias: number
  personalizable: boolean
  activo: boolean
}

export const catalogoAdminApi = {
  productos: {
    list: (params?: Record<string, string>) => api.get('/catalogo/productos/', { params }),
    create: (data: Partial<ProductoAdmin>) => api.post('/catalogo/productos/', data),
    update: (id: string, data: Partial<ProductoAdmin>) => api.patch(`/catalogo/productos/${id}/`, data),
    remove: (id: string) => api.delete(`/catalogo/productos/${id}/`),
  },
  categorias: {
    list: () => api.get('/catalogo/categorias/'),
    create: (data: Partial<Categoria>) => api.post('/catalogo/categorias/', data),
  },
}
