import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { StatutClientBadge, StatutDevisBadge, StatutFactureBadge, StatutProjetBadge } from '@/components/ui/badge'
import { ClientForm } from '@/components/clients/ClientForm'
import { Avatar } from '@/components/shared/avatar'
import { EmailTab } from '@/components/shared/EmailTab'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Client, Contact, NoteClient, Projet, Devis, Facture, Collaborateur } from '@/types'
import { useAuthStore } from '@/store/auth.store'

const TABS = ['Infos', 'Contacts', 'Projets', 'Devis', 'Factures', 'Email', 'Notes'] as const
type Tab = (typeof TABS)[number]

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { collaborateur } = useAuthStore()
  const [client, setClient] = useState<Client | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [projets, setProjets] = useState<Projet[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [notes, setNotes] = useState<NoteClient[]>([])
  const [tab, setTab] = useState<Tab>('Infos')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [c, ct, p, d, f, n] = await Promise.all([
        supabase.from('clients').select('*,commercial:commercial_id(id,prenom,nom,role,avatar_url)').eq('id', id).single(),
        supabase.from('contacts').select('*').eq('client_id', id).order('est_principal', { ascending: false }),
        supabase.from('projets').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('devis').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('factures').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('notes_client').select('*,auteur:auteur_id(prenom,nom)').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(c.data as Client)
      setContacts(ct.data as Contact[] ?? [])
      setProjets(p.data as Projet[] ?? [])
      setDevis(d.data as Devis[] ?? [])
      setFactures(f.data as Facture[] ?? [])
      setNotes(n.data as NoteClient[] ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!id) return
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Client supprimé')
    navigate('/clients')
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !id) return
    const { error } = await supabase.from('notes_client').insert({
      client_id: id,
      auteur_id: collaborateur?.id ?? null,
      contenu: noteText.trim(),
    })
    if (error) { toast.error(error.message); return }
    setNoteText('')
    toast.success('Note ajoutée')
    load()
  }

  const totalDevisé = devis.reduce((s, d) => s + d.total_ttc, 0)
  const totalFacturé = factures.reduce((s, f) => s + f.total_ttc, 0)
  const totalEncaissé = factures.reduce((s, f) => s + f.montant_paye, 0)

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-border-color rounded" /><div className="h-64 bg-border-color rounded" /></div>
  if (!client) return <div className="text-text-muted">Client introuvable</div>

  const commercial = (client as Client & { commercial?: Collaborateur | null }).commercial

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/clients" className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent-soft">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-text-primary truncate">{client.nom_societe}</h1>
            <StatutClientBadge statut={client.statut} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {client.secteur && <p className="text-text-muted text-sm">{client.secteur}</p>}
            {commercial && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Avatar prenom={commercial.prenom} nom={commercial.nom} src={commercial.avatar_url} size="xs" />
                <span>{commercial.prenom} {commercial.nom}</span>
              </div>
            )}
          </div>
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

      {/* Résumé financier */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total devisé', value: totalDevisé },
          { label: 'Total facturé', value: totalFacturé },
          { label: 'Total encaissé', value: totalEncaissé },
        ].map(kpi => (
          <div key={kpi.label} className="bg-bg-surface border border-border-color rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">{kpi.label}</p>
            <p className="font-heading font-bold text-xl text-text-primary">{formatCurrency(kpi.value)}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-border-color overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Infos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
            <CardBody className="space-y-3 text-sm">
              {[
                ['Email', client.email],
                ['Téléphone', client.telephone],
                ['Adresse', [client.adresse, client.code_postal, client.ville, client.pays].filter(Boolean).join(', ')],
                ['SIRET', client.siret],
                ['Secteur', client.secteur],
              ].map(([label, value]) => value ? (
                <div key={label as string} className="flex gap-2">
                  <span className="text-text-muted w-24 flex-shrink-0">{label}</span>
                  <span className="text-text-primary">{value}</span>
                </div>
              ) : null)}
            </CardBody>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-text-muted w-28 flex-shrink-0">Créé le</span>
                  <span className="text-text-primary">{formatDate(client.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-text-muted w-28 flex-shrink-0">Mis à jour</span>
                  <span className="text-text-primary">{formatDate(client.updated_at)}</span>
                </div>
              </CardBody>
            </Card>
            {commercial && (
              <Card>
                <CardHeader><CardTitle>Commercial référent</CardTitle></CardHeader>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <Avatar prenom={commercial.prenom} nom={commercial.nom} src={commercial.avatar_url} size="md" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{commercial.prenom} {commercial.nom}</p>
                      <p className="text-xs text-text-muted capitalize">{commercial.role}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'Contacts' && (
        <Card>
          <CardHeader><CardTitle>Contacts ({contacts.length})</CardTitle></CardHeader>
          <CardBody>
            {contacts.length === 0 ? <p className="text-text-muted text-sm">Aucun contact</p> : (
              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-bg-app rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
                      {c.prenom[0]}{c.nom[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.prenom} {c.nom} {c.est_principal && '★'}</p>
                      <p className="text-xs text-text-muted">{c.poste} {c.email && `· ${c.email}`} {c.telephone && `· ${c.telephone}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'Projets' && (
        <Card>
          <CardHeader>
            <CardTitle>Projets ({projets.length})</CardTitle>
            <Link to={`/projets`}><Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5" /> Nouveau</Button></Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {projets.map(p => (
              <Link key={p.id} to={`/projets/${p.id}`} className="flex items-center justify-between p-3 bg-bg-app rounded-lg hover:bg-accent-soft transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.nom}</p>
                  <p className="text-xs text-text-muted">{formatDate(p.date_debut)} → {formatDate(p.date_fin_prevue)}</p>
                </div>
                <StatutProjetBadge statut={p.statut} />
              </Link>
            ))}
            {projets.length === 0 && <p className="text-text-muted text-sm">Aucun projet</p>}
          </CardBody>
        </Card>
      )}

      {tab === 'Devis' && (
        <Card>
          <CardHeader>
            <CardTitle>Devis ({devis.length})</CardTitle>
            <Link to={`/devis/nouveau`}><Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5" /> Nouveau</Button></Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {devis.map(d => (
              <Link key={d.id} to={`/devis/${d.id}`} className="flex items-center justify-between p-3 bg-bg-app rounded-lg hover:bg-accent-soft transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{d.numero}</p>
                  <p className="text-xs text-text-muted">{formatDate(d.date_creation)}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-semibold text-sm text-text-primary">{formatCurrency(d.total_ttc)}</p>
                  <StatutDevisBadge statut={d.statut} />
                </div>
              </Link>
            ))}
            {devis.length === 0 && <p className="text-text-muted text-sm">Aucun devis</p>}
          </CardBody>
        </Card>
      )}

      {tab === 'Factures' && (
        <Card>
          <CardHeader><CardTitle>Factures ({factures.length})</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {factures.map(f => (
              <Link key={f.id} to={`/factures/${f.id}`} className="flex items-center justify-between p-3 bg-bg-app rounded-lg hover:bg-accent-soft transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{f.numero}</p>
                  <p className="text-xs text-text-muted">Échéance : {formatDate(f.date_echeance)}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-semibold text-sm text-text-primary">{formatCurrency(f.total_ttc)}</p>
                  <StatutFactureBadge statut={f.statut} />
                </div>
              </Link>
            ))}
            {factures.length === 0 && <p className="text-text-muted text-sm">Aucune facture</p>}
          </CardBody>
        </Card>
      )}

      {tab === 'Email' && (
        <EmailTab
          clientId={id ?? null}
          clientEmail={client.email}
          clientNom={client.nom_societe}
          devis={devis}
          factures={factures}
        />
      )}

      {tab === 'Notes' && (
        <div className="space-y-4">
          <Card>
            <CardBody>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Ajouter une note..."
                rows={3}
                className="w-full bg-bg-app border border-border-color rounded-lg p-3 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>Ajouter</Button>
              </div>
            </CardBody>
          </Card>
          {notes.map(n => (
            <Card key={n.id}>
              <CardBody>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-text-primary">
                    {(n.auteur as unknown as { prenom: string; nom: string } | null)
                      ? `${(n.auteur as unknown as { prenom: string; nom: string }).prenom} ${(n.auteur as unknown as { prenom: string; nom: string }).nom}`
                      : 'Inconnu'}
                  </span>
                  <span className="text-xs text-text-muted">{formatDate(n.created_at, "d MMM yyyy 'à' HH:mm")}</span>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{n.contenu}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le client" size="lg">
        <ClientForm client={client} onSaved={() => { setEditOpen(false); load() }} onCancel={() => setEditOpen(false)} />
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        description={`Voulez-vous vraiment supprimer "${client.nom_societe}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
