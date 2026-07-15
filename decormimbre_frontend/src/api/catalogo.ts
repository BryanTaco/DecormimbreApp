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
