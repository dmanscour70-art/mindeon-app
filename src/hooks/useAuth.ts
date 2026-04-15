import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { Collaborateur } from '@/types'

export function useAuth() {
  const { user, collaborateur, loading, setUser, setCollaborateur, setLoading } = useAuthStore()

  useEffect(() => {
    // Récupère la session initiale
    // Force loading=false after 5s max to avoid infinite spinner
    const timeout = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      if (session?.user) {
        try { await loadCollaborateur(session.user.id, session.user.email ?? '') } catch {}
      }
      setLoading(false)
    }).catch(() => { clearTimeout(timeout); setLoading(false) })

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try { await loadCollaborateur(session.user.id, session.user.email ?? '') } catch {}
        } else {
          setCollaborateur(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadCollaborateur(userId: string, email: string) {
    // Cherche le collaborateur lié
    const { data } = await supabase
      .from('collaborateurs')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      setCollaborateur(data as Collaborateur)
      return
    }

    // Création auto au premier login
    const emailParts = email.split('@')[0].split('.')
    const prenom = capitalize(emailParts[0] ?? 'Utilisateur')
    const nom = capitalize(emailParts[1] ?? 'Inconnu')

    const { data: newCollab } = await supabase
      .from('collaborateurs')
      .insert({ user_id: userId, email, prenom, nom, role: 'admin' })
      .select()
      .single()

    if (newCollab) setCollaborateur(newCollab as Collaborateur)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setCollaborateur(null)
  }

  return { user, collaborateur, loading, signIn, signUp, signOut }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
