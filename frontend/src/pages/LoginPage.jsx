import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, LogIn } from 'lucide-react'
import { authAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login(form)
      const { tokens, user, onboarding_complete, subscription_tier } = res.data
      setAuth(user, tokens, onboarding_complete, subscription_tier)
      toast.success(`Welcome back, ${user.first_name}! 👋`)
      navigate(onboarding_complete ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 text-white relative overflow-hidden w-1/2" style={{ background: 'linear-gradient(135deg, #2D6A4F, #1a3d2e)' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={24} className="text-white" />
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700 }}>
              Nourish<span style={{ color: '#F4845F' }}>AI</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Eat well.<br />Live better.<br />
            <span style={{ color: '#F4845F' }}>Stay Ghanaian.</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', lineHeight: 1.7, maxWidth: 360, marginBottom: '2.5rem' }}>
            AI-powered meal plans built around your body, your health goals, and your culture.
          </p>

          <div style={{ display: 'flex', gap: '2rem' }}>
            {[['7', 'Days'], ['21', 'Meals'], ['100%', 'Yours']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#F4845F' }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 80, right: 32, fontSize: '3rem', opacity: 0.2 }}>🥗</div>
        <div style={{ position: 'absolute', top: 80, right: 80, fontSize: '2.5rem', opacity: 0.2 }}>🍲</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-warm-50">
        <div className="w-full" style={{ maxWidth: 420 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div style={{ width: 36, height: 36, background: '#2D6A4F', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={18} className="text-white" />
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700 }}>
              Nourish<span style={{ color: '#F4845F' }}>AI</span>
            </span>
          </div>

          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Welcome back</h2>
          <p className="text-warm-500" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>Sign in to your NourishAI account</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Your username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: '3rem' }}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A8A89E', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#2D6A4F', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogIn size={18} /> Sign In
                </span>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #EEEEE8', textAlign: 'center' }}>
            <p style={{ color: '#A8A89E', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}