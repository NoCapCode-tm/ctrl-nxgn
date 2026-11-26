import { useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

export default function Modal({ open, onClose, title, children, footer, width = '44rem' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.frame}>
        <div className={styles.panel} style={{ width: `min(${width}, 100%)` }}>
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={17} />
            </button>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </div>
  )
}
