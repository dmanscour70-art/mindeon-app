import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, FileText, CheckCircle, XCircle, FolderKanban } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Maintenance, Projet, Client } from '@/types'

const FREQUENCE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
}

interface MaintWithRelations extends Omit<Maintenance, 'projet' | 'client'> {
  projet?: { id: string; nom: string; client_id: string | null } | null
  client?: { nom_societe: string } | null
}

interface FormData {
  description: string
  prix_ht: string
  taux_tva: string
  frequence: string
  date_debut: string
  date_fin: string
  actif: boolean
  notes: string
  projet_id: string
  client_id: string
}

const EMPTY_FORM: FormData = {
  description: '',
  prix_ht: '0',
  taux_tva: '20',
  frequence: 'mensuel',
  date_debut: new Date().toISOString().split('T')[0],
  date_fin: '',
  actif: true,
  notes: '',
  projet_id: '',
  client_id: '',
}

export function MaintenancesPage() {
  const navigate = useNavigate()
  const [maintenances, setMaintenances] = useState<MaintWithRelations[]>([])
  const [projets, setProjets] = useState<(Projet & { clients?: { nom_societe: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MaintWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MaintWithRelations | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [invoicing, setInvoicing] = useState<string | null>(null)
  const [filterActif, setFilterActif] = useState<'' | 'actif' | 'inactif'>('')
  const [filterFrequence, setFilterFrequence] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const [m, p] = await Promise.all([
        supabase
          .from('maintenances')
          .select('*,projet:projet_id(id,nom,client_id),client:client_id(nom_societe)')
          .order('actif', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('projets')
          .select('*,clients(nom_societe)')
          .in('statut', ['en_attente', 'en_cours', 'en_revision'])
          .order('nom'),
      ])
      setMaintenances(m.data as MaintWithRelations[] ?? [])
      setProjets(p.data as (Projet & { clients?: { nom_societe: string } | null })[] ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (m: MaintWithRelations) => {
    setEditing(m)
    setForm({
      description: m.description,
      prix_ht: String(m.prix_ht),
      taux_tva: String(m.taux_tva),
      frequence: m.frequence,
      date_debut: m.date_debut,
      date_fin: m.date_fin ?? '',
      actif: m.actif,
      notes: m.notes ?? '',
      projet_id: m.projet_id,
      client_id: m.client_id ?? '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Description requise'); return }
    if (!form.projet_id) { toast.error('Projet requis'); return }
    setSaving(true)
    try {
      // Resolve client_id from project if not set
      let clientId: string | null = form.client_id || null
      if (!clientId && form.projet_id) {
        const proj = projets.find(p => p.id === form.projet_id)
        clientId = proj?.client_id ?? null
      }
      const payload = {
        projet_id: form.projet_id,
        client_id: clientId,
        description: form.description.trim(),
        prix_ht: parseFloat(form.prix_ht) || 0,
        taux_tva: parseFloat(form.taux_tva) || 20,
        frequence: form.frequence,
        date_debut: form.date_debut,
        date_fin: form.date_fin || null,
        actif: form.actif,
        notes: form.notes.trim() || null,
      }
      const { error } = editing
        ? await supabase.from('maintenances').update(payload).eq('id', editing.id)
        : await supabase.from('maintenances').insert(payload)
      if (error) { toast.error(error.message); return }
      toast.success(editing ? 'Maintenance mise à jour' : 'Maintenance ajoutée')
      setFormOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('maintenances').delete().eq('id', deleteTarget.id)
    if (error) { toast.error(error.message); return }
    toast.success('Maintenance supprimée')
    setDeleteTarget(null)
    load()
  }

  const toggleActif = async (m: MaintWithRelations) => {
    const { error } = await supabase.from('maintenances').update({ actif: !m.actif }).eq('id', m.id)
    if (error) { toast.error(error.message); return }
    load()
  }

  // Invoice all active monthly maintenances for a given projet
  const facturerProjet = async (projetId: string) => {
    const lignes = maintenances.filter(m => m.actif && m.frequence === 'mensuel' && m.projet_id === projetId)
    if (lignes.length === 0) { toast.error('Aucune maintenance mensuelle active pour ce projet'); return }
    const clientId = lignes[0].client_id
    if (!clientId) { toast.error('Pas de client associé à ce projet'); return }
    setInvoicing(projetId)
    try {
      const { data: num } = await supabase.rpc('next_numero_facture')
      const now = new Date()
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: f, error } = await supabase.from('factures').insert({
        numero: num,
        client_id: clientId,
        date_emission: now.toISOString().split('T')[0],
        date_echeance: lastDay,
        notes: `Facture de maintenance — ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        mentions_legales: 'TVA non applicable, article 293 B du CGI',
      }).select('id').single()
      if (error) { toast.error(error.message); return }
      await supabase.from('lignes_facture').insert(
        lignes.map((m, i) => ({
          facture_id: f.id,
          description: `${m.description} — maintenance mensuelle`,
          quantite: 1,
          prix_unitaire_ht: m.prix_ht,
          taux_tva: m.taux_tva,
          position: i,
        }))
      )
      toast.success('Facture de maintenance créée')
      navigate(`/factures/${f.id}`)
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la création de la facture')
    } finally {
      setInvoicing(null)
    }
  }

  // Group by project for invoicing overview
  const byProjet = maintenances.reduce<Record<string, { nom: string; lignes: MaintWithRelations[] }>>((acc, m) => {
    const pid = m.projet_id
    if (!acc[pid]) acc[pid] = { nom: m.projet?.nom ?? 'Projet inconnu', lignes: [] }
    acc[pid].lignes.push(m)
    return acc
  }, {})

  const filtered = maintenances.filter(m =>
    (!filterActif || (filterActif === 'actif' ? m.actif : !m.actif)) &&
    (!filterFrequence || m.frequence === filterFrequence)
  )

  const totalMensuelActif = maintenances
    .filter(m => m.actif && m.frequence === 'mensuel')
    .reduce((s, m) => s + m.prix_ht * (1 + m.taux_tva / 100), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Maintenances</h1>
          <p className="text-text-muted text-sm mt-0.5">Contrats et lignes récurrentes par projet</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nouvelle maintenance</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Revenus mensuels actifs TTC</p>
          <p className="font-heading font-bold text-2xl text-accent">{formatCurrency(totalMensuelActif)}</p>
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Lignes actives</p>
          <p className="font-heading font-bold text-2xl text-text-primary">{maintenances.filter(m => m.actif).length}</p>
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <p className="text-xs text-text-muted mb-1">Projets concernés</p>
          <p className="font-heading font-bold text-2xl text-text-primary">{Object.keys(byProjet).length}</p>
        </div>
      </div>

      {/* Facturation rapide par projet */}
      {Object.keys(byProjet).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Facturer ce mois — par projet</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {Object.entries(byProjet).map(([pid, { nom, lignes }]) => {
              const activeMensuel = lignes.filter(l => l.actif && l.frequence === 'mensuel')
              const total = activeMensuel.reduce((s, l) => s + l.prix_ht * (1 + l.taux_tva / 100), 0)
              if (activeMensuel.length === 0) return null
              return (
                <div key={pid} className="flex items-center justify-between p-3 bg-bg-app rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{nom}</p>
                      <p className="text-xs text-text-muted">{activeMensuel.length} ligne{activeMensuel.length > 1 ? 's' : ''} · {formatCurrency(total)} TTC/mois</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => facturerProjet(pid)} disabled={invoicing === pid}>
                    <FileText className="w-4 h-4" />
                    {invoicing === pid ? 'Création…' : 'Facturer'}
                  </Button>
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}

      {/* Liste complète */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les maintenances ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filterActif}
              onChange={e => setFilterActif(e.target.value as '' | 'actif' | 'inactif')}
              className="bg-bg-app border border-border-color rounded-lg px-2 py-1 text-text-muted text-xs focus:outline-none focus:border-accent"
            >
              <option value="">Tous statuts</option>
              <option value="actif">Actives</option>
              <option value="inactif">Inactives</option>
            </select>
            <select
              value={filterFrequence}
              onChange={e => setFilterFrequence(e.target.value)}
              className="bg-bg-app border border-border-color rounded-lg px-2 py-1 text-text-muted text-xs focus:outline-none focus:border-accent"
            >
              <option value="">Toutes fréquences</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>
        </CardHeader>

        {loading ? (
          <CardBody><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-border-color/20 rounded animate-pulse" />)}</div></CardBody>
        ) : filtered.length === 0 ? (
          <CardBody><p className="text-text-muted text-sm">Aucune maintenance. Cliquez sur "Nouvelle maintenance" pour commencer.</p></CardBody>
        ) : (
          <div className="divide-y divide-border-color">
            {filtered.map(m => (
              <div key={m.id} className={`flex items-center gap-4 px-4 py-3 ${m.actif ? '' : 'opacity-50'}`}>
                <button onClick={() => toggleActif(m)} className="flex-shrink-0" title={m.actif ? 'Désactiver' : 'Activer'}>
                  {m.actif
                    ? <CheckCircle className="w-5 h-5 text-success" />
                    : <XCircle className="w-5 h-5 text-text-muted" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{m.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.projet && (
                      <Link to={`/projets/${m.projet.id}`} className="text-xs text-accent hover:underline">
                        {m.projet.nom}
                      </Link>
                    )}
                    {m.client && <span className="text-xs text-text-muted">· {m.client.nom_societe}</span>}
                    <span className="text-xs text-text-muted">· depuis {formatDate(m.date_debut)}</span>
                    {m.date_fin && <span className="text-xs text-text-muted">→ {formatDate(m.date_fin)}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-heading font-semibold text-text-primary">{formatCurrency(m.prix_ht)} HT</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    {FREQUENCE_LABELS[m.frequence] ?? m.frequence} · TVA {m.taux_tva}%
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-accent-soft">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Modifier la maintenance' : 'Nouvelle maintenance'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Projet *</label>
            <select
              value={form.projet_id}
              onChange={e => setForm(p => ({ ...p, projet_id: e.target.value }))}
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="">— Sélectionner un projet —</option>
              {projets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom}{p.clients ? ` (${p.clients.nom_societe})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Description *</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ex: Hébergement serveur, Support mensuel..."
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Prix HT (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prix_ht}
                onChange={e => setForm(p => ({ ...p, prix_ht: e.target.value }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">TVA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.taux_tva}
                onChange={e => setForm(p => ({ ...p, taux_tva: e.target.value }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Fréquence</label>
              <select
                value={form.frequence}
                onChange={e => setForm(p => ({ ...p, frequence: e.target.value }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Statut</label>
              <select
                value={form.actif ? 'actif' : 'inactif'}
                onChange={e => setForm(p => ({ ...p, actif: e.target.value === 'actif' }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Date début</label>
              <input
                type="date"
                value={form.date_debut}
                onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Date fin (optionnel)</label>
              <input
                type="date"
                value={form.date_fin}
                onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la maintenance"
        description={`Supprimer "${deleteTarget?.description}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
