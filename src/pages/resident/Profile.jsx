import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, MapPin, Calendar, Shield, Upload, CheckCircle, Clock, XCircle, X, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function ResidentProfile() {
  const { profile, barangay, fetchProfile, silentRefreshProfile, user } = useAuth()
  const displayName = profile
    ? `${profile.firstname}${profile.middlename ? ' ' + profile.middlename : ''} ${profile.lastname}${profile.suffix ? ' ' + profile.suffix : ''}`
    : 'Resident'

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileRef = useRef()

  const verStatus = profile?.verification_status ?? 'unverified'

  // Poll silently every 10s while pending — NO loading flash, just updates profile state
  useEffect(() => {
    if (verStatus !== 'pending') return
    const interval = setInterval(() => {
      if (user) silentRefreshProfile(user.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [verStatus, user, silentRefreshProfile])

  const STATUS_CONFIG = {
    unverified: { label: 'Not Verified',    color: 'bg-gray-100 text-gray-600',   icon: XCircle,     dot: 'bg-gray-400' },
    pending:    { label: 'Pending Review',  color: 'bg-yellow-100 text-yellow-700', icon: Clock,      dot: 'bg-yellow-400' },
    verified:   { label: 'Verified',        color: 'bg-green-100 text-green-700',  icon: CheckCircle, dot: 'bg-green-500' },
    rejected:   { label: 'Rejected',        color: 'bg-red-100 text-red-700',      icon: XCircle,     dot: 'bg-red-500' },
  }

  const statusCfg = STATUS_CONFIG[verStatus] ?? STATUS_CONFIG.unverified
  const StatusIcon = statusCfg.icon

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setUploadError('File must be under 5MB.'); return }
    setFile(f)
    setUploadError('')
  }

  async function handleSubmitVerification() {
    if (!file) { setUploadError('Please select a document or valid ID.'); return }
    setUploading(true); setUploadError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('verification-docs')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      // Store the storage PATH (not public URL) — admin will generate signed URL
      const { error: reqErr } = await supabase.from('verification_requests').insert({
        profile_id:    user.id,
        barangay_id:   profile?.barangay_id ?? null,
        document_url:  path,           // ← store path, not public URL
        document_name: file.name,
        status:        'pending',
      })
      if (reqErr) throw reqErr

      // Update profile verification_status to pending
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('id', user.id)
      if (profErr) throw profErr

      await fetchProfile(user.id)
      setUploadSuccess(true)
      setTimeout(() => { setShowVerifyModal(false); setUploadSuccess(false); setFile(null) }, 2500)
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const fields = [
    { icon: User,     label: 'Full Name',    value: displayName },
    { icon: Mail,     label: 'Email',        value: profile?.email ?? '—' },
    { icon: User,     label: 'Username',     value: `@${profile?.username ?? '—'}` },
    { icon: MapPin,   label: 'Barangay',     value: barangay?.name ?? '—' },
    { icon: MapPin,   label: 'Municipality', value: 'Calatrava' },
    { icon: MapPin,   label: 'Province',     value: 'Negros Occidental' },
    { icon: Shield,   label: 'Role',         value: 'Resident' },
    { icon: Calendar, label: 'Member Since', value: profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
          <p className="text-sm text-gray-500">Your personal account information</p>
        </div>
        {/* Manual refresh button — useful when admin has just approved */}
        <button
          onClick={() => user && silentRefreshProfile(user.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          title="Check for status updates"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Refresh Status
        </button>
      </div>

      {/* Two-column layout: profile card left, account details right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-24 relative">
              <div className="absolute -bottom-8 left-6">
                <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-blue-700 font-bold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <div className="pt-12 px-6 pb-6">
              <h2 className="text-lg font-bold text-gray-800">{displayName}</h2>
              <p className="text-sm text-gray-500 mb-3">{profile?.email}</p>

              {/* Verification status badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>

              {/* Verify button */}
              {(verStatus === 'unverified' || verStatus === 'rejected') && (
                <button
                  onClick={() => { setShowVerifyModal(true); setFile(null); setUploadError(''); setUploadSuccess(false) }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Upload size={13} />Verify Account
                </button>
              )}

              {verStatus === 'pending' && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 text-xs text-yellow-700 flex items-start gap-2">
                  <Clock size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Under review. The admin will process it shortly.</span>
                </div>
              )}
              {verStatus === 'verified' && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs text-green-700 flex items-start gap-2">
                  <CheckCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Account verified. You can now request certificates.</span>
                </div>
              )}
              {verStatus === 'rejected' && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700 flex items-start gap-2">
                  <XCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Verification rejected. Please re-submit with a valid ID.</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Account details */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Verification modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

              {uploadSuccess ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-green-700 mb-1">Submitted!</h3>
                  <p className="text-sm text-gray-500">Your verification request has been submitted. The admin will review it shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Verify Your Account</h3>
                      <p className="text-sm text-gray-500">Upload a valid ID or supporting document</p>
                    </div>
                    <button onClick={() => setShowVerifyModal(false)}
                      className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Resident info preview */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
                    <p className="font-semibold text-blue-800 mb-2">Your Information</p>
                    <div className="space-y-1 text-xs text-blue-700">
                      <p><strong>Name:</strong> {displayName}</p>
                      <p><strong>Email:</strong> {profile?.email}</p>
                      <p><strong>Barangay:</strong> {barangay?.name ?? '—'}</p>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 mb-4">
                      {uploadError}
                    </div>
                  )}

                  {/* File upload area */}
                  <div
                    onClick={() => fileRef.current.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-4 ${
                      file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                    }`}
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText size={20} className="text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-blue-700">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Click to upload document</p>
                        <p className="text-xs text-gray-400 mt-1">Valid ID, Barangay ID, or any government-issued ID</p>
                        <p className="text-xs text-gray-400">JPG, PNG, PDF — max 5MB</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowVerifyModal(false)}
                      className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSubmitVerification} disabled={uploading || !file}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors">
                      {uploading
                        ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Uploading…</>
                        : <><Upload size={14} />Submit</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
