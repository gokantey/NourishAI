import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Leaf, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { authAPI } from '../api/client'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { uid, token } = useParams()
  const [form, setForm] = useState({ new_password: '', new_password2: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (form.new_password.length < 8) errs.new_password = 'At least 8 characters'
    if (form.new_password !== form.new_password2) errs.new_password2 = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await authAPI.resetPassword({ uid, token, ...form })
      setDone(true)
    } catch (err) {
      const data = err.response?.data
      if (data?.error) toast.error(data.error)
      else setErrors(data || {})
    } finally {
      setLoading(false)
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
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text)' }}>
            Set a new password
          </h1>
          <p className="text-warm-500" style={{ fontSize: '0.9rem' }}>Choose a strong password for your account.</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 20, padding: "1.5rem" }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 64, height: 64, background: 'var(--lime-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={32} style={{ color: 'var(--lime)' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Password reset!</h3>
              <p className="text-warm-500" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Your password has been updated successfully.</p>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                Login Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`input${errors.new_password ? ' input-error' : ''}`}
                    style={{ paddingRight: '3rem' }}
                    placeholder="At least 8 characters"
                    value={form.new_password}
                    onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.new_password && <p className="error-text">{errors.new_password}</p>}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className={`input${errors.new_password2 ? ' input-error' : ''}`}
                  placeholder="Repeat your new password"
                  value={form.new_password2}
                  onChange={(e) => setForm((f) => ({ ...f, new_password2: e.target.value }))}
                />
                {errors.new_password2 && <p className="error-text">{errors.new_password2}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    Resetting...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}