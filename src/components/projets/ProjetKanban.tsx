import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { StatutProjetBadge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/progress-bar'
import { formatDate } from '@/lib/utils'
import type { Projet, StatutProjet } from '@/types'
import { Building2, Calendar } from 'lucide-react'

const COLS: { id: StatutProjet; label: string; color: string }[] = [
  { id: 'en_attente', label: 'En attente', color: '#f59e0b' },
  { id: 'en_cours',   label: 'En cours',   color: '#6c63ff' },
  { id: 'en_revision',label: 'En révision',color: '#8b5cf6' },
  { id: 'termine',    label: 'Terminé',    color: '#10b981' },
  { id: 'annule',     label: 'Annulé',     color: '#ef4444' },
]

interface Props { projets: Projet[]; onUpdate: () => void }

export function ProjetKanban({ projets, onUpdate }: Props) {
  const moveTo = async (id: string, statut: StatutProjet) => {
    const { error } = await supabase.from('projets').update({ statut }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Statut mis à jour'); onUpdate() }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {COLS.map(col => {
        const items = projets.filter(p => p.statut === col.id)
        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 bg-bg-surface border border-border-color rounded-xl p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const id = e.dataTransfer.getData('projetId')
              if (id) moveTo(id, col.id)
            }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-sm font-semibold text-text-primary">{col.label}</span>
              <span className="ml-auto text-xs text-text-muted bg-border-color px-1.5 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('projetId', p.id)}
                  className="kanban-card bg-bg-app border border-border-color rounded-lg p-3 cursor-grab"
                >
                  <Link to={`/projets/${p.id}`} className="block">
                    <p className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate mb-2">{p.nom}</p>
                    {(p as Projet & { clients?: { nom_societe: string } | null }).clients && (
                      <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{(p as Projet & { clients?: { nom_societe: string } | null }).clients?.nom_societe}</span>
                      </div>
                    )}
                    <ProgressBar value={p.progression} showLabel height="h-1" />
                    {p.date_fin_prevue && (
                      <div className="flex items-center gap-1 text-xs text-text-muted mt-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(p.date_fin_prevue)}</span>
                      </div>
                    )}
                  </Link>
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-border-color rounded-lg text-xs text-text-muted">
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
