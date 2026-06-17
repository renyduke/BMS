import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, Phone, Mail, Plus, Pencil, Trash2, X, Save, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const POSITIONS = [
  'Barangay Captain',
  'Barangay Kagawad',
  'Barangay Secretary',
  'Barangay Treasurer',
  'SK Chairman',
  'SK Kagawad',
  'Barangay Health Worker',
  'Barangay Tanod',
]

const POSITION_COLORS = {
  'Barangay Captain':       'bg-blue-100 text-blue-700',
  'Barangay Kagawad':       'bg-green-100 text-green-700',
  'SK Chairman':            'bg-purple-100 text-purple-700',
  'Barangay Secretary':     'bg-orange-100 text-orange-700',
  'Barangay Treasurer':     'bg-cyan-100 text-cyan-700',
  'SK Kagawad':             'bg-violet-100 text-violet-700',
  'Barangay Health Worker': 'bg-pink-100 text-pink-700',
  'Barangay Tanod':         'bg-amber-100 text-amber-700',
}

const EMPTY_FORM = { name: '', position: POSITIONS[0], contact: '', email: '' }

// ── Modal ─────────────────────────────────────────────────────────────────────
function OfficialModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM)
    setError('')
  }, [initial, open])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">
                  {initial?.id ? 'Edit Official' : 'Add Official'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {initial?.id ? "Update the official's information" : 'Add a new barangay official'}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Hon. Juan Dela Cruz"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Position *</label>
                <select
                  value={form.position}
                  onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="+63 900 000 0000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="official@barangay.gov.ph"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors">
                  {saving
                    ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <Save size={14} />
                  }
                  {saving ? 'Saving…' : 'Save Official'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Officials() {
  const { profile } = useAuth()
  const [officials, setOfficials] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    if (!profile?.barangay_id) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('officials')
      .select('*')
      .eq('barangay_id', profile.barangay_id)
      .order('created_at', { ascending: true })
    if (!error && data) setOfficials(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  async function handleSave(form) {
    if (editing?.id) {
      const { error } = await supabase
        .from('officials')
        .update({ name: form.name.trim(), position: form.position, contact: form.contact.trim(), email: form.email.trim() })
        .eq('id', editing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('officials')
        .insert({ barangay_id: profile.barangay_id, name: form.name.trim(), position: form.position, contact: form.contact.trim(), email: form.email.trim() })
      if (error) throw error
    }
    await load()
  }

  async function handleDelete(id) {
    setDeleting(true)
    const { error } = await supabase.from('officials').delete().eq('id', id)
    if (!error) setOfficials(prev => prev.filter(o => o.id !== id))
    setDeleteConfirm(null)
    setDeleting(false)
  }

  return (
    <div className="space-y-4 max-w-8xl">

      {/* Header — same style as resident pages */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Barangay Officials</h1>
          <p className="text-sm text-gray-500">Current elected and appointed officials</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Official
          </button>
        </div>
      </div>

      {/* Officials list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : officials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <UserCheck size={22} className="text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No officials added yet</p>
          <p className="text-gray-400 text-xs mt-1 mb-5">Click "Add Official" to get started.</p>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} /> Add First Official
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {officials.map((official, i) => (
            <motion.div
              key={official.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {official.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{official.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mt-0.5 ${POSITION_COLORS[official.position] || 'bg-gray-100 text-gray-600'}`}>
                      {official.position}
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                      {official.contact && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone size={11} className="text-gray-400 flex-shrink-0" />
                          {official.contact}
                        </div>
                      )}
                      {official.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail size={11} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{official.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(official); setModalOpen(true) }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(official)}
                    className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <OfficialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={20} className="text-red-500" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Delete Official?</h3>
                <p className="text-sm text-gray-500">
                  Remove <span className="font-semibold text-gray-700">{deleteConfirm.name}</span> from the officials list? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors"
                >
                  {deleting
                    ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <Trash2 size={13} />
                  }
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
