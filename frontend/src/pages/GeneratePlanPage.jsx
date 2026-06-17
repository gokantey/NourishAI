import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Crown, Flame, TrendingUp, Droplets, Utensils, Wallet, Target } from 'lucide-react'
import { mealsAPI, profileAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const MESSAGES = [
  { text: 'Consulting the fufu elders', sub: 'Deep in culinary thought' },
  { text: 'Weighing your macros carefully', sub: 'Precision nutrition in progress' },
  { text: 'Sourcing from Ghanaian markets', sub: 'Farm to your plan' },
  { text: 'Crafting your waakye week', sub: 'Culture meets nutrition' },
  { text: 'Balancing kelewele and kale', sub: 'The perfect union' },
  { text: 'Asking Auntie Ama for secrets', sub: 'Family recipes unlocked' },
  { text: 'Your plan is taking shape', sub: 'Almost ready for you' },
]

const FOOD_WORDS = ['Waakye', 'Jollof', 'Fufu', 'Banku', 'Kelewele', 'Kontomire', 'Abenkwan', 'Kenkey']

function ProfileStat({ icon: Icon, label, value, color }) { // eslint-disable-line no-unused-vars
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={color} />
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{value || '—'}</div>
    </div>
  )
}

// ── Cinematic generation animation ─────────────────────────────────────────
function GeneratingAnimation({ msgIdx }) {
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden', minHeight: 420 }}>

      {/* Background floating food words */}
      {FOOD_WORDS.map((word, i) => (
        <motion.div key={word}
          animate={{ y: [0, -12, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5 }}
          style={{
            position: 'absolute', fontFamily: 'var(--font-display)', fontSize: `${1.2 + (i % 3) * 0.4}rem`, fontWeight: 700, color: 'var(--lime)', pointerEvents: 'none', userSelect: 'none',
            top: `${[8, 18, 32, 48, 60, 72, 80, 90][i]}%`,
            left: `${[5, 65, 20, 80, 8, 58, 30, 75][i]}%`,
          }}>
          {word}
        </motion.div>
      ))}

      {/* Outer orbit ring */}
      <div style={{ position: 'relative', width: 180, height: 180, marginBottom: '2.5rem' }}>

        {/* Outermost ring — slow rotate */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(200,241,53,0.12)' }} />

        {/* Middle ring — counter-rotate */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: '1.5px dashed rgba(200,241,53,0.2)' }} />

        {/* Inner ring — fast */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', inset: 32, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--lime)', borderRightColor: 'rgba(200,241,53,0.3)' }} />

        {/* Amber accent ring */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', inset: 44, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: 'var(--amber)', borderLeftColor: 'rgba(245,166,35,0.3)' }} />

        {/* Orbiting dot — lime */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', inset: 32, borderRadius: '50%' }}>
          <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', boxShadow: '0 0 12px var(--lime)' }} />
        </motion.div>

        {/* Orbiting dot — amber */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', inset: 44, borderRadius: '50%' }}>
          <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)' }} />
        </motion.div>

        {/* Center */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles size={28} color="var(--lime)" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.div key={msgIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }} style={{ textAlign: 'center', marginBottom: '0.625rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            {MESSAGES[msgIdx].text}{'·'.repeat(dots)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {MESSAGES[msgIdx].sub}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Audio visualiser bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 36, marginTop: '1.5rem' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div key={i}
            animate={{ height: [8, [24, 32, 18, 36, 22, 30, 16, 28, 20][i], 8] }}
            transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
            style={{ width: 4, borderRadius: 4, background: i % 3 === 0 ? 'var(--amber)' : 'var(--lime)', opacity: 0.7 }}
          />
        ))}
      </div>

      <div style={{ marginTop: '1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        This usually takes 10–20 seconds
      </div>
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
    profileAPI.get().then(r => setProfile(r.data)).catch(() => { }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!generating) return
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2500)
    return () => clearInterval(t)
  }, [generating])

  const handleGenerate = async () => {
    const gs = profile?.generation_status
    if (gs && !gs.allowed) { navigate('/upgrade'); return }
    setGenerating(true); setMsgIdx(0)
    try {
      const res = await mealsAPI.generate()
      toast.success(res.data.message)
      navigate(`/plans/${res.data.meal_plan.id}`)
    } catch (err) {
      if (err.response?.status === 403) { toast.error('Upgrade to generate more plans!'); navigate('/upgrade') }
      else { toast.error(err.response?.data?.error || 'Generation failed.'); setGenerating(false) }
    }
  }

  const gs = profile?.generation_status
  const isBlocked = gs?.type === 'blocked'
  const isPartial = gs?.type === 'partial'

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ height: 44, width: 280, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 20 }} />
      <div className="skeleton" style={{ height: 320, borderRadius: 20 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Generate a Meal Plan
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
          AI-powered plans built around your body, health, and Ghanaian taste
        </p>
      </motion.div>

      {/* Profile glance */}
      {profile && !generating && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.25rem', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem', fontFamily: 'var(--font-body)' }}>
            Your profile at a glance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
            <ProfileStat icon={Flame} label="Calories" value={profile.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : null} color="#FF6B35" />
            <ProfileStat icon={TrendingUp} label="BMI" value={profile.bmi ? `${profile.bmi} (${profile.bmi_category})` : null} color="var(--lime)" />
            <ProfileStat icon={Utensils} label="Diet" value={profile.dietary_preference?.replace('_', ' ') || 'None'} color="#A78BFA" />
            <ProfileStat icon={Wallet} label="Budget" value={profile.budget ? `₵${profile.budget}` : null} color="var(--amber)" />
            <ProfileStat icon={Droplets} label="Water" value={profile.daily_water_intake ? `${profile.daily_water_intake}L/day` : null} color="#60A5FA" />
            <ProfileStat icon={Target} label="Goal" value={profile.fitness_goal?.replace(/_/g, ' ') || null} color="var(--lime-dim)" />
          </div>
        </motion.div>
      )}

      {/* Main card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <div className="kente-strip" />

        <AnimatePresence mode="wait">

          {/* Generating */}
          {generating && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GeneratingAnimation msgIdx={msgIdx} />
            </motion.div>
          )}

          {/* Blocked */}
          {!generating && isBlocked && (
            <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--amber-glow)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Crown size={24} color="var(--amber)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Generation limit reached
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', maxWidth: 340, margin: '0 auto 0.5rem', fontFamily: 'var(--font-body)' }}>
                You've used all 10 free generations in your current 30-day window.
              </p>
              {gs?.reset_date && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
                  Resets on {new Date(gs.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <button onClick={() => navigate('/upgrade')} className="btn btn-accent btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={15} /> Upgrade to Premium
              </button>
            </motion.div>
          )}

          {/* Ready */}
          {!generating && !isBlocked && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '2.25rem 2rem', textAlign: 'center' }}>

              {isPartial && !isPremium && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--amber-glow)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 14, marginBottom: '1.5rem', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.875rem', flexShrink: 0, marginTop: 1 }}>ℹ</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--amber)', fontFamily: 'var(--font-body)' }}>3-Day Preview Mode</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                      Mon–Wed only. Upgrade to Premium for full 7-day plans every time.
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--lime-glow)', border: '1px solid rgba(200,241,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Sparkles size={32} color="var(--lime)" />
              </motion.div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {isPartial ? 'Generate Your 3-Day Preview' : 'Generate Your 7-Day Plan'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 360, margin: '0 auto 1.75rem', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                {isPremium
                  ? 'Your AI-powered full plan, shaped by your taste ratings and health profile.'
                  : isPartial ? 'Generations 8–10 on the free tier. Upgrade for full plans anytime.'
                    : 'Your first personalised meal plan, built around your body and Ghanaian food culture.'}
              </p>

              <motion.button onClick={handleGenerate} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 6px 24px var(--lime-glow)', marginBottom: '1.5rem' }}>
                <Sparkles size={16} />
                {isPartial ? 'Generate 3-Day Preview' : 'Generate Full Plan'}
              </motion.button>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5, maxWidth: 460, margin: '0 auto', opacity: 0.75, fontFamily: 'var(--font-body)' }}>
                Your meal plan is a personalised starting point based on your body measurements, health conditions, and Ghanaian food preferences. Calorie targets are general estimates. For medical-grade precision, consult a licensed dietitian.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}