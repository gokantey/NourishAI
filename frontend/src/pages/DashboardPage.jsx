import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Bookmark, TrendingUp, Droplets, Flame, Crown, ChevronRight, Calendar } from 'lucide-react'
import { mealsAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, unit, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card"
      style={{ padding: '1.25rem' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', background: color }}>
        <Icon size={18} color="white" />
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#28281E' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.75rem', color: '#A8A89E', marginTop: '0.125rem' }}>{label}</div>
      {unit && <div style={{ fontSize: '0.7rem', color: '#C8C8BE' }}>{unit}</div>}
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="card skeleton" style={{ padding: '1.25rem', height: 120 }} />
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, subscriptionTier, setSubscriptionTier } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const isPremium = subscriptionTier === 'premium'

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
      if (err.response?.status === 403) {
        toast.error('Generation limit reached. Upgrade to Premium!')
        navigate('/upgrade')
      } else {
        toast.error(err.response?.data?.error || 'Failed to generate plan.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const profile = data?.profile
  const latestPlan = data?.latest_plan
  const savedPlans = data?.saved_plans || []
  const goalEstimate = data?.goal_estimate
  const genStatus = profile?.generation_status

  const genLabel = !genStatus ? 'Generate Plan'
    : genStatus.type === 'full' ? 'Generate Full 7-Day Plan'
    : genStatus.type === 'partial' ? 'Generate 3-Day Preview'
    : 'Upgrade to Generate'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#28281E' }}>
            {greeting}, {user?.first_name}! 👋
          </h1>
          <p style={{ color: '#A8A89E', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isPremium ? '✨ Premium Plan' : 'Free Plan'} •{' '}
            {genStatus?.type === 'blocked' ? 'Generation limit reached'
              : genStatus?.type === 'full' ? 'Full plan available'
              : '3-day preview available'}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={genStatus?.type === 'blocked' ? 'btn-accent btn-lg' : 'btn-primary btn-lg'}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {generating ? (
            <>
              <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              Generating...
            </>
          ) : (
            <><Sparkles size={18} /> {genLabel}</>
          )}
        </button>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Flame} label="Daily Calories" value={profile?.daily_calorie_target} unit="kcal/day" color="#F4845F" delay={0} />
            <StatCard icon={TrendingUp} label="BMI" value={profile?.bmi} unit={profile?.bmi_category} color="#2D6A4F" delay={0.05} />
            <StatCard icon={Droplets} label="Water Intake" value={profile?.daily_water_intake} unit="litres/day" color="#60a5fa" delay={0.1} />
            <StatCard icon={Bookmark} label="Saved Plans" value={savedPlans.length} unit={isPremium ? 'unlimited' : 'max 1 free'} color="#a78bfa" delay={0.15} />
          </>
        )}
      </div>

      {/* Upgrade banner */}
      {!isPremium && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ borderRadius: '1.5rem', background: 'linear-gradient(135deg, #F4845F, #e8673d)', padding: '1.5rem', color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Crown size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Unlock NourishAI Premium</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Unlimited plans • AI taste learning • Weekly summaries • GHS 20/month</div>
            </div>
          </div>
          <Link to="/upgrade" style={{ background: 'white', color: '#e8673d', fontWeight: 600, padding: '0.625rem 1.25rem', borderRadius: '0.875rem', textDecoration: 'none', fontSize: '0.875rem', flexShrink: 0 }}>
            Upgrade Now
          </Link>
        </motion.div>
      )}

      {/* Latest plan */}
      {!loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#28281E' }}>Latest Plan</h2>
            <Link to="/history" style={{ fontSize: '0.875rem', color: '#2D6A4F', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {latestPlan ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Link to={`/plans/${latestPlan.id}`} className="card-hover" style={{ padding: '1.5rem', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 56, height: 56, background: '#f0fdf4', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>🍽️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#28281E' }}>
                        {latestPlan.title || `Week of ${latestPlan.week_start_date}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                        <span className={latestPlan.is_partial ? 'badge-orange' : 'badge-green'}>
                          {latestPlan.is_partial ? '3-Day Preview' : '7-Day Full Plan'}
                        </span>
                        {latestPlan.is_saved && <span className="badge-yellow">📌 Saved</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#C8C8BE', fontSize: '0.75rem', flexShrink: 0 }}>
                    <Calendar size={13} /> {latestPlan.week_start_date}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F5F5F0' }}>
                  {[['🔥', latestPlan.nutrition_totals?.calories, 'kcal'],
                    ['💪', `${latestPlan.nutrition_totals?.protein}g`, 'protein'],
                    ['🌾', `${latestPlan.nutrition_totals?.carbohydrates}g`, 'carbs'],
                  ].map(([emoji, val, label]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#28281E' }}>{emoji} {val}</div>
                      <div style={{ fontSize: '0.7rem', color: '#A8A89E' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </Link>
            </motion.div>
          ) : (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍽️</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No plans yet</h3>
              <p style={{ color: '#A8A89E', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Generate your first personalised Ghanaian meal plan to get started.</p>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} /> Generate My First Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Goal estimate */}
      {!loading && goalEstimate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: '#28281E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: '#2D6A4F' }} /> Goal Estimate
          </h2>
          <p style={{ color: '#68685E', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>{goalEstimate.message}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {goalEstimate.kg_to_lose && <span className="badge-green">📉 {goalEstimate.kg_to_lose}kg to lose</span>}
            {goalEstimate.kg_to_gain && <span className="badge-green">📈 {goalEstimate.kg_to_gain}kg to gain</span>}
            {goalEstimate.months && <span className="badge-orange">⏱ {goalEstimate.months} months</span>}
          </div>
        </motion.div>
      )}
    </div>
  )
}