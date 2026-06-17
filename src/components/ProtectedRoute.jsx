import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-10 w-10 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-blue-800 font-medium text-sm">Loading…</p>
      </div>
    </div>
  )
}

// Superadmin only — municipal level
export function SuperAdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  if (!profile) return <Navigate to="/" replace />
  if (profile.role !== 'superadmin') {
    if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/resident/dashboard" replace />
  }
  return children
}

// Barangay admin only
export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  if (!profile) return <Navigate to="/" replace />
  if (profile.role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />
  if (profile.role !== 'admin') return <Navigate to="/resident/dashboard" replace />
  return children
}

// Resident only
export function ResidentRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  if (!profile) return <Navigate to="/" replace />
  if (profile.role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />
  if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return children
}

// Generic protected
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/" replace />
  return children
}

export default ProtectedRoute
