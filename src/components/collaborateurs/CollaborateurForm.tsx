import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { collaborateurSchema, type CollaborateurForm as CF } from '@/validations'
import { Button } from '@/components/ui/button'
import type { Collaborateur } from '@/types'

interface Props {
  collaborateur?: Collaborateur
  onSaved: () => void
  onCancel: () => void
}

export function CollaborateurForm({ collaborateur: c, onSaved, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CF>({
    resolver: zodResolver(collaborateurSchema),
    defaultValues: {
      prenom: c?.prenom ?? '',
      nom: c?.nom ?? '',
      email: c?.email ?? '',
      telephone: c?.telephone ?? '',
      role: c?.role ?? 'developpeur',
    },
  })

  const onSubmit = async (data: CF) => {
    try {
      if (c?.id) {
        const { error } = await supabase.from('collaborateurs').update({
          prenom: data.prenom, nom: data.nom, telephone: data.telephone || null, role: data.role,
        }).eq('id', c.id)
        if (error) throw error
        toast.success('Collaborateur mis à jour')
      } else {
        const { error } = await supabase.from('collaborateurs').insert({
          prenom: data.prenom, nom: data.nom, email: data.email,
          telephone: data.telephone || null, role: data.role,
        })
        if (error) throw error
        toast.success('Collaborateur créé')
      }
      onSaved()
    } catch (e: unknown) { toast.error((e as Error).message) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Prénom *</label>
          <input {...register('prenom')} className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent" />
          {errors.prenom && <p className="text-xs text-danger mt-1">{errors.prenom.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Nom *</label>
          <input {...register('nom')} className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent" />
          {errors.nom && <p className="text-xs text-danger mt-1">{errors.nom.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
        <input type="email" {...register('email')} disabled={!!c?.id} className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent disabled:opacity-50" />
        {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Téléphone</label>
          <input {...register('telephone')} className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Rôle *</label>
          <select {...register('role')} className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent">
            <option value="admin">Admin</option>
            <option value="chef_projet">Chef de projet</option>
            <option value="developpeur">Développeur·se</option>
            <option value="commercial">Commercial·e</option>
            <option value="designer">Designer</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={isSubmitting}>{c ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  )
}
