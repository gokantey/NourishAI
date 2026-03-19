import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Sparkles, History, User, Crown, LogOut, Menu, X, TrendingUp } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import NotificationBell from '../ui/NotificationBell'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate',  icon: Sparkles,         label: 'Generate' },
  { to: '/history',   icon: History,           label: 'History' },
  { to: '/progress',  icon: TrendingUp,        label: 'Progress' },
  { to: '/profile',   icon: User,              label: 'Profile' },
]

function SidebarInner({ user, isPremium, onClose, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--deep)', borderRight: '1px solid var(--border)' }}>

      {/* Kente top strip */}
      <div className="kente-strip" />

      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--night)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
              Nourish<span style={{ color: 'var(--lime)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              Meal Planner
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>Menu</div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: 10, marginBottom: 2,
              textDecoration: 'none', transition: 'all 0.18s var(--ease)',
              background: isActive ? 'var(--lime-glow)' : 'transparent',
              color: isActive ? 'var(--lime)' : 'var(--text-dim)',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: isActive ? 700 : 400,
              borderLeft: isActive ? '2px solid var(--lime)' : '2px solid transparent',
            })}>
            {({ isActive }) => (
              <>
                <Icon size={15} color={isActive ? 'var(--lime)' : 'rgba(240,245,240,0.4)'} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <div style={{ height: 1, background: 'var(--border)', margin: '0.75rem 0' }} />

        <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>Account</div>
        <NavLink to="/upgrade" onClick={onClose}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.75rem', borderRadius: 10, marginBottom: 2,
            textDecoration: 'none', transition: 'all 0.18s',
            background: isPremium ? 'var(--amber-glow)' : isActive ? 'var(--lime-glow)' : 'transparent',
            color: isPremium ? 'var(--amber)' : 'var(--text-dim)',
            fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: isPremium ? 700 : 400,
            borderLeft: isActive || isPremium ? `2px solid ${isPremium ? 'var(--amber)' : 'var(--lime)'}` : '2px solid transparent',
          })}>
          {() => (
            <>
              <Crown size={15} color={isPremium ? 'var(--amber)' : 'rgba(240,245,240,0.4)'} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{isPremium ? 'Premium' : 'Upgrade'}</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* User */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', background: 'var(--surface)', borderRadius: 10, marginBottom: '0.375rem', border: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--lime-dark), var(--amber))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--night)', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0, fontFamily: 'var(--font-display)' }}>
            {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ fontSize: '0.65rem', color: isPremium ? 'var(--amber)' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {isPremium ? 'Premium' : 'Free Plan'}
            </div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', transition: 'all 0.18s', fontFamily: 'var(--font-body)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F48A8A'; e.currentTarget.style.background = 'rgba(212,52,26,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, subscriptionTier, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isPremium = subscriptionTier === 'premium'
  const handleLogout = () => { logout(); toast.success('See you soon!'); navigate('/login') }
  const props = { user, isPremium, onClose: () => setOpen(false), onLogout: handleLogout }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--night)', overflow: 'hidden' }}>
      <aside style={{ width: 224, flexShrink: 0, display: 'none' }} className="desktop-sidebar">
        <SidebarInner {...props} />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 40 }}
              onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, zIndex: 50 }}>
              <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '1rem', right: '-2.75rem', width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} color="var(--text)" />
              </button>
              <SidebarInner {...props} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.5rem', height: 54, background: 'rgba(13,26,20,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setOpen(true)} className="mobile-menu-btn"
            style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Menu size={14} color="var(--text-dim)" />
          </button>
          <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
            {NAV.find(n => location.pathname.startsWith(n.to))?.label || 'NourishAI'}
          </div>
          <NotificationBell />
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}