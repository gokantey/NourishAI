import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Bookmark, TrendingUp, Droplets, Flame, Crown, ChevronRight, ArrowUpRight } from 'lucide-react'
import { mealsAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const ease = [0.16, 1, 0.3, 1]
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease },
})

const GREETINGS = {
  dawn:    { text: 'Good morning,',  sub: 'Start your day with intention' },
  morning: { text: 'Good morning,',  sub: 'Ready to fuel your day?' },
  noon:    { text: 'Good afternoon,', sub: 'Keep the momentum going' },
  evening: { text: 'Good evening,',  sub: 'How did you eat today?' },
  night:   { text: 'Good night,',    sub: 'Rest well and eat well' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return GREETINGS.night
  if (h < 12) return GREETINGS.morning
  if (h < 14) return GREETINGS.noon
  if (h < 20) return GREETINGS.evening
  return GREETINGS.night
}

function StatCard({ icon: Icon, label, value, unit, accentColor, delay }) { // eslint-disable-line no-unused-vars
  return (
    <motion.div {...up(delay)}
      whileHover={{ y: -4, transition: { duration: 0.2, ease } }}
      style={{ background: 'white', borderRadius: 20, padding: '1.25rem 1.25rem 1.125rem', border: '1px solid var(--linen)', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle accent blob */}
      <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', background: accentColor, opacity: 0.07, pointerEvents: 'none' }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
        <Icon size={15} color={accentColor} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, color: 'var(--espresso)', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginTop: '0.3rem', fontWeight: 500 }}>{label}</div>
      {unit && <div style={{ fontSize: '0.68rem', color: 'var(--stone)', marginTop: '0.1rem' }}>{unit}</div>}
    </motion.div>
  )
}

function SkeletonCard() {
  return <div className="skeleton" style={{ borderRadius: 20, height: 130 }} />
}

function GenerationBar({ count, isPremium }) {
  if (isPremium) return null
  const pct = Math.min((count / 10) * 100, 100)
  const remaining = Math.max(10 - count, 0)
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          Free generations used
        </span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          {count} / 10
        </span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 100, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: remaining <= 2 ? 'var(--terra-mid)' : 'rgba(255,255,255,0.65)', borderRadius: 100 }}
        />
      </div>
      {remaining <= 3 && remaining > 0 && (
        <div style={{ fontSize: '0.68rem', color: 'rgba(244,180,138,0.9)', marginTop: '0.3rem', fontFamily: 'var(--font-body)' }}>
          Only {remaining} generation{remaining !== 1 ? 's' : ''} left in this window
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, subscriptionTier, setSubscriptionTier } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const isPremium = subscriptionTier === 'premium'
  const greeting = getGreeting()

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await mealsAPI.dashboard()
      setData(res.data)
      if (res.data.profile.subscription_tier !== subscriptionTier) {
        setSubscriptionTier(res.data.profile.subscription_tier)
      }
    } catch {
      toast.error('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleGenerate = async () => {
    const genStatus = data?.profile?.generation_status
    if (genStatus && !genStatus.allowed) { navigate('/upgrade'); return }
    setGenerating(true)
    try {
      const res = await mealsAPI.generate()
      toast.success(res.data.message)
      navigate(`/plans/${res.data.meal_plan.id}`)
    } catch (err) {
      if (err.response?.status === 403) { navigate('/upgrade') }
      else toast.error(err.response?.data?.error || 'Failed to generate plan.')
    } finally { setGenerating(false) }
  }

  const profile = data?.profile
  const latestPlan = data?.latest_plan
  const savedPlans = data?.saved_plans || []
  const goalEstimate = data?.goal_estimate
  const genStatus = profile?.generation_status
  const isBlocked = genStatus?.type === 'blocked'

  const genLabel = isBlocked ? 'Upgrade to Generate'
    : genStatus?.type === 'partial' ? 'Generate 3-Day Preview'
    : 'Generate Full 7-Day Plan'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Hero card ── */}
      <motion.div {...up(0)} style={{
        borderRadius: 28, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 55%, #3D7A58 100%)',
        padding: '2rem',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: 60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 30, right: 140, width: 50, height: 50, borderRadius: '50%', background: 'rgba(196,82,26,0.2)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            {isPremium && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(196,146,10,0.2)', border: '1px solid rgba(196,146,10,0.3)', color: '#F5D47A', fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.08em', fontFamily: 'var(--font-body)', marginBottom: '0.75rem' }}>
                <Crown size={10} /> PREMIUM
              </motion.div>
            )}
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', fontWeight: 400, marginBottom: '0.25rem' }}>
              {greeting.sub}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontStyle: 'italic', fontSize: 'clamp(1.75rem, 3.5vw, 2.375rem)', color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {greeting.text} {user?.first_name}
            </h1>
          </div>

          <motion.button
            onClick={handleGenerate}
            disabled={generating || loading}
            whileHover={{ scale: 1.04, transition: { duration: 0.18 } }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.5rem', borderRadius: 100,
              background: isBlocked ? 'var(--terracotta)' : 'var(--cream)',
              color: isBlocked ? 'white' : 'var(--forest)',
              border: 'none', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', flexShrink: 0, letterSpacing: '-0.01em',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              opacity: (generating || loading) ? 0.7 : 1,
            }}>
            {generating ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(28,58,43,0.25)', borderTopColor: 'var(--forest)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Crafting your plan...
              </>
            ) : isBlocked ? (
              <><Crown size={15} /> Upgrade to Generate</>
            ) : (
              <><Sparkles size={15} /> {genLabel}</>
            )}
          </motion.button>
        </div>

        {!loading && (
          <GenerationBar count={profile?.plan_generations_count || 0} isPremium={isPremium} />
        )}

        {!loading && isBlocked && genStatus?.reset_date && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
            Window resets on {new Date(genStatus.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
          </div>
        )}
      </motion.div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Flame}     label="Daily Calories"  value={profile?.daily_calorie_target} unit="kcal target"  accentColor="var(--terracotta)" delay={0.05} />
            <StatCard icon={TrendingUp} label="BMI"            value={profile?.bmi}                  unit={profile?.bmi_category} accentColor="var(--fern)" delay={0.1} />
            <StatCard icon={Droplets}  label="Water Target"   value={profile?.daily_water_intake}   unit="litres / day"  accentColor="#3B82F6"           delay={0.15} />
            <StatCard icon={Bookmark}  label="Saved Plans"    value={savedPlans.length}             unit={isPremium ? 'unlimited' : 'max 7 free'} accentColor="#8B5CF6" delay={0.2} />
          </>
        )}
      </div>

      {/* ── Upgrade banner (free users) ── */}
      {!isPremium && !loading && (
        <motion.div {...up(0.25)}
          style={{ borderRadius: 20, background: 'var(--terra-light)', border: '1px solid rgba(196,82,26,0.15)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Crown size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--espresso)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>Unlock NourishAI Premium</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '0.1rem' }}>Unlimited plans · AI taste learning · Weekly summaries · GHS 20/month</div>
            </div>
          </div>
          <Link to="/upgrade" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.125rem', borderRadius: 100, background: 'var(--terracotta)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-body)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            Upgrade Now <ArrowUpRight size={13} />
          </Link>
        </motion.div>
      )}

      {/* ── Latest plan ── */}
      {!loading && (
        <motion.div {...up(0.3)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
              Latest Plan
            </h2>
            <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--fern)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {latestPlan ? (
            <Link to={`/plans/${latestPlan.id}`} className="card-hover" style={{ padding: '1.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    🍽️
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--espresso)', letterSpacing: '-0.01em', fontFamily: 'var(--font-body)' }}>
                      {latestPlan.title || `Plan — ${new Date(latestPlan.week_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                      <span className={latestPlan.is_partial ? 'badge-orange' : 'badge-green'}>
                        {latestPlan.is_partial ? '3-Day Preview' : '7-Day Full Plan'}
                      </span>
                      {latestPlan.is_saved && <span className="badge-yellow">📌 Saved</span>}
                    </div>
                  </div>
                </div>
                <ArrowUpRight size={16} color="var(--stone)" style={{ flexShrink: 0 }} />
              </div>

              {/* Nutrition strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', paddingTop: '1rem', borderTop: '1px solid var(--linen)' }}>
                {[
                  { emoji: '🔥', value: latestPlan.nutrition_totals?.calories, label: 'kcal' },
                  { emoji: '💪', value: `${latestPlan.nutrition_totals?.protein}g`, label: 'protein' },
                  { emoji: '🌾', value: `${latestPlan.nutrition_totals?.carbohydrates}g`, label: 'carbs' },
                ].map(({ emoji, value, label }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '0.625rem 0.25rem', background: 'var(--cream)', borderRadius: 12 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--espresso)', fontFamily: 'var(--font-body)' }}>{emoji} {value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--stone)', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </Link>
          ) : (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍲</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '0.5rem', color: 'var(--espresso)' }}>
                No plans yet
              </h3>
              <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: 300, margin: '0 auto 1.5rem' }}>
                Generate your first personalised Ghanaian meal plan and start your journey.
              </p>
              <button onClick={handleGenerate} disabled={generating} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={17} /> Generate My First Plan
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Goal estimate ── */}
      {!loading && goalEstimate && (
        <motion.div {...up(0.35)} style={{ background: 'white', borderRadius: 20, padding: '1.5rem', border: '1px solid var(--linen)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color="var(--fern)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--espresso)', letterSpacing: '-0.02em' }}>
              Goal Estimate
            </h2>
          </div>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '0.875rem' }}>{goalEstimate.message}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {goalEstimate.kg_to_lose && <span className="badge badge-green">📉 {goalEstimate.kg_to_lose}kg to lose</span>}
            {goalEstimate.kg_to_gain && <span className="badge badge-green">📈 {goalEstimate.kg_to_gain}kg to gain</span>}
            {goalEstimate.months && <span className="badge badge-orange">⏱ {goalEstimate.months} months</span>}
          </div>
        </motion.div>
      )}

    </div>
  )
}