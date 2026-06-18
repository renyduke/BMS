import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, UserCheck, FileText,
  ClipboardList, MapPin, Settings, X, Calendar, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { LogoBadge } from '../Logo'

const NAV_GROUPS = [
  {
    label: 'GENERAL',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
      { label: 'Barangay Officials', icon: UserCheck, to: '/admin/officials' },
      { label: 'Residents', icon: Users, to: '/admin/residents' },
      { label: 'Certification', icon: FileText, to: '/admin/certification' },
      { label: 'Online Requests', icon: ClipboardList, to: '/admin/requests' },
      { label: 'Verify Accounts', icon: ShieldCheck, to: '/admin/verify-accounts' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Barangay Details', icon: MapPin, to: '/admin/barangay-details' },
    ],
  },
]

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
          : 'text-blue-100 hover:bg-blue-700/60 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={18} className={isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onClose }) {
  const { profile, barangay } = useAuth()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const todayFormatted = `Today is ${today}`

  return (
    <div className="flex flex-col h-full bg-blue-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <LogoBadge size="lg" />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">{barangay?.name ?? 'BMS Calatrava'}</p>
            <p className="text-xs text-blue-300 truncate">Calatrava, Negros Occidental</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-blue-800 transition-colors" aria-label="Close sidebar">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-blue-400 tracking-widest px-4 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.to} item={item} onClick={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — date only */}
      <div className="px-4 pb-5 pt-3 border-t border-blue-800">
        <div className="flex items-start gap-2 text-blue-300">
          <Calendar size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
          <p className="text-xs leading-snug">{todayFormatted}</p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-30 md:hidden"
          >
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
