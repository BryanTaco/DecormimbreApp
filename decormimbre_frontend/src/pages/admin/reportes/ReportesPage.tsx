import { useState } from 'react'
import { BarChart2, Download, FileSpreadsheet } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Btn from '@/components/ui/Btn'
import Input from '@/components/ui/Input'

const REPORTES = [
  {
    key: 'ventas',
    title: 'Reporte de Ventas',
    description: 'Cotizaciones aprobadas y pedidos entregados con totales e IVA.',
    icon: BarChart2,
    path: '/api/v1/reportes/excel/?tipo=ventas',
  },
  {
    key: 'inventario',
    title: 'Reporte de Inventario',
    description: 'Stock actual, stock crítico y movimientos de materias primas.',
    icon: FileSpreadsheet,
    path: '/api/v1/reportes/excel/?tipo=inventario',
  },
  {
    key: 'produccion',
    title: 'Reporte de Producción',
    description: 'Pedidos en producción, etapas y artesanos asignados.',
    icon: FileSpreadsheet,
    path: '/api/v1/reportes/excel/?tipo=produccion',
  },
]

export default function ReportesPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const buildUrl = (base: string) => {
    const params = new URLSearchParams()
    if (desde) params.append('desde', desde)
    if (hasta) params.append('hasta', hasta)
    const qs = params.toString()
    return qs ? `${base}&${qs}` : base
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <PageHeader title="Reportes" subtitle="Exporta datos del sistema en formato Excel" />

      {/* Filtro de fechas */}
      <div className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] p-5 mb-6 flex flex-wrap gap-4 items-end">
        <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        <p className="text-xs text-[rgba(92,64,51,0.5)] self-center">Deja vacío para incluir todo el historial</p>
      </div>

      {/* Cards de reportes */}
      <div className="flex flex-col gap-4">
        {REPORTES.map((r) => (
          <div key={r.key} className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] border border-[rgba(92,64,51,0.08)] p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[rgba(92,64,51,0.07)] flex items-center justify-center flex-shrink-0">
                <r.icon className="w-5 h-5 text-[rgba(92,64,51,0.7)]" />
              </div>
              <div>
                <p className="text-sm font-normal text-[rgba(92,64,51,0.9)]">{r.title}</p>
                <p className="text-xs text-[rgba(92,64,51,0.5)] mt-0.5">{r.description}</p>
              </div>
            </div>
            <a
              href={buildUrl(r.path)}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0"
            >
              <Btn variant="secondary" size="sm">
                <Download className="w-3.5 h-3.5" /> Descargar
              </Btn>
            </a>
          </div>
        ))}
      </div>

      {/* Nota */}
      <p className="text-xs text-[rgba(92,64,51,0.4)] mt-6 text-center">
        Los reportes se generan en tiempo real con los datos actuales del sistema.
        Requiere conexión activa al backend.
      </p>
    </div>
  )
}
