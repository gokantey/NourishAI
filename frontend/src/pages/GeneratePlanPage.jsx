import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Crown, Flame, Droplets, TrendingUp, Wallet, Utensils, Target } from 'lucide-react'
import { mealsAPI, profileAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const ease = [0.16, 1, 0.3, 1]
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease },
})

const MESSAGES = [
  { text: 'Consulting the fufu elders...', sub: 'Deep in culinary thought' },
  { text: 'Weighing your macros carefully...', sub: 'Precision nutrition in progress' },
  { text: 'Selecting the freshest ingredients...', sub: 'From market to your plate' },
  { text: 'Crafting your Ghanaian feast...', sub: 'Culture meets nutrition' },
  { text: 'Balancing waakye and wellness...', sub: 'Almost there' },
  { text: 'Asking Auntie Ama for the recipe...', sub: 'Family secrets unlocked' },
  { text: 'Your plan is taking shape...', sub: 'Just a moment more' },
]

function ProfileStat({ icon: Icon, label, value, color }) { // eslint-disable-line no-unused-vars
  return (
    <div style={{ padding: '0.875rem 1rem', background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--linen)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={color} />
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--espresso)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{value || '—'}</div>
    </div>
  )
}

export default function GeneratePlanPage() {
  const navigate = useNavigate()
  const { subscriptionTier } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const isPremium = subscriptionTier === 'premium'

  useEffect(() => {
    profileAPI.get().then(r => setProfile(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!generating) return
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2500)
    return () => clearInterval(t)
  }, [generating])

  const handleGenerate = async () => {
    const genStatus = profile?.generation_status
    if (genStatus && !genStatus.allowed) { navigate('/upgrade'); return }
    setGenerating(true)
    setMsgIdx(0)
    try {
      const res = await mealsAPI.generate()
      toast.success(res.data.message)
      navigate(`/plans/${res.data.meal_plan.id}`)
    } catch (err) {
      if (err.response?.status === 403) { toast.error('Upgrade to generate more plans!'); navigate('/upgrade') }
      else { toast.error(err.response?.data?.error || 'Generation failed. Try again.'); setGenerating(false) }
    }
  }

  const genStatus = profile?.generation_status
  const isBlocked = genStatus?.type === 'blocked'
  const isPartial = genStatus?.type === 'partial'

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ height: 44, width: 280, borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 22 }} />
      <div className="skeleton" style={{ height: 320, borderRadius: 22 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <motion.div {...up(0)}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.625rem, 3vw, 2rem)', fontWeight: 400, fontStyle: 'italic', color: 'var(--espresso)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Generate a Meal Plan
        </h1>
        <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem' }}>
          AI-powered plans built around your body, health, and Ghanaian taste
        </p>
      </motion.div>

      {/* Profile glance */}
      {profile && (
        <motion.div {...up(0.05)} style={{ background: 'white', borderRadius: 22, border: '1px solid var(--linen)', padding: '1.375rem', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', fontFamily: 'var(--font-body)' }}>
            Your profile at a glance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
            <ProfileStat icon={Flame}     label="Calories"  value={profile.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : null}  color="var(--terracotta)" />
            <ProfileStat icon={TrendingUp} label="BMI"       value={profile.bmi ? `${profile.bmi} (${profile.bmi_category})` : null}               color="var(--fern)" />
            <ProfileStat icon={Utensils}   label="Diet"      value={profile.dietary_preference?.replace('_', ' ') || 'None'}                        color="#8B5CF6" />
            <ProfileStat icon={Wallet}     label="Budget"    value={profile.budget ? `₵${profile.budget}` : null}                                  color="var(--gold)" />
            <ProfileStat icon={Droplets}   label="Water"     value={profile.daily_water_intake ? `${profile.daily_water_intake}L/day` : null}       color="#3B82F6" />
            <ProfileStat icon={Target}     label="Goal"      value={profile.fitness_goal?.replace(/_/g, ' ') || null}                               color="var(--forest)" />
          </div>
        </motion.div>
      )}

      {/* Generation card */}
      <motion.div {...up(0.1)} style={{ background: 'white', borderRadius: 22, border: '1px solid var(--linen)', overflow: 'hidden' }}>

        <AnimatePresence mode="wait">

          {/* Blocked state */}
          {isBlocked && (
            <motion.div key="blocked"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--terra-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Crown size={26} color="var(--terracotta)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.5rem', color: 'var(--espresso)' }}>
                Generation limit reached
              </h3>
              <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', marginBottom: '0.5rem', maxWidth: 340, margin: '0 auto 0.5rem' }}>
                You've used all 10 free generations in your current 30-day window (7 full + 3 previews).
              </p>
              {genStatus?.reset_date && (
                <p style={{ color: 'var(--stone)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                  🔄 Resets on {new Date(genStatus.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <button onClick={() => navigate('/upgrade')} className="btn btn-accent btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={16} /> Upgrade to Premium
              </button>
            </motion.div>
          )}

          {/* Generating state */}
          {generating && (
            <motion.div key="generating"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
              style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              {/* Spinner */}
              <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 1.75rem' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--linen)' }} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--fern)' }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                  style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--terra-mid)', opacity: 0.6 }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.625rem' }}>
                  🍲
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={msgIdx}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--espresso)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                    {MESSAGES[msgIdx].text}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
                    {MESSAGES[msgIdx].sub}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div key={i}
                    animate={{ scaleY: [1, 2.5, 1] }}
                    transition={{ duration: 0.8, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 3, height: 16, borderRadius: 10, background: 'var(--fern)', opacity: 0.6, transformOrigin: 'bottom' }}
                  />
                ))}
              </div>

              <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
                This usually takes 10–20 seconds
              </p>
            </motion.div>
          )}

          {/* Ready state */}
          {!isBlocked && !generating && (
            <motion.div key="ready"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '2.25rem 2rem', textAlign: 'center' }}>

              {isPartial && !isPremium && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--gold-light)', border: '1px solid rgba(192,125,26,0.2)', borderRadius: 14, marginBottom: '1.5rem', textAlign: 'left' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>3-Day Preview Mode</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginTop: '0.15rem', lineHeight: 1.5 }}>
                      Mon–Wed only. Upgrade to Premium for full 7-day plans every time.
                    </div>
                  </div>
                </motion.div>
              )}

              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2.25rem' }}>
                🍽️
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.5rem', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
                {isPartial ? 'Generate Your 3-Day Preview' : 'Generate Your 7-Day Plan'}
              </h3>
              <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', maxWidth: 360, margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                {isPremium
                  ? 'Your AI-powered full plan shaped by your taste ratings and health profile.'
                  : isPartial
                  ? 'Generations 8–10 on the free tier. Upgrade for full plans anytime.'
                  : 'Your first personalised meal plan, built around your body and Ghanaian food culture.'}
              </p>

              <motion.button
                onClick={handleGenerate}
                whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 6px 24px rgba(28,58,43,0.22)' }}>
                <Sparkles size={17} />
                {isPartial ? 'Generate 3-Day Preview' : 'Generate Full Plan'}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

    </div>
  )
}