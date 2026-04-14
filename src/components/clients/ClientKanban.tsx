import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { StatutClientBadge } from '@/components/ui/badge'
import type { Client, StatutClient } from '@/types'
import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const COLUMNS: { id: StatutClient; label: string; color: string }[] = [
  { id: 'prospect', label: 'Prospects', color: '#f59e0b' },
  { id: 'client',   label: 'Clients',   color: '#10b981' },
  { id: 'inactif',  label: 'Inactifs',  color: '#8b8aa8' },
]

interface Props {
  clients: Client[]
  onUpdate: () => void
}

export function ClientKanban({ clients, onUpdate }: Props) {
  const handleDrop = async (clientId: string, newStatut: StatutClient) => {
    const { error } = await supabase.from('clients').update({ statut: newStatut }).eq('id', clientId)
    if (error) toast.error(error.message)
    else { toast.success('Statut mis à jour'); onUpdate() }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const colClients = clients.filter(c => c.statut === col.id)
        return (
          <div
            key={col.id}
            className="bg-bg-surface border border-border-color rounded-xl p-3 min-h-96"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const id = e.dataTransfer.getData('clientId')
              if (id) handleDrop(id, col.id)
            }}
          >
            {/* Header colonne */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-sm font-semibold text-text-primary">{col.label}</span>
              <span className="ml-auto text-xs text-text-muted bg-border-color px-1.5 py-0.5 rounded-full">
                {colClients.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {colClients.map(client => (
                <div
                  key={client.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('clientId', client.id)}
                  className="kanban-card bg-bg-app border border-border-color rounded-lg p-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/clients/${client.id}`} className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate block">
                        {client.nom_societe}
                      </Link>
                      {client.secteur && <p className="text-xs text-text-muted">{client.secteur}</p>}
                      {client.ville && <p className="text-xs text-text-muted">{client.ville}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {colClients.length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-border-color rounded-lg text-xs text-text-muted">
                  Glisser ici
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
