import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOTPPage from './pages/VerifyOTPPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import GeneratePlanPage from './pages/GeneratePlanPage'
import MealPlanPage from './pages/MealPlanPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import UpgradePage from './pages/UpgradePage'
import UpgradeSuccessPage from './pages/UpgradeSuccessPage'
import ProgressPage from './pages/ProgressPage'

// Layout
import AppLayout from './components/layout/AppLayout'

// Route guards
function PrivateRoute({ children }) {
  const { isAuthenticated, onboardingComplete } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  return children
}

function OnboardingRoute({ children }) {
  const { isAuthenticated, onboardingComplete } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (onboardingComplete) return <Navigate to="/dashboard" replace />
  return children
}

function PremiumRoute({ children }) {
  const { isAuthenticated, onboardingComplete, subscriptionTier } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  if (subscriptionTier !== 'premium') return <Navigate to="/upgrade" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, onboardingComplete } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to={onboardingComplete ? '/dashboard' : '/onboarding'} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#28281E',
            borderRadius: '16px',
            border: '1px solid #EEEEE8',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)',
            fontSize: '0.875rem',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#2D6A4F', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOTPPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password/:uid/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

        {/* Protected app routes */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/generate" element={<GeneratePlanPage />} />
          <Route path="/plans/:pk" element={<MealPlanPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/upgrade/success" element={<UpgradeSuccessPage />} />
          <Route path="/progress" element={<PremiumRoute><ProgressPage /></PremiumRoute>} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}