import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Lock, RefreshCw, Crown, ShoppingCart, X, Clock, ChefHat, Flame } from 'lucide-react'
import { mealsAPI } from '../api/client'
import toast from 'react-hot-toast'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const LOCKED_DAYS = ['thursday', 'friday', 'saturday', 'sunday']
const DAY_EMOJIS = { monday: '🌅', tuesday: '☀️', wednesday: '🌤️', thursday: '🌞', friday: '🎉', saturday: '🌿', sunday: '🌺' }

// ── Meal Detail Modal ──
function MealDetailModal({ meal, onClose }) {
  if (!meal) return null
  const pillStyle = {
    breakfast: { background: '#fef9c3', color: '#a16207' },
    lunch: { background: '#dcfce7', color: '#15803d' },
    dinner: { background: '#f3e8ff', color: '#7c3aed' },
  }[meal.meal_type]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #F5F5F0', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <button onClick={onClose}
            style={{ position: 'absolute', top: '1rem', right: '1rem', width: 32, height: 32, borderRadius: 10, background: 'var(--surface2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#68685E" />
          </button>
          <span style={{ ...pillStyle, display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.75rem', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            {{ breakfast: '🌄', lunch: '☀️', dinner: '🌙' }[meal.meal_type]} {meal.meal_type}
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem', paddingRight: '2.5rem' }}>
            {meal.title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{meal.description}</p>
        </div>

        {/* Nutrition */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F5F5F0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {[['🔥', meal.calories, 'kcal'], ['💪', `${meal.protein}g`, 'protein'], ['🌾', `${meal.carbohydrates}g`, 'carbs'], ['🫙', `${meal.fats}g`, 'fats'], ['🌿', `${meal.fibre}g`, 'fibre']].map(([emoji, val, label]) => (
              <div key={label} style={{ textAlign: 'center', padding: '0.625rem 0.375rem', background: 'var(--deep)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#2D6A4F' }}>{emoji} {val}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meta info */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F5F5F0', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {meal.prep_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
              <Clock size={15} style={{ color: '#2D6A4F' }} /> {meal.prep_time} min prep
            </div>
          )}
          {meal.difficulty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
              <ChefHat size={15} style={{ color: '#2D6A4F' }} /> {meal.difficulty}
            </div>
          )}
          {meal.suggested_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
              🕐 Suggested: {meal.suggested_time}
            </div>
          )}
          {meal.portion_guide && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
              🍽️ {meal.portion_guide}
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F5F5F0' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>🛒 Ingredients</h3>
          {Array.isArray(meal.ingredients) ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {meal.ingredients.map((ing, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D6A4F', marginTop: 6, flexShrink: 0 }} />
                  {typeof ing === 'object' ? `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ing.ingredient_name || ''}`.trim() : ing}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{meal.ingredients}</p>
          )}
        </div>

        {/* Instructions */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem' }}>👨‍🍳 Instructions</h3>
          {Array.isArray(meal.instructions) ? (
            <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {meal.instructions.map((step, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>{step}</li>
              ))}
            </ol>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{meal.instructions}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── MealCard defined outside ──
function MealCard({ meal, onRate, onRegenerate, onView }) {
  const [rating, setRating] = useState(meal.rating || 0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)

  const pillStyle = {
    breakfast: { background: '#fef9c3', color: '#a16207' },
    lunch: { background: '#dcfce7', color: '#15803d' },
    dinner: { background: '#f3e8ff', color: '#7c3aed' },
  }[meal.meal_type]

  const mealEmoji = { breakfast: '🌄', lunch: '☀️', dinner: '🌙' }[meal.meal_type]

  const handleRate = async (r) => {
    setRatingLoading(true)
    try {
      await mealsAPI.rateMeal(meal.id, r)
      setRating(r)
      onRate?.()
      toast.success(`Rated ${r}/5 ⭐`)
    } catch { toast.error('Failed to rate meal.') }
    finally { setRatingLoading(false) }
  }

  const handleRegen = async () => {
    setRegenLoading(true)
    try {
      const res = await mealsAPI.regenerateMeal(meal.id)
      onRegenerate?.(meal.id, res.data.meal)
      toast.success('Meal swapped! 🔄')
    } catch { toast.error('Failed to swap meal.') }
    finally { setRegenLoading(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.boxShadow = '0 4px 16px var(--lime-glow)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...pillStyle, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.6rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>
          {mealEmoji} {meal.meal_type}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏱ {meal.prep_time}m</span>
      </div>

      <h4 style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.4, margin: 0 }}>{meal.title}</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{meal.description?.slice(0, 75)}...</p>

      {meal.suggested_time && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#F4845F', background: 'rgba(245,166,35,0.1)', borderRadius: 9999, padding: '0.15rem 0.5rem', width: 'fit-content' }}>
          🕐 {meal.suggested_time}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2D6A4F' }}>🔥 {meal.calories} kcal</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onMouseEnter={() => setHoveredStar(s)} onMouseLeave={() => setHoveredStar(0)}
              onClick={() => handleRate(s)} disabled={ratingLoading}
              style={{ fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: s <= (hoveredStar || rating) ? 1 : 0.25, transition: 'opacity 0.1s' }}>⭐</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => onView(meal)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem', borderRadius: 10, border: '1px solid #2D6A4F', background: 'var(--lime-glow)', color: '#2D6A4F', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--lime)'; e.currentTarget.style.color = 'var(--night)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lime-glow)'; e.currentTarget.style.color = 'var(--lime)' }}>
          <Flame size={12} /> View Details
        </button>
        <button onClick={handleRegen} disabled={regenLoading}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem', borderRadius: 10, border: '1px solid #E0E0D8', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0D8'; e.currentTarget.style.color = '#A8A89E' }}>
          <RefreshCw size={11} style={{ animation: regenLoading ? 'spin 1s linear infinite' : 'none' }} /> Swap
        </button>
      </div>
    </div>
  )
}

export default function MealPlanPage() {
  const { pk } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [activeDay, setActiveDay] = useState('monday')
  const [viewingMeal, setViewingMeal] = useState(null)

  const fetchPlan = useCallback(async () => {
    try {
      const res = await mealsAPI.getPlan(pk)
      setPlan(res.data)
    } catch {
      toast.error('Plan not found.')
      navigate('/history')
    } finally {
      setLoading(false)
    }
  }, [pk, navigate])

  useEffect(() => { fetchPlan() }, [fetchPlan])

  const handleSave = async () => {
    setSaving(true)
    try {
      await mealsAPI.savePlan(pk, { title: saveTitle })
      toast.success('Plan saved! 📌')
      setSaveModalOpen(false)
      setPlan((p) => ({ ...p, is_saved: true, title: saveTitle || p.title }))
    } catch (err) {
      if (err.response?.status === 403) { toast.error('Save limit reached. Upgrade to Premium!'); navigate('/upgrade') }
      else toast.error('Failed to save plan.')
    } finally { setSaving(false) }
  }

  const handleUnsave = async () => {
    try {
      await mealsAPI.unsavePlan(pk)
      toast.success('Plan unsaved.')
      setPlan((p) => ({ ...p, is_saved: false }))
    } catch { toast.error('Failed to unsave.') }
  }

  const handleMealUpdate = (mealId, updatedMeal) => {
    setPlan((p) => ({ ...p, meals: p.meals.map((m) => m.id === mealId ? updatedMeal : m) }))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      </div>
    )
  }

  if (!plan) return null

  const getMealsForDay = (day) => {
    const result = {}
    MEAL_TYPES.forEach((type) => {
      result[type] = plan.meals.find((m) => m.day === day && m.meal_type === type) || null
    })
    return result
  }

  const isLocked = plan.show_lock
  const dayMeals = getMealsForDay(activeDay)
  const isLockedDay = isLocked && LOCKED_DAYS.includes(activeDay)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
            {plan.is_partial ? '3-Day Preview Plan' : 'Your 7-Day Plan'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Week of {plan.week_start_date}
            {plan.is_saved && <span style={{ marginLeft: '0.5rem', color: '#F4845F' }}>📌 Saved</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {plan.is_saved ? (
            <button onClick={handleUnsave} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookmarkCheck size={15} style={{ color: '#2D6A4F' }} /> Saved
            </button>
          ) : plan.can_save ? (
            <button onClick={() => setSaveModalOpen(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bookmark size={15} /> Save Plan
            </button>
          ) : (
            <Link to="/upgrade" className="btn-accent btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Crown size={13} /> Upgrade to Save
            </Link>
          )}
        </div>
      </div>

      {/* Partial banner */}
      {isLocked && (
        <div style={{ borderRadius: '1.5rem', background: 'linear-gradient(135deg, #F4845F, #e8673d)', padding: '1.25rem 1.5rem', color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>👀 You're viewing a 3-day preview</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Days 4–7 are locked. Upgrade for the full 7-day plan.</p>
          </div>
          <Link to="/upgrade" style={{ background: 'var(--surface)', color: '#e8673d', fontWeight: 600, padding: '0.625rem 1.25rem', borderRadius: '0.875rem', textDecoration: 'none', fontSize: '0.875rem', flexShrink: 0 }}>
            Unlock Full Plan ✨
          </Link>
        </div>
      )}

      {/* Nutrition summary */}
      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          📊 {plan.is_partial ? '3-Day' : 'Weekly'} Nutrition Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
          {[['Calories', plan.nutrition_totals?.calories, 'kcal'], ['Protein', `${plan.nutrition_totals?.protein}g`, ''], ['Carbs', `${plan.nutrition_totals?.carbohydrates}g`, ''], ['Fats', `${plan.nutrition_totals?.fats}g`, ''], ['Fibre', `${plan.nutrition_totals?.fibre}g`, '']].map(([label, val]) => (
            <div key={label} className="nutrition-chip">
              <span className="nutrition-value">{val}</span>
              <span className="nutrition-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {DAYS.map((day) => {
          const locked = isLocked && LOCKED_DAYS.includes(day)
          const isActive = activeDay === day
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: isActive ? (locked ? 'var(--surface3)' : 'var(--lime)') : 'var(--surface2)', color: isActive ? (locked ? 'var(--text-muted)' : 'var(--night)') : 'var(--text-muted)', border: `1px solid ${isActive && !locked ? 'var(--lime)' : 'var(--border)'}`, boxShadow: isActive && !locked ? '0 2px 12px var(--lime-glow)' : 'none' }}>
              {DAY_EMOJIS[day]} {day.charAt(0).toUpperCase() + day.slice(1)}
              {locked && <Lock size={11} />}
            </button>
          )
        })}
      </div>

      {/* Meals */}
      <AnimatePresence mode="wait">
        <motion.div key={activeDay} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {isLockedDay ? (
            <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', padding: '3rem', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'var(--surface2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Lock size={28} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} is locked
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Upgrade to Premium to unlock all 7 days.</p>
              <Link to="/upgrade" className="btn btn-accent btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={18} /> Upgrade Now ✨
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {MEAL_TYPES.map((type) => (
                dayMeals[type]
                  ? <MealCard key={type} meal={dayMeals[type]} onRate={fetchPlan} onRegenerate={handleMealUpdate} onView={setViewingMeal} />
                  : <div key={type} style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', minHeight: 120 }}>No {type} found</div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Shopping list */}
      {plan.shopping_list?.items?.length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} style={{ color: '#2D6A4F' }} /> Shopping List
            {plan.is_partial && <span className="badge-orange" style={{ marginLeft: '0.5rem' }}>3-day only</span>}
          </h3>
          {(() => {
            const grouped = plan.shopping_list.items.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = []
              acc[item.category].push(item)
              return acc
            }, {})
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} style={{ background: 'var(--deep)', borderRadius: 12, padding: '0.875rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem', paddingBottom: '0.375rem', borderBottom: '1px solid #EEEEE8' }}>{cat}</div>
                    {items.map((item) => (
                      <div key={item.id} style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2D6A4F', flexShrink: 0 }} />
                        {item.ingredient_name} — {item.quantity}{item.unit}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* Save modal */}
      <AnimatePresence>
        {saveModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setSaveModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--surface)', borderRadius: 20, padding: '1.5rem', width: '100%', maxWidth: 400 }}
              onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Save this plan</h3>
              <label className="label">Plan Name (optional)</label>
              <input type="text" className="input" placeholder={`Plan — ${plan.week_start_date}`} value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} autoFocus style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setSaveModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block', margin: '0 auto' }} /> : 'Save Plan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meal detail modal */}
      <AnimatePresence>
        {viewingMeal && <MealDetailModal meal={viewingMeal} onClose={() => setViewingMeal(null)} />}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}