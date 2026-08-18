import { Palette, Ruler } from 'lucide-react'

export interface FichaPersonalizacionData {
  tipo?: string
  material?: string
  color?: { nombre?: string; hex?: string }
  cojin?: { nombre?: string; hex?: string }
  medidas?: { ancho_cm?: number | null; alto_cm?: number | null; profundidad_cm?: number | null }
}

export default function FichaPersonalizacion({ ficha, compact = false }: { ficha?: FichaPersonalizacionData; compact?: boolean }) {
  if (!ficha || !Object.keys(ficha).length) return null
  const medidas = ficha.medidas ?? {}
  const hayMedidas = [medidas.ancho_cm, medidas.alto_cm, medidas.profundidad_cm].some((v) => v !== null && v !== undefined)
  const color = ficha.color
  const cojin = ficha.cojin

  return (
    <div className={`rounded-xl border border-[rgba(92,64,51,0.1)] bg-[#faf7f4] ${compact ? 'mt-3 p-3' : 'p-4'} text-[rgba(92,64,51,0.78)]`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(92,64,51,0.48)] mb-2">Ficha de personalización</p>
      {(ficha.tipo || ficha.material) && <p className="text-sm font-medium text-[rgba(92,64,51,0.9)]">{[ficha.tipo, ficha.material].filter(Boolean).join(' · ')}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {color?.hex && <ColorItem label="Tejido" color={color} />}
        {cojin?.hex && <ColorItem label="Cojín" color={cojin} />}
        {hayMedidas && (
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-[rgba(92,64,51,0.5)]" />
            {[medidas.ancho_cm && `A ${medidas.ancho_cm}`, medidas.alto_cm && `H ${medidas.alto_cm}`, medidas.profundidad_cm && `P ${medidas.profundidad_cm}`].filter(Boolean).join(' × ')} cm
          </span>
        )}
      </div>
    </div>
  )
}

function ColorItem({ label, color }: { label: string; color: { nombre?: string; hex?: string } }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Palette className="w-3.5 h-3.5 text-[rgba(92,64,51,0.5)]" />
      <span className="w-4 h-4 rounded-full border border-black/15 shadow-sm" style={{ background: color.hex }} />
      <span>{label}: <b className="font-medium">{color.nombre || 'Personalizado'} {color.hex}</b></span>
    </span>
  )
}
