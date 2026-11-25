import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })
export const AuthContext = createContext({
  admin: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshAdmin: async () => {},
  setAdmin: () => {},
})
export const ToastContext = createContext({
  notify: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useToast() {
  return useContext(ToastContext)
}
