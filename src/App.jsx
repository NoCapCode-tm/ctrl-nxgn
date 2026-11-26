import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAdminContexts'
import CompliancePage from '@/pages/CompliancePage'
import LoginPage from '@/pages/LoginPage'
import OverviewPage from '@/pages/OverviewPage'
import SecurityPage from '@/pages/SecurityPage'
import VouchersPage from '@/pages/VouchersPage'
import WorkspacesPage from '@/pages/WorkspacesPage'

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: 'var(--app-muted)' }}>
        Verifying Super Admin session...
      </div>
    )
  }
  return admin ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return null
  return admin ? <Navigate to="/overview" replace /> : children
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                element={
                  <GuestRoute>
                    <AuthLayout />
                  </GuestRoute>
                }
              >
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/vouchers" element={<VouchersPage />} />
                <Route path="/workspaces" element={<WorkspacesPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/security" element={<SecurityPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
