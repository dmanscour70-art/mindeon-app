import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { tacheSchema, type TacheForm as TF } from '@/validations'
import { Button } from '@/components/ui/button'
import type { Collaborateur, Tache } from '@/types'

interface Props {
  tache?: Tache
  projetId: string
  collaborateurs: Collaborateur[]
  onSaved: () => void
  onCancel: () => void
}

export function TacheForm({ tache, projetId, collaborateurs, onSaved, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TF>({
    resolver: zodResolver(tacheSchema),
    defaultValues: {
      titre: tache?.titre ?? '',
      description: tache?.description ?? '',
      assignee_id: tache?.assignee_id ?? undefined,
      statut: tache?.statut ?? 'todo',
      priorite: tache?.priorite ?? 'medium',
      date_echeance: tache?.date_echeance ?? '',
      temps_estime: tache?.temps_estime ?? undefined,
    },
  })

  const onSubmit = async (data: TF) => {
    const payload = {
      titre: data.titre,
      description: data.description || null,
      assignee_id: data.assignee_id || null,
      statut: data.statut,
      priorite: data.priorite,
      date_echeance: data.date_echeance || null,
      temps_estime: data.temps_estime ?? null,
      projet_id: projetId,
    }
    try {
      if (tache?.id) {
        const { error } = await supabase.from('taches').update(payload).eq('id', tache.id)
        if (error) throw error
        toast.success('Tâche mise à jour')
      } else {
        const { error } = await supabase.from('taches').insert(payload)
        if (error) throw error
        toast.success('Tâche créée')
      }
      onSaved()
    } catch (e: unknown) { toast.error((e as Error).message) }
  }

  const cls = 'w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Titre *</label>
        <input {...register('titre')} className={cls} />
        {errors.titre && <p className="text-xs text-danger mt-1">{errors.titre.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
        <textarea {...register('description')} rows={2} className={cls + ' resize-none'} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Assigné à</label>
          <select {...register('assignee_id')} className={cls}>
            <option value="">Non assigné</option>
            {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Priorité</label>
          <select {...register('priorite')} className={cls}>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Statut</label>
          <select {...register('statut')} className={cls}>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="review">En révision</option>
            <option value="done">Terminé</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Date d'échéance</label>
          <input type="date" {...register('date_echeance')} className={cls} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Temps estimé (h)</label>
        <input type="number" step="0.5" {...register('temps_estime', { valueAsNumber: true })} className={cls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={isSubmitting}>{tache ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  )
}
