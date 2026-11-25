import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CircleAlert, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import logoUrl from '@/assets/logo.svg'
import { useAuth, useToast } from '@/hooks/useAdminContexts'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Enter your Super Admin username/email and password.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await login({ identifier: identifier.trim(), password })
      notify('Welcome back to Nexgn Super Admin')
      navigate('/overview', { replace: true })
    } catch (err) {
      setError(err?.userMessage || 'Invalid credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <section className={styles.showcase}>
          <div>
            <span className={styles.pill}>
              <ShieldCheck size={14} />
              <span>Isolated Super-Admin Plane</span>
            </span>
            <h2 className={styles.showTitle}>
              Run Nexgn billing, vouchers, and GST compliance from one console.
            </h2>
            <p className={styles.showSub}>
              Built exclusively for platform operators on <strong>admin.nexgn.cloud</strong> with
              dedicated JWT isolation from customer workspaces.
            </p>
            <ul className={styles.featureList}>
              <li>
                <Check size={15} color="#ff4d55" />
                <span>Generate 10,000+ AppSumo &amp; partner stackable codes</span>
              </li>
              <li>
                <Check size={15} color="#ff4d55" />
                <span>Manage 3/6/12-month &amp; Lifetime deals + 60-day refund revocations</span>
              </li>
              <li>
                <Check size={15} color="#ff4d55" />
                <span>Export GSTR-1 tax ledgers (CGST/SGST, IGST &amp; 0% Export LUT)</span>
              </li>
              <li>
                <Check size={15} color="#ff4d55" />
                <span>Monitor abuse radar, session locks &amp; workspace quotas</span>
              </li>
            </ul>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Lock size={13} />
            <span>Rate-limited &amp; httpOnly cookie authenticated</span>
          </div>
        </section>

        <section className={styles.main}>
          <div className={styles.topRow}>
            <img src={logoUrl} alt="Nexgn" style={{ height: '1.8rem' }} />
            <span className={styles.domainTag}>admin.nexgn.cloud</span>
          </div>

          <div className={styles.formWrap}>
            <h1 className={styles.title}>Super Admin Sign In</h1>
            <p className={styles.subtitle}>
              Sign in with your single platform owner username or email.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {error && (
                <div className={styles.alert} role="alert">
                  <CircleAlert size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{error}</span>
                </div>
              )}

              <div className="nx-field">
                <label className="nx-label" htmlFor="sa-identifier" style={{ color: '#101828' }}>
                  Username or Email
                </label>
                <input
                  id="sa-identifier"
                  className={styles.input}
                  type="text"
                  autoComplete="username"
                  placeholder="nexgnadmin or admin@nexgn.cloud"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div className="nx-field">
                <label className="nx-label" htmlFor="sa-password" style={{ color: '#101828' }}>
                  Password
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="sa-password"
                    className={styles.input}
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter Super Admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '2.8rem' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? 'Signing In...' : 'Sign In to Admin Console'}
              </button>
            </form>
          </div>

          <p className={styles.footNote}>
            Default seed script: <code>node src/scripts/seedSuperAdmin.js</code>
          </p>
        </section>
      </div>
    </div>
  )
}
