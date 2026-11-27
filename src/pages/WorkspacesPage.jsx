import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, LogOut, RefreshCw, SlidersHorizontal } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/hooks/useAdminContexts'
import { usePageReveal } from '@/hooks/usePageReveal'
import { adminService } from '@/services/admin.service'
import { formatDateTime, formatMoney, formatShortDate } from '@/utils/format'

export default function WorkspacesPage() {
  const { notify } = useToast()
  const pageRef = useRef(null)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('all')
  const [billingSource, setBillingSource] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [detail, setDetail] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({
    planSlug: '',
    extendDays: 0,
    isLifetime: false,
    customEnvelopeLimit: '',
    customSeatLimit: '',
    ownerStatus: 'Active',
    adminNotes: '',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.listWorkspaces({
        page,
        limit: 20,
        search: search || undefined,
        plan,
        billingSource,
      })
      setItems(res.items || [])
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load workspaces', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, plan, billingSource, notify])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  usePageReveal(pageRef, items.length > 0)

  const openInspector = async (teamId) => {
    try {
      const res = await adminService.getWorkspaceDetail(teamId)
      setDetail(res)
    } catch (err) {
      notify(err?.userMessage || 'Failed to inspect workspace', 'error')
    }
  }

  const openEditor = (ws) => {
    setEditTarget(ws)
    setEditForm({
      planSlug: ws.planSlug || 'free',
      extendDays: 0,
      isLifetime: Boolean(ws.isLifetime),
      customEnvelopeLimit: ws.customEnvelopeLimit ?? '',
      customSeatLimit: ws.customSeatLimit ?? '',
      ownerStatus: ws.owner?.status || 'Active',
      adminNotes: '',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try {
      await adminService.updateWorkspaceSubscription(editTarget.teamId, editForm)
      notify(`Updated ${editTarget.companyName}`)
      setEditTarget(null)
      load()
    } catch (err) {
      notify(err?.userMessage || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRevokeSessions = async (ws) => {
    try {
      const res = await adminService.revokeWorkspaceSessions(ws.teamId)
      notify(res.message)
      if (detail?.team?._id === ws.teamId) openInspector(ws.teamId)
    } catch (err) {
      notify(err?.userMessage || 'Failed to revoke sessions', 'error')
    }
  }

  return (
    <div ref={pageRef} className="nx-page">
      <section className="nx-card" data-anim="card">
        <div className="nx-card-header">
          <div className="nx-controls">
            <input
              type="search"
              className="nx-input"
              placeholder="Search company, org ID, owner email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{ minWidth: '17em' }}
            />
            <select
              className="nx-select"
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
            </select>
            <select
              className="nx-select"
              value={billingSource}
              onChange={(e) => {
                setBillingSource(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All Sources</option>
              <option value="razorpay">Razorpay Paid</option>
              <option value="redeem_code">Redeem Code</option>
              <option value="admin_grant">Admin Grant</option>
              <option value="free">Free</option>
            </select>
          </div>
          <button type="button" className="nx-btn nx-btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="nx-empty">{loading ? 'Loading workspaces...' : 'No workspaces found.'}</div>
        ) : (
          <div className="nx-table-wrap">
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Workspace</th>
                  <th>Owner &amp; Status</th>
                  <th>Plan &amp; Source</th>
                  <th>Monthly Usage</th>
                  <th>GST State</th>
                  <th style={{ textAlign: 'right' }}>Operations</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.teamId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{w.companyName}</div>
                      <div className="nx-muted nx-mono">{w.orgId}</div>
                    </td>
                    <td>
                      <div>{w.owner?.email || '—'}</div>
                      <span className={`nx-badge ${w.owner?.status === 'Active' ? 'nx-badge-success' : 'nx-badge-danger'}`}>
                        {w.owner?.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span className={`nx-badge ${w.planSlug === 'business' ? 'nx-badge-brand' : w.planSlug === 'starter' ? 'nx-badge-info' : 'nx-badge-neutral'}`}>
                          {w.planName}
                        </span>
                        <span className="nx-badge nx-badge-neutral">{w.billingSource}</span>
                        {w.isLifetime && <span className="nx-badge nx-badge-warn">Lifetime</span>}
                        {w.activeRedeemCode && (
                          <span className="nx-badge nx-badge-info nx-mono">{w.activeRedeemCode}</span>
                        )}
                      </div>
                      <div className="nx-muted" style={{ marginTop: '0.25rem' }}>
                        {w.isLifetime
                          ? `Stacked: ${w.stackedCodesCount || 1}`
                          : w.expiresAt
                            ? `Ends ${formatShortDate(w.expiresAt)}`
                            : 'Ongoing'}
                      </div>
                    </td>
                    <td className="nx-mono">
                      <div>
                        Env: {w.envelopesUsed} / {w.envelopeLimit < 0 ? '∞' : w.envelopeLimit}
                      </div>
                      <div className="nx-muted">
                        Seats: {w.seatsUsed} / {w.seatLimit < 0 ? '∞' : w.seatLimit}
                      </div>
                    </td>
                    <td>
                      <div>{w.taxState}</div>
                      {w.gstin && <div className="nx-muted nx-mono">{w.gstin}</div>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="nx-controls" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="nx-btn nx-btn-sm"
                          onClick={() => openInspector(w.teamId)}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          className="nx-btn nx-btn-sm nx-btn-dark"
                          onClick={() => openEditor(w)}
                        >
                          <SlidersHorizontal size={13} />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="nx-pagination">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="nx-controls">
            <button type="button" className="nx-btn nx-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <button type="button" className="nx-btn nx-btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>

      {/* INSPECTOR MODAL */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.team?.company_name ? `${detail.team.company_name} (${detail.team.org_id})` : 'Workspace Detail'}
        width="50em"
      >
        {detail && (
          <div style={{ display: 'grid', gap: '1.15em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65em' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{detail.team?.owner?.name}</div>
                <div className="nx-muted">{detail.team?.owner?.email}</div>
              </div>
              <button
                type="button"
                className="nx-btn nx-btn-sm nx-btn-danger"
                onClick={() => handleRevokeSessions({ teamId: detail.team._id })}
              >
                <LogOut size={13} />
                <span>Force Logout All ({detail.activeSessions?.length || 0} sessions)</span>
              </button>
            </div>

            <div className="nx-grid-2">
              <div className="nx-card" style={{ padding: '0.9em' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35em' }}>Usage &amp; Tax Profile</div>
                <div className="nx-muted">Monthly Envelopes: {detail.usage?.monthlyEnvelopes ?? 0}</div>
                <div className="nx-muted">Total Documents: {detail.usage?.totalDocuments ?? 0}</div>
                <div className="nx-muted">State: {detail.taxProfile?.state || 'Uttar Pradesh'}</div>
                <div className="nx-muted nx-mono">GSTIN: {detail.taxProfile?.gstin || '—'}</div>
              </div>
              <div className="nx-card" style={{ padding: '0.9em' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35em' }}>Team Members ({detail.members?.length || 0})</div>
                {(detail.members || []).map((m) => (
                  <div key={m._id} style={{ fontSize: '0.86em', marginBottom: '0.2em' }}>
                    <strong>{m.email}</strong> · {m.role} · {m.status}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.45em' }}>Recent Payments &amp; Receipts</div>
              {detail.payments?.length === 0 ? (
                <div className="nx-muted">No payment rows.</div>
              ) : (
                <div className="nx-table-wrap">
                  <table className="nx-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Tax Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.payments.map((p) => (
                        <tr key={p._id}>
                          <td className="nx-mono">{p.invoiceNumber || p.razorpayPaymentId || p._id}</td>
                          <td>{p.taxType}</td>
                          <td className="nx-mono">{formatMoney(p.amount, p.currency)}</td>
                          <td>{p.status}</td>
                          <td>{formatDateTime(p.paidAt || p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* SUPPORT OVERRIDES MODAL */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Support Controls · ${editTarget.companyName}` : 'Manage Workspace'}
        width="38em"
      >
        {editTarget && (
          <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: '1em' }}>
            <div className="nx-grid-2">
              <div className="nx-field">
                <label className="nx-label">Plan Override</label>
                <select
                  className="nx-select"
                  value={editForm.planSlug}
                  onChange={(e) => setEditForm((f) => ({ ...f, planSlug: e.target.value }))}
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="nx-field">
                <label className="nx-label">Extend Trial / Expiry (+Days)</label>
                <input
                  type="number"
                  min="0"
                  className="nx-input"
                  value={editForm.extendDays}
                  onChange={(e) => setEditForm((f) => ({ ...f, extendDays: Number(e.target.value) }))}
                />
              </div>
              <div className="nx-field">
                <label className="nx-label">Custom Envelope Limit (-1 = Unlimited)</label>
                <input
                  type="number"
                  className="nx-input"
                  placeholder="Use default plan limit"
                  value={editForm.customEnvelopeLimit}
                  onChange={(e) => setEditForm((f) => ({ ...f, customEnvelopeLimit: e.target.value }))}
                />
              </div>
              <div className="nx-field">
                <label className="nx-label">Custom Seat Limit</label>
                <input
                  type="number"
                  className="nx-input"
                  placeholder="Use default plan limit"
                  value={editForm.customSeatLimit}
                  onChange={(e) => setEditForm((f) => ({ ...f, customSeatLimit: e.target.value }))}
                />
              </div>
              <div className="nx-field">
                <label className="nx-label">Owner Account Status</label>
                <select
                  className="nx-select"
                  value={editForm.ownerStatus}
                  onChange={(e) => setEditForm((f) => ({ ...f, ownerStatus: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Not-Active">Suspended (Not-Active)</option>
                </select>
              </div>
              <div className="nx-field" style={{ alignContent: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editForm.isLifetime}
                    onChange={(e) => setEditForm((f) => ({ ...f, isLifetime: e.target.checked }))}
                  />
                  <span>Lifetime Subscription</span>
                </label>
              </div>
            </div>

            <div className="nx-field">
              <label className="nx-label">Admin Notes</label>
              <textarea
                className="nx-textarea"
                value={editForm.adminNotes}
                onChange={(e) => setEditForm((f) => ({ ...f, adminNotes: e.target.value }))}
                placeholder="Ticket reference or reason for manual override"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button type="button" className="nx-btn" onClick={() => setEditTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="nx-btn nx-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Workspace Overrides'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
