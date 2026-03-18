import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, ArrowRight, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { authAPI } from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    try { await authAPI.forgotPassword({ email }) } catch { /* swallowed intentionally */ }
    finally { setLoading(false); setSent(true) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }} style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 38, height: 38, background: 'var(--forest)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={19} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--espresso)' }}>
              Nourish<span style={{ color: 'var(--terracotta)' }}>AI</span>
            </span>
          </div>
          <div style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>🔑</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.25rem', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
            Forgot your password?
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--linen)', padding: '2rem' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ width: 60, height: 60, background: 'var(--sage-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle size={28} color="var(--fern)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.75rem', color: 'var(--espresso)' }}>Check your email</h3>
              <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
                If an account exists for that email, you'll receive a reset link shortly. It expires in 24 hours.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'flex', justifyContent: 'center' }}>Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className={`input${error ? ' input-error' : ''}`} placeholder="kofi@gmail.com" value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }} autoFocus />
                {error && <p className="error-text">{error}</p>}
              </div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading
                  ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  : <><ArrowRight size={17} /> Send Reset Link</>}
              </motion.button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--stone)', fontSize: '0.875rem', marginTop: '1.5rem', fontFamily: 'var(--font-body)' }}>
          Remembered it?{' '}
          <Link to="/login" style={{ color: 'var(--fern)', fontWeight: 600, textDecoration: 'none' }}>Back to Login</Link>
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}