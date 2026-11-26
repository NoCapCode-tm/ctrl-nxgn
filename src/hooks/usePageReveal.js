import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/utils/motion'

gsap.registerPlugin(useGSAP)

export function usePageReveal(scopeRef, triggerKey) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const items = scopeRef.current?.querySelectorAll('[data-anim="kpi"], [data-anim="card"]')
      if (!items?.length) return

      gsap.fromTo(
        items,
        { y: 18, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.52,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        },
      )
    },
    { scope: scopeRef, dependencies: [triggerKey] },
  )
}
