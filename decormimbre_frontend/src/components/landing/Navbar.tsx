import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import Logo from './Logo'

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Personalizar', to: '/personalizar' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
]

interface NavbarProps {
  theme?: 'dark' | 'light'
}

export default function Navbar({ theme = 'dark' }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const isDark = theme === 'dark'
  const textColor = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(92,64,51,0.9)'
  const activeColor = isDark ? '#fff' : '#5C4033'
  const borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(92,64,51,0.12)'

  return (
    <>
      <nav
        className="flex items-center justify-between py-5 px-6 md:px-10 w-full"
        style={{ position: 'relative', zIndex: 60 }}
      >
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <Logo color={isDark ? '#fff' : '#5C4033'} size={32} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: isDark ? '#fff' : '#5C4033',
              textTransform: 'uppercase',
              lineHeight: 1,
              transition: 'opacity 200ms',
            }}
          >
            Decormimbre
          </span>
        </Link>

        {/* Links desktop */}
        <ul className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  style={{
                    color: isActive ? activeColor : textColor,
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: '0.02em',
                    textDecoration: 'none',
                    position: 'relative',
                    paddingBottom: '2px',
                    transition: 'color 200ms',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        backgroundColor: activeColor,
                        opacity: 0.6,
                      }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-4">
          <Link
            to="/contacto"
            style={{ textDecoration: 'none' }}
            className="hidden md:flex"
          >
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full py-2 pl-2 pr-5"
              style={{
                background: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(92,64,51,0.88)',
                border: `1px solid ${borderColor}`,
                backdropFilter: 'blur(8px)',
                color: isDark ? '#fff' : '#fff',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                transition: 'background 200ms',
              }}
            >
              <span
                className="flex items-center justify-center rounded-full w-6 h-6"
                style={{ background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.22)' }}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              Cotizar ahora
            </motion.span>
          </Link>

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            style={{ color: isDark ? '#fff' : '#5C4033', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 90,
              background: isDark ? 'rgba(30,18,10,0.97)' : '#f5f0eb',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
            }}
          >
            <div className="flex items-center justify-between mb-12">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 no-underline">
                <Logo color={isDark ? '#fff' : '#5C4033'} size={28} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 500, letterSpacing: '0.08em', color: isDark ? '#fff' : '#5C4033', textTransform: 'uppercase' }}>
                  Decormimbre
                </span>
              </Link>
              <button onClick={() => setOpen(false)} style={{ color: isDark ? '#fff' : '#5C4033', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <ul className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '38px',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(92,64,51,0.9)',
                      textDecoration: 'none',
                      lineHeight: 1.1,
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Link to="/contacto" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                <span
                  className="flex items-center gap-2 rounded-full py-3 px-5 w-fit"
                  style={{ background: 'rgba(92,64,51,0.9)', color: '#fff', fontSize: '14px', fontWeight: 500 }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Solicitar cotización
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
