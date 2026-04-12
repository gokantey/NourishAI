import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, UserPlus, Shield } from 'lucide-react'
import { authAPI } from '../api/client'
import GoogleAuthButton from '../components/ui/GoogleAuthButton'
import toast from 'react-hot-toast'

// ── Defined outside component so it never gets recreated on render ──
function FormField({ label, name, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className={`input${error ? ' input-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={name}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '', password2: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    const errs = {}
    if (!form.first_name) errs.first_name = 'Required'
    if (!form.last_name) errs.last_name = 'Required'
    if (!form.username) errs.username = 'Required'
    if (!form.email) errs.email = 'Required'
    if (!form.password) errs.password = 'Required'
    else if (form.password.length < 8) errs.password = 'At least 8 characters'
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await authAPI.register(form)
      sessionStorage.setItem('otp_email', res.data.masked_email)
      toast.success('Verification code sent to your email!')
      navigate('/verify-otp')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setErrors(data)
      else toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--night)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 36, height: 36, background: 'var(--lime)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={16} color="var(--night)" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
              Nourish<span style={{ color: 'var(--lime)' }}>AI</span>
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text)' }}>
            Create your account
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Your personalised Ghanaian meal planner awaits 🌿
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 20, padding: "1.5rem" }}>
          {/* Non-field errors */}
          {errors.non_field_errors && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#ef4444' }}>
              {errors.non_field_errors}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Google sign-up */}
            <div style={{ marginBottom: '1.25rem' }}>
              <GoogleAuthButton label="Sign up with Google" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.125rem' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>or create account with email</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <FormField
                label="First Name" name="first_name" placeholder="Kofi"
                value={form.first_name} onChange={setField('first_name')} error={errors.first_name}
              />
              <FormField
                label="Last Name" name="last_name" placeholder="Mensah"
                value={form.last_name} onChange={setField('last_name')} error={errors.last_name}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <FormField
                label="Username" name="username" placeholder="kofi_mensah"
                value={form.username} onChange={setField('username')} error={errors.username}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <FormField
                label="Email Address" name="email" type="email" placeholder="kofi@gmail.com"
                value={form.email} onChange={setField('email')} error={errors.email}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input${errors.password ? ' input-error' : ''}`}
                  style={{ paddingRight: '3rem' }}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={setField('password')}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--surface3)', padding: 0, zIndex: 2, mixBlendMode: 'difference' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <FormField
                label="Confirm Password" name="password2" type="password" placeholder="Repeat your password"
                value={form.password2} onChange={setField('password2')} error={errors.password2}
              />
            </div>

            {/* Info note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--lime-glow)', border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: '1.5rem' }}>
              <Shield size={16} style={{ color: '#2D6A4F', marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                We'll send a 6-digit verification code to your email to confirm your account.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  Sending code...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} /> Send Verification Code
                </span>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}