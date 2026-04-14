import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatutDevisBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, downloadCSV, getStatutDevisLabel } from '@/lib/utils'
import type { Devis, StatutDevis } from '@/types'

const PAGE_SIZE = 20

export function DevisPage() {
  const navigate = useNavigate()
  const [devis, setDevis] = useState<Devis[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState<StatutDevis | ''>('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    let q = supabase.from('devis').select('*,clients(nom_societe)', { count: 'exact' })
    if (statut) q = q.eq('statut', statut)
    q = q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    const { data, count } = await q
    setDevis(data as Devis[] ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, statut])

  const columns: Column<Devis>[] = [
    { key: 'numero', header: 'N°', render: r => <span className="font-heading font-semibold text-accent">{r.numero ?? '—'}</span> },
    { key: 'client', header: 'Client', render: r => (r as Devis & { clients?: { nom_societe: string } | null }).clients?.nom_societe ?? '—' },
    { key: 'statut', header: 'Statut', render: r => <StatutDevisBadge statut={r.statut} /> },
    { key: 'total_ttc', header: 'Montant TTC', render: r => <span className="font-heading font-semibold">{formatCurrency(r.total_ttc)}</span> },
    { key: 'date_creation', header: 'Date', render: r => formatDate(r.date_creation), className: 'text-text-muted' },
    { key: 'date_validite', header: 'Validité', render: r => formatDate(r.date_validite), className: 'text-text-muted' },
  ]

  const montantTotal = devis.filter(d => ['envoye', 'accepte'].includes(d.statut)).reduce((s, d) => s + d.total_ttc, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Devis</h1>
          <p className="text-text-muted text-sm mt-0.5">{total} devis · <span className="text-text-primary font-heading">{formatCurrency(montantTotal)}</span> en attente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => downloadCSV(devis.map(d => ({ ...d, statut: getStatutDevisLabel(d.statut) })) as unknown as Record<string, unknown>[], 'devis')}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Link to="/devis/nouveau">
            <Button size="sm"><Plus className="w-4 h-4" /> Nouveau</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select value={statut} onChange={e => { setStatut(e.target.value as StatutDevis | ''); setPage(1) }}
          className="px-3 py-2 bg-bg-surface border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent">
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoye">Envoyé</option>
          <option value="accepte">Accepté</option>
          <option value="refuse">Refusé</option>
          <option value="expire">Expiré</option>
        </select>
      </div>

      <div className="bg-bg-surface border border-border-color rounded-xl overflow-hidden">
        <DataTable columns={columns} data={devis} keyExtractor={r => r.id}
          onRowClick={r => navigate(`/devis/${r.id}`)} page={page} pageSize={PAGE_SIZE}
          total={total} onPageChange={setPage} loading={loading} />
      </div>
    </div>
  )
}
