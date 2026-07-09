import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  eyebrow?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, eyebrow, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(92,64,51,0.45)] mb-1">{eyebrow}</p>
        )}
        <h1 className="text-[26px] leading-tight font-normal text-[#3d2215]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[rgba(92,64,51,0.55)] mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex gap-2 flex-wrap">{action}</div>}
    </div>
  )
}
