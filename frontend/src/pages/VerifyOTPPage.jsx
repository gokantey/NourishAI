import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Leaf, RefreshCw } from 'lucide-react'
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
  const [countdown, setCountdown] = useState(120)
  const inputs = useRef([])
  const maskedEmail = sessionStorage.getItem('otp_email') || 'your email'

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const submitOtp = async (code) => {
    setLoading(true)
    setError('')
    const email = sessionStorage.getItem('reg_email')
    try {
      const res = await authAPI.verifyOTP({ email, otp: code })
      const { tokens, user } = res.data
      setAuth(user, tokens, false, 'free')
      sessionStorage.removeItem('reg_email')
      sessionStorage.removeItem('otp_email')
      toast.success(`Welcome to NourishAI, ${user.first_name}! 🎉`)
      navigate('/onboarding')
    } catch (err) {
      const errType = err.response?.data?.error
      if (errType === 'expired') setError('Your code has expired. Please request a new one.')
      else if (errType === 'invalid') setError('Incorrect code. Please try again.')
      else setError('Something went wrong. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (i, val) => {
    val = val.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[i] = val.slice(-1)
    setOtp(newOtp)
    setError('')
    if (val && i < 5) inputs.current[i + 1]?.focus()
    const full = newOtp.join('')
    if (full.length === 6) setTimeout(() => submitOtp(full), 200)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((c, i) => { newOtp[i] = c })
    setOtp(newOtp)
    if (pasted.length === 6) setTimeout(() => submitOtp(pasted), 200)
    else inputs.current[pasted.length]?.focus()
  }

  const handleResend = async () => {
    setResending(true)
    const email = sessionStorage.getItem('reg_email')
    try {
      const res = await authAPI.resendOTP({ email })
      if (res.data && res.data.dev_otp) {
        sessionStorage.setItem('dev_otp', res.data.dev_otp)
        toast.success('New verification code generated (using dev_otp fallback)!')
      } else {
        sessionStorage.removeItem('dev_otp')
        toast.success('New verification code sent!')
      }
      setCountdown(120)
      setOtp(['', '', '', '', '', ''])
      setError('')
      inputs.current[0]?.focus()
    } catch {
      toast.error('Failed to resend code.')
    } finally {
      setResending(false)
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

          <div style={{ width: 64, height: 64, background: 'var(--lime-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Mail size={28} style={{ color: 'var(--lime)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
            Check your email
          </h1>
          <p className="text-warm-500" style={{ fontSize: '0.9rem' }}>
            We sent a 6-digit code to<br />
            <span style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{maskedEmail}</span>
          </p>
          {sessionStorage.getItem('dev_otp') && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid var(--amber)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--amber)' }}>
              🔑 Dev OTP (Email failed to send): <strong>{sessionStorage.getItem('dev_otp')}</strong>
            </div>
          )}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 20, padding: "1.5rem" }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}

          <label className="label" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
            Enter your 6-digit code
          </label>

          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', marginBottom: '1.5rem' }} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                style={{
                  width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                  border: `2px solid ${digit ? '#2D6A4F' : '#E0E0D8'}`,
                  borderRadius: 12, outline: 'none', transition: 'all 0.2s',
                  background: digit ? '#f0fdf4' : 'white',
                  color: digit ? '#2D6A4F' : '#28281E',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = digit ? '#2D6A4F' : '#E0E0D8'; e.target.style.boxShadow = 'none' }}
              />
            ))}
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ width: 24, height: 24, border: '2px solid #bbf7d0', borderTopColor: '#2D6A4F', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Code expires in{' '}
              <span style={{ fontWeight: 600, color: countdown < 60 ? '#ef4444' : '#2D6A4F' }}>
                {formatTime(countdown)}
              </span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Didn't receive it?
              <button onClick={handleResend} disabled={resending}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--lime)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: resending ? 0.5 : 1 }}>
                <RefreshCw size={13} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                Resend code
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Wrong email?{' '}
          <Link to="/register" style={{ color: 'var(--lime)', fontWeight: 500, textDecoration: 'none' }}>
            Register again
          </Link>
        </p>
      </div>
    </div>
  )
}