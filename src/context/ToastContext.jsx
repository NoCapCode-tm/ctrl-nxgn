import { useCallback, useState } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { ToastContext } from '@/hooks/useAdminContexts'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev.slice(-3), { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        style={{
          fontSize: 'min(56px, max(14px, calc(100vw / 137.14)))',
          position: 'fixed',
          bottom: '1.25em',
          right: '1.25em',
          zIndex: 90,
          display: 'grid',
          gap: '0.55em',
          maxWidth: '24em',
          width: 'calc(100vw - 2.5em)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65em',
              padding: '0.85em 1.05em',
              borderRadius: '0.85em',
              background: t.type === 'error' ? '#fef2f2' : '#101828',
              color: t.type === 'error' ? '#991b1b' : '#ffffff',
              border:
                t.type === 'error'
                  ? '1px solid rgba(220, 38, 38, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 1em 2.3em -0.6em rgba(16, 24, 40, 0.35)',
              fontSize: '0.9em',
              fontWeight: 500,
              transition: 'transform 0.2s ease, opacity 0.2s ease',
            }}
          >
            {t.type === 'error' ? (
              <CircleAlert size={18} style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#34d399' }} />
            )}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              style={{
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                padding: '0.15em',
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
