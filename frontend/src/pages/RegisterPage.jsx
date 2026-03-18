import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, ArrowRight, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { authAPI } from '../api/client'
import toast from 'react-hot-toast'

function Field({ label, name, type='text', placeholder, value, onChange, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children || <input type={type} className={`input${error ? ' input-error' : ''}`} placeholder={placeholder} value={value} onChange={onChange} autoComplete={name} />}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', password2: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(s => ({ ...s, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors({})
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
      toast.success('Verification code sent!')
      navigate('/verify-otp')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setErrors(data)
      else toast.error('Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }} style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 38, height: 38, background: 'var(--forest)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={19} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--espresso)' }}>
              Nourish<span style={{ color: 'var(--terracotta)' }}>AI</span>
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.25rem', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>Your personalised Ghanaian meal planner awaits</p>
        </div>

        <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--linen)', padding: '2rem' }}>
          {errors.non_field_errors && (
            <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#C04040', fontFamily: 'var(--font-body)' }}>
              {errors.non_field_errors}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="First Name" name="first_name" placeholder="Kofi" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
              <Field label="Last Name" name="last_name" placeholder="Mensah" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
            </div>
            <Field label="Username" name="username" placeholder="kofi_mensah" value={form.username} onChange={set('username')} error={errors.username} />
            <Field label="Email Address" name="email" type="email" placeholder="kofi@gmail.com" value={form.email} onChange={set('email')} error={errors.email} />
            <Field label="Password" name="password" error={errors.password}>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className={`input${errors.password ? ' input-error' : ''}`} style={{ paddingRight: '3rem' }} placeholder="At least 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" name="password2" type="password" placeholder="Repeat your password" value={form.password2} onChange={set('password2')} error={errors.password2} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--sage-light)', border: '1px solid rgba(61,122,88,0.2)', borderRadius: 12 }}>
              <Shield size={15} color="var(--fern)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--forest)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                We'll send a 6-digit verification code to your email to confirm your account.
              </p>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              {loading
                ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <><ArrowRight size={17} /> Send Verification Code</>}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--stone)', fontSize: '0.875rem', marginTop: '1.5rem', fontFamily: 'var(--font-body)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--fern)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}