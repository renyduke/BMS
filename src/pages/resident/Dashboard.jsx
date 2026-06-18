import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Award, ClipboardList, CheckCircle,
  Clock, ChevronRight, Phone, Users, RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import OfficialsOrgChart from '../../components/admin/OfficialsOrgChart'

// ── Static data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: 'STEP 1',
    label: 'Create an Account and Log in',
    color: 'bg-pink-100 border-pink-300',
    iconBg: 'bg-pink-400',
    icon: Users,
  },
  {
    step: 'STEP 2',
    label: 'Click request Certificate type you want to Request',
    color: 'bg-blue-100 border-blue-300',
    iconBg: 'bg-blue-400',
    icon: Award,
  },
  {
    step: 'STEP 3',
    label: 'Fill up all the needed Information',
    color: 'bg-yellow-100 border-yellow-300',
    iconBg: 'bg-yellow-400',
    icon: FileText,
  },
  {
    step: 'STEP 4',
    label: 'Wait for the Approval of Barangay Secretary',
    color: 'bg-green-100 border-green-300',
    iconBg: 'bg-green-500',
    icon: Clock,
  },
  {
    step: 'STEP 5',
    label: 'Ready to Pick-Up',
    color: 'bg-teal-100 border-teal-300',
    iconBg: 'bg-teal-500',
    icon: CheckCircle,
  },
]

const HOTLINES = [
  { label: 'Barangay Hall',    number: '(034) 123-4567' },
  { label: 'Emergency / 911', number: '911' },
  { label: 'PNP Calatrava',   number: '(034) 456-7890' },
  { label: 'BFP Calatrava',   number: '(034) 789-0123' },
  { label: 'RHU Calatrava',   number: '(034) 321-6540' },
]

const CERT_TYPES = [
  { label: 'Barangay Clearance',    icon: Award,         color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Residency Certificate', icon: FileText,      color: 'bg-green-50 text-green-600 border-green-200' },
  { label: 'Indigency Certificate', icon: FileText,      color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'Business Permit',       icon: ClipboardList, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Cedula',                icon: Award,         color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
]

const STATUS_STYLES = {
  Approved:   'bg-green-100 text-green-700',
  Pending:    'bg-yellow-100 text-yellow-700',
  Processing: 'bg-blue-100 text-blue-700',
  Rejected:   'bg-red-100 text-red-700',
  Cancelled:  'bg-gray-100 text-gray-500',
}

// ── Auto-sliding Steps Carousel ───────────────────────────────────────────────
function StepsCarousel() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  // On mobile show 1, on md show 2, on lg show 3 — but we control via JS for auto-slide
  // We slide one step at a time cycling through all 5
  const total = STEPS.length

  function startTimer() {
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % total)
    }, 2500)
  }

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  function goTo(idx) {
    clearInterval(timerRef.current)
    setCurrent(idx)
    startTimer()
  }

  const { step, label, color, iconBg, icon: Icon } = STEPS[current]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* All 5 cards laid out in a responsive row — on mobile stack, on sm+ row */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-5 gap-3">
        {STEPS.map(({ step: s, label: l, color: c, iconBg: ib, icon: Ic }, idx) => (
          <motion.div
            key={s}
            animate={{
              scale: idx === current ? 1.04 : 1,
              opacity: idx === current ? 1 : 0.6,
            }}
            transition={{ duration: 0.35 }}
            onClick={() => goTo(idx)}
            className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 cursor-pointer select-none ${c} ${
              idx === current ? 'shadow-md' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-full ${ib} flex items-center justify-center mb-2 flex-shrink-0`}>
              <Ic size={18} className="text-white" />
            </div>
            <p className="text-xs font-bold text-gray-700 mb-1">{s}</p>
            <p className="text-xs text-gray-500 leading-tight">{l}</p>
          </motion.div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current ? 'w-5 h-2 bg-blue-500' : 'w-2 h-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">BMS Calatrava</p>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function ResidentDashboard() {
  const { profile, barangay } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests]   = useState([])
  const [loadingReq, setLoadingReq] = useState(true)

  async function loadRequests() {
    if (!profile?.id) return
    setLoadingReq(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('id, type, purpose, status, created_at')
        .eq('resident_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      setRequests(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReq(false)
    }
  }

  useEffect(() => { loadRequests() }, [profile])

  return (
    <div className="flex flex-col xl:flex-row gap-5">

      {/* ── CENTER: main content ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Certification Request card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Certification Request</h2>
              <p className="text-sm text-gray-500">To request for a Certificate, Click Request button.</p>
            </div>
            <button
              onClick={() => navigate('/resident/certificates')}
              className="flex-shrink-0 w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Request
            </button>
          </div>

          {/* Certificate type quick links */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CERT_TYPES.map(({ label, icon: Icon, color }) => (
              <button key={label} onClick={() => navigate('/resident/certificates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:scale-105 ${color}`}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Five Steps card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h3 className="text-center text-base font-extrabold text-gray-800 uppercase tracking-wide mb-5">
            Five Steps in Requesting Barangay Certificates
          </h3>
          <StepsCarousel />
        </motion.div>

        {/* Recent requests table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Recent Requests</h3>
            <div className="flex items-center gap-3">
              <button onClick={loadRequests}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <RefreshCw size={13} className={loadingReq ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => navigate('/resident/requests')}
                className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                View all<ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-gray-50">
            {loadingReq ? (
              [1,2,3].map(i => (
                <div key={i} className="px-4 py-4 animate-pulse space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                No requests yet.{' '}
                <button onClick={() => navigate('/resident/certificates')} className="text-blue-600 font-medium hover:underline">
                  Make one
                </button>
              </div>
            ) : requests.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {r.status}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Request ID', 'Certificate Type', 'Date Filed', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingReq ? (
                  [1,2,3].map(i => (
                    <tr key={i}>
                      {[1,2,3,4,5].map(j => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                      No requests yet.{' '}
                      <button onClick={() => navigate('/resident/certificates')} className="text-blue-600 font-medium hover:underline">
                        Make one
                      </button>
                    </td>
                  </tr>
                ) : requests.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {r.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.type}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate('/resident/requests')}
                        className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                        View<ChevronRight size={12} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT: hotlines + officials ── */}
      <div className="w-full xl:w-52 xl:flex-shrink-0 space-y-4">

        {/* Emergency hotlines */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-400 rounded-2xl shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500">
            <Phone size={14} className="text-red-700" />
            <p className="text-xs font-extrabold text-red-700 uppercase tracking-wider">Emergency Hotlines</p>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 xl:grid-cols-1 gap-x-6 gap-y-2">
            {HOTLINES.map(({ label, number }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-yellow-900 leading-tight">{label}</p>
                <a href={`tel:${number}`} className="text-xs font-bold text-red-800 hover:underline">{number}</a>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Barangay officials */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users size={13} className="text-blue-600" />
            <p className="text-xs font-bold text-gray-700">Barangay Officials</p>
          </div>
          <div className="p-3">
            <OfficialsOrgChart barangayId={barangay?.id} compact />
          </div>
        </motion.div>
      </div>

    </div>
  )
}
