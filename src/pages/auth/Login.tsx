import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Connexion réussie !')
      } else {
        await signUp(email, password)
        toast.success('Compte créé ! Vous êtes connecté.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(
        msg.includes('Invalid login credentials') ? 'Email ou mot de passe incorrect' :
        msg.includes('already registered') ? 'Cet email est déjà utilisé' :
        msg.includes('Password should be') ? 'Mot de passe trop court (6 caractères minimum)' :
        msg
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
      {/* Décor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-accent shadow-glow mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Mindeon</h1>
          <p className="text-text-muted text-sm">Automatisation & Intelligence Artificielle</p>
        </div>

        {/* Card */}
        <div className="bg-bg-surface border border-border-color rounded-2xl p-8">
          {/* Toggle */}
          <div className="flex bg-bg-app rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@mindeon.fr"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-app border border-border-color rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 bg-bg-app border border-border-color rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-text-muted mt-1">6 caractères minimum</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © {new Date().getFullYear()} Mindeon — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
