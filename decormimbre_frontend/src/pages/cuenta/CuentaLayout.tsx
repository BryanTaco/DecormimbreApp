import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { LayoutDashboard, FileText, Package, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import BrandLogo from '@/components/BrandLogo'
import NotificationsBell from '@/components/admin/NotificationsBell'
import { useEffect, useState } from 'react'

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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: location.pathname } }); return }
    if (user.rol !== 'CLIENTE') navigate('/admin')
  }, [user, navigate, location.pathname])

  // Cerrar drawer al navegar y bloquear scroll de fondo
  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])

  if (!user) return null

  const logout = () => { clearAuth(); navigate('/') }
  const initials = user.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const SidebarInner = () => (
    <>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(196,168,130,0.15)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandLogo size={30} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, letterSpacing: '0.08em', color: '#5C4033', textTransform: 'uppercase' }}>Decormimbre</span>
        </Link>
      </div>

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

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {MENU.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: isActive ? 'rgba(92,64,51,0.09)' : 'transparent', color: isActive ? '#5C4033' : 'rgba(92,64,51,0.6)', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: isActive ? 600 : 400, transition: 'all 180ms' }}>
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 12px 24px', borderTop: '1px solid rgba(196,168,130,0.12)' }}>
        <div className="flex items-center gap-1">
          <NotificationsBell placement="up" />
          <button onClick={logout} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'none', border: 'none', color: 'rgba(92,64,51,0.55)', fontFamily: 'var(--font-body)', fontSize: 13.5, cursor: 'pointer' }}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }} className="md:flex">
      {/* Sidebar escritorio */}
      <aside className="hidden md:flex" style={{ width: 240, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(196,168,130,0.2)', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <SidebarInner />
      </aside>

      {/* Topbar móvil */}
      <header className="md:hidden" style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(245,240,235,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,168,130,0.2)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandLogo size={26} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', color: '#5C4033', textTransform: 'uppercase' }}>Decormimbre</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationsBell placement="down" />
          <button onClick={() => setOpen(true)} aria-label="Abrir menú" style={{ background: 'none', border: 'none', color: '#5C4033', cursor: 'pointer', padding: 4 }}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Drawer móvil */}
      <AnimatePresence>
        {open && (
          <div className="md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,8,4,0.4)', zIndex: 50 }} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.25 }}
              style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, maxWidth: '82vw', background: '#fbf8f5', borderRight: '1px solid rgba(196,168,130,0.2)', display: 'flex', flexDirection: 'column', zIndex: 51 }}>
              <button onClick={() => setOpen(false)} aria-label="Cerrar menú" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#5C4033', cursor: 'pointer', zIndex: 1 }}>
                <X size={22} />
              </button>
              <SidebarInner />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
