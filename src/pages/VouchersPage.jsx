import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Ban,
  Download,
  Layers,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TicketPercent,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/hooks/useAdminContexts'
import { usePageReveal } from '@/hooks/usePageReveal'
import { adminService } from '@/services/admin.service'
import { formatDateTime, formatShortDate } from '@/utils/format'

const DEFAULT_GEN_FORM = {
  mode: 'bulk',
  customCode: '',
  prefix: 'AS26',
  count: 100,
  campaign: 'appsumo-2026',
  targetPlan: 'starter',
  isLifetime: false,
  durationDays: 90,
  maxRedemptions: 1,
  stackable: false,
  stackGroup: 'appsumo-2026',
  maxStackPerWorkspace: 2,
  expiresAt: '',
  notes: '',
}

export default function VouchersPage() {
  const { notify } = useToast()
  const pageRef = useRef(null)
  const [tab, setTab] = useState('inventory')

  // Inventory state
  const [vouchers, setVouchers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [search, setSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // Campaign analytics state
  const [campaignStats, setCampaignStats] = useState([])

  // Redemptions state
  const [redemptions, setRedemptions] = useState([])
  const [redSearch, setRedSearch] = useState('')
  const [redStatus, setRedStatus] = useState('all')
  const [redPage, setRedPage] = useState(1)
  const [redTotalPages, setRedTotalPages] = useState(1)

  // Generator modal
  const [genOpen, setGenOpen] = useState(false)
  const [genForm, setGenForm] = useState(DEFAULT_GEN_FORM)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState(null)

  // Refund revocation modal
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revokeReason, setRevokeReason] = useState('AppSumo 60-day refund processed')
  const [revoking, setRevoking] = useState(false)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.listVouchers({
        page,
        limit: 25,
        search: search || undefined,
        campaign: campaignFilter,
        plan: planFilter,
        status: statusFilter,
      })
      setVouchers(res.items || [])
      setTotalPages(res.totalPages || 1)
      if (Array.isArray(res.campaigns)) setCampaigns(res.campaigns)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load vouchers', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, campaignFilter, planFilter, statusFilter, notify])

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await adminService.getCampaignAnalytics()
      setCampaignStats(rows)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load campaign analytics', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  const loadRedemptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.listRedemptions({
        page: redPage,
        limit: 25,
        search: redSearch || undefined,
        status: redStatus,
      })
      setRedemptions(res.items || [])
      setRedTotalPages(res.totalPages || 1)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load redemptions', 'error')
    } finally {
      setLoading(false)
    }
  }, [redPage, redSearch, redStatus, notify])

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (tab === 'inventory') void loadInventory()
      else if (tab === 'campaigns') void loadCampaigns()
      else void loadRedemptions()
    }, 0)
    return () => window.clearTimeout(id)
  }, [tab, loadInventory, loadCampaigns, loadRedemptions])

  usePageReveal(pageRef, tab)

  const handlePresetAppSumo = () => {
    setGenResult(null)
    setGenForm({
      ...DEFAULT_GEN_FORM,
      mode: 'bulk',
      prefix: 'AS26',
      count: 2000,
      campaign: 'appsumo-ltd-2026',
      targetPlan: 'starter',
      isLifetime: true,
      durationDays: 365,
      maxRedemptions: 1,
      stackable: true,
      stackGroup: 'appsumo-ltd-2026',
      maxStackPerWorkspace: 2,
      notes: 'AppSumo Tier 1 Starter / Stack 2 -> Business',
    })
    setGenOpen(true)
  }

  const handleGenerateSubmit = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const payload = {
        ...genForm,
        count: Number(genForm.count) || 1,
        durationDays: genForm.isLifetime ? null : Number(genForm.durationDays) || 90,
        maxRedemptions: Number(genForm.maxRedemptions) || 1,
        maxStackPerWorkspace: Number(genForm.maxStackPerWorkspace) || 2,
        expiresAt: genForm.expiresAt || null,
      }
      const res = await adminService.generateVouchers(payload)
      setGenResult(res.data)
      notify(res.message)
      loadInventory()
      loadCampaigns()
    } catch (err) {
      notify(err?.userMessage || 'Failed to generate codes', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async (campaign = campaignFilter, unredeemedOnly = true) => {
    try {
      await adminService.exportVouchersCsv({ campaign, unredeemedOnly })
      notify('Downloaded voucher CSV')
    } catch (err) {
      notify(err?.userMessage || 'Export failed', 'error')
    }
  }

  const handleToggleVoucher = async (row) => {
    try {
      await adminService.toggleVoucherStatus(row._id, !row.active)
      notify(`${row.code} ${!row.active ? 'activated' : 'disabled'}`)
      loadInventory()
    } catch (err) {
      notify(err?.userMessage || 'Failed to update code', 'error')
    }
  }

  const handleToggleCampaign = async (camp, nextActive) => {
    try {
      await adminService.toggleCampaignStatus(camp, nextActive)
      notify(`Campaign "${camp}" ${nextActive ? 'enabled' : 'paused'}`)
      loadCampaigns()
      loadInventory()
    } catch (err) {
      notify(err?.userMessage || 'Campaign toggle failed', 'error')
    }
  }

  const handleRevokeConfirm = async (e) => {
    e.preventDefault()
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await adminService.revokeRedemption({
        code: revokeTarget.code,
        reason: revokeReason,
      })
      notify(res.message)
      setRevokeTarget(null)
      loadRedemptions()
    } catch (err) {
      notify(err?.userMessage || 'Failed to revoke code', 'error')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div ref={pageRef} className="nx-page">
      {/* Top Action Strip */}
      <div className="nx-toolbar">
        <div className="nx-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className="nx-tab"
            data-active={tab === 'inventory'}
            onClick={() => setTab('inventory')}
          >
            Code Inventory
          </button>
          <button
            type="button"
            role="tab"
            className="nx-tab"
            data-active={tab === 'campaigns'}
            onClick={() => setTab('campaigns')}
          >
            Campaign Analytics
          </button>
          <button
            type="button"
            role="tab"
            className="nx-tab"
            data-active={tab === 'redemptions'}
            onClick={() => setTab('redemptions')}
          >
            Redemptions &amp; Refunds
          </button>
        </div>

        <div className="nx-controls">
          <button
            type="button"
            className="nx-btn nx-btn-sm"
            onClick={handlePresetAppSumo}
          >
            <Layers size={15} />
            <span>AppSumo 2k Preset</span>
          </button>
          <button
            type="button"
            className="nx-btn nx-btn-sm"
            onClick={() => handleExport(campaignFilter, true)}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="nx-btn nx-btn-sm nx-btn-primary"
            onClick={() => {
              setGenResult(null)
              setGenForm(DEFAULT_GEN_FORM)
              setGenOpen(true)
            }}
          >
            <Plus size={15} />
            <span>Generate Codes</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY */}
      {tab === 'inventory' && (
        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div className="nx-controls" style={{ flex: 1 }}>
              <input
                type="search"
                className="nx-input"
                placeholder="Search code, campaign, notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                style={{ minWidth: '15em' }}
              />
              <select
                className="nx-select"
                value={campaignFilter}
                onChange={(e) => {
                  setCampaignFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="nx-select"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
              </select>
              <select
                className="nx-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="exhausted">Fully Redeemed</option>
              </select>
            </div>
            <button type="button" className="nx-btn nx-btn-sm" onClick={loadInventory}>
              <RefreshCw size={14} />
            </button>
          </div>

          {vouchers.length === 0 ? (
            <div className="nx-empty">
              {loading ? 'Loading codes...' : 'No vouchers match these filters yet.'}
            </div>
          ) : (
            <div className="nx-table-wrap">
              <table className="nx-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Campaign</th>
                    <th>Tier &amp; Term</th>
                    <th>Stacking</th>
                    <th>Usage</th>
                    <th>Redeem By</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v._id}>
                      <td className="nx-mono" style={{ fontWeight: 700 }}>
                        {v.code}
                      </td>
                      <td>{v.campaign}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`nx-badge ${v.targetPlan === 'business' ? 'nx-badge-brand' : 'nx-badge-info'}`}>
                            {v.targetPlan}
                          </span>
                          <span className="nx-muted">
                            {v.isLifetime ? 'Lifetime' : `${v.durationDays}d`}
                          </span>
                        </div>
                      </td>
                      <td>
                        {v.stackable ? (
                          <span className="nx-badge nx-badge-warn">
                            Stack up to {v.maxStackPerWorkspace}
                          </span>
                        ) : (
                          <span className="nx-muted">Single</span>
                        )}
                      </td>
                      <td className="nx-mono">
                        {v.redeemedCount} / {v.maxRedemptions}
                      </td>
                      <td>{v.expiresAt ? formatShortDate(v.expiresAt) : 'No limit'}</td>
                      <td>
                        {v.active ? (
                          <span className="nx-badge nx-badge-success">Active</span>
                        ) : (
                          <span className="nx-badge nx-badge-danger">Disabled</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={`nx-btn nx-btn-sm ${v.active ? 'nx-btn-danger' : ''}`}
                          onClick={() => handleToggleVoucher(v)}
                        >
                          <Power size={13} />
                          <span>{v.active ? 'Disable' : 'Enable'}</span>
                        </button>
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
              <button
                type="button"
                className="nx-btn nx-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                type="button"
                className="nx-btn nx-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: CAMPAIGN ANALYTICS */}
      {tab === 'campaigns' && (
        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">Campaign Performance &amp; Kill-Switches</h2>
              <p className="nx-card-sub">Track unique workspaces, stacked Business upgrades, and leaked-batch controls</p>
            </div>
            <button type="button" className="nx-btn nx-btn-sm" onClick={loadCampaigns}>
              <RefreshCw size={14} />
            </button>
          </div>

          {campaignStats.length === 0 ? (
            <div className="nx-empty">No voucher campaigns created yet.</div>
          ) : (
            <div className="nx-table-wrap">
              <table className="nx-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Config</th>
                    <th>Redeemed Slots</th>
                    <th>Workspaces</th>
                    <th>Stacked -&gt; Business</th>
                    <th>Revoked</th>
                    <th style={{ textAlign: 'right' }}>Batch Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.map((c) => (
                    <tr key={c.campaign}>
                      <td style={{ fontWeight: 700 }}>{c.campaign}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span className="nx-badge nx-badge-info">{c.targetPlan}</span>
                          <span className="nx-badge nx-badge-neutral">
                            {c.isLifetime ? 'Lifetime' : `${c.durationDays || 90}d`}
                          </span>
                          {c.stackable && <span className="nx-badge nx-badge-warn">Stackable</span>}
                        </div>
                      </td>
                      <td className="nx-mono">
                        {c.redeemedSlots} / {c.totalCapacity} ({c.totalVouchers} codes)
                      </td>
                      <td className="nx-mono">{c.uniqueWorkspaces}</td>
                      <td className="nx-mono">{c.stackedUpgradesToBusiness}</td>
                      <td className="nx-mono">{c.revokedRedemptions}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="nx-controls" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="nx-btn nx-btn-sm"
                            onClick={() => handleExport(c.campaign, true)}
                          >
                            <Download size={13} />
                            <span>CSV</span>
                          </button>
                          {c.activeVouchers > 0 ? (
                            <button
                              type="button"
                              className="nx-btn nx-btn-sm nx-btn-danger"
                              onClick={() => handleToggleCampaign(c.campaign, false)}
                            >
                              <Ban size={13} />
                              <span>Pause All</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="nx-btn nx-btn-sm"
                              onClick={() => handleToggleCampaign(c.campaign, true)}
                            >
                              <Power size={13} />
                              <span>Resume All</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: REDEMPTIONS & REFUNDS */}
      {tab === 'redemptions' && (
        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div className="nx-controls">
              <input
                type="search"
                className="nx-input"
                placeholder="Search code, receipt, campaign..."
                value={redSearch}
                onChange={(e) => {
                  setRedSearch(e.target.value)
                  setRedPage(1)
                }}
              />
              <select
                className="nx-select"
                value={redStatus}
                onChange={(e) => {
                  setRedStatus(e.target.value)
                  setRedPage(1)
                }}
              >
                <option value="all">All Redemptions</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked / Refunded</option>
              </select>
            </div>
            <button type="button" className="nx-btn nx-btn-sm" onClick={loadRedemptions}>
              <RefreshCw size={14} />
            </button>
          </div>

          {redemptions.length === 0 ? (
            <div className="nx-empty">No voucher redemptions recorded yet.</div>
          ) : (
            <div className="nx-table-wrap">
              <table className="nx-table">
                <thead>
                  <tr>
                    <th>Code &amp; Receipt</th>
                    <th>Workspace / Admin</th>
                    <th>Granted Tier</th>
                    <th>Term</th>
                    <th>Redeemed At / IP</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Refund Ops</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="nx-mono" style={{ fontWeight: 700 }}>{r.code}</div>
                        <div className="nx-muted">{r.receiptNumber}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {r.teamId?.company_name || r.userId?.name || 'Workspace'}
                        </div>
                        <div className="nx-muted">{r.userId?.email}</div>
                      </td>
                      <td>
                        <span className={`nx-badge ${r.targetPlanGranted === 'business' ? 'nx-badge-brand' : 'nx-badge-info'}`}>
                          {r.targetPlanGranted} {r.stackGroup ? `(#${r.stackIndex})` : ''}
                        </span>
                      </td>
                      <td>{r.isLifetime ? 'Lifetime' : formatShortDate(r.expiresAt)}</td>
                      <td>
                        <div>{formatDateTime(r.startsAt)}</div>
                        {r.redeemedIp && <div className="nx-muted nx-mono">{r.redeemedIp}</div>}
                      </td>
                      <td>
                        {r.status === 'active' ? (
                          <span className="nx-badge nx-badge-success">Active</span>
                        ) : (
                          <span className="nx-badge nx-badge-danger">{r.status}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'active' && (
                          <button
                            type="button"
                            className="nx-btn nx-btn-sm nx-btn-danger"
                            onClick={() => {
                              setRevokeTarget(r)
                              setRevokeReason('AppSumo 60-day refund processed')
                            }}
                          >
                            <RotateCcw size={13} />
                            <span>Revoke</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="nx-pagination">
            <span>
              Page {redPage} of {redTotalPages}
            </span>
            <div className="nx-controls">
              <button
                type="button"
                className="nx-btn nx-btn-sm"
                disabled={redPage <= 1}
                onClick={() => setRedPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                type="button"
                className="nx-btn nx-btn-sm"
                disabled={redPage >= redTotalPages}
                onClick={() => setRedPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* GENERATOR MODAL */}
      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Generate Nexgn Redeem Codes"
        width="46em"
      >
        <form onSubmit={handleGenerateSubmit} style={{ display: 'grid', gap: '1em' }}>
          <div className="nx-tabs">
            <button
              type="button"
              className="nx-tab"
              data-active={genForm.mode === 'bulk'}
              onClick={() => setGenForm((f) => ({ ...f, mode: 'bulk', maxRedemptions: 1 }))}
            >
              Bulk Unique Codes (1–10,000)
            </button>
            <button
              type="button"
              className="nx-tab"
              data-active={genForm.mode === 'single'}
              onClick={() => setGenForm((f) => ({ ...f, mode: 'single', maxRedemptions: 100 }))}
            >
              Single Shared Promo Code
            </button>
          </div>

          <div className="nx-grid-2">
            {genForm.mode === 'bulk' ? (
              <>
                <div className="nx-field">
                  <label className="nx-label">Code Prefix</label>
                  <input
                    className="nx-input"
                    value={genForm.prefix}
                    onChange={(e) => setGenForm((f) => ({ ...f, prefix: e.target.value.toUpperCase() }))}
                    placeholder="AS26"
                    required
                  />
                </div>
                <div className="nx-field">
                  <label className="nx-label">Quantity (max 10,000)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    className="nx-input"
                    value={genForm.count}
                    onChange={(e) => setGenForm((f) => ({ ...f, count: e.target.value }))}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="nx-field">
                  <label className="nx-label">Promo Code</label>
                  <input
                    className="nx-input nx-mono"
                    value={genForm.customCode}
                    onChange={(e) => setGenForm((f) => ({ ...f, customCode: e.target.value.toUpperCase() }))}
                    placeholder="NEXGN-PRO-90"
                    required
                  />
                </div>
                <div className="nx-field">
                  <label className="nx-label">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    className="nx-input"
                    value={genForm.maxRedemptions}
                    onChange={(e) => setGenForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
                    required
                  />
                </div>
              </>
            )}

            <div className="nx-field">
              <label className="nx-label">Campaign Tag</label>
              <input
                className="nx-input"
                value={genForm.campaign}
                onChange={(e) =>
                  setGenForm((f) => ({
                    ...f,
                    campaign: e.target.value,
                    stackGroup: f.stackable ? e.target.value : f.stackGroup,
                  }))
                }
                placeholder="appsumo-2026"
                required
              />
            </div>

            <div className="nx-field">
              <label className="nx-label">Base Plan Unlocked</label>
              <select
                className="nx-select"
                value={genForm.targetPlan}
                onChange={(e) => setGenForm((f) => ({ ...f, targetPlan: e.target.value }))}
              >
                <option value="starter">Starter Plan (49 envelopes / 5 seats)</option>
                <option value="business">Business Plan (Unlimited / 15 seats)</option>
              </select>
            </div>
          </div>

          <div className="nx-field">
            <label className="nx-label">Plan Duration After Activation</label>
            <div className="nx-controls">
              {[
                { label: '3 Months (90d)', days: 90, lt: false },
                { label: '6 Months (180d)', days: 180, lt: false },
                { label: '1 Year (365d)', days: 365, lt: false },
                { label: 'Lifetime LTD', days: 365, lt: true },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`nx-btn nx-btn-sm ${
                    (preset.lt && genForm.isLifetime) ||
                    (!preset.lt && !genForm.isLifetime && Number(genForm.durationDays) === preset.days)
                      ? 'nx-btn-dark'
                      : ''
                  }`}
                  onClick={() =>
                    setGenForm((f) => ({
                      ...f,
                      isLifetime: preset.lt,
                      durationDays: preset.days,
                    }))
                  }
                >
                  {preset.label}
                </button>
              ))}
              {!genForm.isLifetime && (
                <input
                  type="number"
                  min="1"
                  className="nx-input"
                  style={{ width: '7.5em', height: '2.2em' }}
                  value={genForm.durationDays}
                  onChange={(e) => setGenForm((f) => ({ ...f, durationDays: e.target.value }))}
                />
              )}
            </div>
          </div>

          <div
            style={{
              padding: '0.85em 1em',
              borderRadius: '0.75em',
              background: 'var(--app-surface-2)',
              border: '1px solid var(--app-line)',
              display: 'grid',
              gap: '0.65em',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55em', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={genForm.stackable}
                onChange={(e) => setGenForm((f) => ({ ...f, stackable: e.target.checked }))}
              />
              <span>Enable AppSumo Tier-Stacking (1 code = Starter, 2nd code = Business upgrade)</span>
            </label>

            {genForm.stackable && (
              <div className="nx-grid-2">
                <div className="nx-field">
                  <label className="nx-label">Stack Group ID</label>
                  <input
                    className="nx-input"
                    value={genForm.stackGroup}
                    onChange={(e) => setGenForm((f) => ({ ...f, stackGroup: e.target.value }))}
                    placeholder="appsumo-2026"
                  />
                </div>
                <div className="nx-field">
                  <label className="nx-label">Max Codes Stacked Per Workspace</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="nx-input"
                    value={genForm.maxStackPerWorkspace}
                    onChange={(e) =>
                      setGenForm((f) => ({ ...f, maxStackPerWorkspace: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="nx-grid-2">
            <div className="nx-field">
              <label className="nx-label">Redeem-By Deadline (Optional)</label>
              <input
                type="date"
                className="nx-input"
                value={genForm.expiresAt}
                onChange={(e) => setGenForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <div className="nx-field">
              <label className="nx-label">Internal Notes</label>
              <input
                className="nx-input"
                value={genForm.notes}
                onChange={(e) => setGenForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Partner deal / batch note"
              />
            </div>
          </div>

          {genResult && (
            <div
              style={{
                padding: '0.9em 1em',
                borderRadius: '0.75em',
                background: 'var(--app-success-bg)',
                color: 'var(--app-success)',
                display: 'grid',
                gap: '0.45em',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5em' }}>
                <strong>
                  <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '0.35em' }} />
                  Generated {genResult.count} code(s) in "{genResult.campaign}"
                </strong>
                <button
                  type="button"
                  className="nx-btn nx-btn-sm nx-btn-dark"
                  onClick={() => handleExport(genResult.campaign, true)}
                >
                  <Download size={13} />
                  <span>Download CSV Now</span>
                </button>
              </div>
              {Array.isArray(genResult.sampleCodes) && (
                <div className="nx-mono" style={{ fontSize: '0.82em' }}>
                  Sample: {genResult.sampleCodes.join(', ')}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65em', marginTop: '0.35em' }}>
            <button type="button" className="nx-btn" onClick={() => setGenOpen(false)}>
              Close
            </button>
            <button type="submit" className="nx-btn nx-btn-primary" disabled={generating}>
              <TicketPercent size={16} />
              <span>{generating ? 'Generating...' : 'Create Redeem Codes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* REFUND REVOCATION MODAL */}
      <Modal
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Redeemed Code (Refund Clawback)"
        width="34em"
      >
        {revokeTarget && (
          <form onSubmit={handleRevokeConfirm} style={{ display: 'grid', gap: '1em' }}>
            <p className="nx-muted" style={{ margin: 0 }}>
              Revoking <strong className="nx-mono">{revokeTarget.code}</strong> marks the redemption
              as revoked and automatically downgrades the workspace (Stacked Business → Starter, or
              single code → Free).
            </p>
            <div className="nx-field">
              <label className="nx-label">Reason / Refund Ticket ID</label>
              <input
                className="nx-input"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65em' }}>
              <button type="button" className="nx-btn" onClick={() => setRevokeTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="nx-btn nx-btn-danger" disabled={revoking}>
                {revoking ? 'Revoking...' : 'Confirm Revoke & Downgrade'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
