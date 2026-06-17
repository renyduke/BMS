import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Award, ClipboardList, CheckCircle,
  Clock, ChevronRight, ChevronLeft, Phone, Users, MapPin
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ── Data ─────────────────────────────────────────────────────────────────────

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

const MY_REQUESTS = [
  { id: 'REQ-001', type: 'Barangay Clearance',      date: '2024-12-01', status: 'Approved'   },
  { id: 'REQ-002', type: 'Certificate of Indigency', date: '2024-12-10', status: 'Pending'    },
  { id: 'REQ-003', type: 'Residency Certificate',    date: '2024-12-15', status: 'Processing' },
]

const STATUS_STYLES = {
  Approved:   'bg-green-100 text-green-700',
  Pending:    'bg-yellow-100 text-yellow-700',
  Processing: 'bg-blue-100 text-blue-700',
  Rejected:   'bg-red-100 text-red-700',
}

const CERT_TYPES = [
  { label: 'Barangay Clearance',    icon: Award,         color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Residency Certificate', icon: FileText,      color: 'bg-green-50 text-green-600 border-green-200' },
  { label: 'Indigency Certificate', icon: FileText,      color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'Business Permit',       icon: ClipboardList, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Cedula',                icon: Award,         color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
]

// ── Steps carousel ────────────────────────────────────────────────────────────
function StepsCarousel() {
  const [current, setCurrent] = useState(0)
  const visible = 3
  const max = STEPS.length - visible

  return (
    <div className="relative">
      <div className="flex items-stretch gap-3 overflow-hidden">
        {STEPS.slice(current, current + visible).map(({ step, label, color, iconBg, icon: Icon }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex-1 flex flex-col items-center text-center p-4 rounded-2xl border-2 ${color} min-w-0`}
          >
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mb-2 flex-shrink-0`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-xs font-bold text-gray-700 mb-1">{step}</p>
            <p className="text-xs text-gray-500 leading-tight">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Prev / Next */}
      {current > 0 && (
        <button onClick={() => setCurrent(c => c - 1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ChevronLeft size={14} className="text-gray-600" />
        </button>
      )}
      {current < max && (
        <button onClick={() => setCurrent(c => c + 1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      )}

      <p className="text-center text-xs text-gray-400 mt-3">BMS Calatrava</p>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function ResidentDashboard() {
  const { profile, barangay } = useAuth()
  const navigate = useNavigate()
  const displayName = profile ? `${profile.firstname} ${profile.lastname}` : 'Resident'
  const pending  = MY_REQUESTS.filter(r => r.status === 'Pending').length
  const approved = MY_REQUESTS.filter(r => r.status === 'Approved').length

  return (
    <div className="flex gap-5 h-full">

      {/* ── CENTER: main content ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Certification Request card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Certification Request</h2>
              <p className="text-sm text-gray-500">To request for a Certificate, Click Request button.</p>
            </div>
            <button
              onClick={() => navigate('/resident/certificates')}
              className="flex-shrink-0 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
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
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-center text-base font-extrabold text-gray-800 uppercase tracking-wide mb-5">
            Five Step in Requesting<br />Barangay Certificates
          </h3>
          <StepsCarousel />
        </motion.div>

        {/* Recent requests table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Recent Requests</h3>
            <button onClick={() => navigate('/resident/requests')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              View all<ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Request ID', 'Certificate Type', 'Date Filed', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MY_REQUESTS.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.type}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
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
      <div className="w-52 flex-shrink-0 hidden xl:block space-y-4">

        {/* Emergency hotlines — styled like the photo (yellow card) */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          className="bg-yellow-400 rounded-2xl shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500">
            <Phone size={14} className="text-red-700" />
            <p className="text-xs font-extrabold text-red-700 uppercase tracking-wider">Emergency Hotlines</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {HOTLINES.map(({ label, number }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-yellow-900 leading-tight">{label}</p>
                <a href={`tel:${number}`} className="text-xs font-bold text-red-800 hover:underline">{number}</a>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Barangay officials */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users size={13} className="text-blue-600" />
            <p className="text-xs font-bold text-gray-700">Barangay Officials</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {[
              { name: 'Hon. Roberto Calatrava', position: 'Barangay Captain' },
              { name: 'Hon. Maria Santos',      position: 'Kagawad' },
              { name: 'Hon. Jose Reyes',        position: 'Kagawad' },
            ].map(({ name, position }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                  {name.split(' ').slice(-1)[0].charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{position}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  )
}
