import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function CitySkyline() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full"
      viewBox="0 0 1440 340"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="
          M0,340 L0,230
          L40,230 L40,180 L60,180 L60,145 L80,145 L80,180 L100,180 L100,230
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
          L1440,340 Z
        "
        fill="#0f172a"
        opacity="0.92"
      />
      {/* Lit windows */}
      {[
        [134,78],[300,60],[547,58],[797,50],[1047,56],[1202,66],[134,112],[300,93],
        [547,91],[797,81],[1047,88],[1202,98],[134,148],[300,128],[547,126],[797,116],
        [1047,123],[1202,133],[300,162],[547,160],[797,150],[1047,157],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 4} y={y} width="8" height="10" fill="#fbbf24" opacity="0.8" rx="1.5" />
      ))}
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email.trim()) return setError('Email is required.')
    if (!form.password)     return setError('Password is required.')

    setLoading(true)
    try {
      const data = await signIn({ email: form.email.trim(), password: form.password })
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).maybeSingle()

      if (profile?.role === 'superadmin')    navigate('/superadmin/dashboard')
      else if (profile?.role === 'admin')    navigate('/admin/dashboard')
      else                                   navigate('/resident/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="h-screen w-full relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(175deg, #e8f0fe 0%, #dbeafe 45%, #bfdbfe 100%)' }}
    >
      <CitySkyline />

      {/* Pin content above skyline, no scroll */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-8 lg:px-20 pb-52">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-16">

          {/* ── LEFT: Branding ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-8 flex-shrink-0"
          >
            {/* Logo */}
            <div className="w-44 h-44 rounded-full overflow-hidden border-[6px] border-white shadow-2xl flex-shrink-0 bg-white">
              <img
                src="/calatrava.png"
                alt="BMS Logo"
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.parentNode.innerHTML =
                    '<div style="width:100%;height:100%;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:32px;color:#fbbf24;letter-spacing:2px;">BMS</div>'
                }}
              />
            </div>

            {/* Name */}
            <div>
              <h1 className="text-6xl font-extrabold text-blue-700 leading-none tracking-tight">
                BMS Calatrava
              </h1>
              <p className="text-gray-600 text-2xl font-semibold mt-3">
                Negros Occidental
              </p>
            </div>
          </motion.div>

          {/* ── RIGHT: Login card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="w-full lg:w-[440px] flex-shrink-0"
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-none shadow-2xl border border-gray-200 px-6 py-6">

              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-6 flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="space-y-3">
                {/* Email */}
                <input
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email"
                  value={form.email} 
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-none border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                />

                {/* Password */}
                <div className="relative">
                  <input
                    id="password" 
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password} 
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full px-4 py-3 pr-12 rounded-none border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Login button */}
                <motion.button
                  type="submit" 
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-none transition-all duration-200 text-base shadow-md shadow-blue-200"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in…
                    </>
                  ) : 'Login'}
                </motion.button>

                {/* Forgot password */}
                <div className="text-center">
                  <button type="button"
                    className="text-sm text-gray-500 hover:text-blue-600 hover:underline transition-colors">
                    Forgot password?
                  </button>
                </div>

                {/* Create account */}
                <Link to="/signup">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-full transition-all duration-200 text-sm"
                  >
                    <UserPlus size={16} />
                    Create new account
                  </motion.button>
                </Link>
              </div>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              BMS Calatrava Management System &copy; {new Date().getFullYear()}
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  )
}