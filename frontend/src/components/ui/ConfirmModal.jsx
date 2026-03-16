import { AnimatePresence, motion } from 'framer-motion'

/**
 * ConfirmModal — replaces all browser confirm() dialogs
 *
 * Props:
 *   open        — boolean
 *   onClose     — fn()
 *   onConfirm   — fn()
 *   title       — string
 *   message     — string
 *   confirmText — string (default "Confirm")
 *   danger      — boolean (red confirm button)
 *   loading     — boolean
 *   icon        — emoji string (optional)
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  danger = false,
  loading = false,
  icon,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              padding: '2rem',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            {icon && (
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: danger ? '#fef2f2' : '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', margin: '0 auto 1.25rem',
              }}>
                {icon}
              </div>
            )}

            <h3 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.25rem', fontWeight: 700,
              color: '#28281E', marginBottom: '0.625rem',
              textAlign: icon ? 'center' : 'left',
            }}>
              {title}
            </h3>

            <p style={{
              color: '#88887E', fontSize: '0.9rem', lineHeight: 1.6,
              marginBottom: '1.75rem',
              textAlign: icon ? 'center' : 'left',
            }}>
              {message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 14,
                  border: '1px solid #E0E0D8', background: 'white',
                  color: '#68685E', fontWeight: 500, fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F0' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 14,
                  border: 'none',
                  background: danger ? '#ef4444' : '#2D6A4F',
                  color: 'white', fontWeight: 600, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.7' : '1' }}
              >
                {loading ? (
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }} />
                ) : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}