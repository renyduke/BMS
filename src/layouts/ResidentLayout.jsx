import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Award,
  User, Settings, LogOut, Menu, X, Search,
  ChevronDown, Clock, Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LogoBadge } from '../components/Logo'

const NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, to: '/resident/dashboard' },
  { label: 'My Requests',  icon: FileText,        to: '/resident/requests' },
  { label: 'Certificates', icon: Award,           to: '/resident/certificates' },
  { label: 'Profile',      icon: User,            to: '/resident/profile' },
  { label: 'Settings',     icon: Settings,        to: '/resident/settings' },
]

function SidebarContent({ onClose }) {
  const { signOut, profile, barangay } = useAuth()
  const navigate = useNavigate()
  const displayName = profile ? `${profile.firstname} ${profile.lastname}` : 'Resident'

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <LogoBadge size="md" />
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-800 leading-tight truncate">BMS Calatrava</p>
            <p className="text-xs text-gray-400 truncate">{barangay?.name ?? 'Negros Occidental'}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Resident
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/resident/dashboard'} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }>
            {({ isActive }) => (
              <>
                <item.icon size={17} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100">
        <button onClick={async () => { await signOut(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={17} />Logout
        </button>
      </div>
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
      <Clock size={13} />
      <span>{time.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      <span className="font-mono font-medium text-gray-700">
        {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  )
}

export default function ResidentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const displayName = profile ? `${profile.firstname} ${profile.lastname}` : 'Resident'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-shrink-0"><SidebarContent /></aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-30 md:hidden">
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" placeholder="Search requests, certificates…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <LiveClock />

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(v => !v); setDropdownOpen(false) }}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">2 new</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {[
                        { text: 'Your Barangay Clearance request has been approved.', time: '2 hrs ago', unread: true },
                        { text: 'New announcement: Barangay Clean-up Drive on Dec 20', time: '5 hrs ago', unread: true },
                        { text: 'Your appointment has been confirmed.', time: 'Yesterday', unread: false },
                      ].map((n, i) => (
                        <div key={i} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/40' : ''}`}>
                          <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <button className="text-xs text-blue-600 hover:underline font-medium">View all notifications</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => { setDropdownOpen(v => !v); setNotifOpen(false) }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
                  <p className="text-xs text-gray-400">Resident</p>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    </div>
                    <div className="p-1">
                      <NavLink to="/resident/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                        <User size={14} />Profile
                      </NavLink>
                      <NavLink to="/resident/settings" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                        <Settings size={14} />Settings
                      </NavLink>
                      <button onClick={async () => { await signOut(); navigate('/') }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut size={14} />Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
