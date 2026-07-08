import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard, FileText, ShoppingBag, Package,
  Users, Truck, BarChart2, LogOut, Menu, X, Target, CheckSquare,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import BrandLogo from '@/components/BrandLogo'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pipeline', label: 'Embudo', icon: Target },
  { to: '/admin/tareas', label: 'Tareas', icon: CheckSquare },
  { to: '/admin/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/inventario', label: 'Inventario', icon: Package },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart2 },
]

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <BrandLogo size={30} />
      <span className="text-[rgba(92,64,51,0.9)] font-normal tracking-tighter text-base">
        DECORMIMBRE
      </span>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              isActive
                ? 'bg-[rgba(92,64,51,0.1)] text-[rgba(92,64,51,0.95)] font-normal'
                : 'text-[rgba(92,64,51,0.55)] hover:bg-[rgba(92,64,51,0.05)] hover:text-[rgba(92,64,51,0.8)]'
            }`
          }
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </>
  )
}

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) navigate('/admin/login')
  }, [user, navigate])

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  if (!user) return null

  const tituloActual = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ?? 'Admin'

  const logout = () => { clearAuth(); navigate('/admin/login') }

  return (
    <div className="flex min-h-screen bg-[#f5f0eb]">
      {/* Sidebar escritorio */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white/60 backdrop-blur-sm border-r border-[rgba(92,64,51,0.08)] py-6 px-4 gap-2">
        <div className="mb-6"><Brand /></div>
        <NavItems />
        <div className="mt-auto">
          <div className="px-3 py-2 mb-2">
            <p className="text-[11px] text-[rgba(92,64,51,0.5)] truncate">{user.email}</p>
            <p className="text-[11px] font-semibold text-[rgba(92,64,51,0.7)] uppercase tracking-wider">{user.rol}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[rgba(92,64,51,0.55)] hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Drawer móvil */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#f8f4ef] border-r border-[rgba(92,64,51,0.1)] py-6 px-4 flex flex-col gap-2 md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between mb-6">
                <Brand />
                <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg text-[rgba(92,64,51,0.6)] hover:bg-[rgba(92,64,51,0.06)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavItems onNavigate={() => setMenuOpen(false)} />
              <div className="mt-auto">
                <div className="px-3 py-2 mb-2">
                  <p className="text-[11px] text-[rgba(92,64,51,0.5)] truncate">{user.email}</p>
                  <p className="text-[11px] font-semibold text-[rgba(92,64,51,0.7)] uppercase tracking-wider">{user.rol}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[rgba(92,64,51,0.55)] hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar móvil */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/80 backdrop-blur-sm border-b border-[rgba(92,64,51,0.08)]">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="p-1.5 rounded-lg text-[rgba(92,64,51,0.7)] hover:bg-[rgba(92,64,51,0.06)]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-[rgba(92,64,51,0.85)]">{tituloActual}</span>
          <button onClick={logout} aria-label="Cerrar sesión" className="p-1.5 rounded-lg text-[rgba(92,64,51,0.6)] hover:bg-red-50 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
