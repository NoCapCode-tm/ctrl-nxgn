import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/useAdminContexts'
import { usePageReveal } from '@/hooks/usePageReveal'
import { adminService } from '@/services/admin.service'
import { formatDateTime, formatMoney } from '@/utils/format'

export default function CompliancePage() {
  const { notify } = useToast()
  const pageRef = useRef(null)
  const [tab, setTab] = useState('ledger')
  const [items, setItems] = useState([])
  const [taxType, setTaxType] = useState('all')
  const [complianceStatus, setComplianceStatus] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [webhooks, setWebhooks] = useState([])
  const [haltedSubs, setHaltedSubs] = useState([])
  const [loading, setLoading] = useState(false)

  const loadLedger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.listCompliancePayments({
        page,
        limit: 25,
        taxType,
        complianceStatus,
        status: statusFilter,
        search: search || undefined,
      })
      setItems(res.items || [])
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      notify(err?.userMessage || 'Failed to load GST ledger', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, taxType, complianceStatus, statusFilter, search, notify])

  const loadWebhooks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.listWebhooksAndGrace()
      setWebhooks(res.webhooks || [])
      setHaltedSubs(res.haltedSubscriptions || [])
    } catch (err) {
      notify(err?.userMessage || 'Failed to load webhook logs', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (tab === 'ledger') void loadLedger()
      else void loadWebhooks()
    }, 0)
    return () => window.clearTimeout(id)
  }, [tab, loadLedger, loadWebhooks])

  usePageReveal(pageRef, tab)

  const handleResolveLut = async (id) => {
    try {
      await adminService.resolveLutViolation(id, 'verified')
      notify('Marked LUT compliance record verified')
      loadLedger()
    } catch (err) {
      notify(err?.userMessage || 'Failed to update compliance status', 'error')
    }
  }

  return (
    <div ref={pageRef} className="nx-page">
      <div className="nx-toolbar">
        <div className="nx-tabs">
          <button
            type="button"
            className="nx-tab"
            data-active={tab === 'ledger'}
            onClick={() => setTab('ledger')}
          >
            GST &amp; Payment Ledger
          </button>
          <button
            type="button"
            className="nx-tab"
            data-active={tab === 'webhooks'}
            onClick={() => setTab('webhooks')}
          >
            Razorpay Webhooks &amp; Halted Queue
          </button>
        </div>

        <div className="nx-controls">
          <button
            type="button"
            className="nx-btn nx-btn-sm nx-btn-dark"
            onClick={() =>
              adminService
                .exportGstr1Csv()
                .then(() => notify('Exported GSTR-1 tax CSV'))
                .catch((e) => notify(e?.userMessage || 'Export failed', 'error'))
            }
          >
            <Download size={14} />
            <span>Export GSTR-1 CSV</span>
          </button>
        </div>
      </div>

      {tab === 'ledger' && (
        <section className="nx-card" data-anim="card">
          <div className="nx-card-header">
            <div className="nx-controls">
              <input
                type="search"
                className="nx-input"
                placeholder="Invoice #, payment ID, email, state..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
              <select
                className="nx-select"
                value={taxType}
                onChange={(e) => {
                  setTaxType(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All Tax Regimes</option>
                <option value="cgst_sgst">CGST + SGST (UP 09)</option>
                <option value="igst">IGST (Inter-State 18%)</option>
                <option value="export_lut">0% Export LUT (USD)</option>
                <option value="redeemed">Voucher Receipts</option>
              </select>
              <select
                className="nx-select"
                value={complianceStatus}
                onChange={(e) => {
                  setComplianceStatus(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All Compliance Flags</option>
                <option value="verified">Verified</option>
                <option value="lut_violation_flagged">LUT Flagged</option>
                <option value="lut_violation_refunded">LUT Auto-Refunded</option>
              </select>
              <select
                className="nx-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All Payment Statuses</option>
                <option value="captured">Captured</option>
                <option value="redeemed">Redeemed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <button type="button" className="nx-btn nx-btn-sm" onClick={loadLedger} disabled={loading}>
              <RefreshCw size={14} />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="nx-empty">{loading ? 'Loading GST ledger...' : 'No ledger records found.'}</div>
          ) : (
            <div className="nx-table-wrap">
              <table className="nx-table">
                <thead>
                  <tr>
                    <th>Invoice &amp; Date</th>
                    <th>Buyer &amp; Place of Supply</th>
                    <th>Tax Breakdown</th>
                    <th>Gross &amp; Status</th>
                    <th>Geo / Card Signals</th>
                    <th>Compliance</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="nx-mono" style={{ fontWeight: 700 }}>
                          {p.invoiceNumber || p.razorpayPaymentId || p._id}
                        </div>
                        <div className="nx-muted">{formatDateTime(p.paidAt || p.createdAt)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.teamId?.company_name || p.email || '—'}</div>
                        <div className="nx-muted">
                          {p.placeOfSupply} {p.taxSnapshot?.gstin ? `· ${p.taxSnapshot.gstin}` : ''}
                        </div>
                      </td>
                      <td className="nx-mono">
                        <div>Base: {formatMoney(p.baseAmount, p.currency)}</div>
                        <div className="nx-muted">
                          {p.taxType === 'cgst_sgst'
                            ? `CGST ${formatMoney(p.cgstAmount, p.currency)} + SGST ${formatMoney(p.sgstAmount, p.currency)}`
                            : p.taxType === 'export_lut'
                              ? '0% Export LUT'
                              : `IGST ${formatMoney(p.igstAmount || p.taxAmount, p.currency)}`}
                        </div>
                      </td>
                      <td>
                        <div className="nx-mono" style={{ fontWeight: 700 }}>
                          {formatMoney(p.amount, p.currency)}
                        </div>
                        <span className={`nx-badge ${p.status === 'captured' ? 'nx-badge-success' : p.status === 'failed' || p.status === 'refunded' ? 'nx-badge-danger' : 'nx-badge-neutral'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="nx-mono">
                        <div>IP: {p.ipCountry || '—'} · Card: {p.cardCountry || '—'}</div>
                        <div className="nx-muted">Method: {p.method || '—'}</div>
                      </td>
                      <td>
                        <span className={`nx-badge ${p.complianceStatus === 'verified' ? 'nx-badge-success' : 'nx-badge-danger'}`}>
                          {p.complianceStatus || 'verified'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {p.complianceStatus && p.complianceStatus !== 'verified' && (
                          <button
                            type="button"
                            className="nx-btn nx-btn-sm"
                            onClick={() => handleResolveLut(p._id)}
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Verified</span>
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
      )}

      {tab === 'webhooks' && (
        <div className="nx-grid-2">
          <section className="nx-card" data-anim="card">
            <div className="nx-card-header">
              <h2 className="nx-card-title">Recent Razorpay Webhooks</h2>
              <button type="button" className="nx-btn nx-btn-sm" onClick={loadWebhooks}>
                <RefreshCw size={14} />
              </button>
            </div>
            {webhooks.length === 0 ? (
              <div className="nx-empty">No webhook events recorded yet.</div>
            ) : (
              <div className="nx-table-wrap">
                <table className="nx-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Event ID</th>
                      <th>Processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((w) => (
                      <tr key={w._id}>
                        <td>
                          <span className="nx-badge nx-badge-info">{w.event}</span>
                        </td>
                        <td className="nx-mono">{w.eventId}</td>
                        <td>{formatDateTime(w.processedAt || w.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="nx-card" data-anim="card">
            <div className="nx-card-header">
              <h2 className="nx-card-title">Halted / Grace-Period Subscriptions</h2>
            </div>
            {haltedSubs.length === 0 ? (
              <div className="nx-empty">Zero halted subscriptions right now.</div>
            ) : (
              <div className="nx-table-wrap">
                <table className="nx-table">
                  <thead>
                    <tr>
                      <th>Workspace</th>
                      <th>Plan</th>
                      <th>Grace Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {haltedSubs.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.teamId?.company_name || 'Personal'}</div>
                          <div className="nx-muted">{s.userId?.email}</div>
                        </td>
                        <td>{s.planSlug}</td>
                        <td>{formatDateTime(s.gracePeriodEndsAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
