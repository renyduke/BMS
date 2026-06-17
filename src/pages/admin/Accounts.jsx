import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Shield, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const ROLE_STYLES = {
  admin:    'bg-blue-100 text-blue-700',
  resident: 'bg-green-100 text-green-700',
}

export default function Accounts() {
  const { profile } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let query = supabase
          .from('profiles')
          .select('id, firstname, lastname, username, email, role, created_at')
          .order('created_at', { ascending: false })

        if (profile?.role === 'admin' && profile?.barangay_id) {
          query = query.eq('barangay_id', profile.barangay_id)
        }

        const { data, error } = await query
        if (!error && data) setAccounts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile])

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase()
    return (
      `${a.firstname} ${a.lastname}`.toLowerCase().includes(q) ||
      (a.username || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Accounts</h1>
        <p className="text-sm text-gray-500">Manage system user accounts</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
        <p className="text-xs text-gray-400 ml-auto">{filtered.length} accounts</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['User', 'Username', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No accounts found.</td></tr>
              ) : (
                filtered.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                          {a.firstname?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{a.firstname} {a.lastname}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">@{a.username}</td>
                    <td className="px-5 py-3 text-gray-500">{a.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[a.role] || 'bg-gray-100 text-gray-500'}`}>
                        {a.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                        {a.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
