import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  nombre: string
  rol: 'ADMIN' | 'PROPIETARIO' | 'ARTESANO'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, access: string, refresh: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, access, refresh) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, accessToken: access })
      },
      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'decormimbre-auth', partialize: (s) => ({ user: s.user }) }
  )
)
