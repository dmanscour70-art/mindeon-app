import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, LayoutGrid, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatutProjetBadge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/progress-bar'
import { Modal } from '@/components/ui/modal'
import { ProjetForm } from '@/components/projets/ProjetForm'
import { ProjetKanban } from '@/components/projets/ProjetKanban'
import { formatDate, downloadCSV } from '@/lib/utils'
import type { Projet, StatutProjet } from '@/types'

const PAGE_SIZE = 20

export function ProjetsPage() {
  const navigate = useNavigate()
  const [projets, setProjets] = useState<Projet[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState<StatutProjet | ''>('')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
    let q = supabase.from('projets')
      .select('*,clients(nom_societe),chef_projet:chef_projet_id(prenom,nom)', { count: 'exact' })
    if (statut) q = q.eq('statut', statut)
    q = q.order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    const { data, count } = await q
    setProjets(data as Projet[] ?? [])
    setTotal(count ?? 0)
    } catch (e) { console.error(e) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, statut])

  const columns: Column<Projet>[] = [
    { key: 'nom', header: 'Nom' },
    { key: 'statut', header: 'Statut', render: r => <StatutProjetBadge statut={r.statut} /> },
    { key: 'client', header: 'Client', render: r => (r as Projet & { clients?: { nom_societe: string } | null }).clients?.nom_societe ?? '—' },
    { key: 'progression', header: 'Progression', render: r => <ProgressBar value={r.progression} showLabel />, className: 'min-w-32' },
    { key: 'date_fin_prevue', header: 'Échéance', render: r => formatDate(r.date_fin_prevue), className: 'text-text-muted' },
    { key: 'chef_projet', header: 'Chef de projet', render: r => {
      const cp = (r as Projet & { chef_projet?: { prenom: string; nom: string } | null }).chef_projet
      return cp ? `${cp.prenom} ${cp.nom}` : '—'
    }, className: 'text-text-muted' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Projets</h1>
          <p className="text-text-muted text-sm mt-0.5">{total} projet{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => downloadCSV(projets as unknown as Record<string, unknown>[], 'projets')}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value as StatutProjet | ''); setPage(1) }}
          className="px-3 py-2 bg-bg-surface border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_cours">En cours</option>
          <option value="en_revision">En révision</option>
          <option value="termine">Terminé</option>
          <option value="annule">Annulé</option>
        </select>
        <div className="flex border border-border-color rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView('list')} className={`p-2 transition-colors ${view === 'list' ? 'bg-accent text-white' : 'bg-bg-surface text-text-muted hover:text-text-primary'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('kanban')} className={`p-2 transition-colors ${view === 'kanban' ? 'bg-accent text-white' : 'bg-bg-surface text-text-muted hover:text-text-primary'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-bg-surface border border-border-color rounded-xl overflow-hidden">
          <DataTable columns={columns} data={projets} keyExtractor={r => r.id}
            onRowClick={r => navigate(`/projets/${r.id}`)} page={page} pageSize={PAGE_SIZE}
            total={total} onPageChange={setPage} loading={loading} />
        </div>
      ) : (
        <ProjetKanban projets={projets} onUpdate={load} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau projet" size="lg">
        <ProjetForm onSaved={() => { setModalOpen(false); load() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
