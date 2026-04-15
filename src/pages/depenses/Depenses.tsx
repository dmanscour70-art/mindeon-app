import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, TrendingDown, Euro, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Depense, CategorieDepense, TypeDepense } from '@/types'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, subMonths, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const CATEGORIES: { value: CategorieDepense; label: string; color: string }[] = [
  { value: 'logiciels',  label: 'Logiciels',  color: '#6c63ff' },
  { value: 'materiel',   label: 'Matériel',   color: '#8b5cf6' },
  { value: 'services',   label: 'Services',   color: '#10b981' },
  { value: 'marketing',  label: 'Marketing',  color: '#f59e0b' },
  { value: 'salaires',   label: 'Salaires',   color: '#3b82f6' },
  { value: 'loyer',      label: 'Loyer',      color: '#ec4899' },
  { value: 'autre',      label: 'Autre',      color: '#6b7280' },
]

const TYPES: { value: TypeDepense; label: string }[] = [
  { value: 'mensuel',   label: 'Récurrente mensuelle' },
  { value: 'ponctuel',  label: 'Ponctuelle' },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

interface DepenseForm {
  description: string
  montant_ht: string
  taux_tva: string
  categorie: CategorieDepense
  type_depense: TypeDepense
  date_depense: string
  notes: string
}

const EMPTY: DepenseForm = {
  description: '',
  montant_ht: '0',
  taux_tva: '20',
  categorie: 'autre',
  type_depense: 'ponctuel',
  date_depense: new Date().toISOString().split('T')[0],
  notes: '',
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-surface border border-border-color rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-muted mb-1.5">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span className="text-text-muted">{e.name}:</span>
          <span className="text-text-primary font-medium">{formatCurrency(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Depense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Depense | null>(null)
  const [form, setForm] = useState<DepenseForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'' | TypeDepense>('')
  const [filterCat, setFilterCat] = useState<'' | CategorieDepense>('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('depenses')
        .select('*')
        .order('date_depense', { ascending: false })
      setDepenses(data as Depense[] ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (d: Depense) => {
    setEditing(d)
    setForm({
      description: d.description,
      montant_ht: String(d.montant_ht),
      taux_tva: String(d.taux_tva),
      categorie: d.categorie,
      type_depense: d.type_depense,
      date_depense: d.date_depense,
      notes: d.notes ?? '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Description requise'); return }
    setSaving(true)
    const payload = {
      description: form.description.trim(),
      montant_ht: parseFloat(form.montant_ht) || 0,
      taux_tva: parseFloat(form.taux_tva) || 20,
      categorie: form.categorie,
      type_depense: form.type_depense,
      date_depense: form.date_depense,
      notes: form.notes.trim() || null,
    }
    const { error } = editing
      ? await supabase.from('depenses').update(payload).eq('id', editing.id)
      : await supabase.from('depenses').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Dépense mise à jour' : 'Dépense ajoutée')
    setFormOpen(false)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('depenses').delete().eq('id', deleteTarget.id)
    if (error) { toast.error(error.message); return }
    toast.success('Dépense supprimée')
    setDeleteTarget(null)
    load()
  }

  // Filtered list
  const filtered = depenses.filter(d =>
    (!filterType || d.type_depense === filterType) &&
    (!filterCat || d.categorie === filterCat)
  )

  // KPIs
  const now = new Date()
  const moisCourant = format(now, 'yyyy-MM')
  const anneeCourante = format(now, 'yyyy')

  const totalMois = depenses
    .filter(d => d.date_depense.startsWith(moisCourant))
    .reduce((s, d) => s + d.montant_ht * (1 + d.taux_tva / 100), 0)

  const totalAnnee = depenses
    .filter(d => d.date_depense.startsWith(anneeCourante))
    .reduce((s, d) => s + d.montant_ht * (1 + d.taux_tva / 100), 0)

  const totalRecurrentes = depenses
    .filter(d => d.type_depense === 'mensuel')
    .reduce((s, d) => s + d.montant_ht * (1 + d.taux_tva / 100), 0)

  // Chart: 12 months bar
  const months12: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const m = format(subMonths(now, i), 'yyyy-MM')
    months12[m] = 0
  }
  for (const d of depenses) {
    const m = d.date_depense.substring(0, 7)
    if (m in months12) months12[m] += d.montant_ht * (1 + d.taux_tva / 100)
  }
  const barData = Object.entries(months12).map(([m, v]) => ({
    mois: format(parseISO(m + '-01'), 'MMM yy', { locale: fr }),
    depenses: Math.round(v * 100) / 100,
  }))

  // Chart: pie by category
  const byCat: Record<string, number> = {}
  for (const d of depenses) {
    byCat[d.categorie] = (byCat[d.categorie] ?? 0) + d.montant_ht * (1 + d.taux_tva / 100)
  }
  const pieData = Object.entries(byCat)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: CAT_MAP[k]?.label ?? k, value: Math.round(v * 100) / 100, color: CAT_MAP[k]?.color ?? '#8b8aa8' }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Dépenses</h1>
          <p className="text-text-muted text-sm mt-0.5">Suivi des charges et frais de fonctionnement</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nouvelle dépense</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <p className="text-xs text-text-muted">Ce mois TTC</p>
          </div>
          <p className="font-heading font-bold text-2xl text-text-primary">{formatCurrency(totalMois)}</p>
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-text-muted" />
            <p className="text-xs text-text-muted">Cette année TTC</p>
          </div>
          <p className="font-heading font-bold text-2xl text-text-primary">{formatCurrency(totalAnnee)}</p>
        </div>
        <div className="bg-bg-surface border border-border-color rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-4 h-4 text-text-muted" />
            <p className="text-xs text-text-muted">Récurrentes / mois TTC</p>
          </div>
          <p className="font-heading font-bold text-2xl text-text-primary">{formatCurrency(totalRecurrentes)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Dépenses sur 12 mois (TTC)</CardTitle></CardHeader>
          <CardBody>
            {loading ? <div className="h-48 bg-border-color/20 rounded animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                  <XAxis dataKey="mois" tick={{ fill: '#8b8aa8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8b8aa8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="depenses" name="Dépenses TTC" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Par catégorie</CardTitle></CardHeader>
          <CardBody>
            {loading ? <div className="h-48 bg-border-color/20 rounded animate-pulse" /> : pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-text-muted text-sm">Aucune dépense</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [formatCurrency(v as number), '']} contentStyle={{ background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 8 }} />
                  <Legend formatter={v => <span style={{ color: '#8b8aa8', fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Filters + List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des dépenses ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as '' | TypeDepense)}
              className="bg-bg-app border border-border-color rounded-lg px-2 py-1 text-text-muted text-xs focus:outline-none focus:border-accent"
            >
              <option value="">Tous types</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value as '' | CategorieDepense)}
              className="bg-bg-app border border-border-color rounded-lg px-2 py-1 text-text-muted text-xs focus:outline-none focus:border-accent"
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </CardHeader>
        {loading ? (
          <CardBody><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-border-color/20 rounded animate-pulse" />)}</div></CardBody>
        ) : filtered.length === 0 ? (
          <CardBody><p className="text-text-muted text-sm">Aucune dépense. Cliquez sur "Nouvelle dépense" pour commencer.</p></CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-app border-b border-border-color">
                  <th className="px-4 py-3 text-left text-xs text-text-muted">Date</th>
                  <th className="px-4 py-3 text-left text-xs text-text-muted">Description</th>
                  <th className="px-4 py-3 text-left text-xs text-text-muted">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs text-text-muted">Type</th>
                  <th className="px-4 py-3 text-right text-xs text-text-muted">HT</th>
                  <th className="px-4 py-3 text-right text-xs text-text-muted">TTC</th>
                  <th className="px-4 py-3 text-right text-xs text-text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const ttc = d.montant_ht * (1 + d.taux_tva / 100)
                  const cat = CAT_MAP[d.categorie]
                  return (
                    <tr key={d.id} className={`border-b border-border-color/50 hover:bg-accent-soft/30 ${i % 2 === 0 ? '' : 'bg-bg-surface/30'}`}>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">{formatDate(d.date_depense)}</td>
                      <td className="px-4 py-3 text-text-primary">
                        <p>{d.description}</p>
                        {d.notes && <p className="text-xs text-text-muted">{d.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: cat?.color + '20', color: cat?.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat?.color }} />
                          {cat?.label ?? d.categorie}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.type_depense === 'mensuel' ? 'bg-accent/10 text-accent' : 'bg-bg-app text-text-muted'}`}>
                          {d.type_depense === 'mensuel' ? 'Récurrente' : 'Ponctuelle'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-heading text-text-muted">{formatCurrency(d.montant_ht)}</td>
                      <td className="px-4 py-3 text-right font-heading font-semibold text-text-primary">{formatCurrency(ttc)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-accent-soft">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Modifier la dépense' : 'Nouvelle dépense'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Description *</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ex: Abonnement Figma, Loyer bureau..."
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Montant HT (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.montant_ht}
                onChange={e => setForm(p => ({ ...p, montant_ht: e.target.value }))}
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
              <label className="block text-xs text-text-muted mb-1">Catégorie</label>
              <select
                value={form.categorie}
                onChange={e => setForm(p => ({ ...p, categorie: e.target.value as CategorieDepense }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Type</label>
              <select
                value={form.type_depense}
                onChange={e => setForm(p => ({ ...p, type_depense: e.target.value as TypeDepense }))}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Date</label>
            <input
              type="date"
              value={form.date_depense}
              onChange={e => setForm(p => ({ ...p, date_depense: e.target.value }))}
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="bg-bg-app rounded-lg px-3 py-2 text-xs text-text-muted">
            TTC : <span className="text-text-primary font-heading font-semibold">
              {formatCurrency((parseFloat(form.montant_ht) || 0) * (1 + (parseFloat(form.taux_tva) || 0) / 100))}
            </span>
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
        title="Supprimer la dépense"
        description={`Supprimer "${deleteTarget?.description}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
