import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LignesEditor, type Ligne } from '@/components/devis/LignesEditor'
import { formatCurrency, calcLignes } from '@/lib/utils'
import { toast } from 'sonner'
import type { Client, Projet, Devis, LigneDevis } from '@/types'
import { useAuthStore } from '@/store/auth.store'

const STEPS = ['Client & Projet', 'Lignes', 'Conditions', 'Aperçu']

function uid() { return Math.random().toString(36).slice(2) }

export function DevisFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { collaborateur } = useAuthStore()
  const isEdit = !!id

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projets, setProjets] = useState<Projet[]>([])

  // Formulaire
  const [clientId, setClientId] = useState('')
  const [projetId, setProjetId] = useState('')
  const [dateValidite, setDateValidite] = useState('')
  const [conditions, setConditions] = useState('30 jours net')
  const [remise, setRemise] = useState(0)
  const [notes, setNotes] = useState('')
  const [mentions, setMentions] = useState('TVA non applicable, article 293 B du CGI')
  const [lignes, setLignes] = useState<Ligne[]>([{ id: uid(), description: '', quantite: 1, prix_unitaire_ht: 0, taux_tva: 20 }])

  useEffect(() => {
    supabase.from('clients').select('*').order('nom_societe').then(({ data }) => setClients(data as Client[] ?? []))
  }, [])

  useEffect(() => {
    if (clientId) {
      supabase.from('projets').select('*').eq('client_id', clientId).then(({ data }) => setProjets(data as Projet[] ?? []))
    }
  }, [clientId])

  useEffect(() => {
    if (!id) return
    const loadEdit = async () => {
      const [d, l] = await Promise.all([
        supabase.from('devis').select('*').eq('id', id).single(),
        supabase.from('lignes_devis').select('*').eq('devis_id', id).order('position'),
      ])
      if (d.data) {
        setClientId(d.data.client_id ?? '')
        setProjetId(d.data.projet_id ?? '')
        setDateValidite(d.data.date_validite ?? '')
        setConditions(d.data.conditions_paiement ?? '')
        setRemise(d.data.remise_pct ?? 0)
        setNotes(d.data.notes ?? '')
        setMentions(d.data.mentions_legales ?? '')
      }
      if (l.data) {
        setLignes(l.data.map((ld: LigneDevis) => ({
          id: uid(), description: ld.description, quantite: ld.quantite,
          prix_unitaire_ht: ld.prix_unitaire_ht, taux_tva: ld.taux_tva,
        })))
      }
    }
    loadEdit()
  }, [id])

  const totaux = calcLignes(lignes, remise)
  const selectedClient = clients.find(c => c.id === clientId)

  const handleSave = async () => {
    if (!clientId) { toast.error('Sélectionnez un client'); return }
    if (lignes.some(l => !l.description.trim())) { toast.error('Toutes les lignes doivent avoir une description'); return }
    setSaving(true)

    try {
      let devisId = id
      if (!isEdit) {
        // Générer le numéro
        const { data: numData } = await supabase.rpc('next_numero_devis')
        const { data: d, error } = await supabase.from('devis').insert({
          numero: numData,
          client_id: clientId,
          projet_id: projetId || null,
          created_by: collaborateur?.id ?? null,
          date_validite: dateValidite || null,
          conditions_paiement: conditions,
          remise_pct: remise,
          notes: notes || null,
          mentions_legales: mentions || null,
        }).select('id').single()
        if (error) throw error
        devisId = d.id
      } else {
        const { error } = await supabase.from('devis').update({
          client_id: clientId,
          projet_id: projetId || null,
          date_validite: dateValidite || null,
          conditions_paiement: conditions,
          remise_pct: remise,
          notes: notes || null,
          mentions_legales: mentions || null,
        }).eq('id', devisId!)
        if (error) throw error
        // Supprimer les anciennes lignes
        await supabase.from('lignes_devis').delete().eq('devis_id', devisId!)
      }

      // Insérer les lignes
      const { error: lignesErr } = await supabase.from('lignes_devis').insert(
        lignes.map((l, i) => ({
          devis_id: devisId,
          description: l.description,
          quantite: l.quantite,
          prix_unitaire_ht: l.prix_unitaire_ht,
          taux_tva: l.taux_tva,
          position: i,
        }))
      )
      if (lignesErr) throw lignesErr

      toast.success(isEdit ? 'Devis mis à jour' : 'Devis créé')
      navigate(`/devis/${devisId}`)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const cls = 'w-full px-3 py-2 bg-bg-surface border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent-soft">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-heading text-xl font-bold text-text-primary">{isEdit ? 'Modifier le devis' : 'Nouveau devis'}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${i === step ? 'text-accent' : i < step ? 'text-success cursor-pointer' : 'text-text-muted'}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < step ? 'bg-success text-white' : i === step ? 'bg-accent text-white' : 'bg-border-color text-text-muted'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-success' : 'bg-border-color'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-bg-surface border border-border-color rounded-2xl p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">Client & Projet</h2>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Client *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className={cls}>
                <option value="">Sélectionner un client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom_societe}</option>)}
              </select>
            </div>
            {clientId && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Projet lié (optionnel)</label>
                <select value={projetId} onChange={e => setProjetId(e.target.value)} className={cls}>
                  <option value="">Aucun projet</option>
                  {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">Lignes de prestation</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-1">Remise globale (%)</label>
              <input type="number" min={0} max={100} value={remise} onChange={e => setRemise(Number(e.target.value))} className={cls + ' max-w-xs'} />
            </div>
            <LignesEditor lignes={lignes} onChange={setLignes} remise_pct={remise} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">Conditions</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date de validité</label>
                <input type="date" value={dateValidite} onChange={e => setDateValidite(e.target.value)} className={cls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Conditions de paiement</label>
                <input value={conditions} onChange={e => setConditions(e.target.value)} className={cls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={cls + ' resize-none'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Mentions légales</label>
              <textarea value={mentions} onChange={e => setMentions(e.target.value)} rows={2} className={cls + ' resize-none'} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">Récapitulatif</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-text-muted mb-1">Client</p>
                <p className="text-text-primary font-medium">{selectedClient?.nom_societe ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Validité</p>
                <p className="text-text-primary">{dateValidite || '—'}</p>
              </div>
            </div>
            <div className="bg-bg-app border border-border-color rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-bg-surface"><th className="px-4 py-2 text-left text-xs text-text-muted">Description</th><th className="px-4 py-2 text-right text-xs text-text-muted">Qté</th><th className="px-4 py-2 text-right text-xs text-text-muted">PU HT</th><th className="px-4 py-2 text-right text-xs text-text-muted">Total HT</th></tr></thead>
                <tbody>
                  {lignes.map((l, i) => (
                    <tr key={i} className="border-t border-border-color/50">
                      <td className="px-4 py-2 text-text-primary">{l.description}</td>
                      <td className="px-4 py-2 text-right text-text-muted">{l.quantite}</td>
                      <td className="px-4 py-2 text-right text-text-muted">{formatCurrency(l.prix_unitaire_ht)}</td>
                      <td className="px-4 py-2 text-right text-text-primary font-heading">{formatCurrency(l.quantite * l.prix_unitaire_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="space-y-2 min-w-52">
                <div className="flex justify-between text-sm"><span className="text-text-muted">HT</span><span className="font-heading text-text-primary">{formatCurrency(totaux.ht)}</span></div>
                {remise > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">Remise ({remise}%)</span><span className="font-heading text-danger">-{formatCurrency(totaux.ht * remise / 100)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-text-muted">TVA</span><span className="font-heading text-text-primary">{formatCurrency(totaux.tva)}</span></div>
                <div className="flex justify-between text-base font-bold border-t border-border-color pt-2"><span className="text-text-primary">TTC</span><span className="text-accent font-heading">{formatCurrency(totaux.ttc)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => step === 0 ? navigate(-1) : setStep(step - 1)}>
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Annuler' : 'Précédent'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            Suivant <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} loading={saving}>
            <Check className="w-4 h-4" /> {isEdit ? 'Mettre à jour' : 'Créer le devis'}
          </Button>
        )}
      </div>
    </div>
  )
}
