import { createBrowserRouter, Outlet } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import RouteError from '@/components/RouteError'

const lazy = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  importFn().then((m) => ({ Component: m.default }))

export const router = createBrowserRouter([
  {
    // Raíz sin layout: captura cualquier error (404, chunk viejo, etc.)
    element: <Outlet />,
    errorElement: <RouteError />,
    // Evita el warning de hidratación inicial con rutas lazy
    hydrateFallbackElement: <div style={{ minHeight: '100vh', background: '#f5f0eb' }} />,
    children: [
  // Landing
  { path: '/', element: <LandingPage /> },
  { path: '/catalogo', lazy: () => lazy(() => import('@/pages/landing/CatalogoPage')) },
  { path: '/nosotros', lazy: () => lazy(() => import('@/pages/landing/NosotrosPage')) },
  { path: '/contacto', lazy: () => lazy(() => import('@/pages/landing/ContactoPage')) },
  { path: '/personalizar', lazy: () => lazy(() => import('@/pages/landing/PersonalizarPage')) },
  { path: '/cotizar', lazy: () => lazy(() => import('@/pages/landing/CotizarPage')) },

  // Client auth
  { path: '/login', lazy: () => lazy(() => import('@/pages/auth/LoginPage')) },
  { path: '/registro', lazy: () => lazy(() => import('@/pages/auth/RegistroPage')) },

  // Client portal
  {
    path: '/cuenta',
    lazy: () => lazy(() => import('@/pages/cuenta/CuentaLayout')),
    children: [
      { index: true, lazy: () => lazy(() => import('@/pages/cuenta/CuentaDashboard')) },
      { path: 'cotizaciones', lazy: () => lazy(() => import('@/pages/cuenta/CotizacionesPage')) },
      { path: 'pedidos', lazy: () => lazy(() => import('@/pages/cuenta/PedidosPage')) },
      { path: 'pedidos/:id', lazy: () => lazy(() => import('@/pages/cuenta/PedidoDetalle')) },
    ],
  },

  // Taller (artesano)
  { path: '/taller', lazy: () => lazy(() => import('@/pages/taller/TallerPage')) },

  // Admin
  { path: '/admin/login', lazy: () => lazy(() => import('@/pages/admin/Login')) },
  {
    path: '/admin',
    lazy: () => lazy(() => import('@/pages/admin/AdminLayout')),
    children: [
      { index: true, lazy: () => lazy(() => import('@/pages/admin/Dashboard')) },
      { path: 'pipeline', lazy: () => lazy(() => import('@/pages/admin/crm/PipelinePage')) },
      { path: 'tareas', lazy: () => lazy(() => import('@/pages/admin/crm/TareasPage')) },
      { path: 'clientes', lazy: () => lazy(() => import('@/pages/admin/clientes/ClientesPage')) },
      { path: 'clientes/:id', lazy: () => lazy(() => import('@/pages/admin/clientes/ClienteDetalle')) },
      { path: 'cotizaciones', lazy: () => lazy(() => import('@/pages/admin/cotizaciones/CotizacionesPage')) },
      { path: 'cotizaciones/:id', lazy: () => lazy(() => import('@/pages/admin/cotizaciones/CotizacionDetalle')) },
      { path: 'pedidos', lazy: () => lazy(() => import('@/pages/admin/pedidos/PedidosPage')) },
      { path: 'pedidos/:id', lazy: () => lazy(() => import('@/pages/admin/pedidos/PedidoDetalle')) },
      { path: 'inventario', lazy: () => lazy(() => import('@/pages/admin/inventario/InventarioPage')) },
      { path: 'proveedores', lazy: () => lazy(() => import('@/pages/admin/proveedores/ProveedoresPage')) },
      { path: 'reportes', lazy: () => lazy(() => import('@/pages/admin/reportes/ReportesPage')) },
    ],
  },

  // Catch-all: cualquier ruta no encontrada
  { path: '*', element: <RouteError /> },
    ],
  },
])
