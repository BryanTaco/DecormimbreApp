import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Sparkles, Ruler, Clock, Wrench, ArrowUpRight, Minus, Plus, Loader } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import AiAssistant from '@/components/AiAssistant'
import { cotizadorApi, type ProductoBase, type Cotizacion } from '@/api/cotizador'
import { waLink } from '@/lib/empresa'

const MATERIALES = [
  { value: 'mimbre', label: 'Mimbre', desc: 'Natural · interior' },
  { value: 'polialuminio', label: 'Polialuminio', desc: 'Sintético · exterior' },
]
const TAMANOS = [
  { value: 'pequeno', label: 'Pequeño' },
  { value: 'estandar', label: 'Estándar' },
  { value: 'grande', label: 'Grande' },
] as const
const money = (n: number | string) => '$' + Number(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })

export default function CotizarPage() {
  const [producto, setProducto] = useState('')
  const [material, setMaterial] = useState('')
  const [tamano, setTamano] = useState<'pequeno' | 'estandar' | 'grande'>('estandar')
  const [colorTipo, setColorTipo] = useState<'estandar' | 'personalizado'>('estandar')
  const [colorHex, setColorHex] = useState('#7db4d8')
  const [cantidad, setCantidad] = useState(1)

  const { data: prodData } = useQuery({ queryKey: ['cotizador-productos'], queryFn: () => cotizadorApi.productos() })
  const productos: ProductoBase[] = prodData?.data ?? []

  const { data: cotData, isFetching } = useQuery({
    queryKey: ['cotizar', producto, material, tamano, colorTipo, colorHex, cantidad],
    queryFn: () => cotizadorApi.cotizar({ producto, material, tamano, color: colorTipo === 'personalizado' ? colorHex : 'estandar', cantidad }),
    enabled: !!producto,
  })
  const cot: Cotizacion | undefined = cotData?.data

  const wa = cot
    ? waLink(`Hola Decormimbre, quiero cotizar: ${cot.producto} en ${cot.material}, tamaño ${cot.tamano}, color ${cot.color.toLowerCase()}, cantidad ${cot.cantidad}. Total referencial: ${money(cot.total)}. ¿Me confirman?`)
    : waLink('Hola Decormimbre, quiero una cotización.')

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors ${active ? 'bg-[#5C4033] text-white border-transparent' : 'bg-white text-[rgba(92,64,51,0.7)] border-[rgba(92,64,51,0.15)] hover:bg-[rgba(92,64,51,0.04)]'}`}>
      {children}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <div className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[rgba(92,64,51,0.07)]">
        <Navbar theme="light" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.5)] mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Cotización rápida
          </p>
          <h1 className="text-[clamp(30px,5vw,52px)] font-normal italic text-[#3d2215] leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>Tu precio al instante</h1>
          <p className="text-[rgba(92,64,51,0.6)] mt-3 max-w-xl">Elige un mueble base y ajústalo. Te damos el precio referencial y las especificaciones sin esperas ni formularios largos.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Opciones */}
          <div className="lg:col-span-3 flex flex-col gap-7">
            {/* Producto */}
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.55)] mb-3">1 · Elige el mueble</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {productos.map((p) => (
                  <button key={p.clave} onClick={() => { setProducto(p.clave); if (!material) setMaterial(p.material_base) }}
                    className={`text-left rounded-2xl border p-4 transition-all ${producto === p.clave ? 'border-[#5C4033] bg-white shadow-[0_10px_24px_rgba(92,64,51,0.12)]' : 'border-[rgba(92,64,51,0.12)] bg-white/70 hover:bg-white'}`}>
                    <p className="text-[14px] font-medium text-[#3d2215] leading-tight">{p.nombre}</p>
                    <p className="text-[11px] uppercase tracking-wide text-[rgba(92,64,51,0.45)] mt-0.5">{p.categoria}</p>
                    <p className="text-[13px] text-[rgba(92,64,51,0.7)] mt-2">desde {money(p.precio_base)}</p>
                  </button>
                ))}
              </div>
            </div>

            {producto && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-7">
                {/* Material */}
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.55)] mb-3">2 · Material</h2>
                  <div className="flex gap-2 flex-wrap">
                    {MATERIALES.map((m) => (
                      <button key={m.value} onClick={() => setMaterial(m.value)}
                        className={`px-4 py-2.5 rounded-2xl text-left border transition-colors ${material === m.value ? 'bg-[#5C4033] text-white border-transparent' : 'bg-white text-[rgba(92,64,51,0.8)] border-[rgba(92,64,51,0.15)] hover:bg-[rgba(92,64,51,0.04)]'}`}>
                        <span className="block text-[13px] font-medium">{m.label}</span>
                        <span className={`block text-[11px] ${material === m.value ? 'text-white/70' : 'text-[rgba(92,64,51,0.5)]'}`}>{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tamaño */}
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.55)] mb-3">3 · Tamaño</h2>
                  <div className="flex gap-2 flex-wrap">
                    {TAMANOS.map((t) => <Chip key={t.value} active={tamano === t.value} onClick={() => setTamano(t.value)}>{t.label}</Chip>)}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.55)] mb-3">4 · Color</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Chip active={colorTipo === 'estandar'} onClick={() => setColorTipo('estandar')}>Estándar</Chip>
                    <Chip active={colorTipo === 'personalizado'} onClick={() => setColorTipo('personalizado')}>Personalizado (+6%)</Chip>
                    {colorTipo === 'personalizado' && (
                      <label className="flex items-center gap-2 ml-1 text-[13px] text-[rgba(92,64,51,0.7)]">
                        <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-8 h-8 rounded-lg border border-[rgba(92,64,51,0.15)] cursor-pointer bg-transparent" />
                        {colorHex}
                      </label>
                    )}
                  </div>
                </div>

                {/* Cantidad */}
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.55)] mb-3">5 · Cantidad</h2>
                  <div className="inline-flex items-center gap-3 bg-white rounded-full border border-[rgba(92,64,51,0.15)] p-1">
                    <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-[rgba(92,64,51,0.7)] hover:bg-[rgba(92,64,51,0.06)]"><Minus className="w-4 h-4" /></button>
                    <span className="w-6 text-center text-[15px] font-medium text-[#3d2215]">{cantidad}</span>
                    <button onClick={() => setCantidad((c) => Math.min(50, c + 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-[rgba(92,64,51,0.7)] hover:bg-[rgba(92,64,51,0.06)]"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Resultado */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 bg-white rounded-[1.8rem] border border-[rgba(92,64,51,0.1)] shadow-[0_14px_40px_rgba(92,64,51,0.1)] overflow-hidden">
              {!producto ? (
                <div className="p-8 text-center">
                  <Sparkles className="w-7 h-7 text-[rgba(92,64,51,0.25)] mx-auto mb-3" />
                  <p className="text-[rgba(92,64,51,0.5)] text-sm">Elige un mueble para ver tu cotización al instante.</p>
                </div>
              ) : isFetching && !cot ? (
                <div className="p-10 flex justify-center"><Loader className="w-6 h-6 animate-spin text-[rgba(92,64,51,0.4)]" /></div>
              ) : cot ? (
                <div>
                  <div className="p-6 pb-5 bg-gradient-to-br from-[#3d2215] to-[#5C4033] text-white">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">{cot.categoria}</p>
                    <h3 className="text-[20px] font-normal italic mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{cot.producto}</h3>
                    <p className="text-[12px] text-white/70 mt-1">{cot.material} · {cot.tamano.toLowerCase()} · color {cot.color.toLowerCase()}{cot.cantidad > 1 ? ` · x${cot.cantidad}` : ''}</p>
                    <div className="flex items-end gap-2 mt-4">
                      <span className="text-[34px] leading-none font-normal">{money(cot.total)}</span>
                      <span className="text-[12px] text-white/60 mb-1">IVA incluido</span>
                    </div>
                    <p className="text-[12px] text-white/60 mt-0.5">Unitario {money(cot.precio_unitario)} · subtotal {money(cot.subtotal)} + IVA {money(cot.iva)}</p>
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    {/* Especificaciones */}
                    <div className="flex flex-col gap-2.5 text-[13px]">
                      <div className="flex items-start gap-2.5"><Ruler className="w-4 h-4 text-[rgba(92,64,51,0.45)] mt-0.5 shrink-0" /><span className="text-[rgba(92,64,51,0.75)]"><b className="font-medium text-[rgba(92,64,51,0.9)]">Medidas:</b> {cot.especificaciones.dimensiones}</span></div>
                      <div className="flex items-start gap-2.5"><Wrench className="w-4 h-4 text-[rgba(92,64,51,0.45)] mt-0.5 shrink-0" /><span className="text-[rgba(92,64,51,0.75)]"><b className="font-medium text-[rgba(92,64,51,0.9)]">Estructura:</b> {cot.especificaciones.estructura}{cot.especificaciones.incluye_cojin ? ' (cojín incluido)' : ''}</span></div>
                      <div className="flex items-start gap-2.5"><Clock className="w-4 h-4 text-[rgba(92,64,51,0.45)] mt-0.5 shrink-0" /><span className="text-[rgba(92,64,51,0.75)]"><b className="font-medium text-[rgba(92,64,51,0.9)]">Producción:</b> {cot.especificaciones.tiempo_produccion}</span></div>
                    </div>

                    {/* Desglose */}
                    <div className="rounded-xl bg-[#faf7f4] border border-[rgba(92,64,51,0.06)] p-3.5">
                      {cot.desglose.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px] py-0.5">
                          <span className="text-[rgba(92,64,51,0.6)]">{d.concepto}</span>
                          <span className="text-[rgba(92,64,51,0.85)]">{money(d.valor)}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-[rgba(92,64,51,0.45)] leading-relaxed">{cot.nota}</p>

                    {/* CTAs */}
                    <div className="flex flex-col gap-2 pt-1">
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-full py-3 text-[14px] font-semibold no-underline">
                        Enviar por WhatsApp
                      </a>
                      <Link to="/personalizar" className="flex items-center justify-center gap-2 bg-[rgba(92,64,51,0.08)] text-[#5C4033] rounded-full py-3 text-[14px] font-medium no-underline hover:bg-[rgba(92,64,51,0.14)] transition-colors">
                        Personalizar en 3D <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-[rgba(92,64,51,0.5)]">No pudimos calcular esta combinación. Escríbenos por WhatsApp.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <AiAssistant />
    </div>
  )
}
