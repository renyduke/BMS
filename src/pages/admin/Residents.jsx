import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Users, FileText, Eye, Edit2, X, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import ResidentRegistrationModal from '../../components/admin/ResidentRegistrationModal'

export default function Residents() {
  const { profile } = useAuth()
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [perPage, setPerPage]   = useState(10)
  const [page, setPage]         = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewResident, setViewResident] = useState(null)
  const [editResident, setEditResident] = useState(null)

  async function load() {
    setLoading(true)
    try {
      let query = supabase
        .from('residents')
        .select('*')
        .order('created_at', { ascending: false })

      if (profile?.role === 'admin' && profile?.barangay_id) {
        query = query.eq('barangay_id', profile.barangay_id)
      }

      const { data, error } = await query
      if (!error && data?.length) setRows(data)
      else setRows([])
    } catch { setRows([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [profile])

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const name = `${r.lastname},${r.firstname} ${r.middlename ?? ''}`.toLowerCase()
    return name.includes(q) || (r.contact ?? '').includes(q) || (r.purok ?? '').toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  function formatName(r) {
    const last  = r.lastname  ?? ''
    const first = r.firstname ?? ''
    const mid   = r.middlename ?? ''
    return `${last},${first}${mid ? ' ' + mid : ''}`
  }

  function formatDate(d) {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  function handleGenerateList() {
    const rows2 = filtered
    const headers = ['Name', 'Gender', 'Civil Status', 'Purok', 'Contact Number', 'Date Registered']
    const csvRows = [
      headers.join(','),
      ...rows2.map(r => [
        formatName(r), r.gender ?? '', r.civil_status ?? '', r.purok ?? '', r.contact ?? '', formatDate(r.created_at)
      ].map(v => `"${v}"`).join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'residents.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Residents</h1>
          <p className="text-xs text-gray-400">Residents</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Card header — "Residents Section" + buttons */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Residents Section</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditResident(null); setModalOpen(true) }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-sm"
              >
                <Plus size={13} />Add Resident
              </button>
              <button
                onClick={handleGenerateList}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-colors shadow-sm"
              >
                <FileText size={13} />Generate List
              </button>
            </div>
          </div>

          {/* Controls: entries per page + search */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1) }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-xs text-gray-400">entries per page</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40">
                  {['Name', 'Gender', 'Civil Status', 'Purok', 'Contact Number', 'Date Registered', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Users size={28} className="text-gray-200" />
                        <p className="text-sm">No residents found.</p>
                        <button onClick={() => { setEditResident(null); setModalOpen(true) }}
                          className="text-xs text-blue-600 hover:underline font-medium">
                          + Add your first resident
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginated.map((r, i) => (
                  <motion.tr key={r.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-blue-50/20 transition-colors">

                    {/* Name — Last,First Middle */}
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {formatName(r)}
                    </td>

                    {/* Gender — colored badge matching photo */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                        r.gender === 'Male'
                          ? 'bg-blue-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {r.gender ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600 text-sm">{r.civil_status ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{r.purok ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{r.contact ?? ''}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Action — two icon buttons matching photo */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewResident(r)}
                          title="View"
                          className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors">
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => { setEditResident(r); setModalOpen(true) }}
                          title="Edit"
                          className="w-7 h-7 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer — showing X to Y of Z entries */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Resident Modal */}
      <ResidentRegistrationModal
        open={modalOpen}
        initial={editResident}
        onClose={() => { setModalOpen(false); setEditResident(null) }}
        onSaved={() => { load(); setModalOpen(false); setEditResident(null) }}
      />

      {/* View Resident Modal */}
      {viewResident && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-4">
            
            {/* Header section with photo overlay */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-400 flex-shrink-0">
              <button onClick={() => setViewResident(null)} 
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white transition-colors" title="Close">
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
                  {viewResident.photo_url ? (
                    <img src={viewResident.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User size={40} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <h2 className="text-2xl font-bold text-gray-800">{formatName(viewResident)}</h2>
                  <p className="text-sm font-medium text-blue-600 flex items-center gap-2">
                    {viewResident.status}
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    {viewResident.gender ?? 'Unknown Gender'}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div><p className="text-xs text-gray-500 font-medium">Alias</p><p className="font-semibold text-gray-800">{viewResident.alias || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Age / DOB</p><p className="font-semibold text-gray-800">{viewResident.age ?? '—'} / {viewResident.dob || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Birth Place</p><p className="font-semibold text-gray-800">{viewResident.birthplace || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Civil Status</p><p className="font-semibold text-gray-800">{viewResident.civil_status || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Religion</p><p className="font-semibold text-gray-800">{viewResident.religion || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Occupation</p><p className="font-semibold text-gray-800">{viewResident.occupation || '—'}</p></div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b pb-2 pt-2">Address & Contact</h3>
                  <div className="grid grid-cols-1 gap-y-4 text-sm">
                    <div><p className="text-xs text-gray-500 font-medium">Complete Address</p><p className="font-semibold text-gray-800">{viewResident.address || '—'}</p></div>
                    <div className="grid grid-cols-2 gap-x-2">
                      <div><p className="text-xs text-gray-500 font-medium">Purok</p><p className="font-semibold text-gray-800">{viewResident.purok ? `Purok ${viewResident.purok}` : '—'}</p></div>
                      <div><p className="text-xs text-gray-500 font-medium">Contact Number</p><p className="font-semibold text-gray-800">{viewResident.contact || '—'}</p></div>
                    </div>
                  </div>
                </div>

                {/* Other Info & Emergency */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b pb-2">Other Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div><p className="text-xs text-gray-500 font-medium">National ID</p><p className="font-semibold text-gray-800">{viewResident.national_id || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">PhilHealth</p><p className="font-semibold text-gray-800">{viewResident.philhealth || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Voter Status</p><p className="font-semibold text-gray-800">{viewResident.voter || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Date Registered</p><p className="font-semibold text-gray-800">{viewResident.date_registered || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">Solo Parent?</p><p className="font-semibold text-gray-800">{viewResident.solo_parent || '—'}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium">4Ps Member?</p><p className="font-semibold text-gray-800">{viewResident.fourps || '—'}</p></div>
                  </div>

                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide border-b border-red-100 pb-2 pt-2">Emergency Contact</h3>
                  <div className="flex gap-4">
                    {viewResident.emerg_photo_url && (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden shadow-sm">
                        <img src={viewResident.emerg_photo_url} alt="Emergency Contact" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm flex-1">
                      <div><p className="text-xs text-gray-500 font-medium">Name</p><p className="font-semibold text-gray-800">{viewResident.emerg_name || '—'}</p></div>
                      <div><p className="text-xs text-gray-500 font-medium">Relationship</p><p className="font-semibold text-gray-800">{viewResident.emerg_relationship || '—'}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-500 font-medium">Contact Number</p><p className="font-semibold text-gray-800">{viewResident.emerg_contact || '—'}</p></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setViewResident(null)}
                className="px-6 py-2.5 text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors shadow-sm">
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
