import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SuperAdminRoute, AdminRoute, ResidentRoute } from './components/ProtectedRoute'

// Auth
import Login from './components/Login'
import Signup from './components/Signup'
import VerifyCertificate from './pages/VerifyCertificate'

// Super Admin
import SuperAdminLayout from './layouts/SuperAdminLayout'
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import Barangays from './pages/superadmin/Barangays'
import AllResidents from './pages/superadmin/AllResidents'
import SuperAdminAccounts from './pages/superadmin/Accounts'
import SuperAdminProfile from './pages/superadmin/Profile'
import AuditLogs from './pages/superadmin/AuditLogs'

// Admin layout + pages
import DashboardLayout from './layouts/DashboardLayout'
import AdminDashboard from './pages/admin/Dashboard'
import Residents from './pages/admin/Residents'
import Officials from './pages/admin/Officials'
import Requests from './pages/admin/Requests'
import Accounts from './pages/admin/Accounts'
import Certification from './pages/admin/Certification'
import BarangayDetails from './pages/admin/BarangayDetails'
import CertificatePreview from './pages/admin/CertificatePreview'
import VerifyAccounts from './pages/admin/VerifyAccounts'
import AdminProfile from './pages/admin/Profile'

// Resident
import ResidentLayout from './layouts/ResidentLayout'
import ResidentDashboard from './pages/resident/Dashboard'
import MyRequests from './pages/resident/MyRequests'
import Certificates from './pages/resident/Certificates'
import ResidentProfile from './pages/resident/Profile'
import Placeholder from './pages/resident/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Public certificate verification — no auth required */}
          <Route path="/verify/:hash" element={<VerifyCertificate />} />
          <Route path="/verify" element={<VerifyCertificate />} />

          {/* Super Admin — municipal level */}
          <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="barangays" element={<Barangays />} />
            <Route path="residents" element={<AllResidents />} />
            <Route path="accounts"  element={<SuperAdminAccounts />} />
            <Route path="profile"   element={<SuperAdminProfile />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Barangay Admin */}
          <Route path="/admin" element={<AdminRoute><DashboardLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"        element={<AdminDashboard />} />
            <Route path="officials"        element={<Officials />} />
            <Route path="residents"        element={<Residents />} />
            <Route path="certification"    element={<Certification />} />
            <Route path="requests"         element={<Requests />} />
            <Route path="verify-accounts"  element={<VerifyAccounts />} />
            <Route path="accounts"         element={<Accounts />} />
            <Route path="barangay-details" element={<BarangayDetails />} />
            <Route path="certificate-preview" element={<CertificatePreview />} />
            <Route path="profile"          element={<AdminProfile />} />
          </Route>

          {/* Resident */}
          <Route path="/resident" element={<ResidentRoute><ResidentLayout /></ResidentRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<ResidentDashboard />} />
            <Route path="requests"      element={<MyRequests />} />
            <Route path="certificates"  element={<Certificates />} />
            <Route path="profile"       element={<ResidentProfile />} />
            <Route path="settings"      element={<Placeholder title="Settings" description="Manage your account settings" />} />
          </Route>

          {/* Legacy redirect */}
          <Route path="/resident/dashboard" element={<Navigate to="/resident/dashboard" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
