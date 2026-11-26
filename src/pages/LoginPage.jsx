<<<<<<< HEAD
import { useCallback, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

import { useAuth, useToast } from '@/hooks/useAdminContexts'
import { motion, prefersReducedMotion } from '@/utils/motion'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import styles from './LoginPage.module.css'

gsap.registerPlugin(useGSAP)

const REMEMBERED_KEY = 'nexgn:admin:remembered-id'

function readRememberedIdentifier() {
  try {
    return localStorage.getItem(REMEMBERED_KEY) || ''
  } catch {
    return ''
  }
}

=======
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CircleAlert, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import logoUrl from '@/assets/logo.svg'
import { useAuth, useToast } from '@/hooks/useAdminContexts'
import styles from './LoginPage.module.css'

>>>>>>> origin/main
export default function LoginPage() {
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

<<<<<<< HEAD
  const root = useRef(null)
  const formRef = useRef(null)
  const ids = {
    identifier: useId(),
    password: useId(),
    idErr: useId(),
    passwordErr: useId(),
  }

  const initialId = readRememberedIdentifier()
  const [values, setValues] = useState({
    identifier: initialId,
    password: '',
    remember: Boolean(initialId),
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-reveal]',
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.08,
            delay: motion.first ? 0.6 : 0.05,
            clearProps: 'transform',
          },
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  useGSAP(
    () => {
      if (!serverError || prefersReducedMotion()) return
      gsap.fromTo(
        '[data-alert]',
        { y: -8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' },
      )
    },
    { scope: root, dependencies: [serverError] },
  )

  const shake = useCallback(() => {
    if (prefersReducedMotion() || !formRef.current) return
    gsap.to(formRef.current, {
      keyframes: [
        { x: -10, duration: 0.08 },
        { x: 10, duration: 0.08 },
        { x: -6, duration: 0.08 },
        { x: 6, duration: 0.08 },
        { x: 0, duration: 0.08 },
      ],
      ease: 'power1.inOut',
    })
  }, [])

  const onChange = (e) => {
    const { name, type, value, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
    if (serverError) setServerError('')
  }

  const validate = () => {
    const next = {}
    if (!values.identifier.trim()) next.identifier = 'Enter your Super Admin username or email.'
    if (!values.password) next.password = 'Enter your password.'
    return next
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) {
      formRef.current
        ?.querySelector(found.identifier ? '[name="identifier"]' : '[name="password"]')
        ?.focus()
      shake()
      return
    }

    setSubmitting(true)
    setServerError('')
    try {
      await login({
        identifier: values.identifier.trim(),
        password: values.password,
        remember: values.remember,
      })

      try {
        if (values.remember) localStorage.setItem(REMEMBERED_KEY, values.identifier.trim())
        else localStorage.removeItem(REMEMBERED_KEY)
      } catch {
        /* ignore */
      }

      notify('Welcome back to Nexgn Super Admin')
      navigate('/overview', { replace: true })
    } catch (err) {
      setServerError(err.userMessage || 'Invalid Super Admin credentials.')
      shake()
=======
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
>>>>>>> origin/main
    } finally {
      setSubmitting(false)
    }
  }

  return (
<<<<<<< HEAD
    <div className={styles.page} ref={root}>
      <div className={styles.head} data-reveal>
        <h1 className={styles.title}>Welcome back !</h1>
        <p className={styles.subtitle}>Log in to access Nexgn Admin Console</p>
      </div>

      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
        {serverError && (
          <div className={styles.alert} role="alert" data-alert>
            <CircleAlert aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <div className={styles.field} data-reveal>
          <label htmlFor={ids.identifier}>Username or E-mail</label>
          <input
            id={ids.identifier}
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="nexgnadmin or admin@nexgn.cloud"
            value={values.identifier}
            onChange={onChange}
            className={clsx(styles.input, errors.identifier && styles.invalid)}
            aria-invalid={!!errors.identifier}
            aria-describedby={errors.identifier ? ids.idErr : undefined}
          />
          {errors.identifier && (
            <p id={ids.idErr} className={styles.error}>
              {errors.identifier}
            </p>
          )}
        </div>

        <div className={styles.field} data-reveal>
          <label htmlFor={ids.password}>Password</label>
          <div className={styles.control}>
            <input
              id={ids.password}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={onChange}
              className={clsx(styles.input, styles.hasToggle, errors.password && styles.invalid)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? ids.passwordErr : undefined}
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          </div>
          {errors.password && (
            <p id={ids.passwordErr} className={styles.error}>
              {errors.password}
            </p>
          )}
        </div>

        <div className={styles.row} data-reveal>
          <label className={styles.check}>
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={onChange}
            />
            <span>Remember Me</span>
          </label>
          <span className={styles.secTag}>Isolated Super-Admin Auth</span>
        </div>

        <button type="submit" className={styles.submit} disabled={submitting} data-reveal>
          {submitting ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <span className={styles.srOnly}>Logging in</span>
            </>
          ) : (
            'Log in'
          )}
        </button>
      </form>

      <div className={styles.divider} data-reveal />

      <div className={styles.noteBox} data-reveal>
        Single platform owner access only. Customer workspace admins cannot sign in here. Reset or
        seed via backend CLI: <code>node src/scripts/seedSuperAdmin.js</code>
      </div>

      {submitting && <LoadingOverlay message="Authenticating Super Admin session..." />}
=======
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
>>>>>>> origin/main
    </div>
  )
}
