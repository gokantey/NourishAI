import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Leaf, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { profileAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const STEPS = ['Your Body', 'Diet & Health', 'Goals & Region']

const ALLERGY_OPTIONS = [
  ['nuts', '🥜 Nuts'], ['gluten', '🌾 Gluten'], ['dairy', '🥛 Dairy'],
  ['shellfish', '🦐 Shellfish'], ['eggs', '🥚 Eggs'], ['soy', '🫘 Soy'],
]
const DIET_OPTIONS = [
  ['none', '🍽️ No Restriction'], ['vegan', '🌱 Vegan'], ['vegetarian', '🥦 Vegetarian'],
  ['keto', '🥩 Keto'], ['halal', '☪️ Halal'], ['gluten_free', '🌾 Gluten Free'], ['paleo', '🦴 Paleo'],
]
const HEALTH_GROUPS = [
  { label: 'Metabolic & Endocrine', conditions: [
    ['type1_diabetes', 'Type 1 Diabetes'], ['type2_diabetes', 'Type 2 Diabetes'],
    ['hypertension', 'Hypertension'], ['high_cholesterol', 'High Cholesterol'],
    ['hypothyroidism', 'Hypothyroidism'], ['hyperthyroidism', 'Hyperthyroidism'],
    ['fatty_liver', 'Fatty Liver'], ['gout', 'Gout'],
  ]},
  { label: 'Blood & Immune', conditions: [
    ['anaemia', 'Anaemia'], ['sickle_cell', 'Sickle Cell'], ['hiv_aids', 'HIV/AIDS'],
  ]},
  { label: 'Digestive', conditions: [
    ['celiac_disease', 'Celiac Disease'], ['lactose_intolerance', 'Lactose Intolerance'],
    ['gastritis', 'Gastritis / Acid Reflux'], ['ibs', 'IBS'], ['kidney_disease', 'Kidney Disease'],
  ]},
  { label: 'Hormonal, Respiratory & Other', conditions: [
    ['pcos', 'PCOS'], ['asthma', 'Asthma'], ['heart_disease', 'Heart Disease'],
    ['stroke_history', 'Stroke History'], ['cancer', 'Cancer'], ['osteoporosis', 'Osteoporosis'],
    ['arthritis', 'Arthritis'],
  ]},
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

// ── Sub-components outside parent ──
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

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { setOnboardingComplete, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [step1, setStep1] = useState({ date_of_birth: '', height: '', weight: '' })
  const [step2, setStep2] = useState({ dietary_preference: 'none', allergies: [], other_allergy: '', health_conditions: [], other_health_condition: '' })
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
        toast.success("Profile complete! Let's generate your first plan 🎉")
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
            Let's set up your profile, {user?.first_name} 👋
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
                {['Enter your body measurements for accurate nutrition targets', 'Tell us about your dietary preferences and health', 'Set your goals and weekly food budget'][step]}
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

              {/* ── Step 2: Diet & Health ── */}
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

                  <div>
                    <label className="label" style={{ marginBottom: '0.5rem' }}>
                      Health Conditions <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    {HEALTH_GROUPS.map((group) => (
                      <div key={group.label} style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{group.label}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                          {group.conditions.map(([value, label]) => (
                            <CheckboxItem key={value} label={label} checked={step2.health_conditions.includes(value)} onChange={() => toggleArray(setStep2, 'health_conditions', value)} />
                          ))}
                        </div>
                      </div>
                    ))}
                    <textarea className="input" rows={2} style={{ resize: 'none', fontSize: '0.875rem' }}
                      placeholder="Other condition not listed..."
                      value={step2.other_health_condition}
                      onChange={(e) => setStep2((s) => ({ ...s, other_health_condition: e.target.value }))} />
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
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} disabled={loading} className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
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