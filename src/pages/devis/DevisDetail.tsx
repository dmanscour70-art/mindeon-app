import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Send, Check, X, FileDown, Copy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { StatutDevisBadge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateDevisPDF } from '@/lib/pdf'
import { toast } from 'sonner'
import type { Devis, LigneDevis, Client } from '@/types'

export function DevisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [devis, setDevis] = useState<Devis | null>(null)
  const [lignes, setLignes] = useState<LigneDevis[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    try {
      const [d, l] = await Promise.all([
        supabase.from('devis').select('*,clients(*)').eq('id', id).single(),
        supabase.from('lignes_devis').select('*').eq('devis_id', id).order('position'),
      ])
      setDevis(d.data as Devis)
      setLignes(l.data as LigneDevis[] ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const changeStatut = async (statut: string) => {
    if (!id) return
    const { error } = await supabase.from('devis').update({ statut }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success(`Statut mis à jour : ${statut}`); load() }
  }

  const handleDelete = async () => {
    if (!id) return
    const { error } = await supabase.from('devis').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Devis supprimé'); navigate('/devis') }
  }

  const convertToFacture = async () => {
    if (!devis) return
    const { data: num } = await supabase.rpc('next_numero_facture')
    const { data: f, error } = await supabase.from('factures').insert({
      numero: num,
      devis_id: devis.id,
      client_id: devis.client_id,
      created_by: devis.created_by,
      conditions_paiement: devis.conditions_paiement,
      remise_pct: devis.remise_pct,
      notes: devis.notes,
      mentions_legales: devis.mentions_legales,
      date_emission: new Date().toISOString().split('T')[0],
    }).select('id').single()
    if (error) { toast.error(error.message); return }

    // Copier les lignes
    await supabase.from('lignes_facture').insert(
      lignes.map((l, i) => ({ facture_id: f.id, description: l.description, quantite: l.quantite, prix_unitaire_ht: l.prix_unitaire_ht, taux_tva: l.taux_tva, position: i }))
    )
    toast.success('Facture créée depuis ce devis')
    navigate(`/factures/${f.id}`)
  }

  const handleExportPDF = () => {
    if (!devis) return
    const client = (devis as Devis & { clients?: Client | null }).clients ?? null
    generateDevisPDF(devis, lignes, client)
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-border-color rounded" /><div className="h-64 bg-border-color rounded" /></div>
  if (!devis) return <div className="text-text-muted">Devis introuvable</div>

  const client = (devis as Devis & { clients?: Client | null }).clients

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/devis" className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent-soft">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-accent">{devis.numero}</h1>
            <StatutDevisBadge statut={devis.statut} />
          </div>
          <p className="text-text-muted text-sm">{client?.nom_societe ?? '—'} · créé le {formatDate(devis.date_creation)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {devis.statut === 'brouillon' && (
            <>
              <Button variant="outline" size="sm" onClick={() => changeStatut('envoye')}><Send className="w-4 h-4" /> Envoyer</Button>
              <Link to={`/devis/${id}/modifier`}><Button variant="secondary" size="sm"><Edit className="w-4 h-4" /></Button></Link>
            </>
          )}
          {devis.statut === 'envoye' && (
            <>
              <Button size="sm" variant="outline" onClick={() => changeStatut('accepte')}><Check className="w-4 h-4" /> Accepté</Button>
              <Button size="sm" variant="danger" onClick={() => changeStatut('refuse')}><X className="w-4 h-4" /> Refusé</Button>
            </>
          )}
          {devis.statut === 'accepte' && (
            <Button size="sm" onClick={convertToFacture}><Copy className="w-4 h-4" /> → Facture</Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleExportPDF}><FileDown className="w-4 h-4" /> PDF</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Infos */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardBody className="space-y-2 text-sm">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">Client</p>
          <p className="font-semibold text-text-primary">{client?.nom_societe ?? '—'}</p>
          {client?.adresse && <p className="text-text-muted">{client.adresse}</p>}
          {client?.email && <p className="text-text-muted">{client.email}</p>}
        </CardBody></Card>
        <Card><CardBody className="space-y-2 text-sm">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">Devis</p>
          <div className="flex justify-between"><span className="text-text-muted">Numéro</span><span className="text-text-primary font-heading">{devis.numero}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Date</span><span className="text-text-primary">{formatDate(devis.date_creation)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Validité</span><span className="text-text-primary">{formatDate(devis.date_validite)}</span></div>
          {devis.conditions_paiement && <div className="flex justify-between"><span className="text-text-muted">Paiement</span><span className="text-text-primary">{devis.conditions_paiement}</span></div>}
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
                  <td className="px-4 py-3 text-right text-text-primary font-heading font-semibold">{formatCurrency(l.quantite * l.prix_unitaire_ht)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end p-4 border-t border-border-color">
          <div className="space-y-2 min-w-56">
            <div className="flex justify-between text-sm"><span className="text-text-muted">Sous-total HT</span><span className="font-heading text-text-primary">{formatCurrency(devis.total_ht)}</span></div>
            {(devis.remise_pct ?? 0) > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">Remise ({devis.remise_pct}%)</span><span className="text-danger font-heading">-{formatCurrency(devis.total_ht * (devis.remise_pct / 100))}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-text-muted">TVA</span><span className="font-heading text-text-primary">{formatCurrency(devis.total_tva)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-border-color pt-2"><span className="text-text-primary">TOTAL TTC</span><span className="text-accent font-heading text-lg">{formatCurrency(devis.total_ttc)}</span></div>
          </div>
        </div>
      </Card>

      {devis.notes && (
        <Card><CardBody><p className="text-xs text-text-muted uppercase tracking-wide mb-2">Notes</p><p className="text-sm text-text-primary whitespace-pre-wrap">{devis.notes}</p></CardBody></Card>
      )}

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Supprimer le devis" description={`Supprimer le devis ${devis.numero} ? Cette action est irréversible.`} />
    </div>
  )
}
