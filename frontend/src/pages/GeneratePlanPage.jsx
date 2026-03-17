import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Crown } from 'lucide-react'
import { mealsAPI, profileAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const GHANAIAN_MESSAGES = [
  'Cooking up something delicious... 🍲',
  'Asking NourishAI to think like Auntie Ama... 👩‍🍳',
  'Mixing flavours from across Ghana... 🌿',
  'Consulting the fufu elders... 🥣',
  'Crafting your perfect meal plan... ✨',
  'Balancing nutrition and Ghanaian taste... 🥗',
  'NourishAI is thinking about waakye right now... 🍛',
]

export default function GeneratePlanPage() {
  const navigate = useNavigate()
  const { subscriptionTier } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [messageIdx, setMessageIdx] = useState(0)

  useEffect(() => {
    profileAPI.get()
      .then((res) => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!generating) return
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % GHANAIAN_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [generating])

  const handleGenerate = async () => {
    const genStatus = profile?.generation_status
    if (genStatus && !genStatus.allowed) { navigate('/upgrade'); return }
    setGenerating(true)
    try {
      const res = await mealsAPI.generate()
      toast.success(res.data.message)
      navigate(`/plans/${res.data.meal_plan.id}`)
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Generation limit reached!')
        navigate('/upgrade')
      } else {
        toast.error(err.response?.data?.error || 'Generation failed. Please try again.')
        setGenerating(false)
      }
    }
  }

  const genStatus = profile?.generation_status
  const isPremium = subscriptionTier === 'premium'
  const isBlocked = genStatus?.type === 'blocked'
  const isPartial = genStatus?.type === 'partial'

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: 40, width: 256, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 24 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#28281E' }}>Generate a Meal Plan</h1>
        <p style={{ color: '#A8A89E', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          AI-powered plans built around your body, health, and Ghanaian taste
        </p>
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, color: '#68685E', fontSize: '0.875rem', marginBottom: '1rem' }}>Your profile at a glance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              ['Calories', profile.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : '—'],
              ['BMI', profile.bmi ? `${profile.bmi} (${profile.bmi_category})` : '—'],
              ['Diet', profile.dietary_preference || 'None'],
              ['Budget', profile.budget ? `₵${profile.budget}` : '—'],
              ['Water', profile.daily_water_intake ? `${profile.daily_water_intake}L/day` : '—'],
              ['Goal', profile.fitness_goal?.replace('_', ' ') || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: '#FAFAF8', borderRadius: '0.875rem', padding: '0.75rem', border: '1px solid #F5F5F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#A8A89E', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#28281E' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation card */}
      <div className="card" style={{ padding: '2rem' }}>
        {isBlocked ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 64, height: 64, background: '#fff4f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Crown size={28} style={{ color: '#F4845F' }} />
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Generation limit reached</h3>
            <p style={{ color: '#A8A89E', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
              You've used all 10 free generations in your current 30-day window (7 full + 3 previews). Upgrade to Premium for unlimited generations.
            </p>
            {genStatus?.reset_date && (
              <p style={{ color: '#A8A89E', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                🔄 Your free generations reset on <strong>{new Date(genStatus.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
            )}
            <button onClick={() => navigate('/upgrade')} className="btn-accent btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Crown size={18} /> Upgrade to Premium
            </button>
          </div>
        ) : generating ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 1.5rem' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #bbf7d0' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#2D6A4F', animation: 'spin 1s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>🍲</div>
            </div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '1.1rem', color: '#28281E', marginBottom: '0.5rem' }}>
              {GHANAIAN_MESSAGES[messageIdx]}
            </p>
            <p style={{ color: '#A8A89E', fontSize: '0.85rem' }}>This usually takes 10–20 seconds</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {isPartial && !isPremium && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, marginBottom: '1.5rem', textAlign: 'left' }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <div>
                  <p style={{ fontWeight: 600, color: '#92400e', fontSize: '0.875rem' }}>3-Day Preview</p>
                  <p style={{ color: '#a16207', fontSize: '0.8rem' }}>Monday to Wednesday only. Upgrade to Premium for full 7-day plans always.</p>
                </div>
              </div>
            )}
            <div style={{ width: 80, height: 80, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2.5rem' }}>🍽️</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {isPartial ? 'Generate 3-Day Preview' : 'Generate Your 7-Day Plan'}
            </h3>
            <p style={{ color: '#A8A89E', fontSize: '0.9rem', maxWidth: 360, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              {isPremium
                ? 'Your AI-powered full plan with taste learning based on your ratings.'
                : isPartial
                ? 'Generations 8–10 on the free tier — 3-day preview plans only.'
                : 'Your first personalised meal plan, built around your profile and Ghanaian food culture.'}
            </p>
            <button onClick={handleGenerate} className="btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} />
              {isPartial ? 'Generate 3-Day Preview' : 'Generate Full Plan'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}