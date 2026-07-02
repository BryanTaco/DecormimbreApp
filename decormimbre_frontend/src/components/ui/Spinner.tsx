export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-8 h-8 rounded-full border-2 border-[rgba(92,64,51,0.15)] border-t-[rgba(92,64,51,0.7)] animate-spin" />
    </div>
  )
}
