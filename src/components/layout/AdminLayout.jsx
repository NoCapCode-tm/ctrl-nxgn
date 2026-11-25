import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import logoUrl from '@/assets/logo.svg'
import compactLogoUrl from '@/assets/compact-logo.svg'
import { useAuth, useTheme, useToast } from '@/hooks/useAdminContexts'
import { adminService } from '@/services/admin.service'
import styles from './AdminLayout.module.css'

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

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [alerts, setAlerts] = useState({ lutComplianceAlerts: 0, haltedSubscriptions: 0 })

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

  const meta = ROUTE_META[location.pathname] || ROUTE_META['/overview']
  const complianceCount = alerts.lutComplianceAlerts + alerts.haltedSubscriptions

  const handleLogout = async () => {
    await logout()
    notify('Signed out of Nexgn Admin')
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.shell} data-collapsed={collapsed ? 'true' : 'false'}>
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      <aside className={styles.sidebar} data-open={mobileOpen ? 'true' : 'false'}>
        <div className={styles.sideHead}>
          <NavLink to="/overview" className={styles.brandLink}>
            {collapsed ? (
              <img src={compactLogoUrl} alt="Nexgn" style={{ width: '2rem', height: '2rem' }} />
            ) : (
              <>
                <img src={logoUrl} alt="Nexgn" className={styles.brandText} />
                <span className={styles.adminPill}>Admin</span>
              </>
            )}
          </NavLink>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className={styles.nav} aria-label="Super Admin Navigation" onClick={() => setMobileOpen(false)}>
          {!collapsed && <span className={styles.navGroupLabel}>Platform Control</span>}

          <NavLink
            to="/overview"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <LayoutDashboard size={18} />
            {!collapsed && <span>Overview</span>}
          </NavLink>

          <NavLink
            to="/vouchers"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <TicketPercent size={18} />
            {!collapsed && <span>Vouchers &amp; AppSumo</span>}
          </NavLink>

          <NavLink
            to="/workspaces"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Building2 size={18} />
            {!collapsed && <span>Workspaces</span>}
          </NavLink>

          {!collapsed && <span className={styles.navGroupLabel}>Finance &amp; Defense</span>}

          <NavLink
            to="/compliance"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <ReceiptIndianRupee size={18} />
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
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <ShieldAlert size={18} />
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
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.burger}`}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
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
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {admin?.mustChangePassword && (
          <div className={styles.bannerWarn} role="alert">
            <span>
              You are signed in with the bootstrap default password. Rotate your Super Admin
              password right away to secure <strong>admin.nexgn.cloud</strong>.
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

        <Outlet />
      </main>
    </div>
  )
}
