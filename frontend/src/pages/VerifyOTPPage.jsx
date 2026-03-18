import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Leaf, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { authAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function VerifyOTPPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(600)
  const inputs = useRef([])
  const maskedEmail = sessionStorage.getItem('otp_email') || 'your email'

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
    return () => clearInterval(t)
  }, [])

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  const submitOtp = async (code) => {
    setLoading(true); setError('')
    try {
      const res = await authAPI.verifyOTP({ otp: code })
      const { tokens, user } = res.data
      setAuth(user, tokens, false, 'free')
      toast.success(`Welcome to NourishAI, ${user.first_name}!`)
      navigate('/onboarding')
    } catch (err) {
      const t = err.response?.data?.error
      if (t === 'expired') setError('Your code has expired. Request a new one.')
      else if (t === 'invalid') setError('Incorrect code. Please try again.')
      else setError('Something went wrong. Please try again.')
      setOtp(['','','','','','']); inputs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleChange = (i, val) => {
    val = val.replace(/\D/g, '')
    const n = [...otp]; n[i] = val.slice(-1); setOtp(n); setError('')
    if (val && i < 5) inputs.current[i+1]?.focus()
    const full = n.join('')
    if (full.length === 6) setTimeout(() => submitOtp(full), 200)
  }

  const handleKeyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i-1]?.focus() }
  const handlePaste = (e) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    const n = [...otp]; p.split('').forEach((c,i) => { n[i] = c }); setOtp(n)
    if (p.length === 6) setTimeout(() => submitOtp(p), 200)
    else inputs.current[p.length]?.focus()
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authAPI.resendOTP()
      setCountdown(600); setOtp(['','','','','','']); setError('')
      toast.success('New code sent!'); inputs.current[0]?.focus()
    } catch { toast.error('Failed to resend.') }
    finally { setResending(false) }
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
          <div style={{ width: 60, height: 60, background: 'var(--sage-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Mail size={26} color="var(--fern)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.5rem', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
            We sent a 6-digit code to<br />
            <span style={{ fontWeight: 600, color: 'var(--espresso)' }}>{maskedEmail}</span>
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--linen)', padding: '2rem' }}>
          {error && (
            <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#C04040', fontFamily: 'var(--font-body)' }}>
              ⚠️ {error}
            </div>
          )}

          <label className="label" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>Enter your 6-digit code</label>

          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', marginBottom: '1.5rem' }} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input key={i} ref={el => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={1}
                value={digit} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} autoFocus={i === 0}
                style={{ width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                  border: `2px solid ${digit ? 'var(--fern)' : 'var(--linen-mid)'}`, borderRadius: 14, outline: 'none', transition: 'all 0.18s',
                  background: digit ? 'var(--sage-light)' : 'white', color: digit ? 'var(--forest)' : 'var(--espresso)', cursor: 'text' }}
                onFocus={e => { e.target.style.borderColor = 'var(--fern)'; e.target.style.boxShadow = '0 0 0 4px rgba(61,122,88,0.1)' }}
                onBlur={e => { e.target.style.borderColor = digit ? 'var(--fern)' : 'var(--linen-mid)'; e.target.style.boxShadow = 'none' }}
              />
            ))}
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ width: 24, height: 24, border: '2px solid var(--linen-mid)', borderTopColor: 'var(--fern)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--stone)', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
              Code expires in{' '}
              <span style={{ fontWeight: 700, color: countdown < 60 ? '#E05252' : 'var(--fern)' }}>{fmt(countdown)}</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
              Didn't receive it?
              <button onClick={handleResend} disabled={resending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--fern)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: resending ? 0.5 : 1, fontFamily: 'var(--font-body)' }}>
                <RefreshCw size={13} style={{ animation: resending ? 'spin 0.8s linear infinite' : 'none' }} />
                Resend code
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--stone)', fontSize: '0.875rem', marginTop: '1.5rem', fontFamily: 'var(--font-body)' }}>
          Wrong email?{' '}
          <Link to="/register" style={{ color: 'var(--fern)', fontWeight: 600, textDecoration: 'none' }}>Register again</Link>
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}