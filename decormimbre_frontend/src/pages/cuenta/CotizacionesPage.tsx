import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { FileText, ExternalLink, Search, Filter } from 'lucide-react'
import { getMisCotizaciones } from '@/api/authApi'

const ESTADO_COLOR: Record<string, string> = {
  APROBADA: '#22c55e', PENDIENTE: '#f59e0b', RECHAZADA: '#ef4444',
  EN_REVISION: '#3b82f6', BORRADOR: '#94a3b8',
}
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente revisión', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada',
  EN_REVISION: 'En revisión', BORRADOR: 'Borrador',
}
const FILTROS = ['Todas', 'PENDIENTE', 'APROBADA', 'RECHAZADA']

export default function CotizacionesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    getMisCotizaciones()
      .then((d) => setData(d.results ?? d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter((c) => {
    const matchFiltro = filtro === 'Todas' || c.estado === filtro
    const term = busqueda.toLowerCase()
    const matchBusq = !term || (c.codigo ?? '').toLowerCase().includes(term) || (c.tipo_mueble ?? '').toLowerCase().includes(term)
    return matchFiltro && matchBusq
  })

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>Mi portal</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, fontStyle: 'italic', color: '#3d2215', margin: '0 0 28px', letterSpacing: '-0.02em' }}>Mis cotizaciones</h1>
      </motion.div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={14} color="rgba(92,64,51,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cotización…" style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 34, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: '1.5px solid rgba(196,168,130,0.3)', background: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontSize: 13, color: '#3d2215', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', borderColor: filtro === f ? '#5C4033' : 'rgba(196,168,130,0.3)', background: filtro === f ? '#5C4033' : 'rgba(255,255,255,0.6)', color: filtro === f ? '#fff' : 'rgba(92,64,51,0.7)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 180ms' }}>
              {f === 'Todas' ? 'Todas' : (ESTADO_LABEL[f] ?? f)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(196,168,130,0.18)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(196,168,130,0.3)', borderTopColor: '#5C4033', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <FileText size={32} color="rgba(196,168,130,0.5)" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', color: 'rgba(92,64,51,0.5)', margin: '0 0 6px' }}>Sin cotizaciones</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.4)', margin: '0 0 18px' }}>Diseña tu mueble y solicita tu primera cotización.</p>
            <Link to="/personalizar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#5C4033', color: '#fff', padding: '10px 20px', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Personalizar mueble
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px 100px', gap: 0, padding: '12px 22px', borderBottom: '1px solid rgba(196,168,130,0.15)', background: 'rgba(245,240,235,0.5)' }}>
              {['Código', 'Mueble', 'Fecha', 'Estado', ''].map(h => (
                <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(92,64,51,0.45)' }}>{h}</span>
              ))}
            </div>
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px 100px', gap: 0, padding: '16px 22px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(196,168,130,0.1)' : 'none', alignItems: 'center', transition: 'background 180ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,240,235,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215' }}>{c.codigo ?? `COT-${c.id?.slice(0, 6).toUpperCase()}`}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(92,64,51,0.7)' }}>{c.tipo_mueble ?? '—'}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(92,64,51,0.5)' }}>{c.fecha_solicitud ? new Date(c.fecha_solicitud).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) : '—'}</span>
                <span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: ESTADO_COLOR[c.estado] ?? '#94a3b8', background: `${ESTADO_COLOR[c.estado] ?? '#94a3b8'}18`, padding: '3px 8px', borderRadius: 99 }}>
                    {ESTADO_LABEL[c.estado] ?? c.estado}
                  </span>
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {c.total && <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', color: '#5C4033', fontWeight: 500 }}>${Number(c.total).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>}
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      <div style={{ marginTop: 18, textAlign: 'right' }}>
        <Link to="/personalizar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#5C4033', color: '#fff', padding: '11px 22px', borderRadius: 11, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          + Nueva cotización
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
