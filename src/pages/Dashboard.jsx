import { motion } from 'framer-motion'
import { LogOut, Users, FileText, Home, Bell, Settings, BarChart2, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const stats = [
  { label: 'Total Residents', value: '4,821', icon: Users, color: 'bg-blue-100 text-blue-700' },
  { label: 'Documents Issued', value: '312', icon: FileText, color: 'bg-green-100 text-green-700' },
  { label: 'Households', value: '1,204', icon: Home, color: 'bg-purple-100 text-purple-700' },
  { label: 'Active Cases', value: '7', icon: Shield, color: 'bg-red-100 text-red-700' },
]

const navItems = [
  { label: 'Dashboard', icon: BarChart2, active: true },
  { label: 'Residents', icon: Users, active: false },
  { label: 'Documents', icon: FileText, active: false },
  { label: 'Notifications', icon: Bell, active: false },
  { label: 'Settings', icon: Settings, active: false },
]

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const displayName = profile
    ? `${profile.firstname} ${profile.lastname}`
    : user?.email ?? 'User'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-blue-900 text-white min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-800">
          <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-yellow-400 flex items-center justify-center text-yellow-400 font-bold text-sm">
            BL
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">BMS Calatrava</p>
            <p className="text-xs text-blue-300">Negros Occidental</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-700 text-white shadow'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-900">Dashboard</h1>
            <p className="text-xs text-gray-500">Barangay Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{displayName}</p>
              <p className="text-xs text-gray-400">{profile?.username ?? user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 p-6">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 text-white mb-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-1">Welcome back, {profile?.firstname ?? 'User'}! 👋</h2>
            <p className="text-blue-200 text-sm">
              Here's what's happening in BMS Calatrava today.
            </p>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map(({ label, value, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-2xl shadow p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent activity placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-white rounded-2xl shadow p-6"
          >
            <h3 className="text-base font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { text: 'New resident registered: Maria Santos', time: '2 min ago', dot: 'bg-green-400' },
                { text: 'Barangay Clearance issued to Juan Reyes', time: '15 min ago', dot: 'bg-blue-400' },
                { text: 'Blotter report filed — Case #2024-007', time: '1 hr ago', dot: 'bg-red-400' },
                { text: 'Certificate of Indigency approved', time: '3 hrs ago', dot: 'bg-yellow-400' },
              ].map(({ text, time, dot }, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                  <div className="flex-1">
                    <p className="text-gray-700">{text}</p>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
