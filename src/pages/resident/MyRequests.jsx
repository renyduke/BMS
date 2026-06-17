import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Edit2, Trash2, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const TABS = ['Pending', 'Approved', 'Rejected', 'Cancelled']

const STATUS_MAP = {
  Pending:   { label: 'wait for approval', color: 'text-yellow-600', dot: 'bg-yellow-400' },
  Approved:  { label: 'Approved',          color: 'text-green-600',  dot: 'bg-green-500'  },
  Rejected:  { label: 'Disapproved',       color: 'text-red-600',    dot: 'bg-red-500'    },
  Cancelled: { label: 'Cancelled',         color: 'text-gray-500',   dot: 'bg-gray-400'   },
}

const SUFFIX_OPTIONS = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      {children}
    </div>
  )
}
function Input({ className = '', ...props }) {
  return (
    <input {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${className}`} />
  )
}
function Select({ children, ...props }) {
  return (
    <select {...props}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all">
      {children}
    </select>
  )
}

export default function MyRequests() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Pending')
  const [detailsModal, setDetailsModal] = useState(null)  // view details
  const [editModal, setEditModal] = useState(null)        // resubmit / edit
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('id, type, purpose, status, created_at, firstname, middlename, lastname, suffix, contact, quantity, response_message')
        .eq('resident_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { load() }, [load])

  const filtered = requests.filter(r => {
    if (activeTab === 'Pending')   return r.status === 'Pending'
    if (activeTab === 'Approved')  return r.status === 'Approved'
    if (activeTab === 'Rejected')  return r.status === 'Rejected'
    if (activeTab === 'Cancelled') return r.status === 'Cancelled'
    return true
  })

  async function handleCancel(id) {
    if (!confirm('Are you sure you want to cancel this request?')) return
    const { error } = await supabase.from('requests').update({ status: 'Cancelled' }).eq('id', id)
    if (error) { alert(error.message); return }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r))
  }

  function openEdit(req) {
    setEditForm({
      firstname:  req.firstname  ?? profile?.firstname  ?? '',
      middlename: req.middlename ?? profile?.middlename ?? '',
      lastname:   req.lastname   ?? profile?.lastname   ?? '',
      suffix:     req.suffix     ?? profile?.suffix     ?? '',
      contact:    req.contact    ?? '',
      purpose:    req.purpose    ?? '',
      quantity:   req.quantity   ?? 1,
    })
    setEditModal(req)
  }

  async function handleResubmit() {
    if (!editForm.purpose.trim()) { alert('Purpose is required.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('requests').update({
        ...editForm,
        status: 'Pending',
      }).eq('id', editModal.id)
      if (error) throw error
      setEditModal(null)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function fmt(d) {
    return new Date(d).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Requests</h1>
          <p className="text-sm text-gray-500">Track and manage your certificate requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => navigate('/resident/certificates')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm">
            <Plus size={15} />New Request
          </button>
        </div>
      </div>

      {/* Tabs — matching photo: Pending | Approved | Rejected | Cancelled */}
      <div className="flex border-b border-gray-200">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {requests.filter(r => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Request cards — matching photo layout */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">No {activeTab.toLowerCase()} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const st = STATUS_MAP[r.status] ?? STATUS_MAP.Pending
            const name = [r.firstname, r.middlename, r.lastname, r.suffix].filter(Boolean).join(' ')
              || [profile?.firstname, profile?.middlename, profile?.lastname, profile?.suffix].filter(Boolean).join(' ')
              || '—'

            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{r.type}</h3>
                    <p className="text-xs text-gray-500">Name: {name}</p>
                    <p className="text-xs text-gray-500">Date Request: {fmt(r.created_at)}</p>
                    <p className={`text-xs font-medium mt-1 flex items-center gap-1.5 ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      Status: {st.label}
                    </p>
                    {r.status === 'Rejected' && r.response_message && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 rounded-lg px-2.5 py-1.5">
                        Admin note: {r.response_message}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Details button (always) */}
                    <button onClick={() => setDetailsModal(r)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      Details
                    </button>

                    {/* Cancel — only for Pending */}
                    {r.status === 'Pending' && (
                      <button onClick={() => handleCancel(r.id)}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors">
                        Cancel
                      </button>
                    )}

                    {/* Resubmit — for Rejected or Cancelled */}
                    {(r.status === 'Rejected' || r.status === 'Cancelled') && (
                      <button onClick={() => openEdit(r)}
                        className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                        <Edit2 size={11} />Resubmit
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Details modal ── */}
      <AnimatePresence>
        {detailsModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">{detailsModal.type}</h3>
                <button onClick={() => setDetailsModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400">Last Name</p><p className="font-semibold">{detailsModal.lastname ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400">First Name</p><p className="font-semibold">{detailsModal.firstname ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Middle Name</p><p className="font-semibold">{detailsModal.middlename ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Suffix</p><p className="font-semibold">{detailsModal.suffix ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Contact Number</p><p className="font-semibold">{detailsModal.contact ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Type of Certificate</p><p className="font-semibold">{detailsModal.type}</p></div>
                  <div><p className="text-xs text-gray-400">Purpose</p><p className="font-semibold">{detailsModal.purpose ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Quantity</p><p className="font-semibold">{detailsModal.quantity ?? 1}</p></div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-0.5 ${STATUS_MAP[detailsModal.status]?.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_MAP[detailsModal.status]?.dot}`} />
                    {STATUS_MAP[detailsModal.status]?.label ?? detailsModal.status}
                  </span>
                </div>
                {detailsModal.response_message && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Admin Response</p>
                    <p className="text-sm text-gray-700">{detailsModal.response_message}</p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-5">
                <button onClick={() => setDetailsModal(null)}
                  className="w-full py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Resubmit / Edit modal ── */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-800">Edit & Resubmit</h3>
                  <p className="text-xs text-gray-500">{editModal.type}</p>
                </div>
                <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Last Name">
                    <Input value={editForm.lastname} onChange={e => setEditForm(p => ({ ...p, lastname: e.target.value }))} />
                  </Field>
                  <Field label="First Name">
                    <Input value={editForm.firstname} onChange={e => setEditForm(p => ({ ...p, firstname: e.target.value }))} />
                  </Field>
                  <Field label="Middle Name">
                    <Input value={editForm.middlename} onChange={e => setEditForm(p => ({ ...p, middlename: e.target.value }))} />
                  </Field>
                  <Field label="Suffix">
                    <Select value={editForm.suffix} onChange={e => setEditForm(p => ({ ...p, suffix: e.target.value }))}>
                      {SUFFIX_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Contact">
                    <Input value={editForm.contact} onChange={e => setEditForm(p => ({ ...p, contact: e.target.value }))} />
                  </Field>
                  <Field label="Purpose">
                    <Input value={editForm.purpose} onChange={e => setEditForm(p => ({ ...p, purpose: e.target.value }))} />
                  </Field>
                  <Field label="Quantity">
                    <Input type="number" min="1" value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: e.target.value }))} />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-5">
                <button onClick={() => setEditModal(null)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleResubmit} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors">
                  {saving ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : null}
                  Resubmit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
