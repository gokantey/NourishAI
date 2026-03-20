import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import api from '../../api/client'

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 64, right: 16 })
  const btnRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications/')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unread_count)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen(o => !o)
  }

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await api.post('/notifications/read-all/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          {/* Fullscreen backdrop — renders directly on document.body */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed',
              top: panelPos.top,
              right: panelPos.right,
              width: Math.min(340, window.innerWidth - 16),
              background: 'var(--deep)',
              borderRadius: 18,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              border: '1px solid var(--border2)',
              zIndex: 99999,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{ background: 'var(--lime)', color: 'var(--night)', fontSize: '0.62rem', fontWeight: 800, padding: '1px 7px', borderRadius: 100, fontFamily: 'var(--font-body)' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lime)', fontSize: '0.75rem', fontWeight: 600, opacity: loading ? 0.5 : 1, fontFamily: 'var(--font-body)' }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                  <Bell size={28} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      background: n.is_read ? 'transparent' : 'rgba(200,241,53,0.04)',
                      cursor: n.is_read ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(200,241,53,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(200,241,53,0.04)' }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: n.is_read ? 'var(--surface2)' : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: n.is_read ? 500 : 700, color: n.is_read ? 'var(--text-dim)' : 'var(--text)', marginBottom: '0.2rem', fontFamily: 'var(--font-body)' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: 'var(--font-body)' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', opacity: 0.6, fontFamily: 'var(--font-body)' }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0, marginTop: 7 }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button ref={btnRef} onClick={handleOpen}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: open ? 'var(--lime-glow)' : 'var(--surface2)',
          border: `1px solid ${open ? 'rgba(200,241,53,0.3)' : 'var(--border)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', transition: 'all 0.15s', flexShrink: 0,
        }}>
        <Bell size={15} color={open ? 'var(--lime)' : 'var(--text-muted)'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            minWidth: 16, height: 16, borderRadius: 8,
            background: 'var(--lime)', color: 'var(--night)',
            fontSize: '0.6rem', fontWeight: 800, fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render panel outside the component tree via portal */}
      {createPortal(panel, document.body)}
    </>
  )
}