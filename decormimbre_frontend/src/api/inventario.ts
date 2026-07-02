import api from './client'

export interface MateriaPrima {
  id: string
  nombre: string
  unidad: string
  stock_actual: string
  stock_minimo: string
  costo_unitario: string
  activo: boolean
  en_stock_critico: boolean
}

export interface Lote {
  id: string
  materia_prima: string
  numero_lote: string
  cantidad_inicial: string
  cantidad_disponible: string
  costo_unitario: string
  fecha_recepcion: string
}

export interface AlertaStock {
  id: number
  materia_prima: string
  materia_prima_nombre: string
  unidad: string
  stock_al_momento: string
  stock_minimo: string
  revisada: boolean
  fecha_alerta: string
}

export const inventarioApi = {
  materias: {
    list: (params?: Record<string, string>) => api.get('/inventario/materias/', { params }),
    detail: (id: string) => api.get(`/inventario/materias/${id}/`),
    create: (data: Partial<MateriaPrima>) => api.post('/inventario/materias/', data),
    update: (id: string, data: Partial<MateriaPrima>) => api.put(`/inventario/materias/${id}/`, data),
  },
  lotes: {
    list: (params?: Record<string, string>) => api.get('/inventario/lotes/', { params }),
    create: (data: Partial<Lote>) => api.post('/inventario/lotes/', data),
  },
  ajuste: (data: { materia_prima: string; tipo: string; cantidad: string; justificacion: string }) =>
    api.post('/inventario/ajustes/', data),
  alertas: {
    list: () => api.get('/inventario/alertas/'),
    revisar: (id: number) => api.put(`/inventario/alertas/${id}/revisar/`),
  },
}
