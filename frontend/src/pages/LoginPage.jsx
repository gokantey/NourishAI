import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { authAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const STATS = [['7', 'Day Plans'], ['21', 'Meals/Week'], ['16', 'Regions']]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Please enter your username and password.'); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.login(form)
      const { tokens, user, onboarding_complete, subscription_tier } = res.data
      setAuth(user, tokens, onboarding_complete, subscription_tier)
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate(onboarding_complete ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--cream)' }}>
      {/* Left panel */}
      <div style={{ width: '48%', background: 'var(--forest)', display: 'none', flexDirection: 'column', justifyContent: 'center', padding: '4rem', position: 'relative', overflow: 'hidden' }} className="auth-left-panel">
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(196,82,26,0.1)' }} />
        <div style={{ position: 'absolute', top: '30%', right: '10%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '3rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} color="rgba(255,255,255,0.9)" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 500, color: 'white', letterSpacing: '-0.02em' }}>
              Nourish<span style={{ color: 'var(--terra-mid)' }}>AI</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.15, color: 'white', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Eat well.<br />Live better.<br /><span style={{ color: 'var(--terra-mid)' }}>Stay Ghanaian.</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 340, marginBottom: '3rem' }}>
            AI-powered meal plans built around your body, your health goals, and your culture.
          </p>

          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {STATS.map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 400, color: 'var(--terra-mid)', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }} style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }} className="auth-mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--espresso)' }}>
              Nourish<span style={{ color: 'var(--terracotta)' }}>AI</span>
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.25rem', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
            Sign in to your NourishAI account
          </p>

          {error && (
            <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#C04040', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label className="label">Username</label>
              <input type="text" className="input" placeholder="Your username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoFocus />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="input" style={{ paddingRight: '3rem' }} placeholder="Your password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--fern)', textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                Forgot password?
              </Link>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
              {loading ? (
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              ) : (
                <><ArrowRight size={17} /> Sign In</>
              )}
            </motion.button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--linen)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
            <p style={{ color: 'var(--stone)', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--fern)', fontWeight: 600, textDecoration: 'none' }}>Create one here</Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) { .auth-left-panel { display: flex !important; } }
      `}</style>
    </div>
  )
}