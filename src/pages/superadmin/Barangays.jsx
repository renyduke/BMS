import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, X, Save, MapPin, Shield, Mail, User, Key } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

const EMPTY_FORM = { name: '', captain: '', contact: '', email: '' }
const EMPTY_ADMIN_FORM = { firstname: '', lastname: '', username: '', email: '', password: '' }

export default function Barangays() {
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = add, object = edit
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Admin Account Creation States (for Add Barangay Modal)
  const [createAdmin, setCreateAdmin] = useState(false)
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM)
  const [adminErrors, setAdminErrors] = useState({})

  // Existing Barangay Admin Creation States
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [targetBarangay, setTargetBarangay] = useState(null)
  const [adminFormExisting, setAdminFormExisting] = useState(EMPTY_ADMIN_FORM)
  const [adminErrorsExisting, setAdminErrorsExisting] = useState({})
  const [savingAdminExisting, setSavingAdminExisting] = useState(false)
  const [errorAdminExisting, setErrorAdminExisting] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data: brgyData } = await supabase
        .from('barangays')
        .select('*')
        .order('name')

      const { data: adminData } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, email, username, barangay_id')
        .eq('role', 'admin')

      if (brgyData) {
        // Get resident counts
        const withCounts = await Promise.all(brgyData.map(async b => {
          const { count } = await supabase
            .from('residents').select('id', { count: 'exact' }).eq('barangay_id', b.id)
          const brgyAdmins = (adminData ?? []).filter(a => a.barangay_id === b.id)
          return { ...b, resident_count: count ?? 0, admins: brgyAdmins }
        }))
        setBarangays(withCounts)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setCreateAdmin(false)
    setAdminForm(EMPTY_ADMIN_FORM)
    setAdminErrors({})
    setError('')
    setShowModal(true)
  }

  function openEdit(b) {
    setEditTarget(b)
    setForm({ name: b.name, captain: b.captain ?? '', contact: b.contact ?? '', email: b.email ?? '' })
    setError('')
    setShowModal(true)
  }

  function openCreateAdminForBrgy(b) {
    setTargetBarangay(b)
    setAdminFormExisting(EMPTY_ADMIN_FORM)
    setAdminErrorsExisting({})
    setErrorAdminExisting('')
    setShowAdminModal(true)
  }

  async function handleCreateAdminExisting() {
    let aErrors = {}
    if (!adminFormExisting.firstname.trim()) aErrors.firstname = 'Required'
    if (!adminFormExisting.lastname.trim()) aErrors.lastname = 'Required'
    if (!adminFormExisting.username.trim()) aErrors.username = 'Required'
    if (!adminFormExisting.email.trim()) aErrors.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminFormExisting.email)) aErrors.email = 'Invalid email'
    if (!adminFormExisting.password.trim()) aErrors.password = 'Required'
    else if (adminFormExisting.password.length < 6) aErrors.password = 'Min. 6 chars'
    
    if (Object.keys(aErrors).length > 0) {
      setAdminErrorsExisting(aErrors)
      return
    }
    
    setSavingAdminExisting(true)
    setErrorAdminExisting('')
    try {
      const { data: authData, error: authErr } = await authClient.auth.signUp({
        email: adminFormExisting.email.trim(),
        password: adminFormExisting.password
      })
      if (authErr) throw authErr
      
      if (authData?.user) {
        const { error: profileErr } = await authClient.from('profiles').insert({
          id: authData.user.id,
          firstname: adminFormExisting.firstname.trim(),
          lastname: adminFormExisting.lastname.trim(),
          username: adminFormExisting.username.trim(),
          email: adminFormExisting.email.trim(),
          role: 'admin',
          barangay_id: targetBarangay.id
        })
        if (profileErr) throw profileErr
      }
      setShowAdminModal(false)
      await load()
    } catch (err) {
      setErrorAdminExisting(err.message || 'Failed to create admin.')
    } finally { setSavingAdminExisting(false) }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Barangay name is required.'); return }
    
    let aErrors = {}
    if (!editTarget && createAdmin) {
      if (!adminForm.firstname.trim()) aErrors.firstname = 'Required'
      if (!adminForm.lastname.trim()) aErrors.lastname = 'Required'
      if (!adminForm.username.trim()) aErrors.username = 'Required'
      if (!adminForm.email.trim()) aErrors.email = 'Required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminForm.email)) aErrors.email = 'Invalid email'
      if (!adminForm.password.trim()) aErrors.password = 'Required'
      else if (adminForm.password.length < 6) aErrors.password = 'Min. 6 chars'
      
      if (Object.keys(aErrors).length > 0) {
        setAdminErrors(aErrors)
        return
      }
    }
    
    setSaving(true); setError(''); setAdminErrors({})
    try {
      if (editTarget) {
        const { error } = await supabase.from('barangays').update({
          name: form.name.trim(), captain: form.captain.trim(),
          contact: form.contact.trim(), email: form.email.trim(),
        }).eq('id', editTarget.id)
        if (error) throw error
      } else {
        const { data: newBrgy, error: brgyErr } = await supabase.from('barangays').insert({
          name: form.name.trim(), captain: form.captain.trim(),
          contact: form.contact.trim(), email: form.email.trim(),
          is_active: true,
        }).select('id').single()
        
        if (brgyErr) throw brgyErr
        
        if (createAdmin && newBrgy) {
          const { data: authData, error: authErr } = await authClient.auth.signUp({
            email: adminForm.email.trim(),
            password: adminForm.password
          })
          if (authErr) throw authErr
          
          if (authData?.user) {
            const { error: profileErr } = await authClient.from('profiles').insert({
              id: authData.user.id,
              firstname: adminForm.firstname.trim(),
              lastname: adminForm.lastname.trim(),
              username: adminForm.username.trim(),
              email: adminForm.email.trim(),
              role: 'admin',
              barangay_id: newBrgy.id
            })
            if (profileErr) throw profileErr
          }
        }
      }
      setShowModal(false); await load()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  async function toggleActive(b) {
    await supabase.from('barangays').update({ is_active: !b.is_active }).eq('id', b.id)
    await load()
  }

  const filtered = barangays.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Barangays</h1>
          <p className="text-sm text-gray-500">Manage all barangays in Calatrava, Negros Occidental</p>
        </div>
        <button onClick={openAdd}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm">
          <Plus size={15} />Add Barangay
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search barangays…"
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">No barangays found.</div>
        ) : filtered.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.resident_count} residents</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {b.captain && <p className="text-xs text-gray-500 mb-1">Captain: {b.captain}</p>}
              {b.contact && <p className="text-xs text-gray-500 mb-1">{b.contact}</p>}
              {b.email && <p className="text-xs text-gray-400 truncate mb-3">{b.email}</p>}

              {/* Administrators section */}
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Shield size={12} />Admins</span>
                  <button onClick={() => openCreateAdminForBrgy(b)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-0.5">
                    <Plus size={10} />Add Admin
                  </button>
                </div>
                {b.admins && b.admins.length > 0 ? (
                  <div className="space-y-1">
                    {b.admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="font-semibold truncate">{admin.firstname} {admin.lastname}</span>
                        <span className="text-gray-400 font-normal truncate max-w-[120px]" title={admin.email}>{admin.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No admin assigned</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
              <button onClick={() => openEdit(b)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors">
                <Edit2 size={12} />Edit
              </button>
              <button onClick={() => toggleActive(b)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                  b.is_active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'
                }`}>
                {b.is_active ? <><ToggleLeft size={12} />Deactivate</> : <><ToggleRight size={12} />Activate</>}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800">
                  {editTarget ? 'Edit Barangay' : 'Add New Barangay'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {[
                  { label: 'Barangay Name *', name: 'name', placeholder: 'e.g. Brgy. Abuanan' },
                  { label: 'Barangay Captain', name: 'captain', placeholder: 'Hon. Juan Dela Cruz' },
                  { label: 'Contact Number', name: 'contact', placeholder: '09171234567' },
                  { label: 'Email Address', name: 'email', placeholder: 'brgy@calatrava.gov.ph' },
                ].map(({ label, name, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="text" value={form[name]}
                      onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                ))}

                {/* Optional Admin Creation Section */}
                {!editTarget && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={createAdmin} onChange={e => setCreateAdmin(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-700">Create an Admin Account for this Barangay</span>
                    </label>

                    {createAdmin && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 pt-2">
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Admin Credentials</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                            <input type="text" value={adminForm.firstname}
                              onChange={e => setAdminForm(prev => ({ ...prev, firstname: e.target.value }))}
                              placeholder="John"
                              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrors.firstname ? 'border-red-500' : 'border-gray-300'}`} />
                            {adminErrors.firstname && <p className="text-red-500 text-[10px] mt-0.5">{adminErrors.firstname}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                            <input type="text" value={adminForm.lastname}
                              onChange={e => setAdminForm(prev => ({ ...prev, lastname: e.target.value }))}
                              placeholder="Doe"
                              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrors.lastname ? 'border-red-500' : 'border-gray-300'}`} />
                            {adminErrors.lastname && <p className="text-red-500 text-[10px] mt-0.5">{adminErrors.lastname}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Username *</label>
                          <input type="text" value={adminForm.username}
                            onChange={e => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="johndoe"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrors.username ? 'border-red-500' : 'border-gray-300'}`} />
                          {adminErrors.username && <p className="text-red-500 text-[10px] mt-0.5">{adminErrors.username}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                          <input type="email" value={adminForm.email}
                            onChange={e => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="admin@lalong.gov"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                          {adminErrors.email && <p className="text-red-500 text-[10px] mt-0.5">{adminErrors.email}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                          <input type="password" value={adminForm.password}
                            onChange={e => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••"
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrors.password ? 'border-red-500' : 'border-gray-300'}`} />
                          {adminErrors.password && <p className="text-red-500 text-[10px] mt-0.5">{adminErrors.password}</p>}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-colors">
                  {saving ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Admin for Existing Barangay Modal */}
      <AnimatePresence>
        {showAdminModal && targetBarangay && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800">
                  Create Admin for {targetBarangay.name}
                </h3>
                <button onClick={() => setShowAdminModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {errorAdminExisting && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {errorAdminExisting}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" value={adminFormExisting.firstname}
                      onChange={e => setAdminFormExisting(prev => ({ ...prev, firstname: e.target.value }))}
                      placeholder="John"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrorsExisting.firstname ? 'border-red-500' : 'border-gray-300'}`} />
                    {adminErrorsExisting.firstname && <p className="text-red-500 text-xs mt-0.5">{adminErrorsExisting.firstname}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" value={adminFormExisting.lastname}
                      onChange={e => setAdminFormExisting(prev => ({ ...prev, lastname: e.target.value }))}
                      placeholder="Doe"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrorsExisting.lastname ? 'border-red-500' : 'border-gray-300'}`} />
                    {adminErrorsExisting.lastname && <p className="text-red-500 text-xs mt-0.5">{adminErrorsExisting.lastname}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input type="text" value={adminFormExisting.username}
                    onChange={e => setAdminFormExisting(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="johndoe"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrorsExisting.username ? 'border-red-500' : 'border-gray-300'}`} />
                  {adminErrorsExisting.username && <p className="text-red-500 text-xs mt-0.5">{adminErrorsExisting.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" value={adminFormExisting.email}
                    onChange={e => setAdminFormExisting(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@lalong.gov"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrorsExisting.email ? 'border-red-500' : 'border-gray-300'}`} />
                  {adminErrorsExisting.email && <p className="text-red-500 text-xs mt-0.5">{adminErrorsExisting.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" value={adminFormExisting.password}
                    onChange={e => setAdminFormExisting(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${adminErrorsExisting.password ? 'border-red-500' : 'border-gray-300'}`} />
                  {adminErrorsExisting.password && <p className="text-red-500 text-xs mt-0.5">{adminErrorsExisting.password}</p>}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreateAdminExisting} disabled={savingAdminExisting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-colors">
                  {savingAdminExisting ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <Save size={15} />
                  )}
                  {savingAdminExisting ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
