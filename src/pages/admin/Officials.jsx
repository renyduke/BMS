import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, Phone, Plus, Pencil, Trash2, X, Save, RefreshCw, Camera, Loader, GitBranch, List } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const POSITIONS = [
  'Barangay Captain',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay Kagawad',
  'SK Chairman',
  'SK Kagawad',
  'Barangay Health Worker',
  'Barangay Tanod',
]

// Rank order for org chart (lower = higher rank)
const POSITION_RANK = {
  'Barangay Captain':       1,
  'Barangay Secretary':     2,
  'Barangay Treasurer':     3,
  'Barangay Kagawad':       4,
  'SK Chairman':            5,
  'SK Kagawad':             6,
  'Barangay Health Worker': 7,
  'Barangay Tanod':         8,
}

const POSITION_COLORS = {
  'Barangay Captain':       'bg-blue-100 text-blue-700 border-blue-300',
  'Barangay Secretary':     'bg-orange-100 text-orange-700 border-orange-300',
  'Barangay Treasurer':     'bg-cyan-100 text-cyan-700 border-cyan-300',
  'Barangay Kagawad':       'bg-green-100 text-green-700 border-green-300',
  'SK Chairman':            'bg-purple-100 text-purple-700 border-purple-300',
  'SK Kagawad':             'bg-violet-100 text-violet-700 border-violet-300',
  'Barangay Health Worker': 'bg-pink-100 text-pink-700 border-pink-300',
  'Barangay Tanod':         'bg-amber-100 text-amber-700 border-amber-300',
}

const STATUSES = ['Active', 'Inactive', 'On Leave']
const GENDERS  = ['Male', 'Female']
const BUCKET   = 'officials-photos'

const EMPTY_FORM = {
  firstname: '', middlename: '', lastname: '',
  gender: 'Male', contact: '', address: '',
  position: POSITIONS[0], committee: '',
  date_assumed: '', term_start: '', term_end: '',
  status: 'Active', photo_url: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}
function lettersOnly(str) {
  return str.replace(/[^a-zA-Z\s]/g, '')
}
function digitsOnly(str) {
  return str.replace(/\D/g, '')
}
function fullName(o) {
  return [o.firstname, o.middlename, o.lastname].filter(Boolean).join(' ')
}

// ─── Photo upload helper ──────────────────────────────────────────────────────
async function uploadPhoto(file, userId) {
  const ext  = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET).upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return `${publicUrl}?t=${Date.now()}`
}

// ─── Field component ─────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-[11px] mt-0.5">{error}</p>}
    </div>
  )
}

const INPUT = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
const SELECT = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function OfficialModal({ open, onClose, onSave, initial, userId }) {
  const [form, setForm]       = useState(EMPTY_FORM)
  const [errs, setErrs]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM)
      setErrs({})
      setPhotoFile(null)
      setPhotoPreview(initial?.photo_url || null)
    }
  }, [open, initial])

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }))
    setErrs(p => ({ ...p, [field]: '' }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setErrs(p => ({ ...p, photo: 'Please select an image.' })); return }
    if (file.size > 5 * 1024 * 1024)    { setErrs(p => ({ ...p, photo: 'Image must be < 5MB.' }));    return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrs(p => ({ ...p, photo: '' }))
    e.target.value = ''
  }

  function validate() {
    const e = {}
    if (!form.firstname.trim())  e.firstname = 'Required'
    if (!form.lastname.trim())   e.lastname  = 'Required'
    if (!form.position)          e.position  = 'Required'
    if (form.contact && form.contact.length !== 11) e.contact = 'Must be exactly 11 digits'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrs(e); return }
    setSaving(true)
    try {
      let photo_url = form.photo_url || ''
      if (photoFile) photo_url = await uploadPhoto(photoFile, userId)
      await onSave({ ...form, photo_url })
      onClose()
    } catch (err) {
      setErrs(p => ({ ...p, _global: err.message || 'Failed to save.' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.18 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-4">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{initial?.id ? 'Edit Official' : 'Add Official'}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><X size={16}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {errs._global && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{errs._global}</div>
              )}

              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400">
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover"/>
                      : <Camera size={28}/>
                    }
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={20} className="text-white"/>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange}/>
                </div>
                <p className="text-xs text-gray-400">Click photo to upload (max 5 MB)</p>
                {errs.photo && <p className="text-red-500 text-xs">{errs.photo}</p>}
              </div>

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="First Name" required error={errs.firstname}>
                  <input className={INPUT} value={form.firstname} placeholder="Juan"
                    onChange={e => set('firstname', toTitleCase(lettersOnly(e.target.value)))}/>
                </Field>
                <Field label="Middle Name" error={errs.middlename}>
                  <input className={INPUT} value={form.middlename} placeholder="Santos"
                    onChange={e => set('middlename', toTitleCase(lettersOnly(e.target.value)))}/>
                </Field>
                <Field label="Last Name" required error={errs.lastname}>
                  <input className={INPUT} value={form.lastname} placeholder="Dela Cruz"
                    onChange={e => set('lastname', toTitleCase(lettersOnly(e.target.value)))}/>
                </Field>
              </div>

              {/* Gender + Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Gender">
                  <select className={SELECT} value={form.gender} onChange={e => set('gender', e.target.value)}>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Contact Number" error={errs.contact}>
                  <input className={INPUT} value={form.contact} maxLength={11} placeholder="09171234567"
                    onChange={e => set('contact', digitsOnly(e.target.value))}/>
                  <p className="text-[10px] text-gray-400 mt-0.5">{form.contact.length}/11 digits</p>
                </Field>
              </div>

              {/* Address */}
              <Field label="Address">
                <input className={INPUT} value={form.address} placeholder="Purok/Street, Barangay"
                  onChange={e => set('address', e.target.value)}/>
              </Field>

              {/* Position + Committee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Position" required error={errs.position}>
                  <select className={SELECT} value={form.position} onChange={e => set('position', e.target.value)}>
                    {POSITIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Committee Assignment">
                  <input className={INPUT} value={form.committee} placeholder="e.g. Health, Peace & Order"
                    onChange={e => set('committee', e.target.value)}/>
                </Field>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Date Assumed Office">
                  <input type="date" className={INPUT} value={form.date_assumed}
                    onChange={e => set('date_assumed', e.target.value)}/>
                </Field>
                <Field label="Term Start">
                  <input type="date" className={INPUT} value={form.term_start}
                    onChange={e => set('term_start', e.target.value)}/>
                </Field>
                <Field label="Term End">
                  <input type="date" className={INPUT} value={form.term_end}
                    onChange={e => set('term_end', e.target.value)}/>
                </Field>
              </div>

              {/* Status */}
              <Field label="Status">
                <select className={SELECT} value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl transition-colors">
                  {saving ? <Loader size={14} className="animate-spin"/> : <Save size={14}/>}
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

// ─── Org chart node ───────────────────────────────────────────────────────────
function OrgNode({ official, colors }) {
  const c = colors[official.position] || 'bg-gray-100 text-gray-700 border-gray-200'
  const [bg, text] = c.split(' ')
  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-2xl border-2 p-3 w-36 flex flex-col items-center gap-2 shadow-sm ${bg} ${c.split(' ')[2] || 'border-gray-200'}`}>
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow bg-white flex items-center justify-center text-xl font-bold text-gray-400">
          {official.photo_url
            ? <img src={official.photo_url} alt="" className="w-full h-full object-cover"/>
            : <span className={text}>{official.firstname?.charAt(0).toUpperCase()}</span>
          }
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-800 leading-tight">
            {official.firstname} {official.lastname}
          </p>
          <p className={`text-[10px] font-semibold mt-0.5 ${text}`}>{official.position}</p>
          {official.status && official.status !== 'Active' && (
            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{official.status}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Org Chart ────────────────────────────────────────────────────────────────
function OrgChart({ officials }) {
  const sorted = [...officials].sort((a, b) =>
    (POSITION_RANK[a.position] ?? 99) - (POSITION_RANK[b.position] ?? 99)
  )

  // Group by rank tier
  const captain   = sorted.filter(o => o.position === 'Barangay Captain')
  const tier2     = sorted.filter(o => ['Barangay Secretary', 'Barangay Treasurer'].includes(o.position))
  const kagawads  = sorted.filter(o => o.position === 'Barangay Kagawad')
  const skChair   = sorted.filter(o => o.position === 'SK Chairman')
  const skKagawad = sorted.filter(o => o.position === 'SK Kagawad')
  const others    = sorted.filter(o => ['Barangay Health Worker', 'Barangay Tanod'].includes(o.position))

  const tiers = [captain, tier2, kagawads, skChair, skKagawad, others].filter(t => t.length)

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <GitBranch size={28} className="mx-auto mb-2 text-gray-200"/>
        <p className="text-sm text-gray-400">No officials to display in org chart</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
      <div className="flex flex-col items-center gap-0 min-w-max mx-auto">
        {tiers.map((tier, ti) => (
          <div key={ti} className="flex flex-col items-center w-full">
            {/* connector line from above */}
            {ti > 0 && (
              <div className="w-0.5 h-6 bg-gray-300" />
            )}
            {/* horizontal spread */}
            <div className="flex items-start gap-6 relative">
              {/* top horizontal bar if > 1 node */}
              {tier.length > 1 && (
                <div className="absolute top-0 left-[72px] right-[72px] h-0.5 bg-gray-300"
                  style={{ top: '-1px' }} />
              )}
              {tier.map((official, oi) => (
                <div key={official.id} className="flex flex-col items-center">
                  {tier.length > 1 && <div className="w-0.5 h-3 bg-gray-300" />}
                  <OrgNode official={official} colors={POSITION_COLORS}/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Officials() {
  const { profile } = useAuth()
  const [officials, setOfficials] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [tab, setTab]             = useState('list') // 'list' | 'chart'

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
    const payload = {
      barangay_id:  profile.barangay_id,
      firstname:    form.firstname.trim(),
      middlename:   form.middlename?.trim() || null,
      lastname:     form.lastname.trim(),
      gender:       form.gender,
      contact:      form.contact?.trim() || null,
      address:      form.address?.trim() || null,
      position:     form.position,
      committee:    form.committee?.trim() || null,
      date_assumed: form.date_assumed || null,
      term_start:   form.term_start || null,
      term_end:     form.term_end || null,
      status:       form.status,
      photo_url:    form.photo_url || null,
      // keep legacy name field in sync
      name: `${form.firstname.trim()} ${form.lastname.trim()}`,
    }
    if (editing?.id) {
      const { error } = await supabase.from('officials').update(payload).eq('id', editing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('officials').insert(payload)
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

  const sortedOfficials = [...officials].sort(
    (a, b) => (POSITION_RANK[a.position] ?? 99) - (POSITION_RANK[b.position] ?? 99)
  )

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Barangay Officials</h1>
          <p className="text-sm text-gray-500">Current elected and appointed officials</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Refresh"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
          </button>
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm">
            <Plus size={15}/> Add Official
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {[{ key: 'list', icon: List, label: 'List View' }, { key: 'chart', icon: GitBranch, label: 'Org Chart' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* Org Chart tab */}
      {tab === 'chart' && <OrgChart officials={officials}/>}

      {/* List tab */}
      {tab === 'list' && (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24"/>
            ))}
          </div>
        ) : officials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <UserCheck size={22} className="mx-auto mb-2 text-gray-300"/>
            <p className="text-sm text-gray-500 font-medium">No officials added yet</p>
            <button onClick={() => { setEditing(null); setModalOpen(true) }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              <Plus size={14}/> Add First Official
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOfficials.map((o, i) => {
              const name  = fullName(o) || o.name || '—'
              const color = POSITION_COLORS[o.position] || 'bg-gray-100 text-gray-600 border-gray-200'
              const [bg, text] = color.split(' ')
              return (
                <motion.div key={o.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-4">
                    {/* avatar */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                      {o.photo_url
                        ? <img src={o.photo_url} alt="" className="w-full h-full object-cover"/>
                        : <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${bg} ${text}`}>
                            {(o.firstname || o.name || '?').charAt(0).toUpperCase()}
                          </div>
                      }
                    </div>
                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800 text-sm">{name}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                          {o.position}
                        </span>
                        {o.status && o.status !== 'Active' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                            {o.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {o.contact && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone size={10}/>{o.contact}
                          </span>
                        )}
                        {o.committee && (
                          <span className="text-xs text-gray-400">Committee: {o.committee}</span>
                        )}
                        {o.gender && (
                          <span className="text-xs text-gray-400">{o.gender}</span>
                        )}
                      </div>
                      {(o.term_start || o.term_end) && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Term: {o.term_start ?? '—'} → {o.term_end ?? '—'}
                        </p>
                      )}
                    </div>
                    {/* actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => { setEditing(o); setModalOpen(true) }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                        <Pencil size={11}/> Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(o)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                        <Trash2 size={11}/> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <OfficialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
        userId={profile?.id}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={20} className="text-red-500"/>
              </div>
              <h3 className="font-bold text-gray-800 text-center mb-1">Delete Official?</h3>
              <p className="text-sm text-gray-500 text-center">
                Remove <span className="font-semibold text-gray-700">{fullName(deleteConfirm) || deleteConfirm.name}</span>? This cannot be undone.
              </p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl transition-colors">
                  {deleting ? <Loader size={14} className="animate-spin"/> : <Trash2 size={13}/>}
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
