import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mealsAPI } from '../api/client'
import { Flame, TrendingUp, Droplets, ShoppingCart, ExternalLink } from 'lucide-react'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const MEAL_COLORS = { breakfast: 'var(--amber)', lunch: 'var(--lime)', dinner: '#A78BFA' }
const ease = [0.16, 1, 0.3, 1]

function NutChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '0.625rem 0.5rem', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: color || 'var(--lime)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3, fontFamily: 'var(--font-body)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export default function SharedPlanPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    mealsAPI.getSharedPlan(token)
      .then(res => {
        setData(res.data)
        if (res.data.schedule?.length > 0) setActiveDay(res.data.schedule[0].day)
      })
      .catch(() => setError('This plan does not exist or the link is invalid.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--night)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--surface2)', borderTopColor: 'var(--lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--night)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>Plan not found</div>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>{error}</div>
      <Link to="/" style={{ color: 'var(--lime)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>Go to NourishAI</Link>
    </div>
  )

  const { plan, owner, nutrition_totals, schedule, shopping_list } = data
  const dayData = schedule.find(d => d.day === activeDay)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--night)', fontFamily: 'var(--font-body)' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--deep)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--night)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
            Nourish<span style={{ color: 'var(--lime)' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shared by <b style={{ color: 'var(--text)' }}>{owner.name}</b></span>
          <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.875rem', borderRadius: 100, background: 'var(--lime)', color: 'var(--night)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
            <ExternalLink size={11} /> Get NourishAI
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>

        {/* Plan header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: '1rem' }}>
          <div className="kente-strip" />
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                  {plan.is_partial ? '3-Day Preview' : '7-Day Meal Plan'}
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {plan.title}
                </h1>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                  Week of {new Date(plan.week_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {owner.region && <span> · {owner.region.replace(/_/g,' ')}</span>}
                  {owner.fitness_goal && <span> · Goal: {owner.fitness_goal.replace(/_/g,' ')}</span>}
                </div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 100, background: 'var(--lime-glow)', border: '1px solid rgba(200,241,53,0.25)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--lime)' }}>
                Shared plan
              </span>
            </div>

            {/* Nutrition summary */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <NutChip label="kcal" value={nutrition_totals.calories} color="#FF6B35" />
              <NutChip label="protein" value={`${nutrition_totals.protein}g`} color="var(--lime)" />
              <NutChip label="carbs" value={`${nutrition_totals.carbohydrates}g`} color="var(--amber)" />
              <NutChip label="fats" value={`${nutrition_totals.fats}g`} color="#A78BFA" />
              <NutChip label="fibre" value={`${nutrition_totals.fibre}g`} color="#60A5FA" />
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '1rem', alignItems: 'start' }}>

          {/* Left — schedule */}
          <div>
            {/* Day tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              {schedule.map(({ day }) => (
                <button key={day} onClick={() => setActiveDay(day)}
                  style={{ padding: '0.4rem 0.875rem', borderRadius: 100, border: `1px solid ${activeDay === day ? 'var(--lime)' : 'var(--border)'}`, background: activeDay === day ? 'var(--lime-glow)' : 'var(--surface)', color: activeDay === day ? 'var(--lime)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>

            {/* Meals for active day */}
            {dayData && Object.entries(dayData.meals).map(([mtype, meal]) => (
              <motion.div key={mtype} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: '0.75rem', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.125rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 100, background: MEAL_COLORS[mtype] + '20', border: `1px solid ${MEAL_COLORS[mtype]}40`, color: MEAL_COLORS[mtype], fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                      {mtype}
                    </span>
                    {meal.prep_time && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meal.prep_time} min</span>}
                    {meal.calories && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meal.calories} kcal</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
                    {meal.title}
                  </div>
                  {meal.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{meal.description}</div>}
                </div>

                <div style={{ padding: '1rem 1.125rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {/* Ingredients */}
                  {meal.ingredients?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Ingredients</div>
                      {meal.ingredients.map((ing, i) => {
                        const txt = typeof ing === 'object'
                          ? `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ing.ingredient_name || ''}`.trim()
                          : ing
                        return <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.6, paddingLeft: '0.625rem', borderLeft: '2px solid var(--border2)' }}>{txt}</div>
                      })}
                    </div>
                  )}

                  {/* Instructions */}
                  {meal.instructions && (
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Method</div>
                      {(Array.isArray(meal.instructions) ? meal.instructions : meal.instructions.split('\n').filter(Boolean)).map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lime)', flexShrink: 0, marginTop: 2, width: 14 }}>{i + 1}.</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right — shopping list */}
          <div style={{ }}>
            {Object.keys(shopping_list).length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={13} color="var(--lime)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>Shopping List</span>
                </div>
                <div style={{ padding: '0.875rem 1rem', maxHeight: 480, overflowY: 'auto' }}>
                  {Object.entries(shopping_list).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: '0.875rem' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>{cat}</div>
                      {items.map((item, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                          {item.name} — <span style={{ color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: '0.75rem', background: 'var(--surface)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: 16, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.375rem' }}>
                Want your own plan?
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
                Get AI-powered Ghanaian meal plans personalised to your body.
              </div>
              <Link to="/register" style={{ display: 'block', padding: '0.5rem', borderRadius: 100, background: 'var(--lime)', color: 'var(--night)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                Start for free
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}