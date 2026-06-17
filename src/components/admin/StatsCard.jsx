import { motion } from 'framer-motion'

export default function StatsCard({ label, value, icon: Icon, color, badge, badgeColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 cursor-default hover:shadow-md transition-all duration-200"
    >
      <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
      {badge && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badgeColor}`}>
          {badge}
        </span>
      )}
    </motion.div>
  )
}
