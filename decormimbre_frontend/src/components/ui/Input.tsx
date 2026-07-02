import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`rounded-xl border ${error ? 'border-red-300' : 'border-[rgba(92,64,51,0.15)]'} bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] placeholder:text-[rgba(92,64,51,0.35)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
