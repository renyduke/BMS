import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shield, User, Crown, Trash2, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const ROLE_STYLES = {
  superadmin: 'bg-indigo-100 text-indigo-700',
  admin:      'bg-blue-100 text-blue-700',
  resident:   'bg-green-100 text-green-700',
}

const ROLE_ICONS = {
  superadmin: Crown,
  admin:      Shield,
  resident:   User,
}

export default function SuperAdminAccounts() {
  const { signUp } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [deleting, setDeleting] = useState(null)
  
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [addForm, setAddForm] = useState({ firstname: '', lastname: '', email: '', password: '', role: 'admin', barangay_id: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [{ data: accData }, { data: brgyData }] = await Promise.all([
        supabase.from('profiles').select('id, firstname, lastname, username, email, role, created_at, barangays(name)').order('created_at', { ascending: false }),
        supabase.from('barangays').select('id, name').order('name')
      ])
      if (accData) setAccounts(accData)
      if (brgyData) setBarangays(brgyData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function changeRole(id, newRole) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    await load()
  }

  async function handleDelete(id, email) {
    if (!window.confirm(`Are you sure you want to delete the account for ${email}? This action cannot be undone.`)) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      setAccounts(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete account')
    } finally {
      setDeleting(null)
    }
  }

  async function handleAddUser(e) {
    e.preventDefault()
    setAddError('')
    if (!addForm.firstname || !addForm.lastname || !addForm.email || !addForm.password) {
      setAddError('Please fill in all required fields.')
      return
    }
    if (addForm.role === 'admin' && !addForm.barangay_id) {
      setAddError('Barangay is required for admin role.')
      return
    }
    setAddLoading(true)
    try {
      const username = addForm.email.split('@')[0] + Math.floor(Math.random() * 1000)
      
      await signUp({
        email: addForm.email.trim(),
        password: addForm.password,
        firstname: addForm.firstname.trim(),
        lastname: addForm.lastname.trim(),
        username: username,
        barangay_id: addForm.role === 'superadmin' ? null : addForm.barangay_id,
        role: addForm.role
      })
      
      alert('User created successfully! Note: As a security measure, you may have been logged out. Please log back in as Super Admin if necessary.')
      setIsAddingUser(false)
      setAddForm({ firstname: '', lastname: '', email: '', password: '', role: 'admin', barangay_id: '' })
      await load()
    } catch (err) {
      setAddError(err.message || 'Failed to add user.')
    } finally {
      setAddLoading(false)
    }
  }

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = `${a.firstname} ${a.lastname}`.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    const matchRole = filterRole === 'all' || a.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">All Accounts</h1>
          <p className="text-sm text-gray-500">Manage user roles across all barangays</p>
        </div>
        <button onClick={() => setIsAddingUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'superadmin', 'admin', 'resident'].map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${filterRole === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['User', 'Email', 'Barangay', 'Role', 'Change Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No accounts found.</td></tr>
              ) : filtered.map((a, i) => {
                const RoleIcon = ROLE_ICONS[a.role] ?? User
                return (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {a.firstname?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{a.firstname} {a.lastname}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{a.email}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{a.barangays?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[a.role] || 'bg-gray-100 text-gray-500'}`}>
                        <RoleIcon size={10} />{a.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select value={a.role}
                        onChange={e => changeRole(a.id, e.target.value)}
                        className="text-xs bg-gray-100 rounded-lg px-2 py-1.5 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                        <option value="resident">resident</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(a.id, a.email)}
                        disabled={deleting === a.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                        title="Delete Account"
                      >
                        {deleting === a.id ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Add New User</h3>
                <button onClick={() => setIsAddingUser(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                {addError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{addError}</div>}
                
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠️</span>
                  <p>Creating a user from this dashboard uses the client SDK, which may log you out for security. If redirected to the login screen, simply sign back in with your Super Admin credentials.</p>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">First Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={addForm.firstname} onChange={e => setAddForm(p => ({ ...p, firstname: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={addForm.lastname} onChange={e => setAddForm(p => ({ ...p, lastname: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" required value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Password <span className="text-red-500">*</span></label>
                    <input type="password" required value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} minLength={6}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Role <span className="text-red-500">*</span></label>
                      <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="resident">Resident</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Barangay</label>
                      <select value={addForm.barangay_id} onChange={e => setAddForm(p => ({ ...p, barangay_id: e.target.value }))}
                        disabled={addForm.role === 'superadmin'}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                        <option value="">— Select —</option>
                        {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsAddingUser(false)}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={addLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm">
                      {addLoading ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : null}
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
