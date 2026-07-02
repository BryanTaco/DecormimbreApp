import type { SelectHTMLAttributes } from 'react'

interface Option { value: string; label: string }

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  placeholder?: string
}

export default function Select({ label, options, placeholder, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(92,64,51,0.6)]">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`rounded-xl border border-[rgba(92,64,51,0.15)] bg-white px-4 py-2.5 text-sm text-[rgba(92,64,51,0.9)] outline-none focus:border-[rgba(92,64,51,0.4)] transition-colors ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
