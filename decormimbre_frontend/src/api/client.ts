import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => {
    // El backend envuelve todo en { success, data, meta }. Lo desenvolvemos
    // aquí para que las páginas lean el contenido directo en `response.data`.
    const body = r.data
    if (body && typeof body === 'object' && !Array.isArray(body) && 'success' in body && 'data' in body) {
      if ('meta' in body) (r as unknown as { meta: unknown }).meta = body.meta
      r.data = body.data
    }
    return r
  },
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          useAuthStore.getState().clearAuth()
          const rol = useAuthStore.getState().user?.rol
          window.location.href = rol === 'CLIENTE' ? '/login' : '/admin/login'
        }
      } else {
        useAuthStore.getState().clearAuth()
        const path = window.location.pathname
        if (path.startsWith('/admin')) {
          window.location.href = '/admin/login'
        } else if (path.startsWith('/cuenta')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
