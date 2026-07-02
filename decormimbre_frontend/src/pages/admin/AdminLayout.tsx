import { useEffect } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, ShoppingBag, Package,
  Users, Truck, BarChart2, Leaf, LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/inventario', label: 'Inventario', icon: Package },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart2 },
]

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/admin/login')
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-[#f5f0eb]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white/60 backdrop-blur-sm border-r border-[rgba(92,64,51,0.08)] py-6 px-4 gap-2">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-[rgba(92,64,51,0.1)] flex items-center justify-center">
            <Leaf className="w-4 h-4 text-[rgba(92,64,51,0.8)]" />
          </div>
          <span className="text-[rgba(92,64,51,0.9)] font-normal tracking-tighter text-base">
            DECORMIMBRE
          </span>
        </div>

        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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

        <div className="mt-auto">
          <div className="px-3 py-2 mb-2">
            <p className="text-[11px] text-[rgba(92,64,51,0.5)] truncate">{user.email}</p>
            <p className="text-[11px] font-semibold text-[rgba(92,64,51,0.7)] uppercase tracking-wider">
              {user.rol}
            </p>
          </div>
          <button
            onClick={() => { clearAuth(); navigate('/admin/login') }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[rgba(92,64,51,0.55)] hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
