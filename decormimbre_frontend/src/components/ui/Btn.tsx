import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

const VARIANTS = {
  primary: 'bg-[rgba(92,64,51,0.9)] text-white hover:bg-[rgba(92,64,51,1)]',
  secondary: 'bg-[rgba(92,64,51,0.08)] text-[rgba(92,64,51,0.9)] hover:bg-[rgba(92,64,51,0.14)]',
  ghost: 'text-[rgba(92,64,51,0.6)] hover:text-[rgba(92,64,51,0.9)] hover:bg-[rgba(92,64,51,0.05)]',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
}

export default function Btn({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 font-normal transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}
