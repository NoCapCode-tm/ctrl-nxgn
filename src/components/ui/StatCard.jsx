import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import clsx from 'clsx'
import { prefersReducedMotion } from '@/utils/motion'
import styles from './StatCard.module.css'

gsap.registerPlugin(useGSAP)

function useNotch(innerRef, bodyRef) {
  useLayoutEffect(() => {
    const inner = innerRef.current
    const body = bodyRef.current
    if (!inner || !body || typeof ResizeObserver === 'undefined') return undefined

    const draw = () => {
      const W = inner.offsetWidth
      const H = inner.offsetHeight
      if (!W || !H) return

      const u = parseFloat(getComputedStyle(inner).fontSize) || 14
      const r = 1.15 * u
      const top = 0.42 * u
      const shelfY = 3.15 * u
      const curveW = 2.6 * u

      const minLeft = Math.max(r * 2, 4.2 * u)
      const desiredNotchW = Math.max(7.2 * u, W * 0.38)
      const notchW = Math.min(desiredNotchW, Math.max(curveW + r, W - minLeft))

      const nx = Math.max(minLeft, W - notchW)
      const cxEnd = Math.min(nx + curveW, W - r)
      const c1x = nx + (cxEnd - nx) * 0.46
      const c2x = nx + (cxEnd - nx) * 0.5

      const f = (n) => n.toFixed(2)
      body.style.clipPath =
        `path('M${f(r)} ${f(top)} ` +
        `H${f(nx)} ` +
        `C${f(c1x)} ${f(top)} ${f(c2x)} ${f(shelfY)} ${f(cxEnd)} ${f(shelfY)} ` +
        `H${f(W - r)} Q${f(W)} ${f(shelfY)} ${f(W)} ${f(shelfY + r)} ` +
        `V${f(H - r)} Q${f(W)} ${f(H)} ${f(W - r)} ${f(H)} ` +
        `H${f(r)} Q0 ${f(H)} 0 ${f(H - r)} ` +
        `V${f(top + r)} Q0 ${f(top)} ${f(r)} ${f(top)} Z')`
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [innerRef, bodyRef])
}

export default function StatCard({
  label,
  value,
  numericValue = null,
  sub = '',
  tag = '',
  tone = 'total',
  Icon,
  onClick,
  loading = false,
}) {
  const rootRef = useRef(null)
  const innerRef = useRef(null)
  const bodyRef = useRef(null)
  const numRef = useRef(null)
  const shown = useRef(0)
  const tlRef = useRef(null)
  const [active, setActive] = useState(false)

  useNotch(innerRef, bodyRef)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const t = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
        t.to('[data-fill-tab]', { clipPath: 'circle(160% at 100% 0%)', duration: 0.4, ease: 'power2.out' }, 0)
          .to('[data-fill-body]', { clipPath: 'circle(160% at 100% 0%)', duration: 0.65, ease: 'power3.inOut' }, 0.08)
          .to(
            '[data-icon]',
            {
              scale: 1.1,
              backgroundColor: '#ffffff',
              boxShadow: '0 0.5em 1em -0.45em rgba(40,30,10,0.28)',
              duration: 0.4,
              ease: 'back.out(2)',
            },
            0.14,
          )
          .fromTo(
            '[data-icon-glyph]',
            { rotate: -10 },
            { rotate: 0, duration: 0.5, ease: 'back.out(3)', immediateRender: false },
            0.14,
          )
          .to('[data-num]', { scale: 1.05, yPercent: -3, transformOrigin: '0% 100%', duration: 0.4 }, 0.16)
          .to(rootRef.current, { y: -4, duration: 0.4 }, 0)
        tlRef.current = t
      })
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  useGSAP(
    () => {
      const el = numRef.current
      if (!el || loading || typeof numericValue !== 'number') return
      if (prefersReducedMotion()) {
        el.textContent = numericValue.toLocaleString()
        shown.current = numericValue
        return
      }
      const counter = { v: shown.current }
      gsap.to(counter, {
        v: numericValue,
        duration: 0.85,
        ease: 'power2.out',
        delay: shown.current ? 0 : 0.15,
        onUpdate: () => {
          el.textContent = Math.round(counter.v).toLocaleString()
          shown.current = counter.v
        },
      })
    },
    { scope: rootRef, dependencies: [numericValue, loading] },
  )

  const handleEnter = (e) => {
    if (e.pointerType === 'touch') return
    setActive(true)
    tlRef.current?.timeScale(1).play()
  }

  const handleLeave = () => {
    setActive(false)
    tlRef.current?.timeScale(1.4).reverse()
  }

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      ref={rootRef}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(styles.card, styles[tone], onClick && styles.clickable)}
      data-active={active ? 'true' : 'false'}
      data-anim="kpi"
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <span ref={innerRef} className={styles.inner}>
        <span className={styles.back}>
          <span className={styles.fillTab} data-fill-tab />
          {tag && <span className={styles.badgeSlot}>{tag}</span>}
        </span>

        <span className={styles.shadow}>
          <span ref={bodyRef} className={styles.body}>
            <span className={styles.fillBody} data-fill-body />
            <span className={styles.icon} data-icon>
              {Icon && <Icon className={styles.glyph} data-icon-glyph aria-hidden="true" />}
            </span>
            <span className={styles.mid}>
              <span ref={numRef} className={styles.value} data-num style={{ display: 'block' }}>
                {loading
                  ? '—'
                  : typeof numericValue === 'number'
                    ? numericValue.toLocaleString()
                    : value}
              </span>
              <span className={styles.label} style={{ display: 'block' }}>
                {label}
              </span>
            </span>
            {sub && <span className={styles.sub}>{sub}</span>}
          </span>
        </span>
      </span>
    </Tag>
  )
}
