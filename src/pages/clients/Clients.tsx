import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Download, LayoutGrid, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatutClientBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { ClientForm } from '@/components/clients/ClientForm'
import { ClientKanban } from '@/components/clients/ClientKanban'
import { formatDate, downloadCSV } from '@/lib/utils'
import type { Client, StatutClient } from '@/types'

const PAGE_SIZE = 20

export function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutClient | ''>('')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
    let q = supabase.from('clients').select('*,commercial:commercial_id(prenom,nom)', { count: 'exact' })
    if (search) q = q.ilike('nom_societe', `%${search}%`)
    if (statut) q = q.eq('statut', statut)
    q = q.order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    const { data, count } = await q
    setClients(data as Client[] ?? [])
    setTotal(count ?? 0)
    } catch (e) { console.error(e) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, search, statut])

  const handleSaved = () => { setModalOpen(false); load() }

  const columns: Column<Client>[] = [
    { key: 'nom_societe', header: 'Société' },
    { key: 'statut', header: 'Statut', render: r => <StatutClientBadge statut={r.statut} /> },
    { key: 'secteur', header: 'Secteur', render: r => r.secteur ?? '—' },
    { key: 'ville', header: 'Ville', render: r => r.ville ?? '—' },
    { key: 'email', header: 'Email', render: r => r.email ?? '—', className: 'text-text-muted' },
    { key: 'created_at', header: 'Créé le', render: r => formatDate(r.created_at), className: 'text-text-muted' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-text-muted text-sm mt-0.5">{total} client{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => downloadCSV(clients as unknown as Record<string, unknown>[], 'clients')}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-4 h-4" /> Nouveau client
          </Button>
        </div>
      </div>

      {/* Filtres + vue */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value as StatutClient | ''); setPage(1) }}
          className="px-3 py-2 bg-bg-surface border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Tous les statuts</option>
          <option value="prospect">Prospect</option>
          <option value="client">Client</option>
          <option value="inactif">Inactif</option>
        </select>
        <div className="flex border border-border-color rounded-lg overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-accent text-white' : 'bg-bg-surface text-text-muted hover:text-text-primary'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-2 transition-colors ${view === 'kanban' ? 'bg-accent text-white' : 'bg-bg-surface text-text-muted hover:text-text-primary'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      {view === 'list' ? (
        <div className="bg-bg-surface border border-border-color rounded-xl overflow-hidden">
          <DataTable
            columns={columns}
            data={clients}
            keyExtractor={r => r.id}
            onRowClick={r => navigate(`/clients/${r.id}`)}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            loading={loading}
            emptyMessage="Aucun client trouvé"
          />
        </div>
      ) : (
        <ClientKanban clients={clients} onUpdate={load} />
      )}

      {/* Modal création */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau client" size="lg">
        <ClientForm onSaved={handleSaved} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
