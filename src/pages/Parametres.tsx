import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Bell, Palette, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const profileSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  telephone: z.string().optional(),
})

const passwordSchema = z.object({
  password: z.string().min(8, '8 caractères minimum'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function ParametresPage() {
  const { collaborateur } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profil' | 'securite' | 'agence'>('profil')

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: savingProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      prenom: collaborateur?.prenom ?? '',
      nom: collaborateur?.nom ?? '',
      telephone: collaborateur?.telephone ?? '',
    },
  })

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors, isSubmitting: savingPwd } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const cls = 'w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors'

  const saveProfile = async (data: ProfileForm) => {
    if (!collaborateur) return
    const { error } = await supabase.from('collaborateurs').update({
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone || null,
    }).eq('id', collaborateur.id)
    if (error) toast.error(error.message)
    else toast.success('Profil mis à jour')
  }

  const savePassword = async (data: PasswordForm) => {
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) toast.error(error.message)
    else { toast.success('Mot de passe modifié'); resetPwd() }
  }

  const TABS = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    { id: 'agence', label: 'Agence', icon: Building2 },
  ] as const

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Paramètres</h1>
        <p className="text-text-muted text-sm mt-0.5">Gérez votre compte et les préférences de l'application</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-surface border border-border-color p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Profil */}
      {activeTab === 'profil' && (
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardBody>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-color">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-heading font-bold text-accent select-none">
                {collaborateur?.prenom?.[0]?.toUpperCase()}{collaborateur?.nom?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{collaborateur?.prenom} {collaborateur?.nom}</p>
                <p className="text-sm text-text-muted capitalize">{collaborateur?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Prénom *</label>
                  <input {...regProfile('prenom')} className={cls} />
                  {profileErrors.prenom && <p className="text-xs text-danger mt-1">{profileErrors.prenom.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nom *</label>
                  <input {...regProfile('nom')} className={cls} />
                  {profileErrors.nom && <p className="text-xs text-danger mt-1">{profileErrors.nom.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Téléphone</label>
                <input {...regProfile('telephone')} placeholder="+33 6 00 00 00 00" className={cls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <input value={collaborateur?.email ?? ''} disabled className={cls + ' opacity-50 cursor-not-allowed'} />
                <p className="text-xs text-text-muted mt-1">L'email ne peut pas être modifié ici</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={savingProfile}>Sauvegarder</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Sécurité */}
      {activeTab === 'securite' && (
        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handlePwd(savePassword)} className="space-y-4 max-w-sm">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Nouveau mot de passe *</label>
                <input type="password" {...regPwd('password')} className={cls} />
                {pwdErrors.password && <p className="text-xs text-danger mt-1">{pwdErrors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Confirmer *</label>
                <input type="password" {...regPwd('confirm')} className={cls} />
                {pwdErrors.confirm && <p className="text-xs text-danger mt-1">{pwdErrors.confirm.message}</p>}
              </div>
              <Button type="submit" loading={savingPwd}>Modifier le mot de passe</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Agence */}
      {activeTab === 'agence' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'agence</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Raison sociale</p>
                  <p className="text-text-primary font-medium">Mindeon Agency</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">SIRET</p>
                  <p className="text-text-primary">XXX XXX XXX XXXXX</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Email</p>
                  <p className="text-text-primary">contact@mindeon.fr</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Téléphone</p>
                  <p className="text-text-primary">+33 1 00 00 00 00</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Adresse</p>
                <p className="text-text-primary">1 rue de la Paix, 75001 Paris</p>
              </div>
              <p className="text-xs text-text-muted pt-2 border-t border-border-color">
                Ces informations apparaissent sur vos devis et factures PDF. Modifiez-les directement dans <code className="bg-bg-app px-1 rounded">src/lib/pdf.ts</code>.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Thème</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent border-2 border-white/30" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Mindeon Dark</p>
                  <p className="text-xs text-text-muted">Thème sombre par défaut</p>
                </div>
                <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Actif</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Tâches assignées', desc: 'Notification en temps réel quand une tâche vous est assignée', defaultOn: true },
                { label: 'Factures en retard', desc: 'Alerte quand une facture dépasse sa date d\'échéance', defaultOn: true },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">{n.label}</p>
                    <p className="text-xs text-text-muted">{n.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${n.defaultOn ? 'bg-accent' : 'bg-border-color'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.defaultOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
