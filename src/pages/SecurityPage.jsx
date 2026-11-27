import { useCallback, useEffect, useRef, useState } from 'react'
import { KeyRound, RefreshCw, ShieldAlert, Trash2, Unlock } from 'lucide-react'
import { useAuth, useToast } from '@/hooks/useAdminContexts'
import { usePageReveal } from '@/hooks/usePageReveal'
import { adminService } from '@/services/admin.service'
import { formatDateTime } from '@/utils/format'

export default function SecurityPage() {
  const { admin, setAdmin } = useAuth()
  const { notify } = useToast()
  const pageRef = useRef(null)

  const [radar, setRadar] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        adminService.getAbuseRadar(),
        adminService.listPlatformSessions(),
      ])
      setRadar(r)
      setSessions(s)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load security telemetry', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  usePageReveal(pageRef, Boolean(radar))

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword.length < 10) {
      notify('New password must be at least 10 characters long.', 'error')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      notify('New password confirmation does not match.', 'error')
      return
    }
    setSavingPw(true)
    try {
      const updated = await adminService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setAdmin(updated)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      notify('Super Admin password updated and old sessions invalidated.')
    } catch (err) {
      notify(err?.userMessage || 'Password update failed', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  const handleKillSession = async (sessionId) => {
    try {
      await adminService.terminatePlatformSession(sessionId)
      notify('Terminated active customer session')
      load()
    } catch (err) {
      notify(err?.userMessage || 'Failed to terminate session', 'error')
    }
  }

  const handleUnlock2FA = async (userId) => {
    try {
      const res = await adminService.unlockUser2FA(userId)
      notify(res.message)
      load()
    } catch (err) {
      notify(err?.userMessage || 'Failed to unlock 2FA', 'error')
    }
  }

  return (
    <div ref={pageRef} className="nx-page">
      <div className="nx-grid-2">
        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">Super Admin Credentials</h2>
              <p className="nx-card-sub">
                Account: <strong>{admin?.username}</strong> ({admin?.email})
              </p>
            </div>
            <KeyRound size={18} color="var(--app-brand)" />
          </div>

          <div className="nx-muted" style={{ marginBottom: '1em' }}>
            Last login: {formatDateTime(admin?.lastLoginAt)} · IP: {admin?.lastLoginIp || '—'}
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '0.85em' }}>
            <div className="nx-field">
              <label className="nx-label">Current Password</label>
              <input
                type="password"
                className="nx-input"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="nx-field">
              <label className="nx-label">New Password (min 10 chars)</label>
              <input
                type="password"
                className="nx-input"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                required
              />
            </div>
            <div className="nx-field">
              <label className="nx-label">Confirm New Password</label>
              <input
                type="password"
                className="nx-input"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="nx-btn nx-btn-primary" disabled={savingPw}>
              {savingPw ? 'Updating Password...' : 'Rotate Super Admin Password'}
            </button>
          </form>
        </section>

        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">Abuse &amp; Promo Farming Radar</h2>
              <p className="nx-card-sub">Multi-redemption IPs, +alias signups &amp; 2FA lockouts</p>
            </div>
            <button type="button" className="nx-btn nx-btn-sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0.75em' }}>
            <div style={{ padding: '0.85em', borderRadius: '0.75em', background: 'var(--app-surface-2)' }}>
              <strong>Same-IP Redemption Clusters:</strong> {radar?.ipClusters?.length || 0}
              {radar?.ipClusters?.slice(0, 3).map((c) => (
                <div key={c._id} className="nx-muted nx-mono" style={{ marginTop: '0.25em' }}>
                  {c._id} · {c.redemptionCount} redemptions
                </div>
              ))}
            </div>

            <div style={{ padding: '0.85em', borderRadius: '0.75em', background: 'var(--app-surface-2)' }}>
              <strong>+Alias Signup Candidates:</strong> {radar?.aliasFarmCandidates?.length || 0}
              {radar?.aliasFarmCandidates?.slice(0, 3).map((u) => (
                <div key={u._id} className="nx-muted nx-mono" style={{ marginTop: '0.25em' }}>
                  {u.email}
                </div>
              ))}
            </div>

            <div style={{ padding: '0.85em', borderRadius: '0.75em', background: 'var(--app-surface-2)' }}>
              <strong>Active 2FA Account Lockouts:</strong> {radar?.blocked2faUsers?.length || 0}
              {radar?.blocked2faUsers?.map((u) => (
                <div
                  key={u._id}
                  className="nx-muted"
                  style={{
                    marginTop: '0.4em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5em',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    {u.email} · {u.twoFAFailedAttempts} fails (until {formatDateTime(u.twoFABlockedUntil)})
                  </span>
                  <button
                    type="button"
                    className="nx-btn nx-btn-sm"
                    onClick={() => handleUnlock2FA(u._id)}
                  >
                    <Unlock size={13} />
                    <span>Unlock 2FA</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* LTD & Voucher Burn Leaderboard */}
      <section className="nx-card" data-anim="card">
        <div className="nx-card-header">
          <div>
            <h2 className="nx-card-title">Voucher &amp; Lifetime Account Envelope Burn</h2>
            <p className="nx-card-sub">Monitor heavy API/SMS/envelope usage across redeemed LTD workspaces</p>
          </div>
          <ShieldAlert size={18} color="var(--app-warn)" />
        </div>

        {(radar?.ltdUsageRows || []).length === 0 ? (
          <div className="nx-empty">No active voucher/LTD workspaces yet.</div>
        ) : (
          <div className="nx-table-wrap">
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Workspace</th>
                  <th>Owner</th>
                  <th>Tier</th>
                  <th>Campaign</th>
                  <th>Stacked</th>
                  <th>Monthly Envelopes</th>
                </tr>
              </thead>
              <tbody>
                {radar.ltdUsageRows.map((row) => (
                  <tr key={row.subscriptionId}>
                    <td style={{ fontWeight: 600 }}>{row.teamName}</td>
                    <td>{row.ownerEmail}</td>
                    <td>
                      <span className="nx-badge nx-badge-info">
                        {row.planSlug} {row.isLifetime ? '· LTD' : ''}
                      </span>
                    </td>
                    <td>{row.campaign}</td>
                    <td className="nx-mono">{row.stackedCodesCount}</td>
                    <td className="nx-mono" style={{ fontWeight: 700 }}>{row.monthlyEnvelopes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Active Customer Sessions */}
      <section className="nx-card" data-anim="card">
        <div className="nx-card-header">
          <div>
            <h2 className="nx-card-title">Live Customer Sessions ({sessions.length})</h2>
            <p className="nx-card-sub">Remotely terminate compromised customer browser/mobile tokens</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="nx-empty">No active customer sessions found.</div>
        ) : (
          <div className="nx-table-wrap">
            <table className="nx-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Device &amp; City</th>
                  <th>IP Address</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.userId?.name || s.email}</div>
                      <div className="nx-muted">{s.email}</div>
                    </td>
                    <td>
                      <span className="nx-badge nx-badge-neutral">{s.deviceType}</span>{' '}
                      <span className="nx-muted">{s.city || 'Unknown'}</span>
                    </td>
                    <td className="nx-mono">{s.ip || '—'}</td>
                    <td>{formatDateTime(s.lastActive)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="nx-btn nx-btn-sm nx-btn-danger"
                        onClick={() => handleKillSession(s.sessionId)}
                      >
                        <Trash2 size={13} />
                        <span>Terminate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
