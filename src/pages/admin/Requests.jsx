import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw, X, Printer, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { issueCertificateOnChain } from '../../lib/blockchain'

const STATUS_STYLES = {
  Pending:   'bg-yellow-100 text-yellow-700',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const TYPE_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700', 'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700', 'bg-pink-100 text-pink-700',
]

function typeColor(type) {
  const idx = Math.abs([...type].reduce((a, c) => a + c.charCodeAt(0), 0)) % TYPE_COLORS.length
  return TYPE_COLORS[idx]
}

function residentName(req) {
  if (req.lastname || req.firstname) {
    return [req.lastname, req.firstname].filter(Boolean).join(', ')
  }
  const p = req.profiles
  if (!p) return '—'
  return `${p.lastname ?? ''}, ${p.firstname ?? ''}`.trim().replace(/^,|,$/, '').trim()
}

function ManageDetailsModal({ req, onClose, onApprove, onReject, processing }) {
  const [responseMessage, setResponseMessage] = useState(req.response_message ?? '')

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Manage Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Last Name',          value: req.lastname  ?? req.profiles?.lastname  ?? '—' },
              { label: 'First Name',         value: req.firstname ?? req.profiles?.firstname ?? '—' },
              { label: 'Middle Name',        value: req.middlename ?? req.profiles?.middlename ?? '—' },
              { label: 'Suffix',             value: req.suffix ?? req.profiles?.suffix ?? '—' },
              { label: 'Contact Number',     value: req.contact ?? '—' },
              { label: 'Type of Certificate',value: req.type ?? '—' },
              { label: 'Purpose',            value: req.purpose ?? '—' },
              { label: 'Quantity',           value: req.quantity ?? 1 },
            ].map(({ label, value }) => (
              <div key={label} className="border-b border-gray-100 pb-2">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Response Message */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-center">Response Message</label>
            <textarea
              value={responseMessage}
              onChange={e => setResponseMessage(e.target.value)}
              rows={3}
              placeholder="Optional message to the resident…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        {req.status === 'Pending' ? (
          <div className="flex gap-3 px-6 pb-5">
            <button onClick={() => onApprove(req, responseMessage)} disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-full disabled:opacity-50 transition-colors shadow-sm">
              {processing ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : <CheckCircle size={16} />}
              Approve ✓
            </button>
            <button onClick={() => onReject(req, responseMessage)} disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-full disabled:opacity-50 transition-colors shadow-sm">
              <XCircle size={16} />Disapprove ✕
            </button>
          </div>
        ) : (
          <div className="px-6 pb-5">
            <div className={`text-center text-sm font-semibold py-2 rounded-full ${STATUS_STYLES[req.status]}`}>
              {req.status === 'Approved' ? '✓ Request has been Approved' : `✕ Request was ${req.status}`}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function Requests() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Request')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [selectedReq, setSelectedReq] = useState(null)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('requests')
        .select(`id, type, purpose, status, created_at, firstname, middlename, lastname, suffix, contact, quantity, response_message, cert_hash, block_index,
          profiles (id, firstname, middlename, lastname, suffix, email),
          barangays (name)`)
        .order('created_at', { ascending: false })

      if (profile?.role === 'admin' && profile?.barangay_id) {
        query = query.eq('barangay_id', profile.barangay_id)
      }

      const { data, error } = await query
      if (error) throw error
      setRequests(data ?? [])
    } catch (err) {
      console.error('Failed to load requests:', err.message)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { load() }, [load])

  function tabFilter(r) {
    if (activeTab === 'Request')     return r.status === 'Pending'
    if (activeTab === 'Approved')    return r.status === 'Approved'
    if (activeTab === 'Disapproved') return r.status === 'Rejected'
    if (activeTab === 'Completed')   return r.status === 'Approved'   // same as approved for now
    return true
  }

  const filtered = requests.filter(r => {
    const name = residentName(r).toLowerCase()
    const q = search.toLowerCase()
    return (name.includes(q) || (r.type ?? '').toLowerCase().includes(q)) && tabFilter(r)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  async function handleApprove(req, responseMessage) {
    setProcessing(true)
    try {
      // 1. Update request status
      const { error } = await supabase.from('requests')
        .update({ status: 'Approved', response_message: responseMessage || null })
        .eq('id', req.id)
      if (error) throw error

      // 2. Issue certificate on blockchain ledger
      const residentFullName = [req.firstname, req.middlename, req.lastname, req.suffix]
        .filter(Boolean).join(' ') || residentName(req)

      const { cert_hash, record_id, block_index } = await issueCertificateOnChain({
        request_id:    req.id,
        resident_name: residentFullName,
        cert_type:     req.type,
        barangay:      req.barangays?.name ?? profile?.barangay_id ?? 'Calatrava',
        issued_by:     profile ? `${profile.firstname} ${profile.lastname}` : 'Admin',
        date_issued:   new Date().toISOString(),
      })

      // 3. Save the hash back to the request row so it persists
      await supabase.from('requests')
        .update({ cert_hash, block_index })
        .eq('id', req.id)

      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Approved', response_message: responseMessage, cert_hash, block_index } : r))
      setSelectedReq(null)

      // 4. Navigate to certificate preview WITH blockchain data
      const p = req.profiles ?? {}
      navigate('/admin/certificate-preview', {
        state: {
          request: { ...req, status: 'Approved', date: req.created_at },
          resident: {
            firstname:  req.firstname  ?? p.firstname  ?? '',
            middlename: req.middlename ?? p.middlename ?? '',
            lastname:   req.lastname   ?? p.lastname   ?? '',
            suffix:     req.suffix     ?? p.suffix     ?? '',
          },
          cert_hash,
          block_index,
          record_id,
        },
      })
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(req, responseMessage) {
    setProcessing(true)
    try {
      const { error } = await supabase.from('requests')
        .update({ status: 'Rejected', response_message: responseMessage || null })
        .eq('id', req.id)
      if (error) throw error
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Rejected', response_message: responseMessage } : r))
      setSelectedReq(null)
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  function handlePrint(req) {
    const p = req.profiles ?? {}
    navigate('/admin/certificate-preview', {
      state: {
        request:     { ...req, date: req.created_at },
        resident: {
          firstname:  req.firstname  ?? p.firstname  ?? '',
          middlename: req.middlename ?? p.middlename ?? '',
          lastname:   req.lastname   ?? p.lastname   ?? '',
          suffix:     req.suffix     ?? p.suffix     ?? '',
        },
        cert_hash:   req.cert_hash   ?? null,
        block_index: req.block_index ?? null,
      },
    })
  }

  const TABS = ['Request', 'Approved', 'Disapproved', 'Completed']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Online Request</h1>
          <p className="text-sm text-gray-400">Online Request</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* White card containing tabs + table — matching photo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs + controls */}
        <div className="flex items-center justify-between px-5 pt-4 border-b border-gray-100 flex-wrap gap-3">
          <div className="flex">
            {TABS.map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(1) }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pb-3">
            <select value={perPage} onChange={e => setPerPage(+e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-xs text-gray-400">entries per page</span>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Type', 'Purpose', 'Date', 'Qty', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-gray-400 text-sm">
                    No {activeTab.toLowerCase()} requests.
                  </td>
                </tr>
              ) : paginated.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{residentName(r)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor(r.type)}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-[140px] truncate text-xs uppercase">{r.purpose ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    {' '}
                    {new Date(r.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-center">{r.quantity ?? 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedReq(r)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        View
                      </button>
                      {r.status === 'Approved' && (
                        <button onClick={() => handlePrint(r)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Print">
                          <Printer size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Manage Details modal */}
      <AnimatePresence>
        {selectedReq && (
          <ManageDetailsModal
            req={selectedReq}
            onClose={() => setSelectedReq(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            processing={processing}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
