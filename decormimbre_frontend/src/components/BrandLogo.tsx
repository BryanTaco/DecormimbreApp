import { useState } from 'react'
import Logo from '@/components/landing/Logo'

// Logo de marca real (/brand/Logo.png) con respaldo al ícono SVG si no carga.
export default function BrandLogo({ size = 32 }: { size?: number }) {
  const [ok, setOk] = useState(true)
  return ok ? (
    <img
      src="/brand/Logo.png"
      alt="Decormimbre"
      onError={() => setOk(false)}
      style={{ height: size, width: 'auto', objectFit: 'contain', display: 'block' }}
    />
  ) : (
    <Logo color="#5C4033" size={size - 4} />
  )
}
