import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { adminAPI } from '../adminApi'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await adminAPI.login(form)
      localStorage.setItem('admin_access_token', res.data.access)
      localStorage.setItem('admin_refresh_token', res.data.refresh)
      localStorage.setItem('admin_user', JSON.stringify(res.data.user))
      navigate('/admin-portal/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1410', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-body)' }}>
      {/* Amber top strip */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #F5A623, #D4841A, #F5A623)' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A1410" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: '#F0F5F0', marginBottom: '0.25rem' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(240,245,240,0.4)' }}>NourishAI · Staff access only</p>
        </div>

        {/* Card */}
        <div style={{ background: '#162019', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.75rem' }}>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(212,52,26,0.12)', border: '1px solid rgba(212,52,26,0.25)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#FF6B6B' }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,245,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>
                Username
              </label>
              <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Admin username" autoFocus
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#1C2B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#F0F5F0', fontSize: '0.9375rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,245,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Password" style={{ width: '100%', padding: '0.75rem 3rem 0.75rem 1rem', background: '#1C2B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#F0F5F0', fontSize: '0.9375rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,245,240,0.35)', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: 100, background: '#F5A623', color: '#0A1410', border: 'none', fontWeight: 700, fontSize: '0.9375rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
              {loading
                ? <span style={{ width: 17, height: 17, border: '2px solid rgba(10,20,16,0.3)', borderTopColor: '#0A1410', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <><ArrowRight size={16} /> Sign In to Admin</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(240,245,240,0.2)', marginTop: '1.5rem' }}>
          NourishAI Admin Portal · Restricted access
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}