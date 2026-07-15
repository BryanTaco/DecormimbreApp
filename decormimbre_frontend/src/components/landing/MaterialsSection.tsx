import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const CHOICE_ICON_STYLE = {
  width: 20,
  height: 20,
  flexShrink: 0,
} as const

const CHOICE_ICONS: Record<string, React.ReactNode> = {
  interior: (
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(92,64,51,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={CHOICE_ICON_STYLE}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </svg>
  ),
  cubierto: (
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(92,64,51,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={CHOICE_ICON_STYLE}>
      <path d="M20 4c-7 0-13 4-13 12 0 1.5.3 2.9.8 4C9.5 20.6 11 21 12.5 21 19 21 21 13 20 4Z" />
      <path d="M4 21c2-6 6-10 12-13" />
    </svg>
  ),
  expuesto: (
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(92,64,51,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={CHOICE_ICON_STYLE}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </svg>
  ),
}

const MATERIALS = [
  {
    name: 'Mimbre',
    subtitle: 'La fibra de la naturaleza',
    image: '/materials/mimbre.webp',
    description:
      'El mimbre es una planta de la familia del sauce (género Salix) cuyas ramas jóvenes y flexibles se han tejido artesanalmente durante siglos. En Ecuador, los artesanos seleccionan a mano las varas más resistentes, las curan con técnicas tradicionales y las tejen en formas que combinan funcionalidad y arte.',
    properties: [
      { label: 'Origen', value: 'Planta natural (Salix viminalis)' },
      { label: 'Durabilidad', value: 'Interior — 20+ años de vida útil' },
      { label: 'Cuidado', value: 'Paño húmedo, aceite de linaza anual' },
      { label: 'Sostenibilidad', value: '100% biodegradable, sin químicos' },
    ],
    color: '#5C4033',
    lightBg: '#f5f0eb',
    accent: '#9B6B4A',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
        <path d="M32 8 Q44 20 44 36 Q44 50 32 56 Q20 50 20 36 Q20 20 32 8Z" stroke="#5C4033" strokeWidth="1.5" fill="rgba(92,64,51,0.08)" />
        <path d="M32 14 Q26 28 28 44" stroke="#5C4033" strokeWidth="1.2" strokeDasharray="2 3" strokeLinecap="round" />
        <path d="M32 14 Q38 28 36 44" stroke="#5C4033" strokeWidth="1.2" strokeDasharray="2 3" strokeLinecap="round" />
        <circle cx="32" cy="10" r="2.5" fill="#5C4033" opacity="0.7" />
      </svg>
    ),
  },
  {
    name: 'Polialuminio',
    subtitle: 'Innovación para el exterior',
    image: '/materials/polialuminio.webp',
    description:
      'El poli-aluminio es un hilo tejible hecho de envases Tetra Pak® reciclados: las capas de polietileno y aluminio del envase se recuperan y transforman en una fibra impermeable y resistente a la intemperie (Ecoyarn). Tiene la apariencia y textura del mimbre natural, con resistencia extrema a la lluvia, rayos UV y temperatura — y cada mueble da una segunda vida a cientos de envases.',
    properties: [
      { label: 'Composición', value: 'PolyAl reciclado de envases Tetra Pak® (polietileno + aluminio)' },
      { label: 'Durabilidad', value: 'Exterior — 10+ años sin decoloración' },
      { label: 'Cuidado', value: 'Agua y jabón, sin mantenimiento especial' },
      { label: 'Sostenibilidad', value: '100% reciclado — economía circular ecuatoriana' },
    ],
    color: '#2C4A3E',
    lightBg: '#eef3f1',
    accent: '#3D6B5C',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
        <rect x="12" y="12" width="40" height="40" rx="6" stroke="#2C4A3E" strokeWidth="1.5" fill="rgba(44,74,62,0.07)" />
        <path d="M12 24 H52 M12 36 H52" stroke="#2C4A3E" strokeWidth="1.2" strokeDasharray="0" />
        <path d="M24 12 V52 M36 12 V52" stroke="#2C4A3E" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="2" fill="#2C4A3E" opacity="0.6" />
        <circle cx="36" cy="24" r="2" fill="#2C4A3E" opacity="0.6" />
        <circle cx="24" cy="36" r="2" fill="#2C4A3E" opacity="0.6" />
        <circle cx="36" cy="36" r="2" fill="#2C4A3E" opacity="0.6" />
      </svg>
    ),
  },
]

export default function MaterialsSection() {
  const [activo, setActivo] = useState(0)
  const mat = MATERIALS[activo]

  return (
    <section className="bg-[#f5f0eb] py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 max-w-2xl"
        >
          <span
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-[rgba(92,64,51,0.55)]"
          >
            Nuestros materiales
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#3d2215',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: '10px 0 16px',
            }}
          >
            ¿Qué es el mimbre<br />y el polialuminio?
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'rgba(92,64,51,0.65)',
              lineHeight: 1.65,
              fontWeight: 300,
            }}
          >
            Usamos dos materiales con propiedades distintas pero igual calidad artesanal.
            Toca cada material para conocer de qué está hecho y cuál es el ideal para tu espacio.
          </p>
        </motion.div>

        {/* Selector dinámico de material */}
        <div className="flex gap-3 mb-8">
          {MATERIALS.map((m, i) => {
            const on = i === activo
            return (
              <button
                key={m.name}
                onClick={() => setActivo(i)}
                aria-pressed={on}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: on ? 600 : 400,
                  padding: '10px 24px',
                  borderRadius: 999,
                  border: `1px solid ${on ? m.color : 'rgba(92,64,51,0.18)'}`,
                  background: on ? m.color : 'white',
                  color: on ? '#fff' : 'rgba(92,64,51,0.7)',
                  cursor: 'pointer',
                  transition: 'all 220ms',
                  letterSpacing: '0.02em',
                }}
              >
                {m.name}
              </button>
            )
          })}
        </div>

        {/* Panel dinámico: imagen + descripción + propiedades */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] overflow-hidden border"
            style={{ borderColor: `${mat.color}18`, background: mat.lightBg }}
          >
            {/* Infografía del material (imagen completa, sin recortar) */}
            <div className="relative w-full" style={{ background: '#fff' }}>
              <motion.img
                key={mat.image}
                src={mat.image}
                alt={`¿Qué es el ${mat.name}? — infografía Decormimbre`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full h-auto block"
              />
            </div>

            {/* Texto */}
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${mat.color}0f` }}
                >
                  {mat.icon}
                </span>
                <div>
                  <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  color: mat.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  margin: '0 0 6px',
                  fontWeight: 500,
                }}
              >
                {mat.subtitle}
              </p>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '40px',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: mat.color,
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {mat.name}
              </h3>
                </div>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: `${mat.color}aa`,
                  lineHeight: 1.7,
                  margin: '0 0 24px',
                  fontWeight: 300,
                }}
              >
                {mat.description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {mat.properties.map((prop) => (
                  <div key={prop.label}>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        color: `${mat.color}66`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        margin: '0 0 3px',
                        fontWeight: 500,
                      }}
                    >
                      {prop.label}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        color: `${mat.color}cc`,
                        margin: 0,
                        lineHeight: 1.4,
                        fontWeight: 400,
                      }}
                    >
                      {prop.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Comparativa de uso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 rounded-[1.5rem] p-7 md:p-10 border border-[rgba(92,64,51,0.1)]"
          style={{ background: 'white' }}
        >
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontStyle: 'italic',
              color: '#3d2215',
              margin: '0 0 20px',
            }}
          >
            ¿Cuál elegir?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: CHOICE_ICONS.interior, title: 'Interior', desc: 'Mimbre natural. Ambientes climatizados con estética orgánica y calidez.' },
              { icon: CHOICE_ICONS.cubierto, title: 'Exterior cubierto', desc: 'Ambos materiales. Terrazas techadas o balcones con luz solar indirecta.' },
              { icon: CHOICE_ICONS.expuesto, title: 'Exterior expuesto', desc: 'Polialuminio. Piscinas, jardines y zonas con lluvia directa o sol intenso.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="mt-0.5">{item.icon}</span>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'rgba(92,64,51,0.9)',
                      margin: '0 0 4px',
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'rgba(92,64,51,0.6)',
                      lineHeight: 1.5,
                      margin: 0,
                      fontWeight: 300,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
