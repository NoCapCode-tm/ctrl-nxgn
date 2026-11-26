export function formatMoney(subunits = 0, currency = 'INR') {
  const cur = String(currency || 'INR').toUpperCase()
  const val = (Number(subunits) || 0) / 100
  const sym = cur === 'USD' ? '$' : '₹'
  return `${sym}${val.toLocaleString(cur === 'USD' ? 'en-US' : 'en-IN', {
    minimumFractionDigits: cur === 'USD' ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatShortDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
