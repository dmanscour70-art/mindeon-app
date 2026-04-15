import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, FileDown, Plus, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'
import { StatutFactureBadge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/progress-bar'
import { ConfirmDialog, Modal } from '@/components/ui/modal'
import { PaiementForm } from '@/components/factures/PaiementForm'
import { formatCurrency, formatDate, daysLate } from '@/lib/utils'
import { generateFacturePDF } from '@/lib/pdf'
import { toast } from 'sonner'
import type { Facture, LigneFacture, Paiement, Client } from '@/types'

export function FactureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [facture, setFacture] = useState<Facture | null>(null)
  const [lignes, setLignes] = useState<LigneFacture[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [paiementOpen, setPaiementOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 12_000)
    try {
      const [f, l, p] = await Promise.all([
        supabase.from('factures').select('*,clients(*)').eq('id', id).single(),
        supabase.from('lignes_facture').select('*').eq('facture_id', id).order('position'),
        supabase.from('paiements').select('*').eq('facture_id', id).order('date_paiement', { ascending: false }),
      ])
      setFacture(f.data as Facture)
      setLignes(l.data as LigneFacture[] ?? [])
      setPaiements(p.data as Paiement[] ?? [])
    } catch (e) { console.error(e) } finally { clearTimeout(t); setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const changeStatut = async (statut: string) => {
    if (!id) return
    const { error } = await supabase.from('factures').update({ statut }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Statut mis à jour'); load() }
  }

  const handleDelete = async () => {
    if (!id) return
    const { error } = await supabase.from('factures').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Facture supprimée'); navigate('/factures') }
  }

  const handleExportPDF = () => {
    if (!facture) return
    const client = (facture as Facture & { clients?: Client | null }).clients ?? null
    generateFacturePDF(facture, lignes, client)
  }

  const genererAvoir = async () => {
    if (!facture) return
    const { data: num } = await supabase.rpc('next_numero_facture')
    const { data: av, error } = await supabase.from('factures').insert({
      numero: num,
      client_id: facture.client_id,
      created_by: facture.created_by,
      statut: 'envoyee',
      date_emission: new Date().toISOString().split('T')[0],
      conditions_paiement: facture.conditions_paiement,
      notes: `Avoir pour la facture ${facture.numero}`,
      mentions_legales: facture.mentions_legales,
    }).select('id').single()
    if (error) { toast.error(error.message); return }
    // Copier les lignes en négatif
    await supabase.from('lignes_facture').insert(
      lignes.map((l, i) => ({ facture_id: av.id, description: `[Avoir] ${l.description}`, quantite: l.quantite, prix_unitaire_ht: -l.prix_unitaire_ht, taux_tva: l.taux_tva, position: i }))
    )
    toast.success('Avoir généré')
    navigate(`/factures/${av.id}`)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-border-color rounded" /><div className="h-64 bg-border-color rounded" /></div>
  if (!facture) return <div className="text-text-muted">Facture introuvable</div>

  const client = (facture as Facture & { clients?: Client | null }).clients
  const resteAPayer = facture.total_ttc - facture.montant_paye
  const late = daysLate(facture.date_echeance)
  const isLate = ['en_retard'].includes(facture.statut) && late > 0

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/factures" className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent-soft">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className={`font-heading text-xl font-bold ${isLate ? 'text-danger' : 'text-accent'}`}>{facture.numero}</h1>
            <StatutFactureBadge statut={facture.statut} />
            {isLate && <div className="flex items-center gap-1 text-xs text-danger"><AlertTriangle className="w-3.5 h-3.5" /> {late} jours de retard</div>}
          </div>
          <p className="text-text-muted text-sm">{client?.nom_societe ?? '—'} · émise le {formatDate(facture.date_emission)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {['envoyee', 'en_retard', 'partiellement_payee'].includes(facture.statut) && (
            <Button size="sm" onClick={() => setPaiementOpen(true)}><Plus className="w-4 h-4" /> Paiement</Button>
          )}
          {facture.statut === 'brouillon' && (
            <Button variant="outline" size="sm" onClick={() => changeStatut('envoyee')}>Envoyer</Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleExportPDF}><FileDown className="w-4 h-4" /> PDF</Button>
          {facture.statut === 'payee' && (
            <Button variant="secondary" size="sm" onClick={genererAvoir}>Générer avoir</Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Barre de paiement */}
      {facture.total_ttc > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Progression du paiement</span>
              <span className="font-heading font-semibold text-text-primary">{formatCurrency(facture.montant_paye)} / {formatCurrency(facture.total_ttc)}</span>
            </div>
            <ProgressBar value={facture.montant_paye} max={facture.total_ttc} color={facture.statut === 'payee' ? 'success' : isLate ? 'danger' : 'accent'} showLabel height="h-2.5" />
            {resteAPayer > 0 && (
              <p className={`text-sm mt-2 ${isLate ? 'text-danger' : 'text-text-muted'}`}>
                Reste à payer : <span className="font-heading font-semibold">{formatCurrency(resteAPayer)}</span>
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Infos */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardBody className="space-y-2 text-sm">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">Client</p>
          <p className="font-semibold text-text-primary">{client?.nom_societe ?? '—'}</p>
          {client?.adresse && <p className="text-text-muted">{client.adresse}</p>}
          {client?.email && <p className="text-text-muted">{client.email}</p>}
        </CardBody></Card>
        <Card><CardBody className="space-y-2 text-sm">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">Facture</p>
          <div className="flex justify-between"><span className="text-text-muted">Numéro</span><span className="text-text-primary font-heading">{facture.numero}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Émission</span><span className="text-text-primary">{formatDate(facture.date_emission)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Échéance</span><span className={isLate ? 'text-danger font-semibold' : 'text-text-primary'}>{formatDate(facture.date_echeance)}</span></div>
          {facture.conditions_paiement && <div className="flex justify-between"><span className="text-text-muted">Paiement</span><span className="text-text-primary">{facture.conditions_paiement}</span></div>}
        </CardBody></Card>
      </div>

      {/* Lignes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-bg-app border-b border-border-color">
              <th className="px-4 py-3 text-left text-xs text-text-muted">Description</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted">Qté</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted">PU HT</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted">TVA</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted">Total HT</th>
            </tr></thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.id} className={`border-b border-border-color/50 ${i % 2 === 0 ? '' : 'bg-bg-surface/50'}`}>
                  <td className="px-4 py-3 text-text-primary">{l.description}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{l.quantite}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{formatCurrency(l.prix_unitaire_ht)}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{l.taux_tva}%</td>
                  <td className="px-4 py-3 text-right font-heading font-semibold text-text-primary">{formatCurrency(l.quantite * l.prix_unitaire_ht)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end p-4 border-t border-border-color">
          <div className="space-y-2 min-w-56">
            <div className="flex justify-between text-sm"><span className="text-text-muted">Sous-total HT</span><span className="font-heading text-text-primary">{formatCurrency(facture.total_ht)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-muted">TVA</span><span className="font-heading text-text-primary">{formatCurrency(facture.total_tva)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-border-color pt-2"><span className="text-text-primary">TOTAL TTC</span><span className={`font-heading text-lg ${isLate ? 'text-danger' : 'text-accent'}`}>{formatCurrency(facture.total_ttc)}</span></div>
          </div>
        </div>
      </Card>

      {/* Paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements reçus ({paiements.length})</CardTitle>
          {['envoyee', 'en_retard', 'partiellement_payee'].includes(facture.statut) && (
            <Button size="sm" onClick={() => setPaiementOpen(true)}><Plus className="w-3.5 h-3.5" /> Enregistrer</Button>
          )}
        </CardHeader>
        <CardBody>
          {paiements.length === 0 ? <p className="text-text-muted text-sm">Aucun paiement enregistré</p> : (
            <div className="space-y-2">
              {paiements.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-bg-app rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{formatDate(p.date_paiement)}</p>
                    <p className="text-xs text-text-muted">{p.mode} {p.reference ? `· Réf. ${p.reference}` : ''}</p>
                  </div>
                  <span className="font-heading font-semibold text-success">{formatCurrency(p.montant)}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modals */}
      <Modal open={paiementOpen} onClose={() => setPaiementOpen(false)} title="Enregistrer un paiement" size="sm">
        <PaiementForm
          factureId={id!}
          resteDu={resteAPayer}
          onSaved={() => { setPaiementOpen(false); load() }}
          onCancel={() => setPaiementOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Supprimer la facture" description={`Supprimer la facture ${facture.numero} ? Cette action est irréversible.`} />
    </div>
  )
}
