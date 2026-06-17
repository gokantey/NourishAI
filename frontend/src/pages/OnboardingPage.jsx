import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Leaf, ChevronRight, ChevronLeft, Check, Utensils, HeartPulse, Wallet, Zap } from 'lucide-react'
import { profileAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

// Step -1 is the intro splash, steps 0-2 are data collection
const STEPS = ['Your Body', 'Diet & Allergies', 'Goals & Region']

const ALLERGY_OPTIONS = [
  ['nuts', '🥜 Nuts'], ['gluten', '🌾 Gluten'], ['dairy', '🥛 Dairy'],
  ['shellfish', '🦐 Shellfish'], ['eggs', '🥚 Eggs'], ['soy', '🫘 Soy'],
]
const DIET_OPTIONS = [
  ['none', '🍽️ No Restriction'], ['vegan', '🌱 Vegan'], ['vegetarian', '🥦 Vegetarian'],
  ['keto', '🥩 Keto'], ['halal', '☪️ Halal'], ['gluten_free', '🌾 Gluten Free'], ['paleo', '🦴 Paleo'],
]
const REGION_OPTIONS = [
  ['greater_accra', 'Greater Accra'], ['ashanti', 'Ashanti'], ['western', 'Western'],
  ['central', 'Central'], ['eastern', 'Eastern'], ['volta', 'Volta'], ['oti', 'Oti'],
  ['northern', 'Northern'], ['savannah', 'Savannah'], ['north_east', 'North East'],
  ['upper_east', 'Upper East'], ['upper_west', 'Upper West'], ['bono', 'Bono'],
  ['bono_east', 'Bono East'], ['ahafo', 'Ahafo'], ['western_north', 'Western North'],
]
const FITNESS_OPTIONS = [
  ['lose_weight', '📉 Lose Weight'], ['maintain', '⚖️ Maintain Weight'], ['build_muscle', '💪 Build Muscle'],
]
const SEX_OPTIONS = [
  ['male', '♂ Male'], ['female', '♀ Female'], ['prefer_not_to_say', '— Prefer not to say'],
]
const ACTIVITY_OPTIONS = [
  ['sedentary', '🪑 Sedentary', 'Desk job, little exercise'],
  ['lightly_active', '🚶 Lightly Active', 'Light exercise 1–3×/week'],
  ['moderately_active', '🏃 Moderately Active', 'Moderate exercise 3–5×/week'],
  ['very_active', '⚡ Very Active', 'Hard exercise 6–7×/week'],
]

// ── Helpers ──
function calcBMI(height, weight) {
  const h = parseFloat(height)
  const w = parseFloat(weight)
  if (!h || !w || h < 50 || w < 10) return null
  return (w / ((h / 100) ** 2)).toFixed(1)
}

function getBMICategory(bmi) {
  const b = parseFloat(bmi)
  if (b < 18.5) return { label: 'Underweight', color: '#60a5fa' }
  if (b < 25) return { label: 'Normal weight', color: '#22c55e' }
  if (b < 30) return { label: 'Overweight', color: '#f59e0b' }
  return { label: 'Obese', color: '#ef4444' }
}

// ── Sub-components ──
function ToggleButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.75rem', borderRadius: '0.75rem', width: '100%',
        border: `1px solid ${active ? '#2D6A4F' : '#E0E0D8'}`,
        background: active ? '#f0fdf4' : 'white',
        color: active ? '#2D6A4F' : '#88887E',
        fontWeight: active ? 600 : 400, fontSize: '0.85rem',
        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
      }}>
      {children}
    </button>
  )
}

function ActivityToggle({ active, onClick, label, description }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
        padding: '0.625rem 0.75rem', borderRadius: '0.75rem', width: '100%',
        border: `1px solid ${active ? '#2D6A4F' : '#E0E0D8'}`,
        background: active ? '#f0fdf4' : 'white',
        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
      }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `2px solid ${active ? '#2D6A4F' : '#C8C8BE'}`,
        background: active ? '#2D6A4F' : 'transparent',
        flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: active ? '#2D6A4F' : '#3a3a35' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: '#88887E', marginTop: 2 }}>{description}</div>
      </div>
    </button>
  )
}

function CheckboxItem({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.45rem 0.625rem', borderRadius: '0.625rem', width: '100%',
        border: `1px solid ${checked ? '#2D6A4F' : '#E0E0D8'}`,
        background: checked ? '#f0fdf4' : 'white',
        color: checked ? '#2D6A4F' : '#88887E',
        fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
      }}>
      <span style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checked ? '#2D6A4F' : '#C8C8BE'}`, background: checked ? '#2D6A4F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {checked && <Check size={9} color="var(--night)" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )
}

// ── Intro Splash (step -1) ──
function IntroSplash({ onStart }) {
  const features = [
    { icon: <Utensils size={16} />, title: 'Culturally tailored meals', desc: 'Ghanaian dishes matched to your region and taste' },
    { icon: <HeartPulse size={16} />, title: 'Health-aware nutrition', desc: 'Respects your conditions, allergies & dietary needs' },
    { icon: <Wallet size={16} />, title: 'Budget-conscious', desc: 'Meal plans that fit your weekly food spend' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 40, height: 40, background: '#2D6A4F', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(45,106,79,0.35)' }}>
            <Leaf size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>
            Nourish<span style={{ color: '#F4845F' }}>AI</span>
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: '0.625rem' }}>
          Your personal Ghanaian<br />meal plan, built for you
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          We'll use your body data, health needs, and budget to generate a 7-day plan of authentic Ghanaian meals you'll actually enjoy.
        </p>
      </div>

      {/* Illustrated mock plan preview */}
      <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #fef9f0)',
          border: '1px solid #d1fae5', borderRadius: 20, padding: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.625rem',
          filter: 'blur(1.5px)', opacity: 0.7,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {['🍚 Waakye with boiled egg & shito', '🍲 Fufu with groundnut soup', '🥘 Jollof rice & grilled tilapia'].map((meal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '1.1rem' }}>{meal.split(' ')[0]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2D2D28' }}>{meal.slice(2)}</div>
                <div style={{ fontSize: '0.72rem', color: '#88887E', marginTop: 2 }}>~{[450, 680, 580][i]} kcal · {['breakfast', 'lunch', 'dinner'][i]}</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#2D6A4F' }}>{['Mon', 'Mon', 'Mon'][i]}</div>
            </div>
          ))}
        </div>
        {/* Overlay label */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(45,106,79,0.92)', borderRadius: 14, padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(4px)' }}>
            <Zap size={14} color="#c8f135" fill="#c8f135" />
            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>Your plan generates in seconds</span>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
        {features.map(({ icon, title, desc }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.75rem 1rem', borderRadius: 14,
              background: 'var(--surface)', border: '1px solid var(--border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
            </div>
            <Check size={15} color="#2D6A4F" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </motion.div>
        ))}
      </div>

      <button onClick={onStart}
        style={{
          width: '100%', padding: '0.875rem 1rem',
          background: 'linear-gradient(135deg, #2D6A4F, #1B4332)',
          color: 'white', border: 'none', borderRadius: 14,
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          boxShadow: '0 4px 20px rgba(45,106,79,0.4)',
          fontFamily: 'var(--font-display)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(45,106,79,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(45,106,79,0.4)' }}
      >
        Get started — takes 2 minutes <ChevronRight size={18} />
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
        Free to use · No credit card required
      </p>
    </motion.div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { setOnboardingComplete, user } = useAuthStore()
  // step -1 = intro, 0/1/2 = data collection
  const [step, setStep] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [step1, setStep1] = useState({ date_of_birth: '', height: '', weight: '', sex: '', activity_level: 'lightly_active' })
  const [step2, setStep2] = useState({ dietary_preference: 'none', allergies: [], other_allergy: '' })
  const [step3, setStep3] = useState({ region: '', fitness_goal: 'maintain', budget: '' })

  // Live BMI calculation
  const bmi = calcBMI(step1.height, step1.weight)
  const bmiInfo = bmi ? getBMICategory(bmi) : null

  const toggleArray = (setter, field, val) => {
    setter((s) => ({
      ...s,
      [field]: s[field].includes(val) ? s[field].filter((v) => v !== val) : [...s[field], val],
    }))
  }

  const validateStep = () => {
    const errs = {}
    if (step === 0) {
      if (!step1.date_of_birth) errs.date_of_birth = 'Required'
      else {
        const dob = new Date(step1.date_of_birth)
        const today = new Date()
        const age = today.getFullYear() - dob.getFullYear() - ((today.getMonth(), today.getDate()) < (dob.getMonth(), dob.getDate()) ? 1 : 0)
        if (age < 10) errs.date_of_birth = 'You must be at least 10 years old'
        if (age > 100) errs.date_of_birth = 'Please enter a valid date of birth'
        if (dob > today) errs.date_of_birth = 'Date of birth cannot be in the future'
      }
      if (!step1.height) errs.height = 'Required'
      if (!step1.weight) errs.weight = 'Required'
      if (!step1.sex) errs.sex = 'Please select one'
    }
    if (step === 2) {
      if (!step3.region) errs.region = 'Please select your region'
      if (!step3.budget) errs.budget = 'Required'
      else if (Number(step3.budget) <= 0) errs.budget = 'Must be greater than 0'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      if (step === 0) { await profileAPI.onboardingStep1(step1); setStep(1) }
      else if (step === 1) { await profileAPI.onboardingStep2(step2); setStep(2) }
      else {
        await profileAPI.onboardingStep3(step3)
        setOnboardingComplete(true)
        toast.success("Profile complete! Let's generate your first plan.")
        navigate('/dashboard')
      }
    } catch (err) {
      const data = err.response?.data
      if (data) setErrors(data)
      else toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render intro splash outside the card layout ──
  if (step === -1) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <IntroSplash onStart={() => setStep(0)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 36, height: 36, background: '#2D6A4F', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
              Nourish<span style={{ color: '#F4845F' }}>AI</span>
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
            Let's set up your profile, {user?.first_name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Step {step + 1} of 3 — {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 5, flex: 1, borderRadius: 9999, background: i <= step ? '#2D6A4F' : '#E0E0D8', transition: 'background 0.4s' }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', borderRadius: 24, boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)', border: '1px solid var(--border)', padding: '1.75rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, background: 'var(--lime-glow)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              {['📏', '🥗', '🎯'][step]}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.1rem', color: 'var(--text)' }}>{STEPS[step]}</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {['Enter your body measurements for accurate nutrition targets', 'Tell us about your dietary preferences and allergies', 'Set your goals and weekly food budget'][step]}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>

              {/* ── Step 1: Body ── */}
              {step === 0 && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label className="label">Date of Birth</label>
                      <input type="date" className={`input${errors.date_of_birth ? ' input-error' : ''}`}
                        max={new Date().toISOString().split('T')[0]}
                        value={step1.date_of_birth}
                        onChange={(e) => setStep1((s) => ({ ...s, date_of_birth: e.target.value }))} />
                      {errors.date_of_birth && <p className="error-text">{errors.date_of_birth}</p>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {[['height', 'Height (cm)', '170'], ['weight', 'Weight (kg)', '65']].map(([field, label, ph]) => (
                        <div key={field}>
                          <label className="label">{label}</label>
                          <input type="number" className={`input${errors[field] ? ' input-error' : ''}`}
                            placeholder={ph} value={step1[field]}
                            onChange={(e) => setStep1((s) => ({ ...s, [field]: e.target.value }))} />
                          {errors[field] && <p className="error-text">{errors[field]}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Sex */}
                    <div>
                      <label className="label" style={{ marginBottom: '0.5rem' }}>Biological Sex <span style={{ color: '#ef4444' }}>*</span></label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {SEX_OPTIONS.map(([value, label]) => (
                          <ToggleButton key={value} active={step1.sex === value} onClick={() => { setStep1((s) => ({ ...s, sex: value })); setErrors((e) => ({ ...e, sex: '' })) }}>
                            {label}
                          </ToggleButton>
                        ))}
                      </div>
                      {errors.sex && <p className="error-text">{errors.sex}</p>}
                    </div>

                    {/* Activity Level */}
                    <div>
                      <label className="label" style={{ marginBottom: '0.5rem' }}>Activity Level</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {ACTIVITY_OPTIONS.map(([value, label, description]) => (
                          <ActivityToggle
                            key={value}
                            active={step1.activity_level === value}
                            onClick={() => setStep1((s) => ({ ...s, activity_level: value }))}
                            label={label}
                            description={description}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live BMI preview */}
                  {bmi && bmiInfo ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--deep)', borderRadius: 14, border: '1px solid var(--border)' }}>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, color: bmiInfo.color, lineHeight: 1 }}>{bmi}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>BMI</div>
                      </div>
                      <div style={{ width: 1, height: 40, background: '#EEEEE8' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: bmiInfo.color, fontSize: '0.9rem' }}>{bmiInfo.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Healthy range: 18.5 – 24.9
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div style={{ padding: '0.875rem 1rem', background: 'rgba(245,166,35,0.1)', borderRadius: 12, border: '1px solid #ffe8e0', fontSize: '0.8rem', color: '#F4845F' }}>
                      🍽️ Enter your height and weight above to see your BMI
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Diet & Allergies only ── */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label className="label" style={{ marginBottom: '0.5rem' }}>Dietary Preference</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {DIET_OPTIONS.map(([value, label]) => (
                        <ToggleButton key={value} active={step2.dietary_preference === value} onClick={() => setStep2((s) => ({ ...s, dietary_preference: value }))}>
                          {label}
                        </ToggleButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label" style={{ marginBottom: '0.5rem' }}>Allergies</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      {ALLERGY_OPTIONS.map(([value, label]) => (
                        <CheckboxItem key={value} label={label} checked={step2.allergies.includes(value)} onChange={() => toggleArray(setStep2, 'allergies', value)} />
                      ))}
                    </div>
                    <textarea className="input" rows={2} style={{ resize: 'none', fontSize: '0.875rem' }}
                      placeholder="Other allergy not listed (e.g. Mango, Avocado...)"
                      value={step2.other_allergy}
                      onChange={(e) => setStep2((s) => ({ ...s, other_allergy: e.target.value }))} />
                  </div>

                  {/* Soft prompt to add health conditions later */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.75rem 0.875rem', background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
                    <HeartPulse size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '0.8rem', color: '#5a5aad', lineHeight: 1.5, margin: 0 }}>
                      Have a health condition like diabetes or hypertension?{' '}
                      <strong>You can add it after setup</strong> in your Profile — your meal plan will update automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 3: Goals ── */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="label">Region in Ghana <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className={`input${errors.region ? ' input-error' : ''}`} value={step3.region}
                      onChange={(e) => { setStep3((s) => ({ ...s, region: e.target.value })); setErrors((err) => ({ ...err, region: '' })) }}>
                      <option value="">— Select your region —</option>
                      {REGION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    {errors.region && <p className="error-text">{errors.region}</p>}
                  </div>

                  <div>
                    <label className="label" style={{ marginBottom: '0.5rem' }}>Fitness Goal <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {FITNESS_OPTIONS.map(([value, label]) => (
                        <ToggleButton key={value} active={step3.fitness_goal === value} onClick={() => setStep3((s) => ({ ...s, fitness_goal: value }))}>
                          {label}
                        </ToggleButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Weekly Food Budget (₵) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="number" className={`input${errors.budget ? ' input-error' : ''}`}
                      placeholder="e.g. 50" value={step3.budget}
                      onChange={(e) => { setStep3((s) => ({ ...s, budget: e.target.value })); setErrors((err) => ({ ...err, budget: '' })) }} />
                    {errors.budget && <p className="error-text">{errors.budget}</p>}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button onClick={() => setStep(step > 0 ? step - 1 : -1)} disabled={loading} className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={handleNext} disabled={loading} className="btn btn-primary btn-lg"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading
              ? <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              : step === 2
                ? <><Check size={18} /> Complete Setup</>
                : <>Continue <ChevronRight size={18} /></>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}