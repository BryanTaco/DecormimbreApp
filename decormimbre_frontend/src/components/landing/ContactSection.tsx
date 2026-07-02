import { useState } from 'react'
import { Send } from 'lucide-react'
import { motion } from 'motion/react'

export default function ContactSection() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contacto" className="bg-[#f5f0eb] py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Info */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.6)]">
            Cotiza tu proyecto
          </span>
          <h2 className="mt-2 text-3xl md:text-5xl font-normal text-[#5C4033] tracking-tight mb-6">
            Hablemos sobre tu espacio
          </h2>
          <p className="text-sm text-[rgba(92,64,51,0.65)] leading-relaxed mb-8">
            Cuéntanos qué necesitas y uno de nuestros asesores te enviará una
            cotización personalizada sin compromiso en menos de 24 horas.
          </p>
          <div className="flex flex-col gap-3 text-sm text-[rgba(92,64,51,0.7)]">
            <span>📍 Quito, Ecuador</span>
            <span>📞 +593 99 123 4567</span>
            <span>✉️ ventas@decormimbre.ec</span>
          </div>
        </div>

        {/* Formulario */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/70 backdrop-blur-sm rounded-[2rem] p-8 flex flex-col gap-4 border border-white/50"
        >
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[rgba(92,64,51,0.1)] flex items-center justify-center">
                <Send className="w-6 h-6 text-[rgba(92,64,51,0.8)]" />
              </div>
              <p className="text-[rgba(92,64,51,0.9)] font-normal">
                ¡Gracias! Nos pondremos en contacto pronto.
              </p>
            </div>
          ) : (
            <>
              {[
                { field: 'nombre', label: 'Nombre completo', type: 'text' },
                { field: 'email', label: 'Correo electrónico', type: 'email' },
                { field: 'telefono', label: 'Teléfono (opcional)', type: 'tel' },
              ].map(({ field, label, type }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] placeholder:text-[rgba(92,64,51,0.35)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors"
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">
                  Mensaje
                </label>
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  className="rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] placeholder:text-[rgba(92,64,51,0.35)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors resize-none"
                  placeholder="Describe el mueble o proyecto que necesitas..."
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-2 flex items-center justify-center gap-2 bg-[rgba(92,64,51,0.9)] text-white rounded-xl py-3 text-sm font-normal hover:bg-[rgba(92,64,51,1)] transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar solicitud
              </motion.button>
            </>
          )}
        </motion.form>
      </div>
    </section>
  )
}
