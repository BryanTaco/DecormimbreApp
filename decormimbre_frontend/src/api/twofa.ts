import api from './client'

export interface TwoFASetup {
  secret: string
  otpauth_url: string
  qr: string // data URI (PNG)
}

export const twoFaApi = {
  status: () => api.get('/auth/2fa/status/'),
  setup: () => api.post('/auth/2fa/setup/'),
  enable: (code: string) => api.post('/auth/2fa/enable/', { code }),
  disable: (code: string) => api.post('/auth/2fa/disable/', { code }),
}
