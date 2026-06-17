import { useState, useEffect } from 'react'
import { Users, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

const POSITION_COLORS = {
  'Barangay Captain':   'bg-blue-100 text-blue-700',
  'Barangay Kagawad':   'bg-green-100 text-green-700',
  'SK Chairman':        'bg-purple-100 text-purple-700',
  'Barangay Secretary': 'bg-orange-100 text-orange-700',
  'Barangay Treasurer': 'bg-cyan-100 text-cyan-700',
}

/**
 * OfficialsWidget — compact list of barangay officials.
 * Props:
 *   barangayId  {string}   – required, the barangay to load officials for
 *   compact     {boolean}  – true → small sidebar card style, false → wider card
 */
export default function OfficialsWidget({ barangayId, compact = true }) {
  const [officials, setOfficials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!barangayId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('officials')
        .select('id, name, position, contact')
        .eq('barangay_id', barangayId)
        .order('created_at', { ascending: true })
      if (!error && data) setOfficials(data)
      setLoading(false)
    }
    load()
  }, [barangayId])

  if (loading) {
    return (
      <div className="space-y-3 px-4 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (officials.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <UserCheck size={20} className="text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">No officials listed yet</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="px-4 py-3 space-y-3">
        {officials.map(({ id, name, position }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
              {name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
              <p className="text-[11px] text-gray-400 truncate">{position}</p>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // Wide card grid view
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {officials.map(({ id, name, position }, i) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${POSITION_COLORS[position] || 'bg-gray-100 text-gray-600'}`}>
              {position}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
