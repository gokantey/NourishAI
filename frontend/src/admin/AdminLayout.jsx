import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Cpu, CreditCard, Bell, Trophy, Settings, LogOut, Menu, X, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/admin-portal/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin-portal/users',          icon: Users,           label: 'Users' },
  { to: '/admin-portal/plans',          icon: FileText,        label: 'Plans' },
  { to: '/admin-portal/ai',             icon: Cpu,             label: 'AI Monitor' },
  { to: '/admin-portal/payments',       icon: CreditCard,      label: 'Payments' },
  { to: '/admin-portal/notifications',  icon: Bell,            label: 'Notifications' },
  { to: '/admin-portal/achievements',   icon: Trophy,          label: 'Achievements' },
  { to: '/admin-portal/system',         icon: Settings,        label: 'System' },
]

const AMBER = '#F5A623'
const AMBER_GLOW = 'rgba(245,166,35,0.15)'

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    navigate('/admin-portal/login')
  }

  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0A1410', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Amber top strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${AMBER}, #D4841A, ${AMBER})` }} />

      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A1410" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#F0F5F0' }}>
              Nourish<span style={{ color: AMBER }}>AI</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(240,245,240,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
              Admin Portal
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: 10, marginBottom: 2,
              textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? AMBER_GLOW : 'transparent',
              color: isActive ? AMBER : 'rgba(240,245,240,0.45)',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              fontWeight: isActive ? 700 : 400,
              borderLeft: `2px solid ${isActive ? AMBER : 'transparent'}`,
            })}>
            {({ isActive }) => (
              <>
                <Icon size={14} color={isActive ? AMBER : 'rgba(240,245,240,0.35)'} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={12} color={AMBER} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', marginBottom: '0.375rem' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${AMBER}, #D4841A)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A1410', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0, fontFamily: 'var(--font-display)' }}>
            {adminUser.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F0F5F0', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminUser.name || adminUser.username}
            </div>
            <div style={{ fontSize: '0.65rem', color: AMBER, fontFamily: 'var(--font-body)', fontWeight: 500 }}>Admin</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(240,245,240,0.3)', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F48A8A'; e.currentTarget.style.background = 'rgba(212,52,26,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,245,240,0.3)'; e.currentTarget.style.background = 'none' }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  )

  const pageLabel = NAV.find(n => location.pathname.startsWith(n.to))?.label || 'Admin'

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0D1A14', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      {/* Desktop sidebar */}
      <aside style={{ width: 220, flexShrink: 0, display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40 }} onClick={() => setOpen(false)} />
          <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, zIndex: 50 }}>
            <Sidebar />
          </aside>
        </>
      )}

      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.5rem', height: 52, background: 'rgba(10,20,16,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => setOpen(true)} className="mobile-menu-btn"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Menu size={14} color="rgba(240,245,240,0.6)" />
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: '#F0F5F0' }}>
            {pageLabel}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}