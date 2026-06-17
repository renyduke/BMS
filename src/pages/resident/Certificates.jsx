import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, FileText, ClipboardList, Plus, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// ── Certificate catalog ───────────────────────────────────────────────────────
const CERTS = [
  { label: 'Barangay Clearance',     icon: Award,         color: 'bg-blue-50 text-blue-600',    border: 'border-blue-100',    fee: '₱50.00',  days: '1-2 days' },
  { label: 'Residency Certificate',  icon: FileText,      color: 'bg-green-50 text-green-600',  border: 'border-green-100',   fee: '₱50.00',  days: '1-2 days' },
  { label: 'Certificate of Indigency', icon: FileText,    color: 'bg-orange-50 text-orange-600',border: 'border-orange-100',  fee: 'Free',    days: '1 day' },
  { label: 'Business Permit',        icon: ClipboardList, color: 'bg-purple-50 text-purple-600',border: 'border-purple-100',  fee: '₱200.00', days: '3-5 days' },
  { label: 'Cedula',                 icon: Award,         color: 'bg-cyan-50 text-cyan-600',    border: 'border-cyan-100',    fee: 'Varies',  days: '1 day' },
  { label: 'Good Moral Certificate', icon: Award,         color: 'bg-pink-50 text-pink-600',    border: 'border-pink-100',    fee: '₱50.00',  days: '1-2 days' },
]

const SUFFIX_OPTIONS = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']

// ── Reusable input ────────────────────────────────────────────────────────────
function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${className}`}
    />
  )
}

function Select({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${className}`}
    >
      {children}
    </select>
  )
}

// ── Certificate-specific extra fields ─────────────────────────────────────────
function ExtraFields({ type, extra, setExtra }) {
  function set(key) {
    return e => setExtra(p => ({ ...p, [key]: e.target.value }))
  }

  if (type === 'Business Permit') {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Business Name" required>
            <Input value={extra.businessName ?? ''} onChange={set('businessName')} placeholder="e.g. Sari-sari Store" />
          </Field>
          <Field label="Business Type" required>
            <Input value={extra.businessType ?? ''} onChange={set('businessType')} placeholder="Retail / Service" />
          </Field>
        </div>
        <Field label="Business Address" required>
          <Input value={extra.businessAddress ?? ''} onChange={set('businessAddress')} placeholder="Purok, Barangay, Municipality" />
        </Field>
      </>
    )
  }

  if (type === 'Cedula') {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of Birth" required>
            <Input type="date" value={extra.dob ?? ''} onChange={set('dob')} />
          </Field>
          <Field label="Civil Status" required>
            <Select value={extra.civilStatus ?? ''} onChange={set('civilStatus')}>
              <option value="">— Select —</option>
              {['Single','Married','Widowed','Separated'].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Height (cm)">
            <Input value={extra.height ?? ''} onChange={set('height')} placeholder="e.g. 165" />
          </Field>
          <Field label="Weight (kg)">
            <Input value={extra.weight ?? ''} onChange={set('weight')} placeholder="e.g. 60" />
          </Field>
        </div>
        <Field label="Occupation">
          <Input value={extra.occupation ?? ''} onChange={set('occupation')} placeholder="e.g. Farmer" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gross Annual Income">
            <Input value={extra.income ?? ''} onChange={set('income')} placeholder="e.g. 50000" />
          </Field>
          <Field label="Place of Birth">
            <Input value={extra.pob ?? ''} onChange={set('pob')} placeholder="City / Municipality" />
          </Field>
        </div>
      </>
    )
  }

  // All other certs share the same simple purpose + quantity fields
  return null
}

// ── Certificate Request Form (full page view) ─────────────────────────────────
function CertRequestForm({ cert, profile, onBack, onSuccess }) {
  const [form, setForm] = useState({
    lastname:   profile?.lastname  ?? '',
    firstname:  profile?.firstname ?? '',
    middlename: profile?.middlename ?? '',
    suffix:     profile?.suffix ?? '',
    contact:    '',
    purpose:    '',
    quantity:   '1',
  })
  const [extra, setExtra] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(key) {
    return e => setForm(p => ({ ...p, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.purpose.trim()) { setError('Purpose is required.'); return }
    setSubmitting(true); setError('')
    try {
      const { error: err } = await supabase.from('requests').insert({
        resident_id: profile?.id ?? null,
        barangay_id: profile?.barangay_id ?? null,
        type:        cert.label,
        purpose:     form.purpose.trim(),
        status:      'Pending',
        firstname:   form.firstname.trim(),
        middlename:  form.middlename.trim() || null,
        lastname:    form.lastname.trim(),
        suffix:      form.suffix || null,
        contact:     form.contact.trim() || null,
        quantity:    parseInt(form.quantity) || 1,
      })
      if (err) throw err
      onSuccess()
    } catch (e) {
      setError(e.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-xl mx-auto">

      {/* Back button */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 transition-colors">
        <ArrowLeft size={16} />Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">{cert.label}</h2>

        <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-5 flex gap-6 text-xs text-gray-500">
          <span>Fee: <strong className="text-gray-700">{cert.fee}</strong></span>
          <span>Processing Time: <strong className="text-gray-700">{cert.days}</strong></span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Row 1: Last + First */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last Name" required>
              <Input value={form.lastname} onChange={set('lastname')} placeholder="Dela Cruz" />
            </Field>
            <Field label="First Name" required>
              <Input value={form.firstname} onChange={set('firstname')} placeholder="Juan" />
            </Field>
          </div>

          {/* Row 2: Middle + Suffix + Contact */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Middle Name">
              <Input value={form.middlename} onChange={set('middlename')} placeholder="Santos" />
            </Field>
            <Field label="Suffix">
              <Select value={form.suffix} onChange={set('suffix')}>
                {SUFFIX_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
              </Select>
            </Field>
            <Field label="Contact Number" required>
              <Input value={form.contact} onChange={set('contact')} placeholder="09XXXXXXXXX" />
            </Field>
          </div>

          {/* Certificate-specific fields */}
          <ExtraFields type={cert.label} extra={extra} setExtra={setExtra} />

          {/* Row: Type of Certificate + Purpose + Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type of Certificate">
              <Input value={cert.label} readOnly className="bg-gray-100 cursor-default" />
            </Field>
            <Field label="Purpose" required>
              <Input
                value={form.purpose}
                onChange={set('purpose')}
                placeholder="Employment / School…"
              />
            </Field>
            <Field label="Quantity">
              <Input
                type="number" min="1" max="10"
                value={form.quantity}
                onChange={set('quantity')}
                placeholder="1"
              />
            </Field>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors shadow-md mt-2">
            {submitting
              ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Submitting…</>
              : 'Submit'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ cert, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-700 mb-2">Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-6">
          Your request for <strong>{cert.label}</strong> has been submitted successfully.
          The barangay admin will process it and notify you shortly.
        </p>
        <button onClick={onBack}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
          Request Another
        </button>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Certificates() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('list')   // 'list' | 'form' | 'success'
  const [selectedCert, setSelectedCert] = useState(null)
  const [showBlockedModal, setShowBlockedModal] = useState(false)

  const isVerified = profile?.verification_status === 'verified'

  function handleRequest(cert) {
    if (!isVerified) { setShowBlockedModal(true); return }
    setSelectedCert(cert)
    setView('form')
  }

  if (view === 'form' && selectedCert) {
    return (
      <CertRequestForm
        cert={selectedCert}
        profile={profile}
        onBack={() => setView('list')}
        onSuccess={() => setView('success')}
      />
    )
  }

  if (view === 'success' && selectedCert) {
    return <SuccessScreen cert={selectedCert} onBack={() => { setView('list'); setSelectedCert(null) }} />
  }

  // ── Certificate list ──
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Certificates</h1>
        <p className="text-sm text-gray-500">Request official barangay certificates and documents</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CERTS.map(({ label, icon: Icon, color, border, fee, days }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-white rounded-2xl border ${border} shadow-sm p-5 hover:shadow-md transition-all`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={22} />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">{label}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span>Fee: <strong className="text-gray-700">{fee}</strong></span>
              <span>Processing: <strong className="text-gray-700">{days}</strong></span>
            </div>
            <button
              onClick={() => handleRequest({ label, fee, days })}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
              <Plus size={13} />Request Now
            </button>
          </motion.div>
        ))}
      </div>

      {/* Not-verified modal */}
      <AnimatePresence>
        {showBlockedModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Account Not Verified</h3>
              <p className="text-sm text-gray-500 mb-5">
                You cannot request a certificate. Please go to your <strong>Profile</strong> page
                and click <strong>"Verify Account"</strong> to upload a valid ID.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowBlockedModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Close
                </button>
                <button onClick={() => { setShowBlockedModal(false); navigate('/resident/profile') }}
                  className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                  Go to Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
