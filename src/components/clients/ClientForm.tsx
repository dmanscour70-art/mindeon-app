import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { clientSchema, type ClientForm as CF } from '@/validations'
import { Button } from '@/components/ui/button'
import type { Client } from '@/types'

interface Props {
  client?: Client
  onSaved: () => void
  onCancel: () => void
}

export function ClientForm({ client, onSaved, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CF>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      nom_societe: client?.nom_societe ?? '',
      email: client?.email ?? '',
      telephone: client?.telephone ?? '',
      adresse: client?.adresse ?? '',
      ville: client?.ville ?? '',
      code_postal: client?.code_postal ?? '',
      pays: client?.pays ?? 'France',
      secteur: client?.secteur ?? '',
      statut: client?.statut ?? 'prospect',
      siret: client?.siret ?? '',
    },
  })

  const onSubmit = async (data: CF) => {
    const payload = {
      nom_societe: data.nom_societe,
      email: data.email || null,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      ville: data.ville || null,
      code_postal: data.code_postal || null,
      pays: data.pays || 'France',
      secteur: data.secteur || null,
      statut: data.statut,
      siret: data.siret || null,
    }
    try {
      if (client?.id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
        if (error) throw error
        toast.success('Client mis à jour')
      } else {
        const { error } = await supabase.from('clients').insert(payload)
        if (error) throw error
        toast.success('Client créé')
      }
      onSaved()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  const field = (name: keyof CF, label: string, type = 'text', extra?: Record<string, unknown>) => (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
      <input
        type={type}
        {...register(name)}
        {...extra}
        className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
      />
      {errors[name] && <p className="text-xs text-danger mt-1">{errors[name]?.message as string}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('nom_societe', 'Nom de la société *')}
        {field('siret', 'SIRET')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('email', 'Email', 'email')}
        {field('telephone', 'Téléphone')}
      </div>
      {field('adresse', 'Adresse')}
      <div className="grid grid-cols-3 gap-4">
        {field('ville', 'Ville')}
        {field('code_postal', 'Code postal')}
        {field('pays', 'Pays')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('secteur', 'Secteur d\'activité')}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Statut</label>
          <select {...register('statut')} className="w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent">
            <option value="prospect">Prospect</option>
            <option value="client">Client</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={isSubmitting}>{client ? 'Mettre à jour' : 'Créer le client'}</Button>
      </div>
    </form>
  )
}
