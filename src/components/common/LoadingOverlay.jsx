import { createPortal } from 'react-dom'
import styles from './LoadingOverlay.module.css'

export default function LoadingOverlay({ message = 'Loading…' }) {
  return createPortal(
    <div className={styles.overlay} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.backdrop} />
      <div className={styles.content}>
        <div className={styles.loader} aria-hidden="true" />
        {message ? (
          <p className={styles.message}>{message}</p>
        ) : (
          <span className={styles.srOnly}>Loading</span>
        )}
      </div>
    </div>,
    document.getElementById('app-portal') ?? document.body,
  )
}
