import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptIndianRupee,
  ShieldAlert,
  Sun,
  TicketPercent,
  X,
} from 'lucide-react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import logoUrl from '@/assets/logo.svg'
import compactLogoUrl from '@/assets/compact-logo.svg'
import { useAuth, useTheme, useToast } from '@/hooks/useAdminContexts'
import { adminService } from '@/services/admin.service'
import { prefersReducedMotion } from '@/utils/motion'
import styles from './AdminLayout.module.css'

gsap.registerPlugin(useGSAP)

const ROUTE_META = {
  '/overview': {
    title: 'Platform Overview',
    subtitle: 'Real-time Nexgn revenue, plan mix, envelopes, and tax compliance telemetry.',
  },
  '/vouchers': {
    title: 'Redeem Codes & AppSumo',
    subtitle: 'Generate 10k+ bulk voucher batches, stackable LTD tiers, 3/6/12-mo promos & revocations.',
  },
  '/workspaces': {
    title: 'Workspaces & Support Ops',
    subtitle: 'Manage customer teams, extend trials, override quotas, and terminate sessions.',
  },
  '/compliance': {
    title: 'GST Compliance & Webhooks',
    subtitle: 'CGST/SGST vs IGST vs 0% Export LUT verification ledger, GSTR-1 CSV export & webhooks.',
  },
  '/security': {
    title: 'Abuse Radar & Admin Security',
    subtitle: 'Promo farming telemetry, LTD envelope burn, active sessions & Super Admin credentials.',
  },
}

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notify } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const shellRef = useRef(null)
  const sidebarRef = useRef(null)
  const navRef = useRef(null)
  const pillRef = useRef(null)
  const stageRef = useRef(null)
  const placedRef = useRef(false)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [alerts, setAlerts] = useState({ lutComplianceAlerts: 0, haltedSubscriptions: 0 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let active = true
    adminService
      .getOverview()
      .then((res) => {
        if (!active || !res?.kpis) return
        setAlerts({
          lutComplianceAlerts: res.kpis.lutComplianceAlerts || 0,
          haltedSubscriptions: res.kpis.haltedSubscriptions || 0,
        })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [location.pathname])

  // Slide active dark pill smoothly across sidebar nav links
  const placePill = useCallback((animate) => {
    const nav = navRef.current
    const pill = pillRef.current
    if (!nav || !pill) return
    const activeLink = nav.querySelector('[aria-current="page"]')
    if (!activeLink) {
      gsap.to(pill, { autoAlpha: 0, duration: 0.2 })
      return
    }
    const target = {
      x: activeLink.offsetLeft,
      y: activeLink.offsetTop,
      width: activeLink.offsetWidth,
      height: activeLink.offsetHeight,
      autoAlpha: 1,
    }
    if (!animate || prefersReducedMotion()) {
      gsap.set(pill, target)
    } else {
      gsap.to(pill, {
        ...target,
        duration: 0.48,
        ease: 'power3.inOut',
        overwrite: 'auto',
      })
    }
  }, [])

  useGSAP(
    () => {
      placePill(placedRef.current)
      placedRef.current = true
    },
    { scope: navRef, dependencies: [location.pathname, collapsed, mobileOpen] },
  )

  useEffect(() => {
    const nav = navRef.current
    if (!nav || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => placePill(false))
    ro.observe(nav)
    return () => ro.disconnect()
  }, [placePill])

  // Desktop sidebar entrance
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          sidebarRef.current,
          { x: -24, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.75,
            ease: 'expo.out',
            clearProps: 'transform,opacity,visibility',
          },
        )
        gsap.fromTo(
          '[data-nav-item]',
          { x: -10, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.45,
            stagger: 0.04,
            delay: 0.16,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility',
          },
        )
      })
      return () => mm.revert()
    },
    { scope: sidebarRef },
  )

  // Mobile drawer item stagger
  useGSAP(
    () => {
      if (!mobileOpen || prefersReducedMotion()) return
      gsap.fromTo(
        '[data-nav-item]',
        { x: -16, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.4,
          stagger: 0.04,
          delay: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        },
      )
    },
    { scope: sidebarRef, dependencies: [mobileOpen] },
  )

  // Smooth route stage transition
  useGSAP(
    () => {
      if (prefersReducedMotion() || !stageRef.current) return
      gsap.fromTo(
        stageRef.current,
        { y: 14, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.48,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        },
      )
    },
    { scope: shellRef, dependencies: [location.pathname] },
  )

  const meta = ROUTE_META[location.pathname] || ROUTE_META['/overview']
  const complianceCount = alerts.lutComplianceAlerts + alerts.haltedSubscriptions

  useEffect(() => {
    document.title = `${meta.title} | Nexgn Admin Console`
  }, [meta.title])

  const handleLogout = async () => {
    await logout()
    notify('Signed out of Nexgn Admin')
    navigate('/login', { replace: true })
  }

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div
        className={styles.backdrop}
        data-open={mobileOpen ? 'true' : 'false'}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        ref={sidebarRef}
        className={styles.sidebar}
        data-open={mobileOpen ? 'true' : 'false'}
      >
        <div className={styles.sideHead}>
          {collapsed ? (
            <button
              type="button"
              className={styles.markBtn}
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
            >
              <span className={styles.mark}>
                <img src={compactLogoUrl} alt="Nexgn" />
              </span>
              <PanelLeftOpen className={styles.markArrow} aria-hidden="true" />
            </button>
          ) : (
            <NavLink to="/overview" className={styles.brandLink}>
              <img src={logoUrl} alt="Nexgn" className={styles.brandText} />
              <span className={styles.adminPill}>Admin</span>
            </NavLink>
          )}

          {!collapsed && (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose />
            </button>
          )}

          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X />
          </button>
        </div>

        <nav
          ref={navRef}
          className={styles.nav}
          aria-label="Super Admin Navigation"
          onClick={() => setMobileOpen(false)}
        >
          <div ref={pillRef} className={styles.indicator} aria-hidden="true" />

          {!collapsed && <span className={styles.navGroupLabel}>Platform Control</span>}

          <NavLink to="/overview" className={styles.navLink} data-nav-item data-tip="Overview">
            <LayoutDashboard />
            {!collapsed && <span>Overview</span>}
          </NavLink>

          <NavLink
            to="/vouchers"
            className={styles.navLink}
            data-nav-item
            data-tip="Vouchers & AppSumo"
          >
            <TicketPercent />
            {!collapsed && <span>Vouchers &amp; AppSumo</span>}
          </NavLink>

          <NavLink to="/workspaces" className={styles.navLink} data-nav-item data-tip="Workspaces">
            <Building2 />
            {!collapsed && <span>Workspaces</span>}
          </NavLink>

          {!collapsed && <span className={styles.navGroupLabel}>Finance &amp; Defense</span>}

          <NavLink
            to="/compliance"
            className={styles.navLink}
            data-nav-item
            data-tip="GST & Webhooks"
          >
            <ReceiptIndianRupee />
            {!collapsed && (
              <>
                <span>GST &amp; Webhooks</span>
                {complianceCount > 0 && (
                  <span className={styles.navAlertBadge}>{complianceCount}</span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/security"
            className={styles.navLink}
            data-nav-item
            data-tip="Abuse & Security"
          >
            <ShieldAlert />
            {!collapsed && <span>Abuse &amp; Security</span>}
          </NavLink>
        </nav>

        <div className={styles.sideFoot}>
          {!collapsed && (
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                {String(admin?.username || 'NX').slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{admin?.name || 'Nexgn Super Admin'}</p>
                <p className={styles.userEmail}>{admin?.email || 'admin@nexgn.cloud'}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="nx-btn"
            onClick={handleLogout}
            style={{ width: '100%' }}
            title="Sign out"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar} data-scrolled={scrolled ? 'true' : 'false'}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.burger}`}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className={styles.pageTitle}>{meta.title}</h1>
              <p className={styles.pageSub}>{meta.subtitle}</p>
            </div>
          </div>

          <div className={styles.topRight}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
          </div>
        </header>

        {admin?.mustChangePassword && (
          <div className={styles.bannerWarn} role="alert">
            <span>
              You are signed in with the bootstrap default password. Rotate your Super Admin
              password right away to secure <strong>ctrl.nexgn.cloud</strong>.
            </span>
            <button
              type="button"
              className="nx-btn nx-btn-sm nx-btn-dark"
              onClick={() => navigate('/security')}
            >
              Rotate Password
            </button>
          </div>
        )}

        <div ref={stageRef}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
