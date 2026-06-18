import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Calendar, Shield, KeyRound, CheckCircle,
  Loader, Eye, EyeOff, Edit3, Save, X, Camera,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const BUCKET = 'avatars'

export default function SuperAdminProfile() {
  const { profile, user, fetchProfile } = useAuth()

  const displayName = profile
    ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim()
    : 'Super Admin'

  // ── avatar ────────────────────────────────────────────────────────────────
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

  // ── edit info ─────────────────────────────────────────────────────────────
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  function startEdit() {
    setEditForm({ firstname: profile?.firstname || '', lastname: profile?.lastname || '', username: profile?.username || '' })
    setSaveError(''); setSaveSuccess(''); setEditing(true)
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    setSaveError(''); setSaveSuccess('')
    if (!editForm.firstname.trim() || !editForm.lastname.trim()) { setSaveError('First name and last name are required.'); return }
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

  // ── password ──────────────────────────────────────────────────────────────
  const [passForm, setPassForm]       = useState({ currentPass: '', newPass: '', confirmPass: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError]     = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPassError(''); setPassSuccess('')
    if (passForm.newPass.length < 6)                       { setPassError('New password must be at least 6 characters.'); return }
    if (passForm.newPass !== passForm.confirmPass)         { setPassError('New passwords do not match.'); return }
    setPassLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: passForm.currentPass })
      if (signInError) { setPassError('Current password is incorrect.'); return }
      const { error: updateError } = await supabase.auth.updateUser({ password: passForm.newPass })
      if (updateError) throw updateError
      setPassSuccess('Password updated successfully!')
      setPassForm({ currentPass: '', newPass: '', confirmPass: '' })
    } catch (err) {
      setPassError(err.message || 'Failed to update password.')
    } finally {
      setPassLoading(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── page header (matches all sidebar pages) ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your account information and security</p>
      </div>

      {/* ── profile identity card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

          {/* avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-sm">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : displayName.charAt(0).toUpperCase() || 'S'
              }
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change photo"
            >
              {avatarUploading
                ? <Loader size={18} className="text-white animate-spin" />
                : <Camera size={18} className="text-white" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* name / role / email */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-gray-800">{displayName}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{profile?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                <Shield size={11} /> Super Administrator
              </span>
              {profile?.created_at && (
                <span className="text-xs text-gray-400">
                  Member since {new Date(profile.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
          </div>

          {/* edit button */}
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Edit3 size={14} /> Edit Info
            </button>
          )}
        </div>
      </motion.div>

      {/* ── account information (view / edit) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={15} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-800">Account Information</h3>
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>

        <div className="p-5">
          {/* view mode */}
          {!editing && (
            <>
              {saveSuccess && (
                <div className="mb-4 bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100 flex items-center gap-2">
                  <CheckCircle size={14} className="flex-shrink-0" />{saveSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: <User size={13} className="text-gray-400" />,     label: 'First Name',      value: profile?.firstname },
                  { icon: <User size={13} className="text-gray-400" />,     label: 'Last Name',       value: profile?.lastname },
                  { icon: <Mail size={13} className="text-gray-400" />,     label: 'Email Address',   value: profile?.email },
                  { icon: <User size={13} className="text-gray-400" />,     label: 'Username',        value: profile?.username ? `@${profile.username}` : '—' },
                  { icon: <Calendar size={13} className="text-gray-400" />, label: 'Account Created', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      {f.icon}
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{f.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 break-all">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* edit mode */}
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 transition-all"
                    placeholder="First name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input type="text" required value={editForm.lastname}
                    onChange={e => setEditForm(p => ({ ...p, lastname: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 transition-all"
                    placeholder="Last name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input type="text" value={editForm.username}
                    onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 transition-all"
                    placeholder="Username (optional)" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={saveLoading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm">
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

      {/* ── change password ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <KeyRound size={15} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-gray-800">Change Password</h3>
        </div>

        <div className="p-5">
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {passError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{passError}</div>
            )}
            {passSuccess && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100 flex items-center gap-2">
                <CheckCircle size={14} className="flex-shrink-0" />{passSuccess}
              </div>
            )}

            <PwField label="Current Password"     value={passForm.currentPass} show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              onChange={e => setPassForm(p => ({ ...p, currentPass: e.target.value }))}
              placeholder="Enter current password" />
            <PwField label="New Password"          value={passForm.newPass}     show={showNew}
              onToggle={() => setShowNew(v => !v)}
              onChange={e => setPassForm(p => ({ ...p, newPass: e.target.value }))}
              placeholder="Enter new password" />
            <PwField label="Confirm New Password"  value={passForm.confirmPass} show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              onChange={e => setPassForm(p => ({ ...p, confirmPass: e.target.value }))}
              placeholder="Confirm new password" />

            <button type="submit" disabled={passLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm">
              {passLoading && <Loader size={14} className="animate-spin" />}
              Update Password
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-400">Choose a strong password with at least 6 characters.</p>
        </div>
      </motion.div>

    </div>
  )
}

function PwField({ label, value, show, onToggle, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required value={value} onChange={onChange}
          className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 transition-all"
          placeholder={placeholder}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}
