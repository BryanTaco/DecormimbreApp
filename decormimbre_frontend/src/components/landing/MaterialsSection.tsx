import { motion } from 'motion/react'

const MATERIALS = [
  {
    name: 'Mimbre',
    subtitle: 'La fibra de la naturaleza',
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
    description:
      'El polialuminio es un material técnico de alto rendimiento: una fibra sintética de polietileno de alta densidad (HDPE) tejida sobre un alma de aluminio. Esta combinación le otorga la apariencia y textura del mimbre natural, pero con resistencia extrema a la lluvia, rayos UV y temperatura. Ideal para exteriores exigentes.',
    properties: [
      { label: 'Composición', value: 'HDPE + alma de aluminio' },
      { label: 'Durabilidad', value: 'Exterior — 10+ años sin decoloración' },
      { label: 'Cuidado', value: 'Agua y jabón, sin mantenimiento especial' },
      { label: 'Resistencia', value: 'UV, lluvia, humedad y temperatura' },
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
  return (
    <section className="bg-[#f5f0eb] py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-2xl"
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
            Entiende cuál es el ideal para tu espacio y estilo de vida.
          </p>
        </motion.div>

        {/* Grid de materiales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MATERIALS.map((mat, i) => (
            <motion.div
              key={mat.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="rounded-[2rem] overflow-hidden border"
              style={{ borderColor: `${mat.color}18`, background: mat.lightBg }}
            >
              {/* Header */}
              <div
                className="p-8 pb-6"
                style={{ borderBottom: `1px solid ${mat.color}12` }}
              >
                <div className="flex items-start justify-between mb-5">
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
                        fontSize: '42px',
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
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${mat.color}0f` }}
                  >
                    {mat.icon}
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: `${mat.color}99`,
                    lineHeight: 1.7,
                    margin: 0,
                    fontWeight: 300,
                  }}
                >
                  {mat.description}
                </p>
              </div>

              {/* Propiedades */}
              <div className="p-8 pt-6">
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
          ))}
        </div>

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
              { icon: '🏠', title: 'Interior', desc: 'Mimbre natural. Ambientes climatizados con estética orgánica y calidez.' },
              { icon: '🌿', title: 'Exterior cubierto', desc: 'Ambos materiales. Terrazas techadas o balcones con luz solar indirecta.' },
              { icon: '☀️', title: 'Exterior expuesto', desc: 'Polialuminio. Piscinas, jardines y zonas con lluvia directa o sol intenso.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-2xl mt-0.5">{item.icon}</span>
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
