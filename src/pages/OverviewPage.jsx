import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  FileSignature,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  TicketPercent,
  TrendingUp,
} from 'lucide-react'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/useAdminContexts'
import { formatMoney } from '@/utils/format'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pct(part, total) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

export default function OverviewPage() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.getOverview()
      setData(res)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load platform overview', 'error')
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

  const k = data?.kpis || {}
  const planMix = data?.planMix || { free: 0, starter: 0, business: 0 }
  const sourceMix = data?.sourceMix || { razorpay: 0, redeem_code: 0, admin_grant: 0, free: 0 }
  const revCurrencies = data?.revenueByCurrency || []
  const taxBreakdown = data?.taxBreakdown || []
  const monthlyRevenue = data?.monthlyRevenue || []
  const voucherTotals = data?.voucherTotals || {}

  const totalPlans = planMix.free + planMix.starter + planMix.business
  const conversionRate = pct(k.voucherToPaidConversions || 0, k.voucherUsersCount || 0)

  return (
    <div className="nx-page">
      <div className="nx-toolbar">
        <div className="nx-controls">
          {k.lutComplianceAlerts > 0 && (
            <button
              type="button"
              className="nx-btn nx-btn-sm nx-btn-danger"
              onClick={() => navigate('/compliance')}
            >
              <AlertTriangle size={14} />
              <span>{k.lutComplianceAlerts} LUT Compliance Alert(s)</span>
            </button>
          )}
          {k.haltedSubscriptions > 0 && (
            <button
              type="button"
              className="nx-btn nx-btn-sm"
              onClick={() => navigate('/compliance')}
            >
              <span>{k.haltedSubscriptions} Halted Grace Subscriptions</span>
            </button>
          )}
        </div>

        <button type="button" className="nx-btn nx-btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} />
          <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="nx-kpi-grid">
        {revCurrencies.length === 0 ? (
          <div className="nx-card">
            <div className="nx-card-header" style={{ marginBottom: '0.4rem' }}>
              <span className="nx-muted">Collected Revenue</span>
              <IndianRupee size={17} color="var(--app-brand)" />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>₹0</div>
            <div className="nx-muted" style={{ marginTop: '0.25rem' }}>
              No captured Razorpay payments yet
            </div>
          </div>
        ) : (
          revCurrencies.map((row) => (
            <div className="nx-card" key={row._id}>
              <div className="nx-card-header" style={{ marginBottom: '0.4rem' }}>
                <span className="nx-muted">Revenue ({row._id})</span>
                <IndianRupee size={17} color="var(--app-brand)" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                {formatMoney(row.grossAmount, row._id)}
              </div>
              <div className="nx-muted" style={{ marginTop: '0.25rem' }}>
                Base: {formatMoney(row.baseAmount, row._id)} · GST: {formatMoney(row.taxAmount, row._id)} ({row.count} txns)
              </div>
            </div>
          ))
        )}

        <div className="nx-card">
          <div className="nx-card-header" style={{ marginBottom: '0.4rem' }}>
            <span className="nx-muted">Workspaces &amp; Users</span>
            <Building2 size={17} color="var(--app-info)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {(k.totalWorkspaces || 0).toLocaleString()}
          </div>
          <div className="nx-muted" style={{ marginTop: '0.25rem' }}>
            {k.totalUsers || 0} users · {k.activeSessions || 0} live sessions
          </div>
        </div>

        <div className="nx-card">
          <div className="nx-card-header" style={{ marginBottom: '0.4rem' }}>
            <span className="nx-muted">Envelopes &amp; Signatures</span>
            <FileSignature size={17} color="var(--app-success)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {(k.monthlyEnvelopes || 0).toLocaleString()}
          </div>
          <div className="nx-muted" style={{ marginTop: '0.25rem' }}>
            This month · {k.signedDocuments || 0} / {k.totalDocuments || 0} completed overall
          </div>
        </div>

        <div className="nx-card">
          <div className="nx-card-header" style={{ marginBottom: '0.4rem' }}>
            <span className="nx-muted">Voucher Utilization &amp; LTD</span>
            <TicketPercent size={17} color="var(--app-warn)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {voucherTotals.totalRedeemed || 0} / {voucherTotals.totalSlots || 0}
          </div>
          <div className="nx-muted" style={{ marginTop: '0.25rem' }}>
            {k.lifetimeWorkspaces || 0} Lifetime workspaces · {conversionRate}% paid conversion
          </div>
        </div>
      </div>

      {/* Breakdown Row */}
      <div className="nx-grid-2">
        <section className="nx-card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">Workspace Plan Mix</h2>
              <p className="nx-card-sub">Distribution across Free, Starter, and Business tiers</p>
            </div>
            <TrendingUp size={18} color="var(--app-muted)" />
          </div>

          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {[
              { label: 'Business Plan (Unlimited)', count: planMix.business, color: '#e50914' },
              { label: 'Starter Plan (49 / mo)', count: planMix.starter, color: '#2563eb' },
              { label: 'Free Tier (19 / mo)', count: planMix.free, color: '#6b7280' },
            ].map((item) => {
              const p = pct(item.count, totalPlans)
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                    <span className="nx-mono">{item.count} ({p}%)</span>
                  </div>
                  <div style={{ height: '0.55rem', borderRadius: '999px', background: 'var(--app-surface-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${p}%`, height: '100%', background: item.color, borderRadius: '999px' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--app-line)', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <span className="nx-badge nx-badge-info">Razorpay Paid: {sourceMix.razorpay}</span>
            <span className="nx-badge nx-badge-warn">Voucher / AppSumo: {sourceMix.redeem_code}</span>
            <span className="nx-badge nx-badge-neutral">Admin Grants: {sourceMix.admin_grant}</span>
          </div>
        </section>

        <section className="nx-card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">GST Breakdown by Regime</h2>
              <p className="nx-card-sub">Server-verified UP CGST/SGST vs Inter-State IGST vs 0% Export LUT</p>
            </div>
            <ShieldCheck size={18} color="var(--app-muted)" />
          </div>

          {taxBreakdown.length === 0 ? (
            <div className="nx-empty">No captured GST transactions recorded yet.</div>
          ) : (
            <div className="nx-table-wrap">
              <table className="nx-table">
                <thead>
                  <tr>
                    <th>Tax Regime</th>
                    <th>Base Revenue</th>
                    <th>Tax Collected</th>
                    <th>Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {taxBreakdown.map((t) => (
                    <tr key={`${t._id.taxType}-${t._id.currency}`}>
                      <td>
                        <span className="nx-badge nx-badge-neutral">
                          {String(t._id.taxType || '').toUpperCase()} ({t._id.currency})
                        </span>
                      </td>
                      <td className="nx-mono">{formatMoney(t.base, t._id.currency)}</td>
                      <td className="nx-mono">{formatMoney(t.taxTotal, t._id.currency)}</td>
                      <td className="nx-mono">{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* 6-Month Revenue Table */}
      <section className="nx-card">
        <div className="nx-card-header">
          <div>
            <h2 className="nx-card-title">Monthly Revenue Ledger (Last 6 Months)</h2>
            <p className="nx-card-sub">Gross collected vs base plan revenue and GST payable</p>
          </div>
        </div>

        {monthlyRevenue.length === 0 ? (
          <div className="nx-empty">No monthly revenue data yet.</div>
        ) : (
          <div className="nx-table-wrap">
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Currency</th>
                  <th>Transactions</th>
                  <th>Base Revenue</th>
                  <th>GST</th>
                  <th>Gross Collected</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRevenue.map((r) => (
                  <tr key={`${r._id.year}-${r._id.month}-${r._id.currency}`}>
                    <td style={{ fontWeight: 600 }}>
                      {MONTH_NAMES[(r._id.month || 1) - 1]} {r._id.year}
                    </td>
                    <td>{r._id.currency}</td>
                    <td className="nx-mono">{r.count}</td>
                    <td className="nx-mono">{formatMoney(r.base, r._id.currency)}</td>
                    <td className="nx-mono">{formatMoney(r.tax, r._id.currency)}</td>
                    <td className="nx-mono" style={{ fontWeight: 700 }}>
                      {formatMoney(r.gross, r._id.currency)}
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
