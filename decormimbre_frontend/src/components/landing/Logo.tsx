interface LogoProps {
  color?: string
  size?: number
}

export default function Logo({ color = '#5C4033', size = 36 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trama de mimbre — hexágono orgánico */}
      <path
        d="M20 3 L33 10.5 L33 25.5 L20 33 L7 25.5 L7 10.5 Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Hilos diagonales que simulan el tejido */}
      <path d="M13 7 L27 29" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <path d="M27 7 L13 29" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <path d="M7 18 L33 18" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      {/* Nodo central */}
      <circle cx="20" cy="18" r="2.5" fill={color} opacity="0.9" />
    </svg>
  )
}
