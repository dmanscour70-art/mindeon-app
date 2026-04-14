import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Euro } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { StatutProjetBadge, StatutDevisBadge, StatutFactureBadge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared/progress-bar'
import { Avatar } from '@/components/shared/avatar'
import { ProjetForm } from '@/components/projets/ProjetForm'
import { TachesKanban } from '@/components/projets/TachesKanban'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Projet, Tache, Collaborateur, Devis, Facture } from '@/types'

const TABS = ['Général', 'Tâches', 'Équipe', 'Finances'] as const
type Tab = (typeof TABS)[number]

export function ProjetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [projet, setProjet] = useState<Projet | null>(null)
  const [taches, setTaches] = useState<Tache[]>([])
  const [equipe, setEquipe] = useState<Collaborateur[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [allCollabs, setAllCollabs] = useState<Collaborateur[]>([])
  const [tab, setTab] = useState<Tab>('Général')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const [p, t, e, d, f, ac] = await Promise.all([
      supabase.from('projets').select('*,clients(nom_societe),chef_projet:chef_projet_id(prenom,nom)').eq('id', id).single(),
      supabase.from('taches').select('*,assignee:assignee_id(prenom,nom,avatar_url)').eq('projet_id', id).order('position'),
      supabase.from('projet_collaborateurs').select('collaborateur_id,collaborateur:collaborateur_id(*)').eq('projet_id', id),
      supabase.from('devis').select('*').eq('projet_id', id).order('created_at', { ascending: false }),
      supabase.from('factures').select('*').eq('client_id', (await supabase.from('projets').select('client_id').eq('id', id).single()).data?.client_id ?? '').limit(5),
      supabase.from('collaborateurs').select('*').eq('actif', true).order('nom'),
    ])
    setProjet(p.data as Projet)
    setTaches(t.data as Tache[] ?? [])
    setEquipe((e.data ?? []).map((r: Record<string, unknown>) => r.collaborateur as Collaborateur))
    setDevis(d.data as Devis[] ?? [])
    setFactures(f.data as Facture[] ?? [])
    setAllCollabs(ac.data as Collaborateur[] ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!id) return
    const { error } = await supabase.from('projets').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Projet supprimé')
    navigate('/projets')
  }

  const tachesDone = taches.filter(t => t.statut === 'done').length
  const totalDevis = devis.reduce((s, d) => s + d.total_ttc, 0)
  const totalFactures = factures.reduce((s, f) => s + f.total_ttc, 0)

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-border-color rounded" /><div className="h-64 bg-border-color rounded" /></div>
  if (!projet) return <div className="text-text-muted">Projet introuvable</div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/projets" className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent-soft">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-text-primary truncate">{projet.nom}</h1>
            <StatutProjetBadge statut={projet.statut} />
          </div>
          {(projet as Projet & { clients?: { nom_societe: string } | null }).clients && (
            <p className="text-text-muted text-sm">{(projet as Projet & { clients?: { nom_societe: string } | null }).clients?.nom_societe}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="w-4 h-4" /> Modifier
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPIs projet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Progression</p>
          <p className="font-heading font-bold text-2xl text-text-primary mb-2">{projet.progression}%</p>
          <ProgressBar value={projet.progression} />
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Tâches</p>
          <p className="font-heading font-bold text-2xl text-text-primary">{tachesDone}/{taches.length}</p>
          <p className="text-xs text-text-muted mt-1">terminées</p>
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Budget HT</p>
          <p className="font-heading font-bold text-2xl text-text-primary">{formatCurrency(projet.budget_ht ?? 0)}</p>
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Équipe</p>
          <p className="font-heading font-bold text-2xl text-text-primary">{equipe.length}</p>
          <p className="text-xs text-text-muted mt-1">collaborateur{equipe.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-6 text-sm">
        <div><span className="text-text-muted">Début : </span><span className="text-text-primary">{formatDate(projet.date_debut)}</span></div>
        <div><span className="text-text-muted">Fin prévue : </span><span className="text-text-primary">{formatDate(projet.date_fin_prevue)}</span></div>
        {projet.date_fin_reelle && <div><span className="text-text-muted">Fin réelle : </span><span className="text-success">{formatDate(projet.date_fin_reelle)}</span></div>}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-border-color">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}
          >{t}</button>
        ))}
      </div>

      {tab === 'Général' && (
        <Card>
          <CardBody className="space-y-3 text-sm">
            {projet.description && <p className="text-text-primary">{projet.description}</p>}
            {projet.type_projet && <div className="flex gap-2"><span className="text-text-muted w-24">Type</span><span className="text-text-primary">{projet.type_projet}</span></div>}
          </CardBody>
        </Card>
      )}

      {tab === 'Tâches' && (
        <TachesKanban taches={taches} projetId={id!} collaborateurs={allCollabs} onUpdate={load} />
      )}

      {tab === 'Équipe' && (
        <Card>
          <CardHeader><CardTitle>Équipe ({equipe.length})</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {equipe.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-bg-app rounded-lg">
                <Avatar prenom={c.prenom} nom={c.nom} src={c.avatar_url} size="md" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.prenom} {c.nom}</p>
                  <p className="text-xs text-text-muted">{c.role}</p>
                </div>
              </div>
            ))}
            {equipe.length === 0 && <p className="text-text-muted text-sm">Aucun collaborateur assigné</p>}
          </CardBody>
        </Card>
      )}

      {tab === 'Finances' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-bg-surface border border-border-color rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">Total devisé</p>
              <p className="font-heading font-bold text-xl text-text-primary">{formatCurrency(totalDevis)}</p>
            </div>
            <div className="bg-bg-surface border border-border-color rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">Total facturé</p>
              <p className="font-heading font-bold text-xl text-text-primary">{formatCurrency(totalFactures)}</p>
            </div>
            <div className="bg-bg-surface border border-border-color rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">Budget HT</p>
              <p className="font-heading font-bold text-xl text-text-primary">{formatCurrency(projet.budget_ht ?? 0)}</p>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Devis liés</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {devis.map(d => (
                <Link key={d.id} to={`/devis/${d.id}`} className="flex items-center justify-between p-3 bg-bg-app rounded-lg hover:bg-accent-soft transition-colors">
                  <div><p className="text-sm font-medium text-text-primary">{d.numero}</p><p className="text-xs text-text-muted">{formatDate(d.date_creation)}</p></div>
                  <div className="text-right">
                    <p className="font-heading font-semibold text-sm text-text-primary">{formatCurrency(d.total_ttc)}</p>
                    <StatutDevisBadge statut={d.statut} />
                  </div>
                </Link>
              ))}
              {devis.length === 0 && <p className="text-text-muted text-sm">Aucun devis</p>}
            </CardBody>
          </Card>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le projet" size="lg">
        <ProjetForm projet={projet} onSaved={() => { setEditOpen(false); load() }} onCancel={() => setEditOpen(false)} />
      </Modal>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Supprimer le projet" description={`Supprimer "${projet.nom}" ? Toutes les tâches seront perdues.`} />
    </div>
  )
}
