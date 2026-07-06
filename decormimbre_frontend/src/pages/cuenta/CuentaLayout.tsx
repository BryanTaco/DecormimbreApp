import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LayoutDashboard, FileText, Package, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/landing/Logo'
import { useEffect } from 'react'

const MENU = [
  { to: '/cuenta', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { to: '/cuenta/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/cuenta/pedidos', label: 'Pedidos', icon: Package },
]

export default function CuentaLayout() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: location.pathname } }); return }
    if (user.rol !== 'CLIENTE') navigate('/admin')
  }, [user])

  if (!user) return null

  const logout = () => { clearAuth(); navigate('/') }

  const initials = user.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f5f0eb' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(196,168,130,0.2)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(196,168,130,0.15)' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo color="#5C4033" size={24} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, letterSpacing: '0.08em', color: '#5C4033', textTransform: 'uppercase' }}>Decormimbre</span>
          </Link>
        </div>

        {/* User info */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(196,168,130,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #7B5840, #C4A882)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)' }}>{initials}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3d2215', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(92,64,51,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {MENU.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: isActive ? 'rgba(92,64,51,0.09)' : 'transparent', color: isActive ? '#5C4033' : 'rgba(92,64,51,0.6)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 180ms' }}>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                  {isActive && <motion.div layoutId="sidebar-indicator" style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#5C4033' }} />}
                </div>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '16px 12px 24px', borderTop: '1px solid rgba(196,168,130,0.12)' }}>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'none', border: 'none', color: 'rgba(92,64,51,0.55)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', transition: 'color 180ms, background 180ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,60,40,0.06)'; e.currentTarget.style.color = '#b02020' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(92,64,51,0.55)' }}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
