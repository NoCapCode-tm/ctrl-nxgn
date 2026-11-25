import { apiClient } from './apiClient'

function unwrapData(res) {
  return res?.data?.data ?? res?.data ?? {}
}

function downloadBlob(data, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export const adminService = {
  // Auth
  login: async ({ identifier, password }) => {
    const res = await apiClient.post('/superadmin/auth/login', { identifier, password })
    return unwrapData(res).admin
  },

  logout: async () => {
    await apiClient.post('/superadmin/auth/logout')
  },

  me: async () => {
    const res = await apiClient.get('/superadmin/auth/me')
    return unwrapData(res).admin
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await apiClient.patch('/superadmin/auth/password', {
      currentPassword,
      newPassword,
    })
    return unwrapData(res).admin
  },

  // Overview
  getOverview: async () => {
    const res = await apiClient.get('/superadmin/overview')
    return unwrapData(res)
  },

  // Vouchers & AppSumo
  listVouchers: async (params = {}) => {
    const res = await apiClient.get('/superadmin/vouchers', { params })
    return unwrapData(res)
  },

  getCampaignAnalytics: async () => {
    const res = await apiClient.get('/superadmin/vouchers/campaigns')
    return unwrapData(res).campaigns || []
  },

  generateVouchers: async (payload) => {
    const res = await apiClient.post('/superadmin/vouchers/generate', payload)
    return {
      data: unwrapData(res),
      message: res?.data?.message || 'Vouchers generated.',
    }
  },

  exportVouchersCsv: async ({ campaign = 'all', unredeemedOnly = false } = {}) => {
    const res = await apiClient.get('/superadmin/vouchers/export', {
      params: { campaign, unredeemedOnly },
      responseType: 'blob',
    })
    const slug = campaign && campaign !== 'all' ? campaign : 'all-campaigns'
    downloadBlob(res.data, `nexgn-vouchers-${slug}.csv`)
  },

  toggleVoucherStatus: async (id, active) => {
    const res = await apiClient.patch(`/superadmin/vouchers/${id}/toggle`, { active })
    return unwrapData(res)
  },

  toggleCampaignStatus: async (campaign, active) => {
    const res = await apiClient.patch('/superadmin/vouchers/campaign/toggle', {
      campaign,
      active,
    })
    return unwrapData(res)
  },

  listRedemptions: async (params = {}) => {
    const res = await apiClient.get('/superadmin/vouchers/redemptions', { params })
    return unwrapData(res)
  },

  revokeRedemption: async ({ code, reason }) => {
    const res = await apiClient.post('/superadmin/vouchers/revoke-redemption', {
      code,
      reason,
    })
    return {
      data: unwrapData(res),
      message: res?.data?.message || 'Redemption revoked.',
    }
  },

  // Workspaces
  listWorkspaces: async (params = {}) => {
    const res = await apiClient.get('/superadmin/workspaces', { params })
    return unwrapData(res)
  },

  getWorkspaceDetail: async (teamId) => {
    const res = await apiClient.get(`/superadmin/workspaces/${teamId}`)
    return unwrapData(res)
  },

  updateWorkspaceSubscription: async (teamId, payload) => {
    const res = await apiClient.patch(`/superadmin/workspaces/${teamId}/subscription`, payload)
    return unwrapData(res)
  },

  revokeWorkspaceSessions: async (teamId) => {
    const res = await apiClient.post(`/superadmin/workspaces/${teamId}/revoke-sessions`)
    return {
      data: unwrapData(res),
      message: res?.data?.message || 'Sessions revoked.',
    }
  },

  // GST Compliance & Webhooks
  listCompliancePayments: async (params = {}) => {
    const res = await apiClient.get('/superadmin/compliance/payments', { params })
    return unwrapData(res)
  },

  exportGstr1Csv: async () => {
    const res = await apiClient.get('/superadmin/compliance/gstr1-export', {
      responseType: 'blob',
    })
    downloadBlob(res.data, 'nexgn-gstr1-ledger.csv')
  },

  resolveLutViolation: async (paymentId, complianceStatus) => {
    const res = await apiClient.post(`/superadmin/compliance/payments/${paymentId}/resolve-lut`, {
      complianceStatus,
    })
    return unwrapData(res)
  },

  listWebhooksAndGrace: async () => {
    const res = await apiClient.get('/superadmin/compliance/webhooks')
    return unwrapData(res)
  },

  // Security & Abuse Radar
  getAbuseRadar: async () => {
    const res = await apiClient.get('/superadmin/security/abuse')
    return unwrapData(res)
  },

  listPlatformSessions: async () => {
    const res = await apiClient.get('/superadmin/security/sessions')
    return unwrapData(res).sessions || []
  },

  terminatePlatformSession: async (sessionId) => {
    await apiClient.delete(`/superadmin/security/sessions/${sessionId}`)
  },
}
