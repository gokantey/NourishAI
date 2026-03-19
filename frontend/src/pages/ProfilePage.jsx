import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { profileAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const REGION_OPTIONS = [
  ['greater_accra', 'Greater Accra'], ['ashanti', 'Ashanti'], ['western', 'Western'],
  ['central', 'Central'], ['eastern', 'Eastern'], ['volta', 'Volta'], ['oti', 'Oti'],
  ['northern', 'Northern'], ['savannah', 'Savannah'], ['north_east', 'North East'],
  ['upper_east', 'Upper East'], ['upper_west', 'Upper West'], ['bono', 'Bono'],
  ['bono_east', 'Bono East'], ['ahafo', 'Ahafo'], ['western_north', 'Western North'],
]

const ALLERGY_OPTIONS = [
  ['nuts', '🥜 Nuts'], ['gluten', '🌾 Gluten'], ['dairy', '🥛 Dairy'],
  ['shellfish', '🦐 Shellfish'], ['eggs', '🥚 Eggs'], ['soy', '🫘 Soy'],
]

const DIET_OPTIONS = [
  ['none', '🍽️ No Restriction'], ['vegan', '🌱 Vegan'], ['vegetarian', '🥦 Vegetarian'],
  ['keto', '🥩 Keto'], ['halal', '☪️ Halal'], ['gluten_free', '🌾 Gluten Free'], ['paleo', '🦴 Paleo'],
]

const FITNESS_OPTIONS = [
  ['lose_weight', '📉 Lose Weight'], ['maintain', '⚖️ Maintain Weight'], ['build_muscle', '💪 Build Muscle'],
]

// ── Defined outside to avoid remount ──
function ToggleBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '0.5rem 0.75rem', borderRadius: '0.75rem', fontSize: '0.82rem', cursor: 'pointer',
        border: `1px solid ${active ? '#2D6A4F' : '#E0E0D8'}`,
        background: active ? '#f0fdf4' : 'white',
        color: active ? '#2D6A4F' : '#88887E',
        fontWeight: active ? 600 : 400, fontFamily: 'var(--font-body)',
        transition: 'all 0.15s', textAlign: 'left', width: '100%',
      }}>
      {children}
    </button>
  )
}

export default function ProfilePage() {
  const { user, subscriptionTier } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isPremium = subscriptionTier === 'premium'

  useEffect(() => {
    profileAPI.get().then((res) => {
      setProfile(res.data)
      setForm({
        date_of_birth: res.data.date_of_birth || '', height: res.data.height || '', weight: res.data.weight || '',
        region: res.data.region || '', dietary_preference: res.data.dietary_preference || 'none',
        allergies: res.data.allergies || [], other_allergy: res.data.other_allergy || '',
        health_conditions: res.data.health_conditions || [],
        other_health_condition: res.data.other_health_condition || '',
        fitness_goal: res.data.fitness_goal || 'maintain', budget: res.data.budget || '',
      })
    }).catch(() => toast.error('Failed to load profile.')).finally(() => setLoading(false))
  }, [])

  const toggleArray = (field, val) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter((v) => v !== val) : [...f[field], val],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await profileAPI.update(form)
      toast.success('Profile updated! ✅')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 20 }} />)}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Keep your details updated for accurate meal plans</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--lime-dark), var(--amber))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>
              {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>@{user?.username}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{user?.email}</div>
            <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 9999, background: isPremium ? '#fff4f0' : '#F5F5F0', color: isPremium ? '#F4845F' : '#A8A89E' }}>
              {isPremium ? '✨ Premium' : 'Free Plan'}
            </div>
          </div>

          {profile && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Current Stats</p>
              {[
                ['BMI', `${profile.bmi ?? '—'} (${profile.bmi_category ?? '—'})`],
                ['Age', profile.age ? `${profile.age} years` : '—'],
                ['Calories', profile.daily_calorie_target ? `${profile.daily_calorie_target} kcal/day` : '—'],
                ['Water', profile.daily_water_intake ? `${profile.daily_water_intake}L/day` : '—'],
                ['Gen Reset', profile.generation_status?.reset_date ? new Date(profile.generation_status.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Body */}
          <section>
            <h3 style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Body Measurements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input"
                  max={new Date().toISOString().split('T')[0]}
                  value={form.date_of_birth || ''}
                  onChange={(e) => setForm((s) => ({ ...s, date_of_birth: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[['height', 'Height (cm)', '175'], ['weight', 'Weight (kg)', '70']].map(([f, l, p]) => (
                  <div key={f}>
                    <label className="label">{l}</label>
                    <input type="number" className="input" placeholder={p} value={form[f] || ''} onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Location</h3>
            <label className="label">Region in Ghana</label>
            <select className="input" value={form.region || ''} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))}>
              <option value="">— Select region —</option>
              {REGION_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </section>

          {/* Diet */}
          <section>
            <h3 style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Diet & Allergies</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label" style={{ marginBottom: '0.5rem' }}>Dietary Preference</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {DIET_OPTIONS.map(([v, l]) => (
                  <ToggleBtn key={v} active={form.dietary_preference === v} onClick={() => setForm((s) => ({ ...s, dietary_preference: v }))}>{l}</ToggleBtn>
                ))}
              </div>
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.5rem' }}>Allergies</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {ALLERGY_OPTIONS.map(([v, l]) => (
                  <ToggleBtn key={v} active={(form.allergies || []).includes(v)} onClick={() => toggleArray('allergies', v)}>{l}</ToggleBtn>
                ))}
              </div>
              <textarea className="input" rows={2} style={{ resize: 'none', fontSize: '0.875rem' }}
                placeholder="Other allergy not listed..."
                value={form.other_allergy || ''}
                onChange={(e) => setForm((s) => ({ ...s, other_allergy: e.target.value }))} />
            </div>
          </section>

          {/* Goals */}
          <section>
            <h3 style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Goals & Budget</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label" style={{ marginBottom: '0.5rem' }}>Fitness Goal</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {FITNESS_OPTIONS.map(([v, l]) => (
                  <ToggleBtn key={v} active={form.fitness_goal === v} onClick={() => setForm((s) => ({ ...s, fitness_goal: v }))}>{l}</ToggleBtn>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Weekly Budget (₵)</label>
              <input type="number" className="input" placeholder="50" value={form.budget || ''} onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value }))} />
            </div>
          </section>

          <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {saving
              ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              : <><Save size={18} /> Save Changes</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}