import axios from 'axios'
import { env } from '@/config/env.config'

export const ADMIN_UNAUTH_EVENT = 'nexgn:superadmin-unauthorized'

export const apiClient = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const url = String(error.config?.url || '')

    if (status === 401 && !url.includes('/superadmin/auth/login')) {
      window.dispatchEvent(new Event(ADMIN_UNAUTH_EVENT))
    }

    const serverMsg =
      typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : typeof error.response?.data?.error === 'string'
          ? error.response.data.error
          : null

    error.userMessage =
      serverMsg ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : !error.response
          ? 'Unable to reach Nexgn API. Verify CORS and API URL.'
          : 'Action failed. Please try again.')

    return Promise.reject(error)
  },
)
