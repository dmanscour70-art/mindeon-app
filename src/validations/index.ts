import { z } from 'zod'

export const clientSchema = z.object({
  nom_societe: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').or(z.literal('')).optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  code_postal: z.string().optional(),
  pays: z.string().default('France'),
  secteur: z.string().optional(),
  statut: z.enum(['prospect', 'client', 'inactif']).default('prospect'),
  siret: z.string().optional(),
  commercial_id: z.string().nullable().optional(),
})

export const contactSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').or(z.literal('')).optional(),
  telephone: z.string().optional(),
  poste: z.string().optional(),
  est_principal: z.boolean().default(false),
})

export const collaborateurSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  role: z.enum(['admin', 'chef_projet', 'developpeur', 'commercial', 'designer']),
})

export const projetSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  client_id: z.string().nullable().optional(),
  chef_projet_id: z.string().nullable().optional(),
  statut: z.enum(['en_attente', 'en_cours', 'en_revision', 'termine', 'annule']),
  progression: z.number().min(0).max(100).default(0),
  date_debut: z.string().optional(),
  date_fin_prevue: z.string().optional(),
  budget_ht: z.number().nullable().optional(),
  type_projet: z.string().optional(),
})

export const tacheSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  assignee_id: z.string().nullable().optional(),
  statut: z.enum(['todo', 'in_progress', 'review', 'done']),
  priorite: z.enum(['low', 'medium', 'high', 'urgent']),
  date_echeance: z.string().optional(),
  temps_estime: z.number().nullable().optional(),
})

export const ligneSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantite: z.number().min(0.01, 'Quantité > 0'),
  prix_unitaire_ht: z.number().min(0, 'Prix >= 0'),
  taux_tva: z.number().min(0).max(100).default(20),
})

export const devisSchema = z.object({
  client_id: z.string().min(1, 'Client requis'),
  projet_id: z.string().nullable().optional(),
  date_validite: z.string().optional(),
  conditions_paiement: z.string().optional(),
  remise_pct: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  mentions_legales: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
})

export const factureSchema = z.object({
  client_id: z.string().min(1, 'Client requis'),
  devis_id: z.string().nullable().optional(),
  date_emission: z.string(),
  date_echeance: z.string().optional(),
  conditions_paiement: z.string().optional(),
  remise_pct: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  mentions_legales: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
})

export const paiementSchema = z.object({
  date_paiement: z.string(),
  montant: z.number().min(0.01, 'Montant > 0'),
  mode: z.string().min(1, 'Mode requis'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientForm = z.infer<typeof clientSchema>
export type ContactForm = z.infer<typeof contactSchema>
export type CollaborateurForm = z.infer<typeof collaborateurSchema>
export type ProjetForm = z.infer<typeof projetSchema>
export type TacheForm = z.infer<typeof tacheSchema>
export type LigneForm = z.infer<typeof ligneSchema>
export type DevisForm = z.infer<typeof devisSchema>
export type FactureForm = z.infer<typeof factureSchema>
export type PaiementForm = z.infer<typeof paiementSchema>
