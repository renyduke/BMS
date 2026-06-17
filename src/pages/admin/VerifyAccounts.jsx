import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CheckCircle, XCircle, Eye, RefreshCw,
  X, FileText, User, Mail, MapPin, Calendar, ExternalLink, Loader
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function residentName(req) {
  const p = req?.profiles
  if (!p) return '—'
  return `${p.firstname ?? ''}${p.middlename ? ' ' + p.middlename : ''} ${p.lastname ?? ''}${p.suffix ? ' ' + p.suffix : ''}`.trim()
}

// ── Document viewer — generates signed URL on open ───────────────────────────
function DocumentViewer({ path, name }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loadingUrl, setLoadingUrl] = useState(true)
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    if (!path) { setLoadingUrl(false); return }
    async function getUrl() {
      setLoadingUrl(true)
      try {
        const { data, error } = await supabase.storage
          .from('verification-docs')
          .createSignedUrl(path, 60 * 60) // 1 hour expiry
        if (error) throw error
        setSignedUrl(data.signedUrl)
      } catch (err) {
        setUrlError('Could not load document: ' + err.message)
      } finally {
        setLoadingUrl(false)
      }
    }
    getUrl()
  }, [path])

  if (loadingUrl) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
        <Loader size={18} className="animate-spin" />
        <span className="text-sm">Loading document…</span>
      </div>
    )
  }

  if (urlError) {
    return (
      <div className="py-6 text-center text-red-500 text-sm px-4">{urlError}</div>
    )
  }

  if (!signedUrl) {
    return <p className="text-sm text-gray-400 p-4 text-center">No document available.</p>
  }

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name ?? path ?? '')
  const isPdf   = /\.pdf$/i.test(name ?? path ?? '')

  if (isImage) {
    return (
      <div className="relative">
        <img
          src={signedUrl}
          alt="Verification document"
          className="w-full max-h-72 object-contain p-2 bg-gray-50"
        />
        <a href={signedUrl} target="_blank" rel="noopener noreferrer"
          className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-white/90 hover:bg-white text-blue-600 text-xs font-medium rounded-lg shadow transition-colors border border-gray-200">
          <ExternalLink size={12} />Open full size
        </a>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="p-4 flex items-center gap-3">
        <FileText size={28} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{name ?? 'Document.pdf'}</p>
          <a href={signedUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
            <ExternalLink size={11} />Open PDF in new tab
          </a>
        </div>
      </div>
    )
  }

  // Generic file
  return (
    <div className="p-4 flex items-center gap-3">
      <FileText size={24} className="text-blue-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-800">{name ?? 'Document'}</p>
        <a href={signedUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
          <ExternalLink size={11} />Open document
        </a>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VerifyAccounts() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('verification_requests')
        .select(`
          id, document_url, document_name, status, admin_note, created_at,
          profiles (
            id, firstname, middlename, lastname, suffix,
            username, email, verification_status, created_at,
            barangays (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (profile?.role === 'admin' && profile?.barangay_id) {
        query = query.eq('barangay_id', profile.barangay_id)
      }

      const { data, error } = await query
      if (error) throw error
      setRequests(data ?? [])
    } catch (err) {
      console.error('Failed to load verification requests:', err.message)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { load() }, [load])

  const filtered = requests.filter(r => {
    const p = r.profiles
    const name = p ? `${p.firstname} ${p.lastname}`.toLowerCase() : ''
    const q = search.toLowerCase()
    const matchSearch = name.includes(q) || (p?.email ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || r.status === filter
    return matchSearch && matchFilter
  })

  async function handleVerify(req, action) {
    setProcessing(true)
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected'

      const { error: reqErr } = await supabase
        .from('verification_requests')
        .update({ status: newStatus, admin_note: adminNote || null })
        .eq('id', req.id)
      if (reqErr) throw reqErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          verification_status: newStatus,
          is_verified: action === 'approve',
        })
        .eq('id', req.profiles.id)
      if (profErr) throw profErr

      setSelected(null)
      setAdminNote('')
      await load()
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  function openModal(req) {
    setSelected(req)
    setAdminNote(req.admin_note ?? '')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Verify Accounts</h1>
          <p className="text-sm text-gray-500">Review resident verification requests and uploaded documents</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',  count: requests.filter(r => r.status === 'pending').length,  color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Verified', count: requests.filter(r => r.status === 'verified').length, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: 'pending',  label: 'Pending' },
            { key: 'verified', label: 'Verified' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all',      label: 'All' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Resident', 'Email', 'Barangay', 'Document', 'Date Submitted', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-gray-400 text-sm">No verification requests found.</p>
                    <p className="text-gray-300 text-xs mt-1">Requests submitted by residents will appear here.</p>
                  </td>
                </tr>
              ) : filtered.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {r.profiles?.firstname?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-gray-800">{residentName(r)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{r.profiles?.email ?? '—'}</td>
                  <td className="px-5 py-3 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {r.profiles?.barangays?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                    {r.document_name ?? 'Document'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {/* View button — opens modal with document */}
                      <button onClick={() => openModal(r)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors">
                        <Eye size={13} />View
                      </button>
                      {/* Quick approve/reject from table row */}
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => { setSelected(r); setAdminNote('') }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors">
                            <CheckCircle size={13} />Approve
                          </button>
                          <button onClick={() => { setSelected(r); setAdminNote('') }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Reject">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Detail / Action Modal ── */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Verification Request</h3>
                  <p className="text-xs text-gray-500">{residentName(selected)}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">

                {/* Resident info */}
                <div className="bg-blue-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Resident Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: User,     label: 'Full Name',  value: residentName(selected) },
                      { icon: Mail,     label: 'Email',      value: selected.profiles?.email ?? '—' },
                      { icon: User,     label: 'Username',   value: `@${selected.profiles?.username ?? '—'}` },
                      { icon: MapPin,   label: 'Barangay',   value: selected.profiles?.barangays?.name ?? '—' },
                      { icon: Calendar, label: 'Joined',     value: selected.profiles?.created_at
                          ? new Date(selected.profiles.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—' },
                      { icon: Calendar, label: 'Submitted',  value: new Date(selected.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2">
                        <Icon size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-blue-500">{label}</p>
                          <p className="text-sm font-semibold text-blue-900 break-all">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document — signed URL loaded on open */}
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Supporting Document
                    <span className="ml-2 text-gray-400 font-normal normal-case">
                      ({selected.document_name ?? 'file'})
                    </span>
                  </p>
                  <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50 min-h-[80px]">
                    <DocumentViewer
                      path={selected.document_url}
                      name={selected.document_name}
                    />
                  </div>
                </div>

                {/* Admin note input (pending only) */}
                {selected.status === 'pending' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Admin Note <span className="font-normal text-gray-400">(optional — shown to resident)</span>
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="e.g. ID is unclear, please re-upload a clearer photo…"
                      rows={2}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                )}

                {/* Existing note (already processed) */}
                {selected.status !== 'pending' && selected.admin_note && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Admin Note</p>
                    <p className="text-sm text-gray-700">{selected.admin_note}</p>
                  </div>
                )}

                {/* Already processed badge */}
                {selected.status !== 'pending' && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${
                    selected.status === 'verified'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {selected.status === 'verified' ? '✓ This account has been verified' : '✗ This request was rejected'}
                  </div>
                )}
              </div>

              {/* Footer — Approve / Reject buttons */}
              {selected.status === 'pending' && (
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
                  <button onClick={() => setSelected(null)}
                    className="flex-1 py-2.5 text-sm font-semibold bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerify(selected, 'reject')}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <XCircle size={16} />
                    {processing ? 'Processing…' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleVerify(selected, 'approve')}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {processing
                      ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      : <CheckCircle size={16} />}
                    Approve
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
