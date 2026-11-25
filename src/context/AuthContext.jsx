import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from '@/hooks/useAdminContexts'
import { ADMIN_UNAUTH_EVENT } from '@/services/apiClient'
import { adminService } from '@/services/admin.service'

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshAdmin = useCallback(async () => {
    try {
      const profile = await adminService.me()
      setAdmin(profile)
      return profile
    } catch {
      setAdmin(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    adminService
      .me()
      .then((profile) => {
        if (active) setAdmin(profile)
      })
      .catch(() => {
        if (active) setAdmin(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onUnauth = () => setAdmin(null)
    window.addEventListener(ADMIN_UNAUTH_EVENT, onUnauth)
    return () => window.removeEventListener(ADMIN_UNAUTH_EVENT, onUnauth)
  }, [])

  const login = useCallback(async (credentials) => {
    const profile = await adminService.login(credentials)
    setAdmin(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminService.logout()
    } finally {
      setAdmin(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, refreshAdmin, setAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
