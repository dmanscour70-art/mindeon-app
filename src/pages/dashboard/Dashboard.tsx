import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart,
} from 'recharts'
import { Euro, FolderKanban, FileText, Target, AlertTriangle, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/shared/stat-card'
import { ProgressBar } from '@/components/shared/progress-bar'
import { StatutProjetBadge, StatutFactureBadge } from '@/components/ui/badge'
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card'
import { TableSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, daysLate } from '@/lib/utils'
import type { StatsDashboard, CAMensuel, Projet, Facture } from '@/types'
import { format, parseISO, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

const CHART_COLORS = ['#6c63ff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

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

export function DashboardPage() {
  const [stats, setStats] = useState<StatsDashboard | null>(null)
  const [caData, setCAData] = useState<CAMensuel[]>([])
  const [projets, setProjets] = useState<(Projet & { client?: { nom_societe: string } | null })[]>([])
  const [factures, setFactures] = useState<(Facture & { client?: { nom_societe: string } | null })[]>([])
  const [projetStats, setProjetStats] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const t = setTimeout(() => setLoading(false), 12_000)
      try {
        const now = new Date()
        const moisDebut = format(subMonths(now, 11), 'yyyy-MM-01')
        const moisCourant = format(now, 'yyyy-MM')

        const { data: factures12m } = await supabase
          .from('factures').select('date_emission,total_ttc,montant_paye,statut')
          .gte('date_emission', moisDebut).neq('statut', 'annulee')

        const { data: projetsActifs } = await supabase
          .from('projets').select('id,nom,statut,progression,date_fin_prevue,clients(nom_societe)')
          .in('statut', ['en_cours', 'en_revision', 'en_attente'])
          .order('updated_at', { ascending: false }).limit(6)

        const { data: facturesAlert } = await supabase
          .from('factures').select('id,numero,statut,total_ttc,date_echeance,montant_paye,clients(nom_societe)')
          .in('statut', ['envoyee', 'en_retard', 'partiellement_payee'])
          .order('date_echeance').limit(5)

        const { data: tousLesProjets } = await supabase.from('projets').select('statut')

        // KPIs calculés localement
        const facturesMois = (factures12m ?? []).filter(f =>
          f.date_emission?.startsWith(moisCourant) && ['envoyee', 'payee', 'partiellement_payee', 'en_retard'].includes(f.statut)
        )
        setStats({
          ca_mois_facture: facturesMois.reduce((s, f) => s + (f.total_ttc ?? 0), 0),
          ca_mois_encaisse: facturesMois.reduce((s, f) => s + (f.montant_paye ?? 0), 0),
          projets_actifs: (tousLesProjets ?? []).filter(p => ['en_cours', 'en_revision'].includes(p.statut)).length,
          devis_en_attente_count: 0,
          devis_en_attente_montant: 0,
          taux_conversion: 0,
        })

        // CA mensuel
        const grouped: Record<string, CAMensuel> = {}
        for (let i = 11; i >= 0; i--) {
          const m = format(subMonths(now, i), 'yyyy-MM')
          grouped[m] = { mois: m, ca_facture: 0, ca_encaisse: 0 }
        }
        for (const f of (factures12m ?? [])) {
          const m = f.date_emission?.substring(0, 7)
          if (m && grouped[m]) {
            if (!['brouillon', 'annulee'].includes(f.statut)) grouped[m].ca_facture += f.total_ttc ?? 0
            grouped[m].ca_encaisse += f.montant_paye ?? 0
          }
        }
        setCAData(Object.values(grouped).map(d => ({
          ...d,
          mois: format(parseISO(d.mois + '-01'), 'MMM yy', { locale: fr }),
        })))

        setProjets((projetsActifs ?? []) as unknown as (Projet & { client?: { nom_societe: string } | null })[])
        setFactures((facturesAlert ?? []) as unknown as (Facture & { client?: { nom_societe: string } | null })[])

        const counts: Record<string, number> = {}
        for (const p of (tousLesProjets ?? [])) counts[p.statut] = (counts[p.statut] ?? 0) + 1
        const colors: Record<string, string> = { en_attente: '#f59e0b', en_cours: '#6c63ff', en_revision: '#8b5cf6', termine: '#10b981', annule: '#ef4444' }
        const labels: Record<string, string> = { en_attente: 'En attente', en_cours: 'En cours', en_revision: 'En révision', termine: 'Terminé', annule: 'Annulé' }
        setProjetStats(Object.entries(counts).map(([k, v]) => ({ name: labels[k] ?? k, value: v, color: colors[k] ?? '#8b8aa8' })))

      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        clearTimeout(t)
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-0.5">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="CA du mois" value={formatCurrency(stats?.ca_mois_facture ?? 0)} subtitle={`Encaissé : ${formatCurrency(stats?.ca_mois_encaisse ?? 0)}`} icon={Euro} color="accent" />
            <StatCard title="Projets actifs" value={stats?.projets_actifs ?? 0} icon={FolderKanban} color="success" />
            <StatCard title="Devis en attente" value={stats?.devis_en_attente_count ?? 0} subtitle={formatCurrency(stats?.devis_en_attente_montant ?? 0)} icon={FileText} color="warning" />
            <StatCard title="Taux conversion" value={`${stats?.taux_conversion ?? 0}%`} subtitle="Devis → Facture" icon={Target} color={Number(stats?.taux_conversion ?? 0) >= 50 ? 'success' : 'warning'} />
          </>
        )}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CA 12 mois */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Chiffre d'affaires — 12 mois</CardTitle></CardHeader>
          <CardBody>
            {loading ? <div className="h-56 bg-border-color/20 rounded animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={caData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                  <XAxis dataKey="mois" tick={{ fill: '#8b8aa8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8b8aa8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span style={{ color: '#8b8aa8', fontSize: 12 }}>{v}</span>} />
                  <Bar dataKey="ca_facture" name="CA Facturé" fill="#6c63ff" radius={[3,3,0,0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="ca_encaisse" name="Encaissé" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Répartition projets */}
        <Card>
          <CardHeader><CardTitle>Projets par statut</CardTitle></CardHeader>
          <CardBody>
            {loading ? <div className="h-56 bg-border-color/20 rounded animate-pulse" /> : projetStats.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-text-muted text-sm">Aucun projet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={projetStats} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {projetStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} projet(s)`, '']} contentStyle={{ background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 8 }} />
                  <Legend formatter={v => <span style={{ color: '#8b8aa8', fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Projets en cours + Factures à surveiller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projets */}
        <Card>
          <CardHeader>
            <CardTitle>Projets en cours</CardTitle>
            <Link to="/projets" className="text-xs text-accent hover:underline">Voir tout</Link>
          </CardHeader>
          <CardBody className="space-y-4">
            {loading ? <TableSkeleton rows={4} cols={1} /> : projets.length === 0 ? (
              <p className="text-text-muted text-sm">Aucun projet actif</p>
            ) : projets.map(p => (
              <Link key={p.id} to={`/projets/${p.id}`} className="block hover:bg-accent-soft -mx-2 px-2 py-2 rounded-lg transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{p.nom}</p>
                    <p className="text-xs text-text-muted">{p.client?.nom_societe ?? 'Sans client'}</p>
                  </div>
                  <StatutProjetBadge statut={p.statut} />
                </div>
                <ProgressBar value={p.progression} showLabel />
                {p.date_fin_prevue && (
                  <p className="text-xs text-text-muted mt-1">Échéance : {formatDate(p.date_fin_prevue)}</p>
                )}
              </Link>
            ))}
          </CardBody>
        </Card>

        {/* Factures à surveiller */}
        <Card>
          <CardHeader>
            <CardTitle>Factures à surveiller</CardTitle>
            <Link to="/factures" className="text-xs text-accent hover:underline">Voir tout</Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {loading ? <TableSkeleton rows={4} cols={1} /> : factures.length === 0 ? (
              <p className="text-text-muted text-sm flex items-center gap-2">
                <span className="text-success">✓</span> Toutes les factures sont à jour
              </p>
            ) : factures.map(f => {
              const late = f.statut === 'en_retard' ? daysLate(f.date_echeance) : 0
              return (
                <Link key={f.id} to={`/factures/${f.id}`}
                  className={`flex items-center justify-between p-3 rounded-lg bg-bg-app hover:bg-border-color/30 transition-colors ${late > 7 ? 'pulse-danger border border-danger/30' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{f.numero}</span>
                      {late > 0 && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                    </div>
                    <p className="text-xs text-text-muted">{f.client?.nom_societe ?? '—'}</p>
                    {f.date_echeance && (
                      <p className={`text-xs mt-0.5 ${late > 0 ? 'text-danger' : 'text-warning'}`}>
                        {late > 0 ? `En retard de ${late} j` : `Échéance : ${formatDate(f.date_echeance)}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-heading font-semibold text-sm text-text-primary">{formatCurrency(f.total_ttc)}</p>
                    <StatutFactureBadge statut={f.statut} />
                  </div>
                </Link>
              )
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
