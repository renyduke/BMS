import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, RefreshCw, UserPlus, UserMinus, UserCheck,
  FileText, Edit3, Trash2, ShieldCheck, AlertTriangle, Clock,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const PAGE_SIZE = 15

// ─── action type meta ─────────────────────────────────────────────────────────
const ACTION_META = {
  resident_added:     { label: 'Resident Added',     icon: UserPlus,   bg: 'bg-green-100',  text: 'text-green-700' },
  resident_deleted:   { label: 'Resident Deleted',   icon: UserMinus,  bg: 'bg-red-100',    text: 'text-red-700' },
  resident_verified:  { label: 'Resident Verified',  icon: UserCheck,  bg: 'bg-blue-100',   text: 'text-blue-700' },
  cert_issued:        { label: 'Certificate Issued',  icon: FileText,   bg: 'bg-indigo-100', text: 'text-indigo-700' },
  cert_approved:      { label: 'Cert. Approved',      icon: ShieldCheck,bg: 'bg-teal-100',   text: 'text-teal-700' },
  cert_rejected:      { label: 'Cert. Rejected',      icon: AlertTriangle, bg: 'bg-orange-100', text: 'text-orange-700' },
  account_created:    { label: 'Account Created',    icon: UserPlus,   bg: 'bg-purple-100', text: 'text-purple-700' },
  account_deleted:    { label: 'Account Deleted',    icon: Trash2,     bg: 'bg-red-100',    text: 'text-red-600' },
  role_changed:       { label: 'Role Changed',       icon: Edit3,      bg: 'bg-yellow-100', text: 'text-yellow-700' },
  barangay_updated:   { label: 'Barangay Updated',   icon: Edit3,      bg: 'bg-gray-100',   text: 'text-gray-600' },
}

const ALL_TYPES = Object.entries(ACTION_META).map(([key, val]) => ({ key, label: val.label }))

function ActionBadge({ action }) {
  const meta = ACTION_META[action] ?? { label: action, icon: Clock, bg: 'bg-gray-100', text: 'text-gray-500' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      <Icon size={11} />{meta.label}
    </span>
  )
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AuditLogs() {
  const [logs, setLogs]         = useState([])
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterBrgy, setFilterBrgy] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [page, setPage]         = useState(1)
  const [expanded, setExpanded] = useState(null)   // id of expanded row

  // ── load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: logData }, { data: brgyData }] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*, barangays(name), profiles(firstname, lastname, role)')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('barangays').select('id, name').order('name'),
      ])
      if (logData)  setLogs(logData)
      if (brgyData) setBarangays(brgyData)
    } catch (err) {
      console.error('AuditLogs load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [load])

  // ── filtering ─────────────────────────────────────────────────────────────
  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const actor = `${l.profiles?.firstname ?? ''} ${l.profiles?.lastname ?? ''}`.toLowerCase()
    const desc  = (l.description ?? '').toLowerCase()
    const matchSearch = actor.includes(q) || desc.includes(q)
    const matchBrgy   = filterBrgy === 'all' || l.barangay_id === filterBrgy
    const matchType   = filterType === 'all' || l.action === filterType
    return matchSearch && matchBrgy && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v)   { setSearch(v); setPage(1) }
  function handleBrgy(v)     { setFilterBrgy(v); setPage(1) }
  function handleType(v)     { setFilterType(v); setPage(1) }
  function toggleExpand(id)  { setExpanded(prev => prev === id ? null : id) }

  return (
    <div className="space-y-5">

      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-500">System-wide activity history across all barangays</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',   value: logs.length,                                              color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Today',          value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Barangays',      value: [...new Set(logs.map(l => l.barangay_id).filter(Boolean))].length, color: 'bg-green-50 text-green-700' },
          { label: 'Filtered',       value: filtered.length,                                          color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} border border-white`}>
            <p className="text-2xl font-bold">{loading ? '—' : s.value}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        {/* search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by actor or description…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* barangay filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <select
            value={filterBrgy}
            onChange={e => handleBrgy(e.target.value)}
            className="text-sm bg-gray-100 rounded-xl px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          >
            <option value="all">All Barangays</option>
            {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* action type filter */}
        <select
          value={filterType}
          onChange={e => handleType(e.target.value)}
          className="text-sm bg-gray-100 rounded-xl px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        >
          <option value="all">All Actions</option>
          {ALL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {/* ── table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Date & Time', 'Actor', 'Barangay', 'Action', 'Description', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Clock size={28} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">No activity logs found.</p>
                    {(search || filterBrgy !== 'all' || filterType !== 'all') && (
                      <button
                        onClick={() => { setSearch(''); setFilterBrgy('all'); setFilterType('all') }}
                        className="mt-2 text-xs text-indigo-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((l, i) => {
                  const actor = l.profiles
                    ? `${l.profiles.firstname ?? ''} ${l.profiles.lastname ?? ''}`.trim()
                    : 'System'
                  const isExpanded = expanded === l.id

                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      {/* date */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(l.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(l.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{timeAgo(l.created_at)}
                        </p>
                      </td>

                      {/* actor */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                            {actor.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800 leading-tight">{actor || '—'}</p>
                            {l.profiles?.role && (
                              <p className="text-[10px] text-gray-400 capitalize">{l.profiles.role}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* barangay */}
                      <td className="px-5 py-3">
                        {l.barangays?.name
                          ? <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{l.barangays.name}</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>

                      {/* action badge */}
                      <td className="px-5 py-3">
                        <ActionBadge action={l.action} />
                      </td>

                      {/* description */}
                      <td className="px-5 py-3 max-w-xs">
                        <p className={`text-xs text-gray-600 ${isExpanded ? '' : 'line-clamp-1'}`}>
                          {l.description ?? '—'}
                        </p>
                        {l.metadata && (
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.pre
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 text-[10px] bg-gray-50 text-gray-500 rounded-lg p-2 overflow-auto max-h-32 border border-gray-100"
                              >
                                {JSON.stringify(l.metadata, null, 2)}
                              </motion.pre>
                            )}
                          </AnimatePresence>
                        )}
                      </td>

                      {/* expand toggle */}
                      <td className="px-5 py-3">
                        {(l.metadata || (l.description ?? '').length > 60) && (
                          <button
                            onClick={() => toggleExpand(l.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} · Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i
              return p <= totalPages ? (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ) : null
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>



    </div>
  )
}
