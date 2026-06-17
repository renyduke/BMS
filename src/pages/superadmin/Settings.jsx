import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, KeyRound, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function SuperAdminSettings() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPassError('')
    setPassSuccess('')

    if (passForm.newPass.length < 6) {
      setPassError('Password must be at least 6 characters.')
      return
    }
    if (passForm.newPass !== passForm.confirmPass) {
      setPassError('Passwords do not match.')
      return
    }

    setPassLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passForm.newPass
      })
      if (error) throw error
      
      setPassSuccess('Password updated successfully!')
      setPassForm({ newPass: '', confirmPass: '' })
    } catch (err) {
      setPassError(err.message || 'Failed to update password')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your super admin preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Moon size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme for the admin panel</p>
            </div>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <KeyRound size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Change Password</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update your account security</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm ml-13">
            {passError && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{passError}</p>}
            {passSuccess && <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-1"><CheckCircle size={14}/> {passSuccess}</p>}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">New Password</label>
              <input type="password" required value={passForm.newPass} onChange={e => setPassForm(p => ({ ...p, newPass: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Confirm New Password</label>
              <input type="password" required value={passForm.confirmPass} onChange={e => setPassForm(p => ({ ...p, confirmPass: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
            </div>

            <button type="submit" disabled={passLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center gap-2">
              {passLoading && <Loader size={14} className="animate-spin" />}
              Update Password
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
