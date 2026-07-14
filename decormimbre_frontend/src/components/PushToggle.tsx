import { useEffect, useState } from 'react'
import { Bell, BellRing, Check } from 'lucide-react'
import { pushSoportado, estaSuscrito, activarPush } from '@/lib/push'

export default function PushToggle() {
  const [soportado, setSoportado] = useState(true)
  const [activo, setActivo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setSoportado(pushSoportado())
    estaSuscrito().then(setActivo)
  }, [])

  if (!soportado) return null

  const onClick = async () => {
    if (activo) return
    setCargando(true); setMsg('')
    const r = await activarPush()
    setCargando(false)
    setActivo(r.ok)
    setMsg(r.mensaje)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(196,168,130,0.2)', borderRadius: 18, padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: activo ? 'rgba(22,163,74,0.12)' : 'rgba(196,168,130,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {activo ? <BellRing size={20} color="#16a34a" /> : <Bell size={20} color="#7B5840" />}
        </div>
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#3d2215' }}>Avisos de tus pedidos</p>
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.55)' }}>
            {msg || (activo
              ? 'Activados en este dispositivo. También te avisamos por correo.'
              : 'Se activan por dispositivo: hazlo aquí y también en tu celular.')}
          </p>
        </div>
      </div>
      <button onClick={onClick} disabled={activo || cargando}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: activo ? 'rgba(22,163,74,0.1)' : '#5C4033', color: activo ? '#16a34a' : '#fff', border: 'none', padding: '10px 20px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: activo ? 'default' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
        {activo ? <><Check size={15} /> Activadas</> : cargando ? 'Activando…' : 'Activar notificaciones'}
      </button>
    </div>
  )
}
