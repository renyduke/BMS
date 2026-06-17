import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, Users, UserCheck, ClipboardList, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

export default function SuperAdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ barangays: 0, residents: 0, accounts: 0, requests: 0 })
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [b, r, a, req] = await Promise.all([
          supabase.from('barangays').select('id, name, is_active', { count: 'exact' }),
          supabase.from('residents').select('id', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('requests').select('id', { count: 'exact' }).eq('status', 'Pending'),
        ])
        setStats({
          barangays: b.count ?? 0,
          residents: r.count ?? 0,
          accounts:  a.count ?? 0,
          requests:  req.count ?? 0,
        })

        // Per-barangay resident counts
        const { data: brgyData } = await supabase
          .from('barangays')
          .select('id, name, is_active')
          .order('name')
          .limit(10)

        if (brgyData) {
          const withCounts = await Promise.all(brgyData.map(async brgy => {
            const { count } = await supabase
              .from('residents')
              .select('id', { count: 'exact' })
              .eq('barangay_id', brgy.id)
            return { ...brgy, resident_count: count ?? 0 }
          }))
          setBarangays(withCounts)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Total Barangays',   value: stats.barangays, icon: Map,          color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Total Residents',   value: stats.residents, icon: Users,         color: 'bg-blue-100 text-blue-700' },
    { label: 'Registered Accounts', value: stats.accounts, icon: UserCheck,   color: 'bg-green-100 text-green-700' },
    { label: 'Pending Requests',  value: stats.requests,  icon: ClipboardList, color: 'bg-orange-100 text-orange-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-10 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-2xl font-bold mb-1">
            Welcome, {profile?.firstname ?? 'Admin'}! 🏛️
          </h2>
          <p className="text-indigo-200 text-sm">
            Municipal overview — Calatrava, Negros Occidental
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '—' : value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Barangay overview table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Barangay Overview</h3>
            <p className="text-xs text-gray-400">Top 10 barangays by resident count</p>
          </div>
          <Link to="/superadmin/barangays"
            className="text-xs text-indigo-600 hover:underline font-medium">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Barangay', 'Residents', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4].map(j => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : barangays.map((b, i) => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{b.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-24">
                        <div className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (b.resident_count / 200) * 100)}%` }} />
                      </div>
                      <span className="text-gray-600 text-xs">{b.resident_count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/superadmin/barangays`} className="text-xs text-indigo-600 hover:underline font-medium">Manage</Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
