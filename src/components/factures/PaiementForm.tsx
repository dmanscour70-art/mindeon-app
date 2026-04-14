import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { paiementSchema, type PaiementForm as PaiementFormType } from '@/validations'
import { toast } from 'sonner'

interface Props {
  factureId: string
  resteDu: number
  onSaved: () => void
  onCancel: () => void
}

const MODES = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'cb', label: 'Carte bancaire' },
  { value: 'prelevement', label: 'Prélèvement' },
  { value: 'especes', label: 'Espèces' },
  { value: 'autre', label: 'Autre' },
]

export function PaiementForm({ factureId, resteDu, onSaved, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PaiementFormType>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      date_paiement: today,
      montant: resteDu > 0 ? resteDu : undefined,
      mode: 'virement',
      reference: '',
      notes: '',
    },
  })

  const cls = 'w-full px-3 py-2 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors'

  const onSubmit = async (data: PaiementFormType) => {
    const { error } = await supabase.from('paiements').insert({
      facture_id: factureId,
      date_paiement: data.date_paiement,
      montant: data.montant,
      mode: data.mode,
      reference: data.reference || null,
      notes: data.notes || null,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Paiement enregistré')
      onSaved()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Date *</label>
          <input type="date" {...register('date_paiement')} className={cls} />
          {errors.date_paiement && <p className="text-xs text-danger mt-1">{errors.date_paiement.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Montant (€) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...register('montant', { valueAsNumber: true })}
            className={cls}
          />
          {errors.montant && <p className="text-xs text-danger mt-1">{errors.montant.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Mode de paiement *</label>
        <select {...register('mode')} className={cls}>
          {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {errors.mode && <p className="text-xs text-danger mt-1">{errors.mode.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Référence</label>
        <input {...register('reference')} placeholder="N° virement, chèque…" className={cls} />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
        <textarea {...register('notes')} rows={2} className={cls + ' resize-none'} />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Enregistrer</Button>
      </div>
    </form>
  )
}
