import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'

export default function Placeholder({ title, description }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Construction size={28} className="text-gray-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">{title} — Coming Soon</p>
          <p className="text-sm text-gray-400 mt-1">This feature is under development.</p>
        </div>
      </motion.div>
    </div>
  )
}
