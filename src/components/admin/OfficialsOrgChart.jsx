import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Rank order ───────────────────────────────────────────────────────────────
const POSITION_RANK = {
  'Barangay Captain':       1,
  'Barangay Secretary':     2,
  'Barangay Treasurer':     3,
  'Barangay Kagawad':       4,
  'SK Chairman':            5,
  'SK Kagawad':             6,
  'Barangay Health Worker': 7,
  'Barangay Tanod':         8,
}

const POSITION_COLORS = {
  'Barangay Captain':       { ring: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
  'Barangay Secretary':     { ring: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  'Barangay Treasurer':     { ring: 'border-cyan-400',   bg: 'bg-cyan-50',   text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700' },
  'Barangay Kagawad':       { ring: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  'SK Chairman':            { ring: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'SK Kagawad':             { ring: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  'Barangay Health Worker': { ring: 'border-pink-400',   bg: 'bg-pink-50',   text: 'text-pink-700',   badge: 'bg-pink-100 text-pink-700' },
  'Barangay Tanod':         { ring: 'border-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
}

const DEFAULT_COLOR = { ring: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-600' }

// ─── Single node card ─────────────────────────────────────────────────────────
function OrgNode({ official }) {
  const c     = POSITION_COLORS[official.position] ?? DEFAULT_COLOR
  const first = official.firstname || (official.name ?? '?').split(' ')[0]
  const last  = official.lastname  || (official.name ?? '').split(' ').slice(-1)[0]
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 w-32 shadow-sm ${c.bg} ${c.ring}`}
    >
      {/* Avatar */}
      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow flex items-center justify-center font-bold text-lg ${c.bg} ${c.text} flex-shrink-0`}>
        {official.photo_url
          ? <img src={official.photo_url} alt={first} className="w-full h-full object-cover" />
          : <span>{initials}</span>
        }
      </div>

      {/* Name + position */}
      <div className="text-center w-full">
        <p className="text-xs font-bold text-gray-800 leading-tight truncate">
          {first} {last}
        </p>
        <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight ${c.badge}`}>
          {official.position}
        </span>
        {official.status && official.status !== 'Active' && (
          <span className="block mt-0.5 text-[9px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
            {official.status}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Connector line ───────────────────────────────────────────────────────────
function VLine({ height = 'h-6' }) {
  return <div className={`w-px ${height} bg-gray-300 mx-auto`} />
}

function HBar({ count }) {
  if (count <= 1) return null
  return (
    <div className="relative flex justify-center w-full">
      <div className="absolute top-0 h-px bg-gray-300" style={{ left: '16.5%', right: '16.5%' }} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OfficialsOrgChart({ barangayId, compact = false }) {
  const [officials, setOfficials] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!barangayId) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('officials')
      .select('id, name, firstname, lastname, position, photo_url, status')
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setOfficials(data)
        setLoading(false)
      })
  }, [barangayId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (officials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <GitBranch size={28} className="text-gray-200 mb-2" />
        <p className="text-sm text-gray-400">No officials to display</p>
      </div>
    )
  }

  // Sort by rank then group into tiers
  const sorted = [...officials].sort(
    (a, b) => (POSITION_RANK[a.position] ?? 99) - (POSITION_RANK[b.position] ?? 99)
  )

  const tierDefs = [
    ['Barangay Captain'],
    ['Barangay Secretary', 'Barangay Treasurer'],
    ['Barangay Kagawad'],
    ['SK Chairman'],
    ['SK Kagawad'],
    ['Barangay Health Worker', 'Barangay Tanod'],
  ]

  const tiers = tierDefs
    .map(positions => sorted.filter(o => positions.includes(o.position)))
    .filter(tier => tier.length > 0)

  // Also catch any positions not in the tier defs
  const knownPositions = new Set(tierDefs.flat())
  const others = sorted.filter(o => !knownPositions.has(o.position))
  if (others.length) tiers.push(others)

  return (
    <div className="overflow-x-auto">
      <div className={`flex flex-col items-center ${compact ? 'gap-0' : 'gap-0'} mx-auto`}
        style={{ minWidth: 'max-content' }}>
        {tiers.map((tier, ti) => (
          <div key={ti} className="flex flex-col items-center w-full">
            {/* vertical connector from tier above */}
            {ti > 0 && <VLine height="h-5" />}

            {/* horizontal bar across top of tier nodes */}
            {tier.length > 1 && (
              <div className="relative w-full flex justify-center">
                <div
                  className="absolute top-0 h-px bg-gray-300"
                  style={{
                    left:  `calc(50% - ${(tier.length - 1) * 72}px)`,
                    right: `calc(50% - ${(tier.length - 1) * 72}px)`,
                    width: `${(tier.length - 1) * 144}px`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    position: 'relative',
                  }}
                />
              </div>
            )}

            {/* nodes row */}
            <div className="flex items-start gap-4 relative">
              {tier.length > 1 && (
                <div
                  className="absolute h-px bg-gray-300"
                  style={{ top: '-1px', left: '64px', right: '64px' }}
                />
              )}
              {tier.map(official => (
                <div key={official.id} className="flex flex-col items-center">
                  {tier.length > 1 && <VLine height="h-3" />}
                  <OrgNode official={official} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
