import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-[rgba(92,64,51,0.06)] flex items-center justify-center">
        <Icon className="w-6 h-6 text-[rgba(92,64,51,0.4)]" />
      </div>
      <p className="text-[rgba(92,64,51,0.7)] font-normal">{title}</p>
      {description && <p className="text-sm text-[rgba(92,64,51,0.45)]">{description}</p>}
      {action}
    </div>
  )
}
