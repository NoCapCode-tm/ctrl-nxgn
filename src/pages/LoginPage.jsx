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

export default function LoginPage() {
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

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
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
    </div>
  )
}
