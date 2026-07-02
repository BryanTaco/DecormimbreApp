import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white rounded-[1.5rem] shadow-xl p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-normal text-[#5C4033]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(92,64,51,0.07)] transition-colors">
            <X className="w-4 h-4 text-[rgba(92,64,51,0.6)]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
