import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { Avatar } from '@/components/shared/avatar'
import { Badge } from '@/components/ui/badge'
import { getRoleLabel, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Collaborateur } from '@/types'
import { CollaborateurForm } from '@/components/collaborateurs/CollaborateurForm'

export function CollaborateursPage() {
  const [collabs, setCollabs] = useState<Collaborateur[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Collaborateur | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Collaborateur | null>(null)

  const load = async () => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 12_000)
    try {
    const { data } = await supabase.from('collaborateurs').select('*').order('nom')
    setCollabs(data as Collaborateur[] ?? [])
    } catch (e) { console.error(e) } finally {
      clearTimeout(t); setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('collaborateurs').delete().eq('id', deleteTarget.id)
    if (error) { toast.error(error.message); return }
    toast.success('Collaborateur supprimé')
    setDeleteTarget(null)
    load()
  }

  const roleColors: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'muted'> = {
    admin: 'danger', chef_projet: 'accent', developpeur: 'success', commercial: 'warning', designer: 'muted',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Collaborateurs</h1>
          <p className="text-text-muted text-sm mt-0.5">{collabs.length} membre{collabs.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setModalOpen(true) }} size="sm">
          <Plus className="w-4 h-4" /> Inviter
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-border-color" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-border-color rounded w-3/4" />
                  <div className="h-3 bg-border-color rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collabs.map(c => (
            <div key={c.id} className="bg-bg-surface border border-border-color rounded-xl p-5 hover:shadow-glow transition-shadow">
              <div className="flex items-start gap-3">
                <Avatar prenom={c.prenom} nom={c.nom} src={c.avatar_url} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-primary">{c.prenom} {c.nom}</p>
                    {!c.actif && <Badge variant="muted">Inactif</Badge>}
                  </div>
                  <Badge variant={roleColors[c.role] ?? 'muted'} className="mt-1">{getRoleLabel(c.role)}</Badge>
                  <p className="text-xs text-text-muted mt-2 truncate">{c.email}</p>
                  {c.telephone && <p className="text-xs text-text-muted">{c.telephone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-color">
                <p className="text-xs text-text-muted flex-1">Depuis {formatDate(c.created_at)}</p>
                <button
                  onClick={() => { setEditTarget(c); setModalOpen(true) }}
                  className="text-xs text-accent hover:underline"
                >Modifier</button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="text-xs text-danger hover:underline"
                >Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Modifier le collaborateur' : 'Inviter un collaborateur'} size="md">
        <CollaborateurForm
          collaborateur={editTarget ?? undefined}
          onSaved={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le collaborateur"
        description={`Supprimer ${deleteTarget?.prenom} ${deleteTarget?.nom} ? Cette action est irréversible.`}
      />
    </div>
  )
}
