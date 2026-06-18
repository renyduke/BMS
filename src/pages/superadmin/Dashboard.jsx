import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, Users, UserCheck, BarChart2, PieChartIcon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

const BAR_COLORS = [
  '#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899',
  '#14b8a6','#a855f7','#0ea5e9','#22c55e','#eab308',
]
function barColor(i) { return BAR_COLORS[i % BAR_COLORS.length] }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-medium">
          {p.name}: {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function shortName(name = '', max = 10) {
  return name.length > max ? name.slice(0, max) + '…' : name
}

export default function SuperAdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats]         = useState({ barangays: 0, residents: 0, accounts: 0 })
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [b, r, a] = await Promise.all([
          supabase.from('barangays').select('id', { count: 'exact' }),
          supabase.from('residents').select('id', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' }),
        ])
        setStats({
          barangays: b.count ?? 0,
          residents: r.count ?? 0,
          accounts:  a.count ?? 0,
        })

        const { data: brgyData } = await supabase
          .from('barangays')
          .select('id, name, is_active')
          .order('name')

        if (brgyData) {
          const withCounts = await Promise.all(brgyData.map(async (brgy, i) => {
            const { count: resCnt } = await supabase
              .from('residents')
              .select('id', { count: 'exact' })
              .eq('barangay_id', brgy.id)
            return {
              ...brgy,
              short:          shortName(brgy.name),
              resident_count: resCnt ?? 0,
              color:          barColor(i),
            }
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

  const activeCount   = barangays.filter(b => b.is_active).length
  const inactiveCount = barangays.filter(b => !b.is_active).length
  const statusData = [
    { name: 'Active',   value: activeCount,   color: '#10b981' },
    { name: 'Inactive', value: inactiveCount, color: '#d1d5db' },
  ]

  const STAT_CARDS = [
    { label: 'Total Barangays',     value: stats.barangays, icon: Map,       color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Total Residents',     value: stats.residents, icon: Users,     color: 'bg-blue-100 text-blue-700' },
    { label: 'Registered Accounts', value: stats.accounts,  icon: UserCheck, color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-10 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-2xl font-bold mb-1">Welcome, {profile?.firstname ?? 'Admin'}! 🏛️</h2>
          <p className="text-indigo-200 text-sm">Municipal overview — Calatrava, Negros Occidental</p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart — residents per barangay */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" />
              Residents per Barangay
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Total registered residents by barangay</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : barangays.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No barangay data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={barangays}
                margin={{ top: 4, right: 8, left: -16, bottom: 40 }}
                barSize={barangays.length > 10 ? 14 : 22}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="short"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  angle={-35} textAnchor="end" interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
                <Bar dataKey="resident_count" name="Residents" radius={[5, 5, 0, 0]}>
                  {barangays.map(b => (
                    <Cell key={b.id} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie — active vs inactive */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-500" />
              Barangay Status
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Active vs inactive</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3 space-y-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-gray-600 font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                  <span className="text-gray-400">Total</span>
                  <span className="font-bold text-gray-800">{stats.barangays}</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Barangay overview table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Barangay Overview</h3>
            <p className="text-xs text-gray-400">All barangays and their resident counts</p>
          </div>
          <Link to="/superadmin/barangays" className="text-xs text-indigo-600 hover:underline font-medium">
            View all →
          </Link>
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
              ) : barangays.map((b, i) => {
                const maxRes = Math.max(...barangays.map(x => x.resident_count), 1)
                return (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{b.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                          <div className="h-1.5 rounded-full" style={{ width: `${(b.resident_count / maxRes) * 100}%`, background: b.color }} />
                        </div>
                        <span className="text-gray-600 text-xs w-8 text-right">{b.resident_count}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link to="/superadmin/barangays" className="text-xs text-indigo-600 hover:underline font-medium">Manage</Link>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  )
}
