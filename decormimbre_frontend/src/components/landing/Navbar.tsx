import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUpRight, Menu, X, User, LogIn } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Cotizar', to: '/cotizar' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
]

interface NavbarProps {
  theme?: 'dark' | 'light'
}

function BrandLogo({ isDark }: { isDark: boolean }) {
  const textColor = isDark ? '#ffffff' : '#3d2215'
  const [imgOk, setImgOk] = useState(true)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {imgOk && (
        <img
          src="/brand/Logo.png"
          alt=""
          onError={() => setImgOk(false)}
          style={{
            height: 36,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color: textColor,
          textTransform: 'uppercase',
          lineHeight: 1,
          transition: 'color 200ms',
          userSelect: 'none',
        }}
      >
        Decormimbre
      </span>
    </div>
  )
}

export default function Navbar({ theme = 'dark' }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  // Bloquea el scroll del fondo mientras el menú móvil está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cierra el menú al cambiar de ruta
  useEffect(() => { setOpen(false) }, [location.pathname])

  const isDark = theme === 'dark'
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(92,64,51,0.88)'
  const activeColor = isDark ? '#fff' : '#5C4033'
  const borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(92,64,51,0.12)'

  return (
    <>
      <nav
        className="flex items-center justify-between py-5 px-6 md:px-10 w-full"
        style={{ position: 'relative', zIndex: 60 }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center no-underline group">
          <BrandLogo isDark={isDark} />
        </Link>

        {/* Links desktop */}
        <ul className="hidden md:flex items-center gap-8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  style={{
                    color: isActive ? activeColor : textColor,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.03em',
                    textDecoration: 'none',
                    position: 'relative',
                    paddingBottom: 3,
                    transition: 'color 200ms',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 1.5,
                        backgroundColor: activeColor,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          {/* Mi cuenta / login button */}
          {user?.rol === 'CLIENTE' ? (
            <Link to="/cuenta" style={{ textDecoration: 'none' }} className="hidden md:flex">
              <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-full py-2 px-4"
                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(92,64,51,0.08)', border: `1px solid ${borderColor}`, backdropFilter: 'blur(8px)', color: isDark ? 'rgba(255,255,255,0.85)' : '#5C4033', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <User className="w-3.5 h-3.5" />
                {user.nombre.split(' ')[0]}
              </motion.span>
            </Link>
          ) : !user ? (
            <Link to="/login" style={{ textDecoration: 'none' }} className="hidden md:flex">
              <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 rounded-full py-2 px-4"
                style={{ background: 'transparent', border: `1px solid ${borderColor}`, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(92,64,51,0.65)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <LogIn className="w-3 h-3" />
                Acceder
              </motion.span>
            </Link>
          ) : null}
          <Link
            to="/personalizar"
            style={{ textDecoration: 'none' }}
            className="hidden md:flex"
          >
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full py-2 pl-2 pr-5"
              style={{
                background: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(92,64,51,0.9)',
                border: `1px solid ${borderColor}`,
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'background 200ms',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span
                className="flex items-center justify-center rounded-full w-6 h-6"
                style={{ background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.22)' }}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              Personalizar
            </motion.span>
          </Link>

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            style={{ color: isDark ? '#fff' : '#5C4033', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — portal a body para cubrir toda la pantalla en cualquier página */}
      {createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999,
              background: isDark ? 'rgba(28,16,8,0.97)' : '#f5f0eb',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
            }}
          >
            <div className="flex items-center justify-between mb-12">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center no-underline">
                <BrandLogo isDark={isDark} />
              </Link>
              <button onClick={() => setOpen(false)} style={{ color: isDark ? '#fff' : '#5C4033', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <ul className="flex flex-col gap-5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 40,
                      fontWeight: 400,
                      fontStyle: 'italic',
                      letterSpacing: '-0.02em',
                      color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(92,64,51,0.9)',
                      textDecoration: 'none',
                      lineHeight: 1.1,
                      display: 'block',
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3">
              {/* Acceder / Mi cuenta (en desktop está en la barra; aquí faltaba) */}
              {user?.rol === 'CLIENTE' ? (
                <Link to="/cuenta" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <span
                    className="flex items-center gap-2 rounded-full py-3.5 px-6 w-fit"
                    style={{ background: 'transparent', border: `1px solid ${borderColor}`, color: isDark ? 'rgba(255,255,255,0.85)' : '#5C4033', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}
                  >
                    <User className="w-4 h-4" />
                    Mi cuenta · {user.nombre.split(' ')[0]}
                  </span>
                </Link>
              ) : !user ? (
                <Link to="/login" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <span
                    className="flex items-center gap-2 rounded-full py-3.5 px-6 w-fit"
                    style={{ background: 'transparent', border: `1px solid ${borderColor}`, color: isDark ? 'rgba(255,255,255,0.85)' : '#5C4033', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}
                  >
                    <LogIn className="w-4 h-4" />
                    Acceder
                  </span>
                </Link>
              ) : null}
              <Link to="/personalizar" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                <span
                  className="flex items-center gap-2 rounded-full py-3.5 px-6 w-fit"
                  style={{ background: '#5C4033', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Personalizar mueble
                </span>
              </Link>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
