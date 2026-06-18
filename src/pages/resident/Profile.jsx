import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, MapPin, Calendar, Shield, Edit3, Save, X,
  CheckCircle, Loader, Camera, Lock, Eye, EyeOff,
  Upload, Clock, XCircle, FileText, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const BUCKET = 'avatars'

export default function ResidentProfile() {
  const { profile, user, barangay, fetchProfile, silentRefreshProfile } = useAuth()

  const displayName = profile
    ? `${profile.firstname || ''} ${profile.middlename ? profile.middlename + ' ' : ''}${profile.lastname || ''}${profile.suffix ? ' ' + profile.suffix : ''}`.trim()
    : 'Resident'

  // ── Avatar ────────────────────────────────────────────────────────────────
  const fileRef = useRef(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError]         = useState('')
  const avatarUrl = profile?.avatar_url || null

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setAvatarError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024)    { setAvatarError('Image must be smaller than 5 MB.'); return }
    setAvatarError('')
    setAvatarUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const urlWithBust = `${publicUrl}?t=${Date.now()}`
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: urlWithBust }).eq('id', user.id)
      if (dbErr) throw dbErr
      await fetchProfile(user.id)
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload photo.')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  // ── Edit info ─────────────────────────────────────────────────────────────
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  function startEdit() {
    setEditForm({
      firstname:  profile?.firstname  || '',
      lastname:   profile?.lastname   || '',
      username:   profile?.username   || '',
    })
    setSaveError(''); setSaveSuccess(''); setEditing(true)
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    setSaveError(''); setSaveSuccess('')
    if (!editForm.firstname.trim() || !editForm.lastname.trim()) {
      setSaveError('First name and last name are required.'); return
    }
    setSaveLoading(true)
    try {
      const { error } = await supabase.from('profiles').update({
        firstname: editForm.firstname.trim(),
        lastname:  editForm.lastname.trim(),
        username:  editForm.username.trim() || null,
      }).eq('id', user.id)
      if (error) {
        if (error.message.includes('profiles_username_key')) throw new Error('That username is already taken.')
        throw error
      }
      await fetchProfile(user.id)
      setSaveSuccess('Profile updated successfully!')
      setEditing(false)
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes.')
    } finally {
      setSaveLoading(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm, setPwForm]       = useState({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError]     = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (!pwForm.current)                          { setPwError('Enter your current password.'); return }
    if (pwForm.newPw.length < 6)                  { setPwError('New password must be at least 6 characters.'); return }
    if (pwForm.newPw !== pwForm.confirm)           { setPwError('New passwords do not match.'); return }
    if (pwForm.newPw === pwForm.current)           { setPwError('New password must differ from current password.'); return }
    setPwLoading(true)
    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    profile.email,
        password: pwForm.current,
      })
      if (signInErr) throw new Error('Current password is incorrect.')
      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (updateErr) throw updateErr
      setPwSuccess('Password changed successfully!')
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err) {
      setPwError(err.message || 'Failed to change password.')
    } finally {
      setPwLoading(false)
    }
  }

  // ── Verification ─────────────────────────────────────────────────────────
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verFile, setVerFile]                 = useState(null)
  const [verUploading, setVerUploading]       = useState(false)
  const [verError, setVerError]               = useState('')
  const [verSuccess, setVerSuccess]           = useState(false)
  const verFileRef = useRef()
  const verStatus  = profile?.verification_status ?? 'unverified'
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefreshStatus() {
    if (!user || refreshing) return
    setRefreshing(true)
    await silentRefreshProfile(user.id)
    setTimeout(() => setRefreshing(false), 800)
  }

  useEffect(() => {
    if (verStatus !== 'pending') return
    const interval = setInterval(() => { if (user) silentRefreshProfile(user.id) }, 10000)
    return () => clearInterval(interval)
  }, [verStatus, user, silentRefreshProfile])

  const STATUS_CONFIG = {
    unverified: { label: 'Not Verified',   color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
    pending:    { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
    verified:   { label: 'Verified',       color: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
    rejected:   { label: 'Rejected',       color: 'bg-red-100 text-red-700',       dot: 'bg-red-500'    },
  }
  const statusCfg = STATUS_CONFIG[verStatus] ?? STATUS_CONFIG.unverified

  async function handleSubmitVerification() {
    if (!verFile) { setVerError('Please select a document or valid ID.'); return }
    setVerUploading(true); setVerError('')
    try {
      const ext  = verFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('verification-docs').upload(path, verFile, { upsert: true })
      if (upErr) throw upErr
      const { error: reqErr } = await supabase.from('verification_requests').insert({
        profile_id: user.id, barangay_id: profile?.barangay_id ?? null,
        document_url: path, document_name: verFile.name, status: 'pending',
      })
      if (reqErr) throw reqErr
      const { error: profErr } = await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', user.id)
      if (profErr) throw profErr
      await fetchProfile(user.id)
      setVerSuccess(true)
      setTimeout(() => { setShowVerifyModal(false); setVerSuccess(false); setVerFile(null) }, 2500)
    } catch (err) {
      setVerError(err.message || 'Upload failed. Please try again.')
    } finally {
      setVerUploading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your account information and security</p>
      </div>

      {/* ── Identity card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : displayName.charAt(0).toUpperCase() || 'R'
              }
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change photo">
              {avatarUploading
                ? <Loader size={18} className="text-white animate-spin" />
                : <Camera size={18} className="text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name / role / verification */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-gray-800">{displayName}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{profile?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                <Shield size={11} /> Resident
              </span>
              {barangay?.name && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                  <MapPin size={11} /> {barangay.name}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <button
                onClick={handleRefreshStatus}
                title="Refresh verification status"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                <RefreshCw size={13} className={refreshing ? 'animate-spin text-blue-500' : ''} />
              </button>
            </div>
            {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!editing && (
              <button onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                <Edit3 size={14} /> Edit Info
              </button>
            )}
            {(verStatus === 'unverified' || verStatus === 'rejected') && (
              <button onClick={() => { setShowVerifyModal(true); setVerFile(null); setVerError(''); setVerSuccess(false) }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                <Upload size={14} /> Verify Account
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Account Information ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-gray-800">Account Information</h3>
          </div>
          {!editing && (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>

        <div className="p-5">
          {/* View mode */}
          {!editing && (
            <>
              {saveSuccess && (
                <div className="mb-4 bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100 flex items-center gap-2">
                  <CheckCircle size={14} className="flex-shrink-0" />{saveSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: <User size={13} className="text-gray-400" />,     label: 'First Name',    value: profile?.firstname },
                  { icon: <User size={13} className="text-gray-400" />,     label: 'Last Name',     value: profile?.lastname },
                  { icon: <Mail size={13} className="text-gray-400" />,     label: 'Email Address', value: profile?.email },
                  { icon: <User size={13} className="text-gray-400" />,     label: 'Username',      value: profile?.username ? `@${profile.username}` : '—' },
                  { icon: <MapPin size={13} className="text-gray-400" />,   label: 'Barangay',      value: barangay?.name },
                  { icon: <Calendar size={13} className="text-gray-400" />, label: 'Member Since',  value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">{f.icon}
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{f.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 break-all">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Edit mode */}
          {editing && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              {saveError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{saveError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                  <input type="text" required value={editForm.firstname}
                    onChange={e => setEditForm(p => ({ ...p, firstname: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    placeholder="First name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input type="text" required value={editForm.lastname}
                    onChange={e => setEditForm(p => ({ ...p, lastname: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    placeholder="Last name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input type="text" value={editForm.username}
                    onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    placeholder="Username (optional)" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={saveLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm">
                  {saveLoading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-semibold px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* ── Change Password ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock size={15} className="text-blue-500" />
          <h3 className="text-sm font-bold text-gray-800">Change Password</h3>
        </div>
        <div className="p-5">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {pwError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{pwError}</div>
            )}
            {pwSuccess && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100 flex items-center gap-2">
                <CheckCircle size={14} className="flex-shrink-0" />{pwSuccess}
              </div>
            )}

            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={pwLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm">
              {pwLoading ? <Loader size={14} className="animate-spin" /> : <Lock size={14} />}
              Update Password
            </button>
          </form>
        </div>
      </motion.div>

      {/* ── Verification Modal ── */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

              {verSuccess ? (
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

                  <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
                    <p className="font-semibold text-blue-800 mb-2">Your Information</p>
                    <div className="space-y-1 text-xs text-blue-700">
                      <p><strong>Name:</strong> {displayName}</p>
                      <p><strong>Email:</strong> {profile?.email}</p>
                      <p><strong>Barangay:</strong> {barangay?.name ?? '—'}</p>
                    </div>
                  </div>

                  {verError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 mb-4">
                      {verError}
                    </div>
                  )}

                  <div onClick={() => verFileRef.current.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-4 ${
                      verFile ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                    }`}>
                    {verFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText size={20} className="text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-blue-700">{verFile.name}</p>
                          <p className="text-xs text-gray-400">{(verFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Click to upload document</p>
                        <p className="text-xs text-gray-400 mt-1">Valid ID, Barangay ID, or any government-issued ID</p>
                        <p className="text-xs text-gray-400">JPG, PNG, PDF — max 5 MB</p>
                      </>
                    )}
                    <input ref={verFileRef} type="file" accept="image/*,.pdf" className="hidden"
                      onChange={e => { const f = e.target.files[0]; if (f && f.size > 5*1024*1024) { setVerError('File must be under 5 MB.'); return } setVerFile(f || null); setVerError('') }} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowVerifyModal(false)}
                      className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSubmitVerification} disabled={verUploading || !verFile}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors">
                      {verUploading
                        ? <><Loader size={14} className="animate-spin" />Uploading…</>
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
