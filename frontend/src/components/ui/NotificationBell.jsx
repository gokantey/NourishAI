import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, CheckCheck } from 'lucide-react'
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
  const dropdownRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications/')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unread_count)
    } catch {
      // fail silently
    }
  }, [])

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setOpen((o) => !o)
  }

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`)
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await api.post('/notifications/read-all/')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          width: 36, height: 36, borderRadius: 11,
          background: open ? '#f0fdf4' : '#F5F5F0',
          border: open ? '1px solid #bbf7d0' : '1px solid transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        <Bell size={16} color={open ? '#2D6A4F' : '#68685E'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 8, height: 8, borderRadius: '50%',
            background: '#F4845F', border: '2px solid white',
          }} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 340, background: 'white',
              borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #F5F5F0', zIndex: 200, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem 0.75rem',
              borderBottom: '1px solid #F5F5F0',
            }}>
              <div>
                <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: '#28281E' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '0.5rem', background: '#F4845F', color: 'white',
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem',
                    borderRadius: 9999,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2D6A4F', fontSize: '0.78rem', fontWeight: 600,
                    opacity: loading ? 0.5 : 1,
                  }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔔</div>
                  <p style={{ color: '#A8A89E', fontSize: '0.875rem' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid #F5F5F0',
                      background: n.is_read ? 'white' : '#fafff8',
                      cursor: n.is_read ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!n.is_read) e.currentTarget.style.background = '#f0fdf4' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = n.is_read ? 'white' : '#fafff8' }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: n.is_read ? '#F5F5F0' : '#f0fdf4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      {n.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.85rem', fontWeight: n.is_read ? 500 : 700,
                        color: n.is_read ? '#68685E' : '#28281E',
                        marginBottom: '0.2rem',
                      }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: '0.78rem', color: '#A8A89E',
                        lineHeight: 1.5,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#C8C8BE', marginTop: '0.3rem' }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2D6A4F', flexShrink: 0, marginTop: 6 }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid #F5F5F0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#A8A89E' }}>
                  Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}