import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Printer, Search, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const CERT_TYPES = [
  {
    name: 'Barangay Clearance',
    desc: 'General purpose clearance certifying good moral character and no derogatory record.',
    color: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    name: 'Certificate of Indigency',
    desc: 'Certifies that the resident belongs to an indigent family in the barangay.',
    color: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  {
    name: 'Certificate of Residency',
    desc: 'Proof that the person is a bonafide resident of the barangay.',
    color: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  {
    name: 'Business Permit',
    desc: 'Barangay-level clearance for small business operations within the barangay.',
    color: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  {
    name: 'Good Moral Certificate',
    desc: 'Character reference certifying the person is of good moral standing.',
    color: 'bg-pink-100 text-pink-700',
    border: 'border-pink-200',
    dot: 'bg-pink-500',
  },
  {
    name: 'Cedula',
    desc: 'Community tax certificate issued to residents of the barangay.',
    color: 'bg-cyan-100 text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
]

export default function Certification() {
  const { profile, barangay } = useAuth()
  const navigate = useNavigate()

  const [residents, setResidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selectedCert, setSelectedCert] = useState(null)   // cert type object
  const [selectedResident, setSelectedResident] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let q = supabase
          .from('residents')
          .select('id, firstname, middlename, lastname, suffix, address, purok, contact, barangay_id')
          .order('lastname')
        if (profile?.barangay_id) q = q.eq('barangay_id', profile.barangay_id)
        const { data } = await q
        if (data) setResidents(data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [profile])

  const filtered = residents.filter(r => {
    const q = search.toLowerCase()
    return `${r.firstname} ${r.lastname}`.toLowerCase().includes(q) ||
      (r.address ?? '').toLowerCase().includes(q)
  })

  function handleGenerate() {
    if (!selectedCert || !selectedResident) return
    navigate('/admin/certificate-preview', {
      state: {
        request: {
          type:       selectedCert.name,
          firstname:  selectedResident.firstname,
          middlename: selectedResident.middlename ?? '',
          lastname:   selectedResident.lastname,
          suffix:     selectedResident.suffix ?? '',
          date:       new Date().toISOString(),
        },
        resident: selectedResident,
      },
    })
  }

  return (
    <div className="space-y-5">

      {/* header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Certification</h1>
        <p className="text-sm text-gray-500">Select a certificate type and a resident to generate a printable document</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── LEFT: Certificate types ── */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">1 — Choose Certificate Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {CERT_TYPES.map((cert, i) => {
              const active = selectedCert?.name === cert.name
              return (
                <motion.button
                  key={i}
                  onClick={() => setSelectedCert(cert)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                    active
                      ? `${cert.border} bg-white shadow-md ring-2 ring-offset-1 ring-indigo-400`
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cert.color}`}>
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight">{cert.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cert.desc}</p>
                  </div>
                  {active && (
                    <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${cert.dot}`} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Resident picker + generate ── */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">2 — Select Resident</p>

          {/* search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or address…"
              className="w-full pl-8 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* resident list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={24} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">No residents found</p>
                </div>
              ) : (
                filtered.map(r => {
                  const active = selectedResident?.id === r.id
                  const name = `${r.firstname} ${r.lastname}`
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedResident(r)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                        active ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{r.address ?? '—'}</p>
                      </div>
                      {active && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-50 bg-gray-50">
              <p className="text-xs text-gray-400">{filtered.length} resident{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* generate button */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Certificate</p>
                <p className={`font-semibold ${selectedCert ? 'text-gray-800' : 'text-gray-300'}`}>
                  {selectedCert?.name ?? 'Not selected'}
                </p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Resident</p>
                <p className={`font-semibold truncate ${selectedResident ? 'text-gray-800' : 'text-gray-300'}`}>
                  {selectedResident ? `${selectedResident.firstname} ${selectedResident.lastname}` : 'Not selected'}
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedCert || !selectedResident}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              <Printer size={16} />
              Generate &amp; Preview Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
