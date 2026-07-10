import api from './client'

export interface ProductoBase {
  clave: string
  nombre: string
  imagen: string
  categoria: string
  material_base: string
  precio_base: number
  dimensiones: string
  incluye_cojin: boolean
}

export interface Cotizacion {
  producto: string
  imagen: string
  categoria: string
  material: string
  tamano: string
  color: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  iva: number
  total: number
  moneda: string
  especificaciones: {
    dimensiones: string
    estructura: string
    incluye_cojin: boolean
    tiempo_produccion: string
  }
  desglose: { concepto: string; valor: number }[]
  nota: string
}

export interface CotizarParams {
  producto: string
  material?: string
  tamano?: 'pequeno' | 'estandar' | 'grande'
  color?: string
  cantidad?: number
}

export const cotizadorApi = {
  productos: () => api.get('/public/cotizador/productos/'),
  cotizar: (data: CotizarParams) => api.post('/public/cotizador/', data),
}
