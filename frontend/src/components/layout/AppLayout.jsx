import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Sparkles, History, User, Crown, LogOut, Menu, X, Leaf } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import NotificationBell from '../ui/NotificationBell'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate',  icon: Sparkles,         label: 'Generate Plan' },
  { to: '/history',   icon: History,           label: 'Plan History' },
  { to: '/profile',   icon: User,              label: 'My Profile' },
]

function SidebarContent({ user, isPremium, onClose, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--forest)' }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.5rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={18} color="rgba(255,255,255,0.9)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Nourish<span style={{ color: 'var(--terra-mid)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              AI Meal Planner
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.875rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.625rem', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => ( // eslint-disable-line no-unused-vars
          <NavLink key={to} to={to} onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 0.75rem', borderRadius: 12,
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', marginBottom: '2px',
              transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
              background: isActive ? 'rgba(255,255,255,0.11)' : 'transparent',
              color: isActive ? 'white' : 'rgba(255,255,255,0.48)',
              fontFamily: 'var(--font-body)',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <Icon size={14} color={isActive ? 'white' : 'rgba(255,255,255,0.45)'} />
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--terra-mid)' }} />}
              </>
            )}
          </NavLink>
        ))}

        <div style={{ margin: '1rem 0 0.625rem', height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.625rem', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>Account</div>
        <NavLink to="/upgrade" onClick={onClose}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 0.75rem', borderRadius: 12,
            fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
            textDecoration: 'none', marginBottom: '2px', transition: 'all 0.18s',
            background: isActive ? 'rgba(196,82,26,0.2)' : 'transparent',
            color: isPremium ? '#F4B48A' : isActive ? '#F4B48A' : 'rgba(255,255,255,0.48)',
            fontFamily: 'var(--font-body)',
          })}>
          {({ isActive }) => (
            <>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPremium || isActive ? 'rgba(196,82,26,0.2)' : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <Crown size={14} color={isPremium ? '#F4B48A' : 'rgba(255,255,255,0.45)'} />
              </div>
              {isPremium ? 'Premium ✦' : 'Upgrade to Premium'}
            </>
          )}
        </NavLink>
      </nav>

      {/* User */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: '0.375rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--fern), var(--terracotta))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, fontFamily: 'var(--font-body)' }}>
            {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ fontSize: '0.68rem', color: isPremium ? '#F4B48A' : 'rgba(255,255,255,0.38)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
              {isPremium ? '✦ Premium' : 'Free Plan'}
            </div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', transition: 'all 0.18s', fontFamily: 'var(--font-body)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,82,82,0.12)'; e.currentTarget.style.color = '#F48A8A' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
          <LogOut size={13} /> Logout
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, subscriptionTier, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isPremium = subscriptionTier === 'premium'

  const handleLogout = () => { logout(); toast.success('See you soon!'); navigate('/login') }
  const sidebarProps = { user, isPremium, onClose: () => setSidebarOpen(false), onLogout: handleLogout }
  const activeLabel = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'NourishAI'

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--cream)', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <aside style={{ width: 240, flexShrink: 0, display: 'none' }} className="desktop-sidebar">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(28,58,43,0.55)', backdropFilter: 'blur(4px)', zIndex: 40 }}
              onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, zIndex: 50 }}>
              <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: '1rem', right: '-2.75rem', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} color="white" />
              </button>
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.5rem', height: 58, background: 'rgba(248,245,240,0.9)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--linen)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--linen)', border: '1px solid var(--linen-mid)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Menu size={15} color="var(--warm-gray)" />
          </button>
          <div style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--espresso)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>
            {activeLabel}
          </div>
          <NotificationBell />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.5rem' }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}