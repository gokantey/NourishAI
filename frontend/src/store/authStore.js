import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      onboardingComplete: false,
      subscriptionTier: 'free',
      hasPassword: true,

      setAuth: (user, tokens, onboardingComplete, subscriptionTier, hasPassword = true) => {
        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)
        set({
          user,
          isAuthenticated: true,
          onboardingComplete: onboardingComplete ?? false,
          subscriptionTier: subscriptionTier ?? 'free',
          hasPassword: hasPassword ?? true,
        })
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      setOnboardingComplete: (val) => set({ onboardingComplete: val }),

      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('auth-storage')
        set({ user: null, isAuthenticated: false, onboardingComplete: false, subscriptionTier: 'free', hasPassword: true })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('auth-storage')
        set({ user: null, isAuthenticated: false, onboardingComplete: false, subscriptionTier: 'free', hasPassword: true })
      },

      isPremium: () => {
        const state = get()
        return state.subscriptionTier === 'premium'
      },
    }),
    {
      name: 'nourishai-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
        subscriptionTier: state.subscriptionTier,
        hasPassword: state.hasPassword,
      }),
    }
  )
)

export default useAuthStore