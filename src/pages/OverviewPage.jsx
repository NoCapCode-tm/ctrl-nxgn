import { useCallback, useEffect, useRef, useState } from 'react'
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
import StatCard from '@/components/ui/StatCard'
import { useToast } from '@/hooks/useAdminContexts'
import { usePageReveal } from '@/hooks/usePageReveal'
import { adminService } from '@/services/admin.service'
import { formatMoney } from '@/utils/format'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pct(part, total) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

export default function OverviewPage() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const pageRef = useRef(null)

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

  usePageReveal(pageRef, Boolean(data))

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
    <div ref={pageRef} className="nx-page">
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

      {/* Signature Notched Animated KPI Grid (scales from 320px phone to 3840px 4K) */}
      <div className="nx-kpi-grid">
        {revCurrencies.length === 0 ? (
          <StatCard
            label="Collected Revenue"
            value="₹0"
            tag="INR"
            sub="No captured Razorpay payments yet"
            tone="brand"
            Icon={IndianRupee}
            loading={loading}
            onClick={() => navigate('/compliance')}
          />
        ) : (
          revCurrencies.map((row) => (
            <StatCard
              key={row._id}
              label={`Revenue (${row._id})`}
              value={formatMoney(row.grossAmount, row._id)}
              tag={`${row.count} txns`}
              sub={`Base ${formatMoney(row.baseAmount, row._id)} · GST ${formatMoney(row.taxAmount, row._id)}`}
              tone="brand"
              Icon={IndianRupee}
              loading={loading}
              onClick={() => navigate('/compliance')}
            />
          ))
        )}

        <StatCard
          label="Active Workspaces"
          numericValue={k.totalWorkspaces || 0}
          tag={`${k.activeSessions || 0} live`}
          sub={`${k.totalUsers || 0} total workspace users`}
          tone="total"
          Icon={Building2}
          loading={loading}
          onClick={() => navigate('/workspaces')}
        />

        <StatCard
          label="Monthly Envelopes"
          numericValue={k.monthlyEnvelopes || 0}
          tag={`${k.signedDocuments || 0} signed`}
          sub={`Out of ${k.totalDocuments || 0} total documents`}
          tone="signed"
          Icon={FileSignature}
          loading={loading}
          onClick={() => navigate('/workspaces')}
        />

        <StatCard
          label="Redeemed Vouchers"
          numericValue={voucherTotals.totalRedeemed || 0}
          tag={`${conversionRate}% paid`}
          sub={`${k.lifetimeWorkspaces || 0} Lifetime · ${voucherTotals.totalSlots || 0} slots`}
          tone="pending"
          Icon={TicketPercent}
          loading={loading}
          onClick={() => navigate('/vouchers')}
        />
      </div>

      {/* Breakdown Row */}
      <div className="nx-grid-2">
        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">Workspace Plan Mix</h2>
              <p className="nx-card-sub">Distribution across Free, Starter, and Business tiers</p>
            </div>
            <TrendingUp size={18} color="var(--app-muted)" />
          </div>

          <div style={{ display: 'grid', gap: '0.95em' }}>
            {[
              { label: 'Business Plan (Unlimited)', count: planMix.business, color: '#e50914' },
              { label: 'Starter Plan (49 / mo)', count: planMix.starter, color: '#2563eb' },
              { label: 'Free Tier (19 / mo)', count: planMix.free, color: '#6b7280' },
            ].map((item) => {
              const p = pct(item.count, totalPlans)
              return (
                <div key={item.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9em',
                      marginBottom: '0.32em',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                    <span className="nx-mono">
                      {item.count} ({p}%)
                    </span>
                  </div>
                  <div className="nx-bar-track">
                    <div
                      className="nx-bar-fill"
                      style={{ width: `${p}%`, background: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              marginTop: '1.25em',
              paddingTop: '1em',
              borderTop: '1px solid var(--app-line)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.55em',
            }}
          >
            <span className="nx-badge nx-badge-info">Razorpay Paid: {sourceMix.razorpay}</span>
            <span className="nx-badge nx-badge-warn">Voucher / AppSumo: {sourceMix.redeem_code}</span>
            <span className="nx-badge nx-badge-neutral">Admin Grants: {sourceMix.admin_grant}</span>
          </div>
        </section>

        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div>
              <h2 className="nx-card-title">GST Breakdown by Regime</h2>
              <p className="nx-card-sub">
                Server-verified UP CGST/SGST vs Inter-State IGST vs 0% Export LUT
              </p>
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
      <section className="nx-card" data-anim="card">
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
