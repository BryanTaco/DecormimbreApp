import { Scissors, Layers, Sparkles, PackageCheck } from 'lucide-react'
import { motion } from 'motion/react'

const STEPS = [
  {
    icon: Scissors,
    title: 'Selección de Materiales',
    desc: 'Elegimos mimbre natural y polialuminio certificado de proveedores ecuatorianos de confianza.',
  },
  {
    icon: Layers,
    title: 'Tejido Artesanal',
    desc: 'Nuestros artesanos tejen cada pieza a mano siguiendo técnicas tradicionales perfeccionadas por décadas.',
  },
  {
    icon: Sparkles,
    title: 'Acabados y Control',
    desc: 'Cada mueble pasa por un riguroso control de calidad antes de ser entregado al cliente.',
  },
  {
    icon: PackageCheck,
    title: 'Entrega Segura',
    desc: 'Empacamos y entregamos tu pedido en perfectas condiciones, directamente a tu hogar.',
  },
]

export default function ProcessSection() {
  return (
    <section id="proceso" className="bg-[#f5f0eb] py-20 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.6)]">
            Nuestro Proceso
          </span>
          <h2 className="mt-2 text-3xl md:text-5xl font-normal text-[#5C4033] tracking-tight">
            Del mimbre a tu hogar
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-6 flex flex-col gap-4 border border-white/40"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(92,64,51,0.08)] flex items-center justify-center">
                <step.icon className="w-5 h-5 text-[rgba(92,64,51,0.8)]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgba(92,64,51,0.5)] mb-1">
                  Paso {i + 1}
                </p>
                <h3 className="text-[17px] font-normal text-[rgba(92,64,51,0.95)] mb-2">{step.title}</h3>
                <p className="text-sm text-[rgba(92,64,51,0.65)] leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
