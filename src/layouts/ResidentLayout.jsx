import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Award,
  User, LogOut, Menu, X, Search,
  ChevronDown, Bell, ShieldCheck, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { LogoBadge } from '../components/Logo'

const NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, to: '/resident/dashboard' },
  { label: 'My Requests',  icon: FileText,        to: '/resident/requests' },
  { label: 'Certificates', icon: Award,           to: '/resident/certificates' },
]

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function notifIcon(type) {
  if (type === 'request')      return <MessageSquare size={14} className="text-blue-500" />
  if (type === 'verification') return <ShieldCheck   size={14} className="text-green-500" />
  return                              <Bell          size={14} className="text-gray-400" />
}

// ── Avatar circle (used in both sidebar & header) ─────────────────────────────
function AvatarCircle({ avatarUrl, initial, size = 8 }) {
  const dim = `w-${size} h-${size}`
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-blue-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
      {avatarUrl
        ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        : initial}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const { signOut, barangay } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-100 shadow-sm">
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

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/resident/dashboard'} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
            {({ isActive }) => (
              <>
                <item.icon size={17} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-gray-100">
        <button onClick={async () => { await signOut(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={17} />Logout
        </button>
      </div>
    </div>
  )
}

// ── Avatar circle ─────────────────────────────────────────────────────────────
export default function ResidentLayout() {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = profile ? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim() : 'Resident'
  const avatarUrl   = profile?.avatar_url ?? null
  const initial     = displayName.charAt(0).toUpperCase() || 'R'

  // ── Notifications — exact same pattern as MyRequests ────────────────────
  const [notifs, setNotifs] = useState([])
  const notifsRef = useRef([])

  const fetchNotifs = useCallback(async () => {
    if (!profile?.id) return

    const seen = JSON.parse(localStorage.getItem('notif_read') || '[]')
    const list = []

    const { data: reqs, error } = await supabase
      .from('requests')
      .select('id, type, status, response_message, created_at')
      .eq('resident_id', profile.id)
      .in('status', ['Approved', 'Rejected', 'Cancelled'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) console.error('notif fetch error:', error.message)

    ;(reqs ?? []).forEach(r => {
      const statusLabel = r.status === 'Approved' ? 'approved ✓' : r.status === 'Rejected' ? 'rejected ✗' : 'cancelled'
      const id = `req-${r.id}-${r.status}`
      list.push({
        id,
        type: 'request',
        text: `Your ${r.type} request was ${statusLabel}.`,
        sub:  r.response_message ? `Admin: ${r.response_message}` : null,
        time: r.created_at,
        unread: !seen.includes(id),
      })
    })

    const { data: prof } = await supabase
      .from('profiles')
      .select('id, verification_status, created_at')
      .eq('id', profile.id)
      .maybeSingle()

    if (prof?.verification_status && prof.verification_status !== 'unverified') {
      const label = {
        verified: 'Your account has been verified ✓',
        rejected: 'Your account verification was rejected ✗',
        pending:  'Your verification is under review.',
      }[prof.verification_status]
      if (label) {
        const id = `verif-${prof.id}-${prof.verification_status}`
        list.push({ id, type: 'verification', text: label, sub: null, time: prof.created_at, unread: !seen.includes(id) })
      }
    }

    list.sort((a, b) => new Date(b.time) - new Date(a.time))
    notifsRef.current = list
    setNotifs(list)
  }, [profile])   // ← depends on full profile object, same as MyRequests depends on profile

  // Run on mount and whenever profile changes (i.e. after auth loads)
  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // Poll every 10 s
  useEffect(() => {
    const poll = setInterval(fetchNotifs, 10000)
    return () => clearInterval(poll)
  }, [fetchNotifs])

  // ── Mark all read when panel opens ───────────────────────────────────────
  function openNotifs() {
    setNotifOpen(v => {
      const opening = !v
      if (opening) {
        const ids = notifsRef.current.map(n => n.id)
        localStorage.setItem('notif_read', JSON.stringify(ids))
        setNotifs(prev => prev.map(n => ({ ...n, unread: false })))
        notifsRef.current = notifsRef.current.map(n => ({ ...n, unread: false }))
      }
      return opening
    })
    setDropdownOpen(false)
  }

  const unreadCount = notifs.filter(n => n.unread).length

  // Close panels on outside click
  const notifRef    = useRef(null)
  const dropdownRef = useRef(null)
  useEffect(() => {
    function handler(e) {
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden md:flex flex-shrink-0"><SidebarContent /></aside>

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" placeholder="Search requests, certificates…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">

            {/* ── Notifications ── */}
            <div className="relative" ref={notifRef}>
              <button onClick={openNotifs}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                      {notifs.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                          {notifs.length} total
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet.</p>
                        </div>
                      ) : notifs.map(n => (
                        <div key={n.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-default transition-colors ${n.unread ? 'bg-blue-50/50' : ''}`}>
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {notifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                              {n.sub && (
                                <p className="text-xs text-gray-400 mt-0.5 italic truncate">{n.sub}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.time)}</p>
                            </div>
                            {n.unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <button onClick={() => { setNotifOpen(false); navigate('/resident/requests') }}
                        className="text-xs text-blue-600 hover:underline font-medium">
                        View all requests
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Profile dropdown ── */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => { setDropdownOpen(v => !v); setNotifOpen(false) }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <AvatarCircle avatarUrl={avatarUrl} initial={initial} size={8} />
                <span className="hidden sm:block text-sm font-semibold text-gray-800">{displayName}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-1">
                      <NavLink to="/resident/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                        <User size={14} />Profile
                      </NavLink>
                      <button onClick={async () => { setDropdownOpen(false); await signOut(); navigate('/') }}
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
