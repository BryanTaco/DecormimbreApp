import axios from 'axios'
import api from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: string
  clienteId?: string
}

export interface LoginResult {
  access: string
  refresh: string
  user: AuthUser
}

export async function loginCliente(payload: LoginPayload): Promise<LoginResult> {
  // Response: {success, data:{access, refresh}, message}
  const { data: body } = await axios.post('/api/v1/auth/token/', payload)
  const tokens = body.data ?? body
  const access: string = tokens.access
  const refresh: string = tokens.refresh

  // Fetch user info with the new token
  const { data: meBody } = await axios.get('/api/v1/auth/me/', {
    headers: { Authorization: `Bearer ${access}` },
  })
  const me = meBody.data ?? meBody

  return {
    access,
    refresh,
    user: {
      id: me.id,
      email: me.email,
      nombre: me.nombre,
      rol: me.rol,
      clienteId: me.cliente_id ?? undefined,
    },
  }
}

export async function registrarCliente(payload: RegisterPayload) {
  const { data: body } = await axios.post('/api/v1/auth/registro/', payload)
  return body.data ?? body
}

export async function getMe() {
  const { data: body } = await api.get('/auth/me/')
  return body.data ?? body
}

export async function getMisCotizaciones() {
  const { data: body } = await api.get('/clientes/mis-cotizaciones/')
  return body.data ?? body
}

export async function getMisPedidos() {
  const { data: body } = await api.get('/clientes/mis-pedidos/')
  return body.data ?? body
}

export async function getMiPedido(id: string) {
  const { data: body } = await api.get(`/clientes/mis-pedidos/${id}/`)
  return body.data ?? body
}

export async function getNotificaciones() {
  const { data: body } = await api.get('/auth/notificaciones/')
  return body.data ?? body
}

export async function marcarNotificacionLeida(id: string) {
  const { data: body } = await api.post(`/auth/notificaciones/${id}/leer/`)
  return body.data ?? body
}
