import { useState, useEffect } from 'react'
import { Save, Building2, User, Phone, Mail, MapPin, Globe, Landmark } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'

export default function BarangayDetails() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    captain: '',
    contact: '',
    email: '',
  })

  useEffect(() => {
    async function load() {
      if (!profile?.barangay_id) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('barangays')
          .select('*')
          .eq('id', profile.barangay_id)
          .maybeSingle()
        if (!error && data) {
          setForm({
            name: data.name ?? '',
            captain: data.captain ?? '',
            contact: data.contact ?? '',
            email: data.email ?? '',
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile])

  async function handleSave() {
    if (!profile?.barangay_id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('barangays')
        .update({
          name: form.name.trim(),
          captain: form.captain.trim(),
          contact: form.contact.trim(),
          email: form.email.trim(),
        })
        .eq('id', profile.barangay_id)
      if (error) throw error
      alert('Barangay details updated successfully!')
    } catch (err) {
      alert(err.message || 'Failed to update details.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Barangay Details</h1>
        <p className="text-xs text-gray-400">Manage your barangay's primary information and contact details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Primary Information</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Barangay Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" placeholder="e.g. San Jose" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Barangay Captain</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.captain} onChange={e => setForm(prev => ({ ...prev, captain: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" placeholder="Full Name" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Contact Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.contact} onChange={e => setForm(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" placeholder="+63 900 000 0000" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" placeholder="barangay@example.com" />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm">
                {saving ? (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Save size={14} />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Location Context Sidebar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Landmark size={16} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Location Context</span>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-0.5">Municipality</p>
                <p className="text-sm font-bold text-gray-800">Calatrava</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-0.5">Province</p>
                <p className="text-sm font-bold text-gray-800">Negros Occidental</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-0.5">Region</p>
                <p className="text-sm font-bold text-gray-800">Region VI (Western Visayas)</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
