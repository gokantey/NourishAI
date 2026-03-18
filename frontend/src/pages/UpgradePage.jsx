import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Check, CheckCircle, ArrowRight } from 'lucide-react'
import { upgradeAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import ConfirmModal from '../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const FREE = ['7 full 7-day meal plans per month','3-day preview plans (gens 8-10)','Save up to 7 plans','Meal ratings','Goal estimate calculator','Shopping list per plan']
const PREMIUM = ['Unlimited meal plan generations','Full 7-day plans always','AI taste learning from your ratings','Unlimited saved plans','Weekly meal summary emails','Export plans as PDF (coming soon)','Health streak tracking (coming soon)','Priority support']

const up = (d=0) => ({ initial:{opacity:0,y:18}, animate:{opacity:1,y:0}, transition:{duration:0.45,delay:d,ease:[0.16,1,0.3,1]} })

export function UpgradePage() {
  const { subscriptionTier, setSubscriptionTier } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const isPremium = subscriptionTier === 'premium'

  const handleUpgrade = async () => {
    setLoading(true)
    try { const r = await upgradeAPI.createCheckout(); window.location.href = r.data.authorization_url }
    catch { toast.error('Failed to start checkout.'); setLoading(false) }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try { await upgradeAPI.cancel(); setSubscriptionTier('free'); setCancelOpen(false); toast.success('Subscription cancelled.') }
    catch { toast.error('Failed to cancel.') }
    finally { setCancelling(false) }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div {...up(0)} style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--espresso)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          {isPremium ? "You're on Premium ✦" : 'Upgrade to Premium'}
        </h1>
        <p style={{ color: 'var(--warm-gray)', maxWidth: 400, margin: '0 auto', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
          {isPremium ? 'You have full access to all NourishAI features.' : 'Unlock unlimited meal plans, AI taste learning, and more.'}
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <motion.div {...up(0.05)} style={{ background: 'white', borderRadius: 24, border: '1px solid var(--linen)', padding: '1.75rem' }}>
          <span className="badge badge-gray" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Free</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--espresso)', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>GHS 0</div>
          <div style={{ color: 'var(--stone)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Forever free</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {FREE.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--warm-gray)', fontFamily: 'var(--font-body)' }}>
                <Check size={14} color="var(--fern)" style={{ flexShrink: 0, marginTop: 2 }} /> {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--sage-light)', borderRadius: 12, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)', fontFamily: 'var(--font-body)' }}>
              Your current plan
            </div>
          )}
        </motion.div>

        <motion.div {...up(0.1)} style={{ background: 'white', borderRadius: 24, border: '2px solid var(--terracotta)', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--terracotta)', color: 'white', fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: 100, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
            MOST POPULAR
          </div>
          <span className="badge badge-orange" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Crown size={10} /> Premium
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--espresso)', marginBottom: '0.2rem', letterSpacing: '-0.03em' }}>GHS 20</div>
          <div style={{ color: 'var(--stone)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>per month</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {PREMIUM.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--warm-gray)', fontFamily: 'var(--font-body)' }}>
                <Check size={14} color="var(--terracotta)" style={{ flexShrink: 0, marginTop: 2 }} /> {f}
              </li>
            ))}
          </ul>

          {isPremium ? (
            <div>
              <div style={{ padding: '0.75rem', background: 'var(--terra-light)', borderRadius: 12, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
                ✦ Active Plan
              </div>
              <button onClick={() => setCancelOpen(true)}
                style={{ width: '100%', background: 'none', border: '1px solid var(--linen-mid)', borderRadius: 100, color: 'var(--stone)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.625rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(224,82,82,0.4)'; e.currentTarget.style.color = '#E05252'; e.currentTarget.style.background = 'rgba(224,82,82,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--linen-mid)'; e.currentTarget.style.color = 'var(--stone)'; e.currentTarget.style.background = 'none' }}>
                Cancel subscription
              </button>
            </div>
          ) : (
            <motion.button onClick={handleUpgrade} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn btn-accent btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading
                ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <><Crown size={16} /> Upgrade Now — GHS 20/month</>}
            </motion.button>
          )}
        </motion.div>
      </div>

      <ConfirmModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancel} loading={cancelling}
        icon="⚠️" title="Cancel your Premium subscription?"
        message="You'll be moved to the free plan immediately. You'll lose unlimited generations, AI taste learning, and weekly summary emails. You can resubscribe anytime."
        confirmText="Yes, Cancel" danger />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function UpgradeSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSubscriptionTier } = useAuthStore()
  const [status, setStatus] = useState('loading')
  const ref = searchParams.get('reference')

  useEffect(() => {
    if (!ref) { setStatus('error'); return }
    upgradeAPI.verifySuccess(ref)
      .then(() => { setSubscriptionTier('premium'); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [ref, setSubscriptionTier])    // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        {status === 'loading' && (
          <div>
            <div style={{ width: 60, height: 60, border: '4px solid var(--linen-mid)', borderTopColor: 'var(--fern)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 1.5rem' }} />
            <p style={{ color: 'var(--warm-gray)', fontFamily: 'var(--font-body)' }}>Verifying your payment...</p>
          </div>
        )}
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}>
            <div style={{ width: 72, height: 72, background: 'var(--sage-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={32} color="var(--fern)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--espresso)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Welcome to Premium! ✦
            </h2>
            <p style={{ color: 'var(--warm-gray)', marginBottom: '2rem', lineHeight: 1.6, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              You now have unlimited access to all NourishAI features. Go generate your first Premium plan!
            </p>
            <Link to="/generate" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRight size={17} /> Generate a Plan
            </Link>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--espresso)', marginBottom: '0.75rem' }}>Verification failed</h2>
            <p style={{ color: 'var(--warm-gray)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <button onClick={() => navigate('/upgrade')} className="btn btn-ghost">Back to Upgrade</button>
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default UpgradePage