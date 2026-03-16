import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Sparkles, History, User, Crown,
  LogOut, Menu, X, Leaf, ChevronRight
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import NotificationBell from '../ui/NotificationBell'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate', icon: Sparkles, label: 'Generate Plan' },
  { to: '/history', icon: History, label: 'Plan History' },
  { to: '/profile', icon: User, label: 'My Profile' },
]

// Per-route topbar — clean page titles, no greeting
function getTopbar(pathname, isPremium) {
  if (pathname === '/dashboard') return {
    title: 'Dashboard',
    sub: isPremium ? '✨ Premium Plan' : 'Free Plan',
    action: null,
  }
  if (pathname === '/generate') return {
    title: 'Generate Meal Plan',
    sub: 'Powered by AI — personalised for you',
    action: null,
  }
  if (pathname === '/history') return {
    title: 'Plan History',
    sub: 'Your saved and recent meal plans',
    action: { label: 'New Plan', to: '/generate', icon: Sparkles },
  }
  if (pathname === '/profile') return {
    title: 'My Profile',
    sub: 'Update your details for better plans',
    action: null,
  }
  if (pathname === '/upgrade') return {
    title: isPremium ? 'Your Subscription' : 'Upgrade to Premium',
    sub: isPremium ? 'Manage your plan' : 'Unlock everything NourishAI has to offer',
    action: null,
  }
  if (pathname.startsWith('/plans/')) return {
    title: 'Meal Plan',
    sub: 'View, rate, and manage your meals',
    action: null,
  }
  return { title: 'NourishAI', sub: '', action: null }
}

function SidebarContent({ user, isPremium, onClose, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #F5F5F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 36, height: 36, background: '#2D6A4F', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#28281E', lineHeight: 1.2 }}>
              Nourish<span style={{ color: '#F4845F' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#A8A89E' }}>AI Meal Planner</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '1rem 0.875rem', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#C8C8BE', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.625rem', marginBottom: '0.625rem' }}>Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: '0.875rem',
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', marginBottom: '0.25rem', transition: 'all 0.15s',
              background: isActive ? '#2D6A4F' : 'transparent',
              color: isActive ? 'white' : '#68685E',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(255,255,255,0.2)' : '#F5F5F0', flexShrink: 0 }}>
                  <Icon size={14} color={isActive ? 'white' : '#68685E'} />
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={13} color="rgba(255,255,255,0.6)" />}
              </>
            )}
          </NavLink>
        ))}

        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#C8C8BE', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.625rem', marginBottom: '0.625rem' }}>Account</p>
          <NavLink to="/upgrade" onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: '0.875rem',
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? '#F4845F' : 'transparent',
              color: isActive ? 'white' : isPremium ? '#F4845F' : '#68685E',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(255,255,255,0.2)' : isPremium ? '#fff4f0' : '#F5F5F0', flexShrink: 0 }}>
                  <Crown size={14} color={isActive ? 'white' : isPremium ? '#F4845F' : '#68685E'} />
                </div>
                {isPremium ? 'Premium ✨' : 'Upgrade'}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User + logout */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid #F5F5F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', background: '#FAFAF8', borderRadius: 12, marginBottom: '0.375rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2D6A4F, #F4845F)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
            {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#28281E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ fontSize: '0.68rem', color: isPremium ? '#F4845F' : '#A8A89E', fontWeight: 500 }}>
              {isPremium ? '✨ Premium' : 'Free Plan'}
            </div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#A8A89E', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A8A89E' }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 9, background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={13} />
          </div>
          Logout
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

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const topbar = getTopbar(location.pathname, isPremium)
  const sidebarProps = { user, isPremium, onClose: () => setSidebarOpen(false), onLogout: handleLogout }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FAFAF8', overflow: 'hidden' }}>

      {/* ── Desktop sidebar — always visible on lg+ ── */}
      <aside style={{
        width: 232, background: 'white', borderRight: '1px solid #F5F5F0',
        flexShrink: 0, display: 'none',
      }} className="desktop-sidebar">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', zIndex: 40 }}
              onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, background: 'white', zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}>
              <button onClick={() => setSidebarOpen(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', width: 30, height: 30, borderRadius: 9, background: '#F5F5F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#68685E" />
              </button>
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', background: 'white', borderBottom: '1px solid #F5F5F0', flexShrink: 0 }}>
          {/* Hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"
            style={{ width: 34, height: 34, borderRadius: 10, background: '#F5F5F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Menu size={16} color="#68685E" />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', fontWeight: 700, color: '#28281E', lineHeight: 1.2 }}>
              {topbar.title}
            </div>
            {topbar.sub && (
              <div style={{ fontSize: '0.72rem', color: '#A8A89E', marginTop: '0.1rem' }}>{topbar.sub}</div>
            )}
          </div>

          {/* Contextual action */}
          {topbar.action && (
            <NavLink to={topbar.action.to}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', borderRadius: '0.875rem',
                background: '#2D6A4F', color: 'white',
                textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
              }}>
              <topbar.action.icon size={14} />
              {topbar.action.label}
            </NavLink>
          )}

          {/* Notification bell */}
          <NotificationBell />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 1200, margin: '0 auto', padding: '1.75rem 1.5rem' }}>
            <Outlet />
          </motion.div>
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; flex-direction: column; }
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}