import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Bookmark, TrendingUp, Droplets, Flame, Crown, ChevronRight, ArrowUpRight, Zap } from 'lucide-react'
import { mealsAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const ease = [0.16, 1, 0.3, 1]
const up = (d = 0) => ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d, ease } })

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function SkeletonCard({ h = 120, r = 16 }) {
  return <div className="skeleton" style={{ height: h, borderRadius: r }} />
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, subscriptionTier, setSubscriptionTier } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const isPremium = subscriptionTier === 'premium'

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await mealsAPI.dashboard()
      setData(res.data)
      if (res.data.profile.subscription_tier !== subscriptionTier) setSubscriptionTier(res.data.profile.subscription_tier)
    } catch { toast.error('Failed to load dashboard.') }
    finally { setLoading(false) }
  }, []) // eslint-disable-line

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleGenerate = () => {
    const gs = data?.profile?.generation_status
    if (gs && !gs.allowed) { navigate('/upgrade'); return }
    navigate('/generate')
  }

  const profile = data?.profile
  const latestPlan = data?.latest_plan
  const savedPlans = data?.saved_plans || []
  const goalEstimate = data?.goal_estimate
  const gs = profile?.generation_status
  const isBlocked = gs?.type === 'blocked'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Row 1: Greeting + Generate ── */}
      <motion.div {...up(0)} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>

        {/* Greeting card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.375rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
          {/* Adinkra watermark */}
          <div style={{ position: 'absolute', right: 20, bottom: 24, fontSize: '5rem', opacity: 0.04, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'serif' }}>✦</div>

          {isPremium && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, background: 'var(--amber-glow)', border: '1px solid rgba(245,166,35,0.25)', marginBottom: '0.875rem' }}>
              <Crown size={10} color="var(--amber)" />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>PREMIUM</span>
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {getGreeting()},<br /><span style={{ color: 'var(--lime)' }}>{user?.first_name}.</span>
          </h1>
        </div>

        {/* Generate CTA card */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          style={{ background: isBlocked ? 'var(--surface)' : 'var(--lime)', borderRadius: 20, padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', border: isBlocked ? '1px solid var(--border)' : 'none', transition: 'all 0.2s', boxShadow: isBlocked ? 'none' : '0 8px 32px var(--lime-glow)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: isBlocked ? 'var(--lime-glow)' : 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isBlocked ? <Crown size={20} color="var(--lime)" /> : <Sparkles size={20} color="var(--night)" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: isBlocked ? 'var(--text)' : 'var(--night)', lineHeight: 1.2, marginBottom: '0.2rem' }}>
              {isBlocked ? 'Upgrade to Generate' : gs?.type === 'partial' ? 'Generate 3-Day Preview' : 'Generate 7-Day Plan'}
            </div>
            <div style={{ fontSize: '0.72rem', color: isBlocked ? 'var(--text-muted)' : 'rgba(0,0,0,0.55)', fontFamily: 'var(--font-body)' }}>
              {isBlocked ? `Resets ${gs?.reset_date ? new Date(gs.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'soon'}` : 'AI-powered · Ghanaian taste'}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Row 2: Stats bento ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} h={100} />)
        ) : [
          { icon: Flame,      value: profile?.daily_calorie_target, label: 'kcal/day',  color: '#FF6B35', sub: 'Daily target' },
          { icon: TrendingUp, value: profile?.bmi,                  label: profile?.bmi_category || 'BMI', color: 'var(--lime)', sub: 'Body Mass Index' },
          { icon: Droplets,   value: profile?.daily_water_intake,    label: 'L/day',     color: '#60A5FA', sub: 'Hydration target' },
          { icon: Bookmark,   value: savedPlans.length,              label: isPremium ? 'unlimited' : 'of 7', color: '#A78BFA', sub: 'Saved plans' },
        ].map(({ icon: Icon, value, label, color, sub }, i) => ( // eslint-disable-line no-unused-vars
          <motion.div key={i} {...up(0.04 + i * 0.04)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1rem', transition: 'all 0.2s var(--ease)', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = '' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.625rem' }}>
              <Icon size={14} color={color} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>
              {value ?? '—'}
            </div>
            <div style={{ fontSize: '0.7rem', color: color, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{label}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 1 }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 3: Latest plan + Quick actions ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '0.75rem' }}>

          {/* Latest plan */}
          <motion.div {...up(0.2)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Latest Plan
              </h2>
              <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', color: 'var(--lime)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                View all <ChevronRight size={13} />
              </Link>
            </div>

            {latestPlan ? (
              <Link to={`/plans/${latestPlan.id}`} style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, textDecoration: 'none', color: 'inherit', overflow: 'hidden', transition: 'all 0.2s var(--ease)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,241,53,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div className="kente-strip" />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      🍽
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                        {latestPlan.title || `Plan — ${new Date(latestPlan.week_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <span className={latestPlan.is_partial ? 'badge badge-orange' : 'badge badge-green'}>
                          {latestPlan.is_partial ? '3-Day Preview' : '7-Day Full Plan'}
                        </span>
                        {latestPlan.is_saved && <span className="badge badge-yellow">Saved</span>}
                      </div>
                    </div>
                    <ArrowUpRight size={15} color="var(--text-muted)" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[
                      { label: 'kcal',    value: latestPlan.nutrition_totals?.calories,       color: '#FF6B35' },
                      { label: 'protein', value: `${latestPlan.nutrition_totals?.protein}g`,  color: 'var(--lime)' },
                      { label: 'carbs',   value: `${latestPlan.nutrition_totals?.carbohydrates}g`, color: 'var(--amber)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.625rem', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color, lineHeight: 1, marginBottom: 2 }}>{value}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>No plans yet</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Generate your first personalised Ghanaian meal plan.</div>
                <button onClick={handleGenerate} className="btn btn-primary"><Sparkles size={14} /> Generate My First Plan</button>
              </div>
            )}
          </motion.div>

          {/* Right column — upgrade or goal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!isPremium && (
              <motion.div {...up(0.24)}>
                <Link to="/upgrade" style={{ display: 'block', background: 'var(--surface)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 18, padding: '1.25rem', textDecoration: 'none', transition: 'all 0.2s', overflow: 'hidden', position: 'relative', maxWidth: 400 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--amber-glow)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'var(--amber-glow)', pointerEvents: 'none' }} />
                  <Crown size={20} color="var(--amber)" style={{ marginBottom: '0.75rem' }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}>Go Premium</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, fontFamily: 'var(--font-body)', marginBottom: '0.875rem' }}>
                    Unlimited plans · AI taste learning · Weekly summaries
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--amber)', color: 'var(--night)', padding: '6px 14px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    GHS 20/mo <ArrowUpRight size={12} />
                  </div>
                </Link>
              </motion.div>
            )}

            {goalEstimate && (
              <motion.div {...up(0.28)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.25rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                  <Zap size={14} color="var(--lime)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Goal Track</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.6, fontFamily: 'var(--font-body)', marginBottom: '0.625rem' }}>{goalEstimate.message}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {goalEstimate.kg_to_lose && <span className="badge badge-green">{goalEstimate.kg_to_lose}kg to lose</span>}
                  {goalEstimate.kg_to_gain && <span className="badge badge-green">{goalEstimate.kg_to_gain}kg to gain</span>}
                  {goalEstimate.months && <span className="badge badge-orange">{goalEstimate.months} months</span>}
                </div>
              </motion.div>
            )}

            {/* Free gen counter */}
            {!isPremium && !loading && (
              <motion.div {...up(0.32)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Free generations</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{profile?.plan_generations_count || 0}/10</span>
                </div>
                <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 100, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((profile?.plan_generations_count || 0) / 10) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    style={{ height: '100%', background: isBlocked ? 'var(--kente-red)' : 'var(--lime)', borderRadius: 100 }} />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}