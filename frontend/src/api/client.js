import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach access token to every request ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-refresh on 401 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh })
          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth endpoints ──
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  verifyOTP: (data) => api.post('/auth/verify-otp/', data),
  resendOTP: () => api.post('/auth/resend-otp/'),
  login: (data) => api.post('/auth/login/', data),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
}

// ── Profile endpoints ──
export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.patch('/profile/update/', data),
  onboardingStep1: (data) => api.post('/onboarding/step1/', data),
  onboardingStep2: (data) => api.post('/onboarding/step2/', data),
  onboardingStep3: (data) => api.post('/onboarding/step3/', data),
}

// ── Meal plan endpoints ──
export const mealsAPI = {
  dashboard: () => api.get('/dashboard/'),
  generate: () => api.post('/plans/generate/'),
  history: () => api.get('/plans/'),
  getPlan: (pk) => api.get(`/plans/${pk}/`),
  deletePlan: (pk) => api.delete(`/plans/${pk}/delete/`),
  savePlan: (pk, data) => api.post(`/plans/${pk}/save/`, data),
  unsavePlan: (pk) => api.post(`/plans/${pk}/unsave/`),
  regenerateMeal: (pk) => api.post(`/meals/${pk}/regenerate/`),
  rateMeal: (pk, rating) => api.post(`/meals/${pk}/rate/`, { rating }),
  exportPdf: (pk) => api.get(`/plans/${pk}/export-pdf/`, { responseType: 'blob' }),
  sharePlan: (pk) => api.post(`/plans/${pk}/share/`),
  getSharedPlan: (token) => api.get(`/shared/${token}/`),
  generateSnacks: (pk) => api.post(`/plans/${pk}/snacks/`),
  rebalancePlan: (pk) => api.post(`/plans/${pk}/rebalance/`),
}

// ── Upgrade endpoints ──
export const upgradeAPI = {
  createCheckout: () => api.post('/upgrade/checkout/'),
  verifySuccess: (reference) => api.get(`/upgrade/success/?reference=${reference}`),
  cancel: () => api.post('/upgrade/cancel/'),
}

// ── Progress endpoints ──
export const progressAPI = {
  get:              () => api.get('/progress/'),
  checkin:          (completed_items) => api.post('/progress/checkin/', { completed_items }),
  useFreeze:        () => api.post('/progress/freeze/'),
  saveChecklistPrefs: (items) => api.post('/progress/checklist-prefs/', { items }),
}

export default api