import { motion } from 'motion/react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
  trend?: number
  onClick?: () => void
  delay?: number
}

// KPI reutilizable con el estilo del Dashboard (degradado, círculo decorativo, hover).
export default function StatCard({ label, value, icon: Icon, color = '#5C4033', trend, onClick, delay = 0 }: Props) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={onClick ? { y: -3 } : undefined}
      className={`text-left w-full bg-white rounded-[1.4rem] p-5 border border-[rgba(92,64,51,0.09)] shadow-[0_1px_3px_rgba(92,64,51,0.05)] relative overflow-hidden ${onClick ? 'hover:shadow-[0_14px_30px_rgba(92,64,51,0.13)] transition-shadow cursor-pointer' : 'cursor-default'}`}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: `${color}10` }} />
      <div className="flex items-start justify-between relative">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}26, ${color}0f)` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[30px] leading-none font-normal text-[#3d2215] mt-4">{value}</p>
      <p className="text-[12px] text-[rgba(92,64,51,0.55)] mt-1.5">{label}</p>
    </motion.button>
  )
}
