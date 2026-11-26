import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ReceiptIndianRupee, ShieldCheck, TicketPercent } from 'lucide-react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { motion, prefersReducedMotion } from '@/utils/motion'
import styles from './AuthShowcase.module.css'

gsap.registerPlugin(useGSAP)

const SLIDES = [
  {
    Icon: TicketPercent,
    title: 'AppSumo & Vouchers',
    lines: ['Generate 10k+ batch codes', 'and tier stacking in seconds'],
  },
  {
    Icon: ReceiptIndianRupee,
    title: 'GST & Tax Compliance',
    lines: ['Verified CGST, IGST & LUT', 'GSTR-1 ledgers on demand'],
  },
  {
    Icon: ShieldCheck,
    title: 'Isolated Command Plane',
    lines: ['Platform telemetry, quotas', 'and abuse defense in one place'],
  },
]

const AUTOPLAY_MS = 6500

export default function AuthShowcase() {
  const root = useRef(null)
  const indexRef = useRef(0)
  const dirRef = useRef(1)
  const busy = useRef(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useGSAP(
    () => {
      if (motion.first || prefersReducedMotion()) return
      gsap.fromTo(
        '[data-anim="line"]',
        { yPercent: 115 },
        { yPercent: 0, duration: 1, stagger: 0.12, ease: 'expo.out', delay: 0.3 },
      )
      gsap.fromTo(
        '[data-anim="glass"], [data-anim="fade"]',
        { y: 14, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.5,
          clearProps: 'transform',
        },
      )
    },
    { scope: root },
  )

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        busy.current = false
        return
      }
      const dir = dirRef.current
      gsap.fromTo(
        '[data-slide-part]',
        { y: 18 * dir, autoAlpha: 0, filter: 'blur(6px)' },
        {
          y: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          delay: motion.first ? 1.3 : 0,
          clearProps: 'filter',
          onComplete: () => {
            busy.current = false
          },
        },
      )
    },
    { scope: root, dependencies: [index] },
  )

  const go = useCallback((dir) => {
    if (busy.current) return
    const next = (indexRef.current + dir + SLIDES.length) % SLIDES.length
    dirRef.current = dir

    if (prefersReducedMotion() || !root.current) {
      indexRef.current = next
      setIndex(next)
      return
    }

    busy.current = true
    gsap.context(() => {
      gsap.to('[data-slide-part]', {
        y: -14 * dir,
        autoAlpha: 0,
        filter: 'blur(6px)',
        duration: 0.35,
        stagger: 0.04,
        ease: 'power2.in',
        onComplete: () => {
          indexRef.current = next
          setIndex(next)
        },
      })
    }, root)
  }, [])

  useEffect(() => {
    if (paused) return undefined
    const id = window.setInterval(() => {
      if (!document.hidden) go(1)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [go, paused])

  const { Icon, title, lines } = SLIDES[index]

  return (
    <aside className={styles.showcase} ref={root}>
      <div className={styles.media} data-anim="media" aria-hidden="true">
        <img
          className={styles.photo}
          data-anim="kenburns"
          src="/brand/auth-bg.webp"
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable="false"
        />
      </div>
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.panel}>
        <svg className={styles.clipDefs} width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="nexgn-glass-clip" clipPathUnits="objectBoundingBox">
              <path d="M0.0458,0 H0.953 Q1,0 0.9976,0.035 L0.9334,0.965 Q0.931,1 0.885,1 H0.0458 Q0,1 0,0.965 V0.035 Q0,0 0.0458,0 Z" />
            </clipPath>
          </defs>
        </svg>
        <div className={styles.glassBg} data-anim="glass" aria-hidden="true" />

        <a
          href="https://sign.nexgn.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
          data-anim="fade"
        >
          Nexgn Sign App
        </a>

        <div className={styles.glass}>
          <div className={styles.copy}>
            <h2 className={styles.headline}>
              <span className={styles.line}>
                <span className={styles.lineInner} data-anim="line">
                  Platform control.
                </span>
              </span>
              <span className={styles.line}>
                <span className={`${styles.lineInner} ${styles.accent}`} data-anim="line">
                  Scale guaranteed.
                </span>
              </span>
            </h2>
            <p className={styles.lead} data-anim="fade">
              Manage redeem campaigns, workspace quotas, and GST compliance across Nexgn from one
              isolated operator console.
            </p>
          </div>

          <div
            className={styles.slider}
            role="group"
            aria-roledescription="carousel"
            aria-label="Highlights"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className={styles.slide}>
              <div className={styles.slideHead} data-slide-part>
                <h3 className={styles.slideTitle}>{title}</h3>
                <Icon className={styles.slideIcon} strokeWidth={1.1} aria-hidden="true" />
              </div>
              <p className={styles.slideText} data-slide-part>
                {lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </p>
            </div>

            <div className={styles.controls} data-anim="fade">
              <button
                type="button"
                className={styles.arrow}
                onClick={() => go(-1)}
                aria-label="Previous slide"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => go(1)}
                aria-label="Next slide"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
