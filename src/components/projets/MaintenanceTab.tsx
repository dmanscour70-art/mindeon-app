import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import type { Maintenance } from '@/types'

interface Props {
  projetId: string
  clientId: string | null
}

const FREQUENCE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
}

interface MaintenanceFormData {
  description: string
  prix_ht: string
  taux_tva: string
  frequence: string
  date_debut: string
  date_fin: string
  actif: boolean
  notes: string
}

const EMPTY_FORM: MaintenanceFormData = {
  description: '',
  prix_ht: '0',
  taux_tva: '20',
  frequence: 'mensuel',
  date_debut: new Date().toISOString().split('T')[0],
  date_fin: '',
  actif: true,
  notes: '',
}

export function MaintenanceTab({ projetId, clientId }: Props) {
  const navigate = useNavigate()
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Maintenance | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Maintenance | null>(null)
  const [form, setForm] = useState<MaintenanceFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [invoicing, setInvoicing] = useState(false)

  const load = async () => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 12_000)
    try {
      const { data } = await supabase
        .from('maintenances')
        .select('*')
        .eq('projet_id', projetId)
        .order('actif', { ascending: false })
        .order('created_at', { ascending: false })
      setMaintenances(data as Maintenance[] ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      clearTimeout(t); setLoading(false)
    }
  }

  useEffect(() => { load() }, [projetId])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (m: Maintenance) => {
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
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Description requise'); return }
    setSaving(true)
    const payload = {
      projet_id: projetId,
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
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Maintenance mise à jour' : 'Maintenance ajoutée')
    setFormOpen(false)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('maintenances').delete().eq('id', deleteTarget.id)
    if (error) { toast.error(error.message); return }
    toast.success('Maintenance supprimée')
    setDeleteTarget(null)
    load()
  }

  const toggleActif = async (m: Maintenance) => {
    const { error } = await supabase.from('maintenances').update({ actif: !m.actif }).eq('id', m.id)
    if (error) { toast.error(error.message); return }
    toast.success(m.actif ? 'Maintenance désactivée' : 'Maintenance réactivée')
    load()
  }

  const facturerCeMois = async () => {
    const actives = maintenances.filter(m => m.actif && m.frequence === 'mensuel')
    if (actives.length === 0) { toast.error('Aucune maintenance mensuelle active à facturer'); return }
    if (!clientId) { toast.error('Ce projet n\'a pas de client associé'); return }
    setInvoicing(true)
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
        actives.map((m, i) => ({
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
      setInvoicing(false)
    }
  }

  const totalMensuel = maintenances.filter(m => m.actif && m.frequence === 'mensuel')
    .reduce((s, m) => s + m.prix_ht * (1 + m.taux_tva / 100), 0)

  return (
    <div className="space-y-4">
      {/* KPI + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-text-muted">Maintenance mensuelle TTC</p>
            <p className="font-heading font-bold text-xl text-text-primary">{formatCurrency(totalMensuel)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Lignes actives</p>
            <p className="font-heading font-bold text-xl text-text-primary">
              {maintenances.filter(m => m.actif).length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={facturerCeMois} disabled={invoicing}>
            <FileText className="w-4 h-4" /> Facturer ce mois
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Liste */}
      <Card>
        {loading ? (
          <CardBody><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-border-color/20 rounded animate-pulse" />)}</div></CardBody>
        ) : maintenances.length === 0 ? (
          <CardBody><p className="text-text-muted text-sm">Aucune maintenance. Ajoutez des lignes pour suivre les maintenances récurrentes.</p></CardBody>
        ) : (
          <div className="divide-y divide-border-color">
            {maintenances.map(m => (
              <div key={m.id} className={`flex items-center gap-4 px-4 py-3 ${m.actif ? '' : 'opacity-50'}`}>
                <button onClick={() => toggleActif(m)} className="flex-shrink-0" title={m.actif ? 'Désactiver' : 'Activer'}>
                  {m.actif
                    ? <CheckCircle className="w-5 h-5 text-success" />
                    : <XCircle className="w-5 h-5 text-text-muted" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{m.description}</p>
                  <p className="text-xs text-text-muted">
                    Depuis {formatDate(m.date_debut)}
                    {m.date_fin && ` → ${formatDate(m.date_fin)}`}
                    {m.notes && ` · ${m.notes}`}
                  </p>
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
