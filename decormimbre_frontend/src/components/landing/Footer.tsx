import { Link } from 'react-router-dom'
import Logo from './Logo'

const LINKS = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Personalizar', to: '/personalizar' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Materiales', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: '#1e1008',
        color: 'rgba(255,255,255,0.6)',
        padding: '56px 40px 40px',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-4">
              <Logo color="rgba(255,255,255,0.7)" size={30} />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                }}
              >
                Decormimbre
              </span>
            </Link>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.6,
                maxWidth: 260,
                fontWeight: 300,
                margin: 0,
              }}
            >
              Muebles artesanales de mimbre y polialuminio, tejidos a mano en Ecuador.
            </p>
          </div>

          {/* Nav */}
          <div className="flex gap-12">
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.3)',
                  margin: '0 0 16px',
                }}
              >
                Navegación
              </p>
              <ul className="flex flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.55)',
                        textDecoration: 'none',
                        transition: 'color 200ms',
                        fontWeight: 300,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.3)',
                  margin: '0 0 16px',
                }}
              >
                Contacto
              </p>
              <div
                className="flex flex-col gap-2"
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}
              >
                <span>info@decormimbre.ec</span>
                <span>+593 99 000 0000</span>
                <span>Quito, Ecuador</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.25)',
              margin: 0,
              fontWeight: 300,
            }}
          >
            © {new Date().getFullYear()} Decormimbre. Todos los derechos reservados.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.2)',
              margin: 0,
              fontWeight: 300,
            }}
          >
            Arte artesanal ecuatoriano desde 2009
          </p>
        </div>
      </div>
    </footer>
  )
}
