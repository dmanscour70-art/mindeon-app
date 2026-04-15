import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Download, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatutFactureBadge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/progress-bar'
import { formatCurrency, formatDate, downloadCSV, daysLate } from '@/lib/utils'
import type { Facture, StatutFacture } from '@/types'

const PAGE_SIZE = 20

export function FacturesPage() {
  const navigate = useNavigate()
  const [factures, setFactures] = useState<Facture[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState<StatutFacture | ''>('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
    let q = supabase.from('factures').select('*,clients(nom_societe)', { count: 'exact' })
    if (statut) q = q.eq('statut', statut)
    q = q.order('date_emission', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    const { data, count } = await q
    setFactures(data as Facture[] ?? [])
    setTotal(count ?? 0)
    } catch (e) { console.error(e) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, statut])

  const columns: Column<Facture>[] = [
    {
      key: 'numero', header: 'N°',
      render: r => {
        const late = daysLate(r.date_echeance)
        const isLate = r.statut === 'en_retard' && late > 7
        return (
          <div className="flex items-center gap-2">
            <span className={`font-heading font-semibold ${isLate ? 'text-danger' : 'text-accent'}`}>{r.numero ?? '—'}</span>
            {isLate && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
          </div>
        )
      }
    },
    { key: 'client', header: 'Client', render: r => (r as Facture & { clients?: { nom_societe: string } | null }).clients?.nom_societe ?? '—' },
    { key: 'statut', header: 'Statut', render: r => <StatutFactureBadge statut={r.statut} /> },
    { key: 'total_ttc', header: 'Montant TTC', render: r => <span className="font-heading font-semibold">{formatCurrency(r.total_ttc)}</span> },
    {
      key: 'paiement', header: 'Paiement',
      render: r => (
        <div className="min-w-24">
          <ProgressBar value={r.montant_paye} max={r.total_ttc} color={r.statut === 'payee' ? 'success' : 'accent'} height="h-1" />
          <p className="text-xs text-text-muted mt-0.5">{formatCurrency(r.montant_paye)} / {formatCurrency(r.total_ttc)}</p>
        </div>
      )
    },
    { key: 'date_emission', header: 'Émission', render: r => formatDate(r.date_emission), className: 'text-text-muted' },
    { key: 'date_echeance', header: 'Échéance', render: r => {
      const late = daysLate(r.date_echeance)
      return <span className={late > 0 && r.statut !== 'payee' ? 'text-danger' : 'text-text-muted'}>{formatDate(r.date_echeance)}{late > 0 && r.statut !== 'payee' ? ` (${late}j)` : ''}</span>
    }},
  ]

  const montantEnAttente = factures.filter(f => ['envoyee', 'partiellement_payee', 'en_retard'].includes(f.statut)).reduce((s, f) => s + (f.total_ttc - f.montant_paye), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Factures</h1>
          <p className="text-text-muted text-sm mt-0.5">{total} facture{total > 1 ? 's' : ''} · <span className="text-warning font-heading">{formatCurrency(montantEnAttente)}</span> en attente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => downloadCSV(factures as unknown as Record<string, unknown>[], 'factures')}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Link to="/factures/nouvelle">
            <Button size="sm"><Plus className="w-4 h-4" /> Nouvelle</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select value={statut} onChange={e => { setStatut(e.target.value as StatutFacture | ''); setPage(1) }}
          className="px-3 py-2 bg-bg-surface border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent">
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoyee">Envoyée</option>
          <option value="partiellement_payee">Partiellement payée</option>
          <option value="payee">Payée</option>
          <option value="en_retard">En retard</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      <div className="bg-bg-surface border border-border-color rounded-xl overflow-hidden">
        <DataTable columns={columns} data={factures} keyExtractor={r => r.id}
          onRowClick={r => navigate(`/factures/${r.id}`)} page={page} pageSize={PAGE_SIZE}
          total={total} onPageChange={setPage} loading={loading} />
      </div>
    </div>
  )
}
