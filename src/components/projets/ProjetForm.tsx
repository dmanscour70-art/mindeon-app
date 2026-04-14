import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { projetSchema, type ProjetForm as PF } from '@/validations'
import { Button } from '@/components/ui/button'
import type { Client, Collaborateur, Projet } from '@/types'

interface Props {
  projet?: Projet
  onSaved: () => void
  onCancel: () => void
}

export function ProjetForm({ projet, onSaved, onCancel }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [collabs, setCollabs] = useState<Collaborateur[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PF>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projetSchema) as any,
    defaultValues: {
      nom: projet?.nom ?? '',
      description: projet?.description ?? '',
      client_id: projet?.client_id ?? undefined,
      chef_projet_id: projet?.chef_projet_id ?? undefined,
      statut: projet?.statut ?? 'en_attente',
      progression: projet?.progression ?? 0,
      date_debut: projet?.date_debut ?? '',
      date_fin_prevue: projet?.date_fin_prevue ?? '',
      budget_ht: projet?.budget_ht ?? undefined,
      type_projet: projet?.type_projet ?? '',
    },
  })

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('id,nom_societe').order('nom_societe'),
      supabase.from('collaborateurs').select('id,prenom,nom').eq('actif', true).order('nom'),
    ]).then(([c, col]) => {
      setClients(c.data as Client[] ?? [])
      setCollabs(col.data as Collaborateur[] ?? [])
    })
  }, [])

  const onSubmit = async (data: PF) => {
    const payload = {
      nom: data.nom,
      description: data.description || null,
      client_id: data.client_id || null,
      chef_projet_id: data.chef_projet_id || null,
      statut: data.statut,
      progression: data.progression,
      date_debut: data.date_debut || null,
      date_fin_prevue: data.date_fin_prevue || null,
      budget_ht: data.budget_ht ?? null,
      type_projet: data.type_projet || null,
    }
    try {
      if (projet?.id) {
        const { error } = await supabase.from('projets').update(payload).eq('id', projet.id)
        if (error) throw error
        toast.success('Projet mis à jour')
      } else {
        const { error } = await supabase.from('projets').insert(payload)
        if (error) throw error
        toast.success('Projet créé')
      }
      onSaved()
    } catch (e: unknown) { toast.error((e as Error).message) }
  }

  const inputCls = 'w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Nom du projet *</label>
        <input {...register('nom')} className={inputCls} />
        {errors.nom && <p className="text-xs text-danger mt-1">{errors.nom.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
        <textarea {...register('description')} rows={2} className={inputCls + ' resize-none'} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Client</label>
          <select {...register('client_id')} className={inputCls}>
            <option value="">Sélectionner...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom_societe}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Chef de projet</label>
          <select {...register('chef_projet_id')} className={inputCls}>
            <option value="">Sélectionner...</option>
            {collabs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Statut</label>
          <select {...register('statut')} className={inputCls}>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="en_revision">En révision</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Progression (%)</label>
          <input type="number" min={0} max={100} {...register('progression', { valueAsNumber: true })} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Date de début</label>
          <input type="date" {...register('date_debut')} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Date de fin prévue</label>
          <input type="date" {...register('date_fin_prevue')} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Budget HT (€)</label>
          <input type="number" step="0.01" {...register('budget_ht', { valueAsNumber: true })} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Type de projet</label>
          <input {...register('type_projet')} placeholder="Développement, Conseil..." className={inputCls} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={isSubmitting}>{projet ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  )
}
