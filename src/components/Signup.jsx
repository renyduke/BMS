import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle, Loader, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ── Reuse same skyline as Login ───────────────────────────────────────────────
function CitySkyline() {
  return (
    <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 340"
      preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="
        M0,340 L0,230 L40,230 L40,180 L60,180 L60,145 L80,145 L80,180 L100,180 L100,230
        L115,230 L115,140 L128,140 L128,105 L134,105 L134,70 L140,70 L140,105 L146,105 L146,140 L160,140 L160,230
        L175,230 L175,175 L200,175 L200,148 L212,148 L212,118 L224,118 L224,148 L236,148 L236,175 L260,175 L260,230
        L275,230 L275,120 L288,120 L288,85 L294,85 L294,52 L300,52 L300,85 L306,85 L306,120 L320,120 L320,230
        L338,230 L338,160 L360,160 L360,130 L372,130 L372,100 L384,100 L384,130 L396,130 L396,160 L418,160 L418,230
        L433,230 L433,190 L455,190 L455,162 L467,162 L467,132 L479,132 L479,162 L491,162 L491,190 L513,190 L513,230
        L528,230 L528,118 L541,118 L541,83 L547,83 L547,50 L553,50 L553,83 L559,83 L559,118 L573,118 L573,230
        L588,230 L588,162 L610,162 L610,135 L622,135 L622,105 L634,105 L634,135 L646,135 L646,162 L668,162 L668,230
        L683,230 L683,185 L705,185 L705,155 L717,155 L717,122 L729,122 L729,155 L741,155 L741,185 L763,185 L763,230
        L778,230 L778,108 L791,108 L791,73 L797,73 L797,42 L803,42 L803,73 L809,73 L809,108 L823,108 L823,230
        L838,230 L838,155 L860,155 L860,125 L872,125 L872,95 L884,95 L884,125 L896,125 L896,155 L918,155 L918,230
        L933,230 L933,192 L955,192 L955,162 L967,162 L967,128 L979,128 L979,162 L991,162 L991,192 L1013,192 L1013,230
        L1028,230 L1028,115 L1041,115 L1041,80 L1047,80 L1047,48 L1053,48 L1053,80 L1059,80 L1059,115 L1073,115 L1073,230
        L1088,230 L1088,168 L1110,168 L1110,138 L1122,138 L1122,108 L1134,108 L1134,138 L1146,138 L1146,168 L1168,168 L1168,230
        L1183,230 L1183,125 L1196,125 L1196,90 L1202,90 L1202,58 L1208,58 L1208,90 L1214,90 L1214,125 L1228,125 L1228,230
        L1243,230 L1243,172 L1265,172 L1265,142 L1277,142 L1277,112 L1289,112 L1289,142 L1301,142 L1301,172 L1323,172 L1323,230
        L1338,230 L1338,195 L1360,195 L1360,165 L1372,165 L1372,132 L1384,132 L1384,165 L1396,165 L1396,195 L1440,195
        L1440,340 Z"
        fill="#0f172a" opacity="0.92" />
      {[
        [134,78],[300,60],[547,58],[797,50],[1047,56],[1202,66],
        [134,112],[300,93],[547,91],[797,81],[1047,88],[1202,98],
        [134,148],[300,128],[547,126],[797,116],[1047,123],[1202,133],
      ].map(([x, y], i) => (
        <rect key={i} x={x-4} y={y} width="8" height="10" fill="#fbbf24" opacity="0.8" rx="1.5" />
      ))}
    </svg>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SUFFIX_OPTIONS = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']
const initialForm = {
  lastname: '', firstname: '', middlename: '', suffix: '',
  username: '', email: '', password: '', confirmPassword: '', barangay_id: '',
}

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({ error, children }) {
  return (
    <div>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [barangays, setBarangays] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState('idle')
  const [nameStatus, setNameStatus] = useState('idle')
  const debounceRef = useRef(null)
  const nameDebounceRef = useRef(null)

  useEffect(() => {
    supabase.from('barangays').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setBarangays(data) })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
    setGlobalError('')

    if (name === 'username') {
      setUsernameStatus('idle')
      clearTimeout(debounceRef.current)
      const trimmed = value.trim()
      if (trimmed.length >= 3) {
        setUsernameStatus('checking')
        debounceRef.current = setTimeout(() => checkUsername(trimmed), 600)
      }
    }
    if (name === 'firstname' || name === 'lastname') {
      setNameStatus('idle')
      clearTimeout(nameDebounceRef.current)
      const updated = { ...form, [name]: value }
      const fn = updated.firstname.trim()
      const ln = updated.lastname.trim()
      if (fn.length >= 2 && ln.length >= 2) {
        setNameStatus('checking')
        nameDebounceRef.current = setTimeout(() => checkResidentName(fn, ln), 700)
      }
    }
  }

  async function checkResidentName(firstname, lastname) {
    try {
      const { data, error } = await supabase.from('residents').select('id')
        .ilike('firstname', firstname.trim()).ilike('lastname', lastname.trim()).limit(1)
      if (error) { setNameStatus('idle'); return }
      setNameStatus(data && data.length > 0 ? 'found' : 'not_found')
    } catch { setNameStatus('idle') }
  }

  async function checkUsername(username) {
    try {
      const { data, error } = await supabase.from('profiles').select('id')
        .eq('username', username).maybeSingle()
      if (error) { setUsernameStatus('idle'); return }
      setUsernameStatus(data ? 'taken' : 'available')
    } catch { setUsernameStatus('idle') }
  }

  function validate() {
    const e = {}
    if (!form.lastname.trim())  e.lastname  = 'Required'
    if (!form.firstname.trim()) e.firstname = 'Required'
    if (nameStatus === 'not_found') e.firstname = 'Name not found in barangay records.'
    if (nameStatus === 'checking')  e.firstname = 'Verifying name…'
    if (!form.username.trim())  e.username  = 'Required'
    else if (usernameStatus === 'taken')    e.username = 'Username already taken.'
    else if (usernameStatus === 'checking') e.username = 'Checking availability…'
    if (!form.barangay_id)      e.barangay_id = 'Select your barangay.'
    if (!form.email.trim())     e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email.'
    if (!form.password)         e.password = 'Required'
    else if (form.password.length < 6) e.password = 'Min. 6 characters.'
    if (!form.confirmPassword)  e.confirmPassword = 'Required'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true); setGlobalError('')
    try {
      await signUp({
        email: form.email.trim(), password: form.password,
        lastname: form.lastname.trim(), firstname: form.firstname.trim(),
        middlename: form.middlename.trim(), suffix: form.suffix,
        username: form.username.trim(), barangay_id: form.barangay_id,
      })
      setSuccess(true)
      setTimeout(() => navigate('/'), 3000)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('profiles_username_key') || msg.includes('username'))
        setErrors(prev => ({ ...prev, username: 'Username already taken.' }))
      else if (msg.includes('profiles_email_key') || msg.includes('email'))
        setErrors(prev => ({ ...prev, email: 'Email already registered.' }))
      else setGlobalError(msg || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const inp = (field) =>
    `w-full px-3 py-2 border text-gray-900 placeholder-gray-400 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[field] ? 'border-red-400' : 'border-gray-300'}`

  // ── Success screen ──
  if (success) {
    return (
      <div className="h-screen w-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(175deg, #e8f0fe 0%, #dbeafe 45%, #bfdbfe 100%)' }}>
        <CitySkyline />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white shadow-2xl border border-gray-200 p-10 text-center w-80">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm mb-1">Check your email to confirm your account.</p>
          <p className="text-gray-400 text-xs">Redirecting to login in 3 seconds…</p>
        </motion.div>
      </div>
    )
  }

  // ── Main layout ──
  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(175deg, #e8f0fe 0%, #dbeafe 45%, #bfdbfe 100%)' }}>
      <CitySkyline />

      {/* Centered card — scrollable internally */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-4 pb-44 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="bg-white shadow-2xl border border-gray-200">
            {/* Card header — branding */}
            <div className="text-center pt-5 pb-3 border-b border-gray-100">
              <h1 className="text-xl font-extrabold text-blue-700 tracking-tight">BMS Calatrava</h1>
              <p className="text-xs text-gray-500 mt-0.5">Sign up</p>
            </div>

            {/* Scrollable form body */}
            <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
              {globalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 mb-3 flex items-start gap-2">
                  <span>⚠️</span><span>{globalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Row 1: Last + First */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Field error={errors.lastname}>
                    <input name="lastname" type="text" value={form.lastname} onChange={handleChange}
                      placeholder="Last name" className={inp('lastname')} />
                  </Field>
                  <Field error={errors.firstname}>
                    <input name="firstname" type="text" value={form.firstname} onChange={handleChange}
                      placeholder="First name" className={inp('firstname')} />
                  </Field>
                </div>

                {/* Row 2: Middle + Suffix */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Field error={errors.middlename}>
                    <input name="middlename" type="text" value={form.middlename} onChange={handleChange}
                      placeholder="Middle name" className={inp('middlename')} />
                  </Field>
                  <Field error={errors.suffix}>
                    <select name="suffix" value={form.suffix} onChange={handleChange} className={inp('suffix')}>
                      {SUFFIX_OPTIONS.map(o => <option key={o} value={o}>{o || 'Suffix'}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Name verification banner */}
                {nameStatus === 'checking' && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2 mb-2">
                    <Loader size={12} className="animate-spin flex-shrink-0" />
                    <span>Verifying name in barangay records…</span>
                  </div>
                )}
                {nameStatus === 'found' && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 mb-2">
                    <CheckCircle size={12} className="flex-shrink-0" />
                    <span>Name found. You may proceed.</span>
                  </div>
                )}
                {nameStatus === 'not_found' && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 mb-2">
                    <ShieldAlert size={12} className="flex-shrink-0" />
                    <span>Name not found. Contact your barangay admin first.</span>
                  </div>
                )}

                {/* Barangay */}
                <Field error={errors.barangay_id}>
                  <select name="barangay_id" value={form.barangay_id} onChange={handleChange}
                    className={`${inp('barangay_id')} mb-2`}>
                    <option value="">— Select Barangay —</option>
                    {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>

                {/* Username */}
                <Field error={errors.username}>
                  <div className="relative mb-2">
                    <input name="username" type="text" value={form.username} onChange={handleChange}
                      placeholder="Username" autoComplete="username"
                      className={`${inp('username')} pr-8`} />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking'  && <Loader size={13} className="text-gray-400 animate-spin" />}
                      {usernameStatus === 'available' && <CheckCircle size={13} className="text-green-500" />}
                      {usernameStatus === 'taken'     && <XCircle size={13} className="text-red-500" />}
                    </span>
                  </div>
                </Field>

                {/* Email */}
                <Field error={errors.email}>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="Email address" autoComplete="email"
                    className={`${inp('email')} mb-2`} />
                </Field>

                {/* Password */}
                <Field error={errors.password}>
                  <div className="relative mb-2">
                    <input name="password" type={showPassword ? 'text' : 'password'}
                      value={form.password} onChange={handleChange}
                      placeholder="New password" autoComplete="new-password"
                      className={`${inp('password')} pr-9`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                {/* Confirm password */}
                <Field error={errors.confirmPassword}>
                  <div className="relative mb-3">
                    <input name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="Confirm password" autoComplete="new-password"
                      className={`${inp('confirmPassword')} pr-9`} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                {/* Submit */}
                <motion.button type="submit"
                  disabled={loading || nameStatus === 'not_found' || nameStatus === 'checking'}
                  whileHover={{ scale: loading || nameStatus === 'not_found' ? 1 : 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2.5 transition-all text-sm">
                  {loading
                    ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Creating…</>
                    : <><UserPlus size={14} />Sign Up</>}
                </motion.button>
              </form>
            </div>

            {/* Card footer */}
            <div className="text-center py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
