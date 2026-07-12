import api from '@/api/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSoportado(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function estaSuscrito(): Promise<boolean> {
  if (!pushSoportado()) return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return false
    return !!(await reg.pushManager.getSubscription())
  } catch {
    return false
  }
}

export async function activarPush(): Promise<{ ok: boolean; mensaje: string }> {
  if (!pushSoportado()) return { ok: false, mensaje: 'Tu navegador no soporta notificaciones push.' }
  try {
    const permiso = await Notification.requestPermission()
    if (permiso !== 'granted') return { ok: false, mensaje: 'Permiso de notificaciones denegado.' }

    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const { data } = await api.get('/auth/push/public-key/')
    const publicKey: string = data?.publicKey
    if (!publicKey) return { ok: false, mensaje: 'El servidor no tiene el push configurado.' }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    await api.post('/auth/push/subscribe/', { endpoint: json.endpoint, keys: json.keys })
    return { ok: true, mensaje: '¡Notificaciones activadas! Te avisaremos del estado de tus pedidos.' }
  } catch (e) {
    return { ok: false, mensaje: 'No se pudo activar. Intenta de nuevo.' }
  }
}

export async function desactivarPush(): Promise<void> {
  if (!pushSoportado()) return
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = reg && (await reg.pushManager.getSubscription())
    if (sub) {
      await api.post('/auth/push/unsubscribe/', { endpoint: sub.endpoint })
      await sub.unsubscribe()
    }
  } catch {
    // silencioso
  }
}
