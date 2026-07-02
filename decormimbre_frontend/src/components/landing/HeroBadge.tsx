import { Leaf } from 'lucide-react'
import { motion } from 'motion/react'

export default function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/20 mx-auto mb-3 w-fit"
    >
      <Leaf className="w-4 h-4 text-[rgba(92,64,51,0.8)]" />
      <span className="text-[14px] font-normal text-[rgba(92,64,51,0.9)]">Eco Artesanal</span>
    </motion.div>
  )
}
