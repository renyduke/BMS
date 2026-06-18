import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Users, UserCog, LogOut, Menu, X,
  Bell, ChevronDown, UserCircle, UserPlus, ClipboardList,
  UserCheck, CheckCheck, RefreshCw, ScrollText,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LogoBadge } from '../components/Logo'
import { supabase } from '../lib/supabase'

const NAV = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/superadmin/dashboard' },
  { label: 'Barangays',     icon: Map,             to: '/superadmin/barangays' },
  { label: 'All Residents', icon: Users,           to: '/superadmin/residents' },
  { label: 'Accounts',      icon: UserCog,         to: '/superadmin/accounts' },
  { label: 'Audit Logs',    icon: ScrollText,      to: '/superadmin/audit-logs' },
]

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function notifIcon(type) {
  if (type === 'request')  return <ClipboardList size={15} className="text-orange-500" />
  if (type === 'account')  return <UserPlus size={15} className="text-indigo-500" />
  if (type === 'resident') return <UserCheck size={15} className="text-green-600" />
  return <Bell size={15} className="text-gray-400" />
}

const STORAGE_KEY = 'sa_notif_read_ids'

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function saveReadIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

// ─── sidebar ─────────────────────────────────────────────────────────────────

function SidebarContent({ onClose }) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 text-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <LogoBadge size="md" className="border-yellow-400" />
          <div>
            <p className="font-bold text-sm leading-tight">BMS Calatrava</p>
            <p className="text-xs text-slate-400">Municipal Admin</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-5 py-3 border-b border-slate-700">
        <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Super Admin
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }>
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-700 pt-3">
        <button onClick={async () => { await signOut(); navigate('/') }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all">
          <LogOut size={18} />Logout
        </button>
      </div>
    </div>
  )
}

// ─── notification bell ────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const [notifs, setNotifs]     = useState([])
  const [readIds, setReadIds]   = useState(getReadIds)
  const [loading, setLoading]   = useState(false)
  const ref                     = useRef(null)

  const unread = notifs.filter(n => !readIds.has(n.id)).length

  // ── fetch recent activity ──────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // last 7 days

      const [
        { data: requests },
        { data: accounts },
        { data: residents },
      ] = await Promise.all([
        supabase
          .from('requests')
          .select('id, created_at, status, type')
          .eq('status', 'Pending')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('id, created_at, firstname, lastname, role')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('residents')
          .select('id, created_at, firstname, lastname, barangays(name)')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const built = []

      ;(requests || []).forEach(r => built.push({
        id:      `req-${r.id}`,
        type:    'request',
        title:   'New Certificate Request',
        body:    `A pending ${r.type || 'certificate'} request needs review.`,
        time:    r.created_at,
      }))

      ;(accounts || []).forEach(a => built.push({
        id:      `acc-${a.id}`,
        type:    'account',
        title:   'New Account Registered',
        body:    `${a.firstname ?? ''} ${a.lastname ?? ''} (${a.role}) created an account.`.trim(),
        time:    a.created_at,
      }))

      ;(residents || []).forEach(r => built.push({
        id:      `res-${r.id}`,
        type:    'resident',
        title:   'New Resident Registered',
        body:    `${r.firstname ?? ''} ${r.lastname ?? ''} from ${r.barangays?.name ?? 'unknown barangay'}.`.trim(),
        time:    r.created_at,
      }))

      // sort newest first
      built.sort((a, b) => new Date(b.time) - new Date(a.time))
      setNotifs(built.slice(0, 30))
    } catch (err) {
      console.error('Notification fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifs()
  }, [fetchNotifs])

  // ── realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('sa-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' },  fetchNotifs)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' },  fetchNotifs)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'residents' }, fetchNotifs)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchNotifs])

  // ── close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function markAllRead() {
    const ids = new Set(notifs.map(n => n.id))
    const merged = new Set([...readIds, ...ids])
    setReadIds(merged)
    saveReadIds(merged)
  }

  function markRead(id) {
    const merged = new Set([...readIds, id])
    setReadIds(merged)
    saveReadIds(merged)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-indigo-500" />
                <span className="text-sm font-bold text-gray-800">Notifications</span>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={fetchNotifs}
                  title="Refresh"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* list */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
              {loading && notifs.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-gray-300" />
                  Loading…
                </div>
              ) : notifs.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  <Bell size={24} className="mx-auto mb-2 text-gray-200" />
                  No notifications in the last 7 days
                </div>
              ) : (
                notifs.map(n => {
                  const isRead = readIds.has(n.id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
                        isRead ? 'opacity-60' : ''
                      }`}
                    >
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        n.type === 'request'  ? 'bg-orange-50' :
                        n.type === 'account'  ? 'bg-indigo-50' :
                        'bg-green-50'
                      }`}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${isRead ? 'text-gray-500' : 'text-gray-800'}`}>
                            {n.title}
                          </p>
                          {!isRead && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-0.5" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.time)}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* footer */}
            {notifs.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <p className="text-[11px] text-gray-400">Showing activity from the last 7 days</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── layout ───────────────────────────────────────────────────────────────────

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const displayName = profile ? `${profile.firstname} ${profile.lastname}` : 'Super Admin'
  const avatarUrl   = profile?.avatar_url || null

  // close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [dropdownOpen])

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="hidden md:flex flex-shrink-0"><SidebarContent /></aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-30 md:hidden">
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4 z-10 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <Menu size={20} />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-800">Municipal Admin Panel</p>
            <p className="text-xs text-gray-400">Calatrava, Negros Occidental</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">

            {/* ── notification bell ── */}
            <NotificationBell />

            {/* ── profile dropdown ── */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : displayName.charAt(0).toUpperCase()
                  }
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
                  <p className="text-xs text-gray-400">Super Admin</p>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-1">
                      <button onClick={() => { setDropdownOpen(false); navigate('/superadmin/profile') }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                        <UserCircle size={15} className="text-gray-400" />My Profile
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button onClick={async () => { await signOut(); navigate('/') }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut size={15} />Logout
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
