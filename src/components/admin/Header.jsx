import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Bell, Search, ChevronDown, LogOut, User, Users, ClipboardList, X, RefreshCw, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

// ── Global search ─────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef()
  const containerRef = useRef()
  const debounceRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (!q.trim()) { 
      setResults([]); 
      setOpen(false); 
      return 
    }
    setLoading(true)
    const bid = profile?.barangay_id
    const likeQ = `%${q}%`

    try {
      // Search residents
      let resQuery = supabase.from('residents')
        .select('id, firstname, lastname, contact, purok')
        .or(`firstname.ilike.${likeQ},lastname.ilike.${likeQ},contact.ilike.${likeQ},purok.ilike.${likeQ}`)
        .limit(5)
      if (bid) resQuery = resQuery.eq('barangay_id', bid)

      // Search requests
      let reqQuery = supabase.from('requests')
        .select('id, type, status, firstname, lastname')
        .or(`type.ilike.${likeQ},firstname.ilike.${likeQ},lastname.ilike.${likeQ},purpose.ilike.${likeQ}`)
        .limit(5)
      if (bid) reqQuery = reqQuery.eq('barangay_id', bid)

      // Search accounts (profiles)
      let accQuery = supabase.from('profiles')
        .select('id, firstname, lastname, email, username, role')
        .or(`firstname.ilike.${likeQ},lastname.ilike.${likeQ},email.ilike.${likeQ},username.ilike.${likeQ}`)
        .limit(5)

      const [resData, reqData, accData] = await Promise.all([
        resQuery, reqQuery, accQuery
      ])

      const items = []

      ;(resData.data ?? []).forEach(r => items.push({
        type: 'resident',
        icon: Users,
        color: 'text-blue-600 bg-blue-50',
        label: `${r.firstname} ${r.lastname}`,
        sub: r.purok ?? r.contact ?? 'Resident',
        route: '/admin/residents',
        id: r.id,
      }))

      ;(reqData.data ?? []).forEach(r => items.push({
        type: 'request',
        icon: ClipboardList,
        color: 'text-orange-600 bg-orange-50',
        label: r.type,
        sub: `${r.firstname ?? ''} ${r.lastname ?? ''} · ${r.status}`.trim(),
        route: '/admin/requests',
        id: r.id,
      }))

      ;(accData.data ?? []).forEach(a => items.push({
        type: 'account',
        icon: User,
        color: 'text-purple-600 bg-purple-50',
        label: `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim() || a.username,
        sub: `${a.email} · ${a.role}`,
        route: '/admin/accounts',
        id: a.id,
      }))

      setResults(items)
      setOpen(items.length > 0)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [profile])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (!val.trim()) { 
      setResults([]); 
      setOpen(false); 
      return 
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  function handleSelect(item) {
    navigate(item.route)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder="Search residents, requests, accounts…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        {loading && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3.5 w-3.5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
        {query && !loading && (
          <button onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {['resident', 'request', 'account'].map(type => {
              const group = results.filter(r => r.type === type)
              if (!group.length) return null
              const labels = { resident: 'Residents', request: 'Requests', account: 'Accounts' }
              return (
                <div key={type}>
                  <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{labels[type]}</p>
                  </div>
                  {group.map((item, i) => {
                    const Icon = item.icon
                    return (
                      <button key={i} onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition-colors text-left">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                          <Icon size={15}/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                          <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}

            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
            </div>
          </motion.div>
        )}

        {/* No results */}
        {open && results.length === 0 && !loading && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 px-4 py-6 text-center"
          >
            <Search size={20} className="text-gray-300 mx-auto mb-2"/>
            <p className="text-sm text-gray-500">No results for <strong>"{query}"</strong></p>
            <p className="text-xs text-gray-400 mt-1">Try searching by name, type, or email</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
export default function Header({ onMenuClick }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const displayName = profile ? `${profile.firstname} ${profile.lastname}` : 'Admin'

  const [notifications, setNotifications] = useState([])
  const [refreshing, setRefreshing]       = useState(false)

  // persist read IDs in localStorage
  const STORAGE_KEY = 'admin_notif_read_ids'
  function getReadIds() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
    catch { return new Set() }
  }
  const [readIds, setReadIds] = useState(getReadIds)

  function markAllRead() {
    const ids = new Set(notifications.map(n => n.id))
    const merged = new Set([...readIds, ...ids])
    setReadIds(merged)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]))
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const fetchNotifications = useCallback(async () => {
    if (!profile?.barangay_id) return
    
    try {
      const { data: pendingRequests } = await supabase
        .from('requests')
        .select('id, type, firstname, lastname, created_at')
        .eq('barangay_id', profile.barangay_id)
        .eq('status', 'Pending')
        .order('created_at', { ascending: false })
        .limit(10)
        
      const { data: pendingVerifs } = await supabase
        .from('verification_requests')
        .select('id, created_at, profiles(firstname, lastname)')
        .eq('barangay_id', profile.barangay_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)
        
      const notifs = []
      
      if (pendingRequests) {
        pendingRequests.forEach(req => {
          notifs.push({
            id: `req_${req.id}`,
            text: `New ${req.type} request from ${req.firstname} ${req.lastname}`,
            time: req.created_at,
            type: 'request',
            unread: true
          })
        })
      }
      
      if (pendingVerifs) {
        pendingVerifs.forEach(verif => {
          const name = verif.profiles ? `${verif.profiles.firstname} ${verif.profiles.lastname}` : 'A resident'
          notifs.push({
            id: `verif_${verif.id}`,
            text: `Account verification request from ${name}`,
            time: verif.created_at,
            type: 'verification',
            unread: true
          })
        })
      }
      
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
      setNotifications(notifs)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [profile])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdowns on Escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4 z-10 flex-shrink-0">
      <button 
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20}/>
      </button>

      {/* Global search */}
      <GlobalSearch />

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => { 
              setNotifOpen(v => !v); 
              setDropdownOpen(false); 
            }}
            className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" 
            aria-label="Notifications"
          >
            <Bell size={20}/>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div 
                initial={{ opacity:0, y:8, scale:0.95 }} 
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:0.95 }} 
                transition={{ duration:0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-indigo-500" />
                    <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRefresh}
                      title="Refresh"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    {unreadCount > 0 && (
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
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => {
                      const isRead = readIds.has(n.id)
                      return (
                        <div key={n.id}
                          onClick={() => {
                            // mark as read
                            const merged = new Set([...readIds, n.id])
                            setReadIds(merged)
                            localStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]))
                            setNotifOpen(false)
                            navigate(n.type === 'request' ? '/admin/requests' : '/admin/verify-accounts')
                          }}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${
                            isRead ? 'opacity-60' : 'bg-blue-50/40'
                          }`}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>{n.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(n.time).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <p className="text-[11px] text-gray-400">Click a notification to mark it as read</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button 
            onClick={() => { 
              setDropdownOpen(v => !v); 
              setNotifOpen(false); 
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : displayName.charAt(0).toUpperCase()
              }
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block"/>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity:0, y:8, scale:0.95 }} 
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:0.95 }} 
                transition={{ duration:0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              >
                <div className="p-1">
                  <button 
                    onClick={() => { 
                      navigate('/admin/profile'); 
                      setDropdownOpen(false); 
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <User size={15}/>Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={15}/>Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}