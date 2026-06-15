import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import GoogleAuthButton from '../components/ui/GoogleAuthButton'
import toast from 'react-hot-toast'

const STATS = [['7', 'Day Plans'], ['21', 'Meals/Week'], ['16', 'Regions']]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Ping backend in background to warm it up on cold starts
    authAPI.ping().catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reason = params.get('reason')
    if (reason === 'account_suspended') setError('suspended')
    else if (reason === 'session_expired') setError('session_expired')
    else if (reason === 'account_deleted') setError('account_deleted')
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Please enter your username and password.'); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.login(form)
      const { tokens, user, onboarding_complete, subscription_tier } = res.data
      setAuth(user, tokens, onboarding_complete, subscription_tier, res.data.has_password ?? true)
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate(onboarding_complete ? '/dashboard' : '/onboarding')
    } catch (err) {
      const errorCode = err.response?.data?.error_code
      if (errorCode === 'account_suspended') {
        setError('suspended')
      } else {
        setError(err.response?.data?.error || 'Invalid username or password.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--night)' }}>

      {/* Left panel */}
      <div className="auth-left-panel" style={{ width: '48%', background: 'var(--deep)', display: 'none', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem 3.5rem', position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>

        {/* Kente bottom border */}
        <div className="kente-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
        <div className="kente-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* Background pattern — subtle adinkra */}
        {['✦', '◈', '◉', '✧', '⊕', '◇'].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: '5rem', opacity: 0.03, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', color: 'var(--lime)',
            top: `${[10, 25, 45, 60, 75, 88][i]}%`, left: `${[10, 65, 20, 75, 5, 55][i]}%`
          }}>
            {s}
          </div>
        ))}

        {/* Glowing circle accent */}
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(200,241,53,0.04)', top: -100, right: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,166,35,0.04)', bottom: 100, left: -60, pointerEvents: 'none' }} />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--night)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
            Nourish<span style={{ color: 'var(--lime)' }}>AI</span>
          </span>
        </motion.div>

        {/* Main copy */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ position: 'relative' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 2.625rem)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: '1.25rem' }}>
            Eat well.<br />Live better.<br /><span style={{ color: 'var(--lime)' }}>Stay Ghanaian.</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: 320, fontFamily: 'var(--font-body)' }}>
            AI-powered meal plans built around your body, your health goals, and the richness of Ghanaian food culture.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ display: 'flex', gap: '2.5rem', position: 'relative' }}>
          {STATS.map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--lime)', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, fontFamily: 'var(--font-body)', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--surface)' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--night)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
              Nourish<span style={{ color: 'var(--lime)' }}>AI</span>
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
            Sign in to your NourishAI account
          </p>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: (error === 'suspended' || error === 'session_expired') ? 'rgba(245,166,35,0.1)' : error === 'account_deleted' ? 'rgba(52,211,153,0.1)' : 'rgba(212,52,26,0.1)', border: `1px solid ${(error === 'suspended' || error === 'session_expired') ? 'rgba(245,166,35,0.35)' : error === 'account_deleted' ? 'rgba(52,211,153,0.35)' : 'rgba(212,52,26,0.25)'}`, borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>
                {error === 'account_deleted' ? (
                  <>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34D399', marginBottom: '0.2rem' }}>Account Deleted</div>
                    <div style={{ fontSize: '0.82rem', color: '#34D399', opacity: 0.85, lineHeight: 1.5 }}>
                      Your account and all associated data have been permanently deleted.
                    </div>
                  </>
                ) : error === 'suspended' ? (
                  <>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5A623', marginBottom: '0.2rem' }}>Account Suspended</div>
                    <div style={{ fontSize: '0.82rem', color: '#F5A623', opacity: 0.85, lineHeight: 1.5 }}>
                      Your account has been suspended. Please contact us at{' '}
                      <a href="mailto:team.nourishai@gmail.com" style={{ color: '#F5A623', textDecoration: 'underline' }}>team.nourishai@gmail.com</a>{' '}
                      if you believe this is a mistake.
                    </div>
                  </>
                ) : error === 'session_expired' ? (
                  <>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F5A623', marginBottom: '0.2rem' }}>Session Ended</div>
                    <div style={{ fontSize: '0.82rem', color: '#F5A623', opacity: 0.85, lineHeight: 1.5 }}>
                      Your session has ended. Please sign in again to continue.
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.875rem', color: '#FF6B6B' }}>{error}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google sign-in — must be outside <form> to avoid nested form issue with GSI */}
          <GoogleAuthButton label="Sign in with Google" onError={msg => setError(msg)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label className="label">Username</label>
              <input type="text" className="input" placeholder="Your username" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="input" style={{ paddingRight: '3rem' }}
                  placeholder="Your password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--surface3)', padding: 0, zIndex: 2, mixBlendMode: 'difference' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                Forgot password?
              </Link>
            </div>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.25rem' }}>
              {loading
                ? <span style={{ width: 17, height: 17, border: '2px solid rgba(13,26,20,0.3)', borderTopColor: 'var(--night)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <><ArrowRight size={16} /> Sign In</>}
            </motion.button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--lime)', fontWeight: 600, textDecoration: 'none' }}>Create one here</Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        input[type='password']::-ms-reveal,
        input[type='password']::-webkit-credentials-auto-fill-button { display: none !important; }
        input::-webkit-strong-password-auto-fill-button { display: none !important; }
        @media (min-width: 1024px) { .auth-left-panel { display: flex !important; } .auth-mobile-logo { display: none !important; } }
      `}</style>
    </div>
  )
}