import { create } from 'zustand'
import { Profile } from '@/lib/types/database'

interface AuthState {
  profile: Profile | null
  session: any | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setSession: (session: any | null) => void
  setIsLoading: (isLoading: boolean) => void
  clearAuth: () => void
  
  // Helpers
  isAdmin: () => boolean
  isCafeteria: () => boolean
  isRider: () => boolean
  isEstudiante: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  session: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ profile: null, session: null, isLoading: false }),

  isAdmin: () => get().profile?.role === 'admin',
  isCafeteria: () => get().profile?.role === 'cafeteria',
  isRider: () => get().profile?.role === 'repartidor',
  isEstudiante: () => get().profile?.role === 'estudiante',
}))
