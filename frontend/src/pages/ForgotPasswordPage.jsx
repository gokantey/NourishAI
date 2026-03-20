import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Send, CheckCircle } from 'lucide-react'
import { authAPI } from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword({ email })
    } catch {
      // Intentionally swallow — always show success to avoid email enumeration
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--night)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, background: 'var(--lime)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
              Nourish<span style={{ color: 'var(--amber)' }}>AI</span>
            </span>
          </div>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔑</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text)' }}>
            Forgot your password?
          </h1>
          <p className="text-warm-500" style={{ fontSize: '0.9rem' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 20, padding: "1.5rem" }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 64, height: 64, background: 'var(--lime-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={32} style={{ color: 'var(--lime)' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Check your email
              </h3>
              <p className="text-warm-500" style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                If an account exists for that email, you'll receive a password reset link shortly. The link expires in 24 hours.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className={`input${error ? ' input-error' : ''}`}
                  placeholder="kofi@gmail.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  autoFocus
                />
                {error && <p className="error-text">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    Sending...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={18} /> Send Reset Link
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Remembered it?{' '}
          <Link to="/login" style={{ color: 'var(--lime)', fontWeight: 500, textDecoration: 'none' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  )
}