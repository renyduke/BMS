import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import OfficialsWidget from '../../components/OfficialsWidget'

function StatCard({ label, value, viewColor, loading, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }} onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-all"
    >
      <p className="text-sm font-semibold text-gray-700 leading-tight mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <button className={`px-3 py-1 text-white text-xs font-semibold rounded-full ${viewColor}`}
          onClick={e => { e.stopPropagation(); onClick() }}>
          View
        </button>
        <span className="text-4xl font-bold text-gray-800">
          {loading ? <span className="text-gray-300 animate-pulse">—</span> : value}
        </span>
      </div>
    </motion.div>
  )
}

function SmallStatCard({ label, value, viewColor, loading, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }} onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <p className="text-xs font-semibold text-gray-700 mb-2 leading-tight">{label}</p>
      <div className="flex items-end justify-between">
        <button className={`px-2.5 py-1 text-white text-xs font-semibold rounded-full ${viewColor}`}>View</button>
        <span className="text-3xl font-bold text-gray-800">{loading ? '—' : value}</span>
      </div>
    </motion.div>
  )
}

function TotalResidentsCard({ value, loading, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }} onClick={onClick}
      className="rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-all"
      style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
    >
      <p className="text-sm font-bold text-white mb-3">Total residents</p>
      <div className="flex items-end justify-between">
        <button className="px-3 py-1 bg-white/30 hover:bg-white/40 text-white text-xs font-semibold rounded-full transition-colors">
          View
        </button>
        <span className="text-5xl font-extrabold text-white">{loading ? '—' : value}</span>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    pending:0, toVerify:0, residents:0,
    indigent:0, singleMother:0, fourps:0,
    senior:0, voters:0, pwd:0, vaccinated:0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const bid = profile?.barangay_id
      setLoading(true)
      try {
        // Helper: apply barangay filter only when barangay_id is available
        function q(table) {
          const base = supabase.from(table).select('id', { count: 'exact', head: true })
          return bid ? base.eq('barangay_id', bid) : base
        }

        const [
          pending, toVerify, residents,
          indigent, singleMother, fourps,
          senior, voters, pwd, vaccinated,
        ] = await Promise.all([
          q('requests').eq('status', 'Pending'),
          q('verification_requests').eq('status', 'pending'),
          q('residents'),
          q('residents').eq('indigenous', 'Yes'),
          q('residents').eq('solo_parent', 'Yes'),
          q('residents').eq('fourps', 'Yes'),
          q('residents').gte('age', 60),
          q('residents').eq('voter', 'Yes'),
          q('residents').not('pwd_id', 'is', null),
          q('residents').eq('vaccinated', 'Yes'),
        ])
        setStats({
          pending:      pending.count      ?? 0,
          toVerify:     toVerify.count     ?? 0,
          residents:    residents.count    ?? 0,
          indigent:     indigent.count     ?? 0,
          singleMother: singleMother.count ?? 0,
          fourps:       fourps.count       ?? 0,
          senior:       senior.count       ?? 0,
          voters:       voters.count       ?? 0,
          pwd:          pwd.count          ?? 0,
          vaccinated:   vaccinated.count   ?? 0,
        })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [profile])

  const PIE_DATA = [
    { name:'Vaccinated',    value: Math.max(stats.vaccinated,   1), color:'#3b82f6' },
    { name:'Single Mother', value: Math.max(stats.singleMother, 1), color:'#ef4444' },
    { name:'Voters',        value: Math.max(stats.voters,       1), color:'#eab308' },
    { name:'Senior Citizen',value: Math.max(stats.senior,       1), color:'#22c55e' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-xs text-gray-400">Dashboard</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* LEFT — Chart + Content */}
        <div className="xl:col-span-2 space-y-4">

          {/* Residents Data pie chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-500">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
              <h3 className="text-sm font-bold text-gray-700">Residents Data</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" outerRadius={110} dataKey="value" stroke="#fff" strokeWidth={2}>
                  {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Barangay Officials — live from DB */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-indigo-500">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h3 className="text-sm font-bold text-gray-700">Barangay Officials</h3>
              </div>
              <a href="/admin/officials" className="text-xs text-indigo-600 hover:underline font-medium">Manage →</a>
            </div>
            <div className="p-4">
              <OfficialsWidget barangayId={profile?.barangay_id} compact={false} />
            </div>
          </div>
        </div>

        {/* RIGHT — Stat cards */}
        <div className="space-y-3">

          {/* Pending request */}
          <StatCard label="Pending request" value={stats.pending}
            viewColor="bg-blue-500 hover:bg-blue-600" loading={loading}
            onClick={() => navigate('/admin/requests')} />

          {/* To verify accounts */}
          <StatCard label="To verify accounts" value={stats.toVerify}
            viewColor="bg-orange-400 hover:bg-orange-500" loading={loading}
            onClick={() => navigate('/admin/verify-accounts')} />

          {/* Total residents — pink full-width */}
          <TotalResidentsCard value={stats.residents} loading={loading}
            onClick={() => navigate('/admin/residents')} />

          {/* 2×2 small cards */}
          <div className="grid grid-cols-2 gap-3">
            <SmallStatCard label="Indigent family" value={stats.indigent}
              viewColor="bg-green-500" loading={loading} onClick={() => navigate('/admin/residents')} />
            <SmallStatCard label="Single mother" value={stats.singleMother}
              viewColor="bg-cyan-400" loading={loading} onClick={() => navigate('/admin/residents')} />
            <SmallStatCard label="4ps family" value={stats.fourps}
              viewColor="bg-orange-400" loading={loading} onClick={() => navigate('/admin/residents')} />
            <SmallStatCard label="Senior citizen" value={stats.senior}
              viewColor="bg-blue-400" loading={loading} onClick={() => navigate('/admin/residents')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SmallStatCard label="Registered voters" value={stats.voters}
              viewColor="bg-green-500" loading={loading} onClick={() => navigate('/admin/residents')} />
            <SmallStatCard label="Persons with disabilities" value={stats.pwd}
              viewColor="bg-blue-400" loading={loading} onClick={() => navigate('/admin/residents')} />
          </div>

        </div>
      </div>
    </div>
  )
}
