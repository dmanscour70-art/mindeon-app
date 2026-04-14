import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Collaborateur } from '@/types'

interface AuthState {
  user: User | null
  collaborateur: Collaborateur | null
  loading: boolean
  setUser: (user: User | null) => void
  setCollaborateur: (c: Collaborateur | null) => void
  setLoading: (b: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  collaborateur: null,
  loading: true,
  setUser: (user) => set({ user }),
  setCollaborateur: (collaborateur) => set({ collaborateur }),
  setLoading: (loading) => set({ loading }),
}))
