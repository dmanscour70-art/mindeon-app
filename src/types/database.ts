export type StatutProjet = 'en_attente' | 'en_cours' | 'en_revision' | 'termine' | 'annule'
export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
export type StatutFacture = 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee'
export type StatutClient = 'prospect' | 'client' | 'inactif'
export type RoleCollaborateur = 'admin' | 'chef_projet' | 'developpeur' | 'commercial' | 'designer'
export type PrioriteTache = 'low' | 'medium' | 'high' | 'urgent'
export type StatutTache = 'todo' | 'in_progress' | 'review' | 'done'

export interface Collaborateur {
  id: string
  user_id: string | null
  nom: string
  prenom: string
  email: string
  telephone: string | null
  role: RoleCollaborateur
  avatar_url: string | null
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  nom_societe: string
  siret: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  pays: string
  secteur: string | null
  statut: StatutClient
  commercial_id: string | null
  created_at: string
  updated_at: string
  // Relations
  commercial?: Collaborateur | null
}

export interface Contact {
  id: string
  client_id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  poste: string | null
  est_principal: boolean
  created_at?: string
}

export interface NoteClient {
  id: string
  client_id: string
  auteur_id: string | null
  contenu: string
  created_at: string
  auteur?: Collaborateur | null
}

export interface Projet {
  id: string
  nom: string
  description: string | null
  client_id: string | null
  chef_projet_id: string | null
  statut: StatutProjet
  progression: number
  date_debut: string | null
  date_fin_prevue: string | null
  date_fin_reelle: string | null
  budget_ht: number | null
  type_projet: string | null
  created_at: string
  updated_at: string
  // Relations
  client?: Client | null
  chef_projet?: Collaborateur | null
}

export interface ProjetCollaborateur {
  projet_id: string
  collaborateur_id: string
  collaborateur?: Collaborateur
}

export interface Tache {
  id: string
  projet_id: string
  titre: string
  description: string | null
  assignee_id: string | null
  statut: StatutTache
  priorite: PrioriteTache
  date_echeance: string | null
  temps_estime: number | null
  temps_reel: number | null
  position: number
  created_at: string
  updated_at: string
  assignee?: Collaborateur | null
}

export interface Devis {
  id: string
  numero: string | null
  client_id: string | null
  created_by: string | null
  projet_id: string | null
  statut: StatutDevis
  date_creation: string
  date_validite: string | null
  conditions_paiement: string | null
  remise_pct: number
  notes: string | null
  mentions_legales: string | null
  total_ht: number
  total_tva: number
  total_ttc: number
  created_at: string
  updated_at: string
  client?: Client | null
  created_by_collab?: Collaborateur | null
}

export interface LigneDevis {
  id: string
  devis_id: string
  description: string
  quantite: number
  prix_unitaire_ht: number
  taux_tva: number
  position: number
}

export interface Facture {
  id: string
  numero: string | null
  devis_id: string | null
  client_id: string | null
  created_by: string | null
  statut: StatutFacture
  date_emission: string
  date_echeance: string | null
  conditions_paiement: string | null
  remise_pct: number
  notes: string | null
  mentions_legales: string | null
  total_ht: number
  total_tva: number
  total_ttc: number
  montant_paye: number
  created_at: string
  updated_at: string
  client?: Client | null
}

export interface LigneFacture {
  id: string
  facture_id: string
  description: string
  quantite: number
  prix_unitaire_ht: number
  taux_tva: number
  position: number
}

export interface Paiement {
  id: string
  facture_id: string
  date_paiement: string
  montant: number
  mode: string
  reference: string | null
  notes: string | null
  created_at: string
}

export interface Maintenance {
  id: string
  projet_id: string
  client_id: string | null
  description: string
  prix_ht: number
  taux_tva: number
  frequence: 'mensuel' | 'trimestriel' | 'annuel'
  date_debut: string
  date_fin: string | null
  actif: boolean
  notes: string | null
  created_at: string
  updated_at: string
  projet?: Projet | null
  client?: Client | null
}

export type CategorieDepense = 'logiciels' | 'materiel' | 'services' | 'marketing' | 'salaires' | 'loyer' | 'autre'
export type TypeDepense = 'mensuel' | 'ponctuel'

export interface Depense {
  id: string
  description: string
  montant_ht: number
  taux_tva: number
  categorie: CategorieDepense
  type_depense: TypeDepense
  date_depense: string
  projet_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  projet?: Projet | null
}

// KPIs
export interface StatsDashboard {
  ca_mois_facture: number
  ca_mois_encaisse: number
  projets_actifs: number
  devis_en_attente_count: number
  devis_en_attente_montant: number
  taux_conversion: number
}

export interface CAMensuel {
  mois: string
  ca_facture: number
  ca_encaisse: number
}
