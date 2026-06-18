import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_STYLES = {
  Verified: 'bg-green-100 text-green-700',
  Pending:  'bg-yellow-100 text-yellow-700',
  Inactive: 'bg-gray-100 text-gray-500',
}

const PAGE_SIZE = 10

export default function AllResidents() {
  const [rows, setRows] = useState([])
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrgy, setFilterBrgy] = useState('all')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  function showConfirm({ message, subtext, onConfirm, errorOnly }) {
    setConfirmDialog({ message, subtext, onConfirm, errorOnly })
  }

  function closeConfirm() {
    setConfirmDialog(null)
  }

  function handleDelete(id, name) {
    showConfirm({
      message: `Delete resident "${name}"?`,
      subtext: 'This will permanently remove this resident record and cannot be undone.',
      onConfirm: async () => {
        closeConfirm()
        setDeleting(id)
        try {
          const { error } = await supabase.from('residents').delete().eq('id', id)
          if (error) throw error
          setRows(prev => prev.filter(r => r.id !== id))
        } catch (err) {
          showConfirm({
            message: 'Failed to delete resident',
            subtext: err.message || 'An unexpected error occurred.',
            onConfirm: closeConfirm,
            errorOnly: true,
          })
        } finally {
          setDeleting(null)
        }
      }
    })
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [{ data: residents }, { data: brgys }] = await Promise.all([
          supabase.from('residents')
            .select('*, barangays(name)')
            .order('created_at', { ascending: false }),
          supabase.from('barangays').select('id, name').order('name'),
        ])
        if (residents) setRows(residents)
        if (brgys) setBarangays(brgys)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = `${r.firstname} ${r.lastname}`.toLowerCase().includes(q) ||
      (r.address || '').toLowerCase().includes(q)
    const matchBrgy = filterBrgy === 'all' || r.barangay_id === filterBrgy
    return matchSearch && matchBrgy
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">All Residents</h1>
        <p className="text-sm text-gray-500">View residents across all barangays in Calatrava</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or address…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <select value={filterBrgy} onChange={e => { setFilterBrgy(e.target.value); setPage(1) }}
            className="text-sm bg-gray-100 rounded-xl px-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
            <option value="all">All Barangays</option>
            {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Name', 'Barangay', 'Address', 'Contact', 'Status', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No residents found.</td></tr>
              ) : paginated.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{r.firstname} {r.lastname}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {r.barangays?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{r.address ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{r.contact ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDelete(r.id, `${r.firstname} ${r.lastname}`)}
                      disabled={deleting === r.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                      title="Delete Resident"
                    >
                      {deleting === r.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} records · Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </motion.div>
      {/* Custom Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 leading-snug">{confirmDialog.message}</h3>
                  {confirmDialog.subtext && (
                    <p className="text-sm text-gray-500 mt-1">{confirmDialog.subtext}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {!confirmDialog.errorOnly && (
                  <button
                    onClick={closeConfirm}
                    className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${
                    confirmDialog.errorOnly
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmDialog.errorOnly ? 'OK' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
