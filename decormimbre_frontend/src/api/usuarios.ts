import api from './client'

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
}

export const usuariosApi = {
  list: () => api.get('/auth/usuarios/'),
  create: (data: Partial<Usuario> & { password: string }) => api.post('/auth/usuarios/', data),
  update: (id: string, data: Partial<Usuario>) => api.put(`/auth/usuarios/${id}/`, data),
  deactivate: (id: string) => api.delete(`/auth/usuarios/${id}/`),
  artesanos: () => api.get('/auth/usuarios/', { params: { rol: 'ARTESANO' } }),
}
