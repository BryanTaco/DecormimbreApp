import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'

// Página de error/404 propia. Si el fallo es por un chunk viejo (tras un
// redeploy o HMR), recarga una sola vez para traer los módulos frescos.
export default function RouteError() {
  const error = useRouteError() as unknown
  const navigate = useNavigate()

  const msg =
    (error as { message?: string })?.message ||
    (isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : '')

  const esChunkViejo = /dynamically imported module|module script failed|Failed to fetch/i.test(msg)
  if (esChunkViejo && !sessionStorage.getItem('chunk-reloaded')) {
    sessionStorage.setItem('chunk-reloaded', '1')
    window.location.reload()
    return null
  }

  const es404 = isRouteErrorResponse(error) && error.status === 404
  const titulo = es404 || !error ? 'Página no encontrada' : 'Algo salió mal'
  const detalle = es404 || !error
    ? 'La página que buscas no existe o fue movida.'
    : 'Ocurrió un error al cargar esta sección. Intenta recargar.'

  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(92,64,51,0.45)', margin: '0 0 8px' }}>
        {es404 ? 'Error 404' : 'Error'}
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontStyle: 'italic', color: '#3d2215', margin: '0 0 10px' }}>{titulo}</h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(92,64,51,0.6)', margin: '0 0 24px', maxWidth: 380, lineHeight: 1.6 }}>{detalle}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => window.location.reload()} style={{ background: '#5C4033', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Recargar
        </button>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(92,64,51,0.08)', color: '#5C4033', border: '1px solid rgba(92,64,51,0.15)', padding: '11px 22px', borderRadius: 99, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Ir al inicio
        </button>
      </div>
    </div>
  )
}
