import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Leaf, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
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
    try { await authAPI.resetPassword({ uid, token, ...form }); setDone(true) }
    catch (err) { const data = err.response?.data; if (data?.error) toast.error(data.error); else setErrors(data || {}) }
    finally { setLoading(false) }
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
          <div style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.25rem', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
            Set a new password
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>Choose a strong password for your account.</p>
        </div>

        <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--linen)', padding: '2rem' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ width: 60, height: 60, background: 'var(--sage-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle size={28} color="var(--fern)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.75rem', color: 'var(--espresso)' }}>Password reset!</h3>
              <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Your password has been updated successfully.</p>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'flex', justifyContent: 'center' }}>Login Now</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className={`input${errors.new_password ? ' input-error' : ''}`} style={{ paddingRight: '3rem' }} placeholder="At least 8 characters" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} autoFocus />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.new_password && <p className="error-text">{errors.new_password}</p>}
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className={`input${errors.new_password2 ? ' input-error' : ''}`} placeholder="Repeat your new password" value={form.new_password2} onChange={e => setForm(f => ({ ...f, new_password2: e.target.value }))} />
                {errors.new_password2 && <p className="error-text">{errors.new_password2}</p>}
              </div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                {loading
                  ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  : <><ArrowRight size={17} /> Reset Password</>}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}