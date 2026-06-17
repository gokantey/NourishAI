import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Public endpoints that never need an access token ──
const PUBLIC_ENDPOINTS = [
  '/health',
  '/auth/login', '/auth/register', '/auth/verify-otp', '/auth/resend-otp',
  '/auth/google', '/auth/forgot-password', '/auth/reset-password',
  '/auth/token/refresh', '/shared/',
]

function isPublicEndpoint(url = '') {
  return PUBLIC_ENDPOINTS.some(p => url.includes(p))
}

// ── Request interceptor: attach token OR abort if logged out ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (!isPublicEndpoint(config.url)) {
    // No token and not a public endpoint — cancel the request immediately.
    // This stops all in-flight requests the moment tokens are cleared,
    // preventing the retry loop after suspension/deletion/logout.
    const controller = new AbortController()
    controller.abort()
    config.signal = controller.signal
  }

  return config
})

// ── Single shared refresh promise ──
let _refreshPromise = null

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = axios
    .post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: localStorage.getItem('refresh_token'),
    })
    .then((res) => {
      localStorage.setItem('access_token', res.data.access)
      return res.data.access
    })
    .catch((err) => {
      const code = err.response?.data?.error_code
      const detail = (err.response?.data?.detail || '').toLowerCase()
      if (code === 'account_suspended' || detail.includes('inactive')) {
        forceLogout('account_suspended')
      } else {
        forceLogout('session_expired')
      }
      throw err
    })
    .finally(() => { _refreshPromise = null })
  return _refreshPromise
}

function forceLogout(reason) {
  // Clear tokens first — the request interceptor will abort any new requests
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('auth-storage')
  window.location.href = `/login?reason=${reason}`
}

// ── Response interceptor ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Aborted requests (from our request interceptor) — ignore silently
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    const original = error.config
    const status = error.response?.status
    const data = error.response?.data || {}
    const detail = (data.detail || '').toLowerCase()

    // 403: explicitly suspended
    if (status === 403 && data.error_code === 'account_suspended') {
      forceLogout('account_suspended')
      return Promise.reject(error)
    }

    if (status === 401) {
      // Auth endpoints — pass through, don't retry
      if (isPublicEndpoint(original.url || '')) return Promise.reject(error)

      // Suspended user — detected via "inactive" in detail message
      if (data.error_code === 'account_suspended' || detail.includes('inactive')) {
        forceLogout('account_suspended')
        return Promise.reject(error)
      }

      // Try refresh once
      if (!original._retry) {
        original._retry = true
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) {
          window.location.href = '/login'
          return Promise.reject(error)
        }
        try {
          const newAccess = await refreshAccessToken()
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        } catch {
          return Promise.reject(error)
        }
      }
    }

    return Promise.reject(error)
  }
)

// ── Auth endpoints ──
export const authAPI = {
  ping: () => api.get('/health/'),
  register: (data) => api.post('/auth/register/', data),
  verifyOTP: (data) => api.post('/auth/verify-otp/', data),
  resendOTP: (data) => api.post('/auth/resend-otp/', data),
  login: (data) => api.post('/auth/login/', data),
  googleAuth: (id_token) => api.post('/auth/google/', { id_token }),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
}

// ── Profile endpoints ──
export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.patch('/profile/update/', data),
  deleteAccount: (password) => api.post('/profile/delete/', { password }),
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