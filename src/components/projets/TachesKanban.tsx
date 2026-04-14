import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { PrioriteBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/shared/avatar'
import { ConfirmDialog } from '@/components/ui/modal'
import { formatDate } from '@/lib/utils'
import type { Tache, Collaborateur, StatutTache } from '@/types'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { TacheForm } from './TacheForm'

const COLS: { id: StatutTache; label: string }[] = [
  { id: 'todo',        label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'review',      label: 'En révision' },
  { id: 'done',        label: 'Terminé' },
]

interface Props {
  taches: Tache[]
  projetId: string
  collaborateurs: Collaborateur[]
  onUpdate: () => void
}

export function TachesKanban({ taches, projetId, collaborateurs, onUpdate }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tache | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tache | null>(null)

  const moveStatut = async (id: string, statut: StatutTache) => {
    const { error } = await supabase.from('taches').update({ statut }).eq('id', id)
    if (error) toast.error(error.message)
    else onUpdate()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('taches').delete().eq('id', deleteTarget.id)
    if (error) toast.error(error.message)
    else { toast.success('Tâche supprimée'); setDeleteTarget(null); onUpdate() }
  }

  const getCollab = (id: string | null) => collaborateurs.find(c => c.id === id) ?? null

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLS.map(col => {
          const items = taches.filter(t => t.statut === col.id).sort((a, b) => a.position - b.position)
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-64 bg-bg-surface border border-border-color rounded-xl p-3"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('tacheId')
                if (id) moveStatut(id, col.id)
              }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-text-primary">{col.label}</span>
                <span className="text-xs text-text-muted bg-border-color px-1.5 py-0.5 rounded-full">{items.length}</span>
              </div>

              <div className="space-y-2">
                {items.map(t => {
                  const assignee = getCollab(t.assignee_id)
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('tacheId', t.id)}
                      className="kanban-card bg-bg-app border border-border-color rounded-lg p-3 cursor-grab group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm text-text-primary leading-snug flex-1">{t.titre}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => { setEditTarget(t); setFormOpen(true) }} className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-accent">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-danger">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <PrioriteBadge priorite={t.priorite} />
                        {assignee && <Avatar prenom={assignee.prenom} nom={assignee.nom} size="xs" />}
                      </div>
                      {t.date_echeance && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                          <Calendar className="w-3 h-3" />
                          {formatDate(t.date_echeance)}
                        </div>
                      )}
                    </div>
                  )
                })}
                <button
                  onClick={() => { setEditTarget(null); setFormOpen(true) }}
                  className="w-full flex items-center gap-2 p-2 text-xs text-text-muted hover:text-text-primary hover:bg-accent-soft rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null) }} title={editTarget ? 'Modifier la tâche' : 'Nouvelle tâche'} size="md">
        <TacheForm
          tache={editTarget ?? undefined}
          projetId={projetId}
          collaborateurs={collaborateurs}
          onSaved={() => { setFormOpen(false); setEditTarget(null); onUpdate() }}
          onCancel={() => { setFormOpen(false); setEditTarget(null) }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la tâche"
        description={`Supprimer "${deleteTarget?.titre}" ?`}
      />
    </>
  )
}
