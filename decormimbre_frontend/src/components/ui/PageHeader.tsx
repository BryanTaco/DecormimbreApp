import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-normal text-[#5C4033]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[rgba(92,64,51,0.55)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
