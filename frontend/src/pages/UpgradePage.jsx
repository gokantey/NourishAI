import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Check, CheckCircle } from 'lucide-react'
import { upgradeAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import ConfirmModal from '../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const FREE_FEATURES = [
  '7 full 7-day meal plans per month',
  '1 three-day preview plan per month',
  'Save up to 7 plans',
  'Meal ratings',
  'Goal estimate calculator',
  'Shopping list',
]

const PREMIUM_FEATURES = [
  'Unlimited meal plan generations',
  'Full 7-day plans always',
  'AI taste learning from your ratings',
  'Unlimited saved plans',
  'Weekly meal summary emails (Sundays)',
  'Export plans as PDF',
  'Share meal plans publicly',
  'Health streak tracking',
  'Priority support',
]

export function UpgradePage() {
  const { subscriptionTier, setSubscriptionTier } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const isPremium = subscriptionTier === 'premium'

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await upgradeAPI.createCheckout()
      window.location.href = res.data.authorization_url
    } catch {
      toast.error('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  const handleCancelConfirm = async () => {
    setCancelling(true)
    try {
      await upgradeAPI.cancel()
      setSubscriptionTier('free')
      setCancelModalOpen(false)
      toast.success("Subscription cancelled. You've been moved to the free plan.")
    } catch {
      toast.error('Failed to cancel subscription.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style>{`
        .upgrade-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 600px) {
          .upgrade-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          {isPremium ? "You're on Premium ✨" : 'Upgrade to Premium'}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
          {isPremium
            ? 'You have full access to all NourishAI features.'
            : 'Unlock unlimited meal plans, AI taste learning, and more.'}
        </p>
      </div>

      <div className="upgrade-cards-grid">
        {/* Free card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1.75rem', borderRadius: 20, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(145deg, rgba(200,241,53,0.06) 0%, var(--surface) 60%)',
            border: isPremium ? '1px solid var(--border)' : '1.5px solid rgba(200,241,53,0.35)',
            boxShadow: isPremium ? 'none' : '0 0 24px rgba(200,241,53,0.07)',
          }}>
          {/* subtle glow blob */}
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(200,241,53,0.07)', top: -60, right: -60, pointerEvents: 'none' }} />
          <span className="badge badge-green" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Free</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>GHS 0</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Forever free</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FREE_FEATURES.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                <Check size={15} style={{ color: 'var(--lime)', flexShrink: 0, marginTop: 2 }} /> {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.25)', borderRadius: 12, textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--lime)' }}>
              Your current plan
            </div>
          )}
        </motion.div>

        {/* Premium card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            padding: '1.75rem', borderRadius: 20, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(145deg, rgba(244,132,95,0.09) 0%, var(--surface) 60%)',
            border: isPremium ? '1.5px solid rgba(244,132,95,0.5)' : '1.5px solid rgba(244,132,95,0.35)',
            boxShadow: isPremium ? '0 0 32px rgba(244,132,95,0.12)' : '0 0 24px rgba(244,132,95,0.07)',
          }}
        >
          {/* subtle glow blob */}
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(244,132,95,0.07)', top: -70, right: -70, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(244,132,95,0.15)', border: '1px solid rgba(244,132,95,0.3)', color: '#F4845F', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: 9999 }}>
            Most Popular
          </div>
          <span className="badge badge-orange" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Crown size={11} /> Premium
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>GHS 20</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>per month</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                <Check size={15} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} /> {f}
              </li>
            ))}
          </ul>

          {isPremium ? (
            <div>
              <div style={{ padding: '0.75rem', background: 'rgba(245,166,35,0.1)', borderRadius: 12, textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#F4845F', marginBottom: '0.75rem' }}>
                 Active Plan
              </div>
              <button
                onClick={() => setCancelModalOpen(true)}
                style={{ width: '100%', background: 'none', border: '1px solid #E0E0D8', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.625rem', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0D8'; e.currentTarget.style.color = '#A8A89E'; e.currentTarget.style.background = 'none' }}
              >
                Cancel subscription
              </button>
            </div>
          ) : (
            <button onClick={handleUpgrade} disabled={loading} className="btn btn-accent btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  Redirecting...
                </span>
              ) : (
                <><Crown size={18} /> Upgrade Now — GHS 20/month</>
              )}
            </button>
          )}
        </motion.div>
      </div>

      {/* Cancel subscription confirmation modal */}
      <ConfirmModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        loading={cancelling}
        icon="⚠️"
        title="Cancel your Premium subscription?"
        message="You'll be moved to the free plan immediately. You'll lose access to unlimited generations, AI taste learning, and weekly summary emails. You can resubscribe anytime."
        confirmText="Yes, Cancel"
        danger
      />
    </div>
  )
}

export function UpgradeSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSubscriptionTier } = useAuthStore()
  const [verifyStatus, setVerifyStatus] = useState('loading')
  const reference = searchParams.get('reference')

  useEffect(() => {
    if (!reference) {
      setVerifyStatus('error')
      return
    }
    upgradeAPI.verifySuccess(reference)
      .then(() => {
        setSubscriptionTier('premium')
        setVerifyStatus('success')
      })
      .catch(() => setVerifyStatus('error'))
  }, [reference, setSubscriptionTier])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        {verifyStatus === 'loading' && (
          <div>
            <div style={{ width: 64, height: 64, border: '4px solid #bbf7d0', borderTopColor: '#2D6A4F', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
            <p style={{ color: 'var(--text-dim)' }}>Verifying your payment...</p>
          </div>
        )}
        {verifyStatus === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ width: 80, height: 80, background: 'var(--lime-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={36} style={{ color: '#2D6A4F' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>
              Welcome to Premium! ✨
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              You now have unlimited access to all NourishAI features. Go generate your first Premium plan!
            </p>
            <Link to="/generate" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Generate a Plan
            </Link>
          </motion.div>
        )}
        {verifyStatus === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>
              Verification failed
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <button onClick={() => navigate('/upgrade')} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center' }}>
              Back to Upgrade
            </button>
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default UpgradePage