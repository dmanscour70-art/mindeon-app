-- ============================================================
-- CRM Mindeon — Schéma complet
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE statut_projet AS ENUM ('en_attente','en_cours','en_revision','termine','annule');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE statut_devis AS ENUM ('brouillon','envoye','accepte','refuse','expire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE statut_facture AS ENUM ('brouillon','envoyee','partiellement_payee','payee','en_retard','annulee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE statut_client AS ENUM ('prospect','client','inactif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE role_collaborateur AS ENUM ('admin','chef_projet','developpeur','commercial','designer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE priorite_tache AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE statut_tache AS ENUM ('todo','in_progress','review','done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS collaborateurs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nom         text NOT NULL,
  prenom      text NOT NULL,
  email       text NOT NULL UNIQUE,
  telephone   text,
  role        role_collaborateur NOT NULL DEFAULT 'developpeur',
  avatar_url  text,
  actif       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_societe  text NOT NULL,
  siret        text,
  email        text,
  telephone    text,
  adresse      text,
  ville        text,
  code_postal  text,
  pays         text NOT NULL DEFAULT 'France',
  secteur      text,
  statut       statut_client NOT NULL DEFAULT 'prospect',
  commercial_id uuid REFERENCES collaborateurs(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prenom       text NOT NULL,
  nom          text NOT NULL,
  email        text,
  telephone    text,
  poste        text,
  est_principal boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes_client (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  auteur_id uuid REFERENCES collaborateurs(id) ON DELETE SET NULL,
  contenu   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projets (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom             text NOT NULL,
  description     text,
  client_id       uuid REFERENCES clients(id) ON DELETE SET NULL,
  chef_projet_id  uuid REFERENCES collaborateurs(id) ON DELETE SET NULL,
  statut          statut_projet NOT NULL DEFAULT 'en_attente',
  progression     smallint NOT NULL DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
  date_debut      date,
  date_fin_prevue date,
  date_fin_reelle date,
  budget_ht       numeric(12,2),
  type_projet     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projet_collaborateurs (
  projet_id        uuid NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  collaborateur_id uuid NOT NULL REFERENCES collaborateurs(id) ON DELETE CASCADE,
  PRIMARY KEY (projet_id, collaborateur_id)
);

CREATE TABLE IF NOT EXISTS taches (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  projet_id     uuid NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  titre         text NOT NULL,
  description   text,
  assignee_id   uuid REFERENCES collaborateurs(id) ON DELETE SET NULL,
  statut        statut_tache NOT NULL DEFAULT 'todo',
  priorite      priorite_tache NOT NULL DEFAULT 'medium',
  date_echeance date,
  temps_estime  numeric(5,2),
  temps_reel    numeric(5,2),
  position      int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Séquences numérotation
CREATE SEQUENCE IF NOT EXISTS devis_numero_seq START 1;
CREATE SEQUENCE IF NOT EXISTS factures_numero_seq START 1;

CREATE TABLE IF NOT EXISTS devis (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero             text UNIQUE,
  client_id          uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_by         uuid REFERENCES collaborateurs(id) ON DELETE SET NULL,
  projet_id          uuid REFERENCES projets(id) ON DELETE SET NULL,
  statut             statut_devis NOT NULL DEFAULT 'brouillon',
  date_creation      date NOT NULL DEFAULT CURRENT_DATE,
  date_validite      date,
  conditions_paiement text DEFAULT '30 jours net',
  remise_pct         numeric(5,2) NOT NULL DEFAULT 0,
  notes              text,
  mentions_legales   text DEFAULT 'TVA non applicable, article 293 B du CGI',
  total_ht           numeric(12,2) NOT NULL DEFAULT 0,
  total_tva          numeric(12,2) NOT NULL DEFAULT 0,
  total_ttc          numeric(12,2) NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_devis (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id          uuid NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  description       text NOT NULL,
  quantite          numeric(10,2) NOT NULL DEFAULT 1,
  prix_unitaire_ht  numeric(12,2) NOT NULL DEFAULT 0,
  taux_tva          numeric(5,2) NOT NULL DEFAULT 20,
  position          int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS factures (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero             text UNIQUE,
  devis_id           uuid REFERENCES devis(id) ON DELETE SET NULL,
  client_id          uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_by         uuid REFERENCES collaborateurs(id) ON DELETE SET NULL,
  statut             statut_facture NOT NULL DEFAULT 'brouillon',
  date_emission      date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance      date,
  conditions_paiement text DEFAULT '30 jours net',
  remise_pct         numeric(5,2) NOT NULL DEFAULT 0,
  notes              text,
  mentions_legales   text DEFAULT 'TVA non applicable, article 293 B du CGI',
  total_ht           numeric(12,2) NOT NULL DEFAULT 0,
  total_tva          numeric(12,2) NOT NULL DEFAULT 0,
  total_ttc          numeric(12,2) NOT NULL DEFAULT 0,
  montant_paye       numeric(12,2) NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_facture (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id        uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  description       text NOT NULL,
  quantite          numeric(10,2) NOT NULL DEFAULT 1,
  prix_unitaire_ht  numeric(12,2) NOT NULL DEFAULT 0,
  taux_tva          numeric(5,2) NOT NULL DEFAULT 20,
  position          int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS paiements (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id     uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  date_paiement  date NOT NULL DEFAULT CURRENT_DATE,
  montant        numeric(12,2) NOT NULL,
  mode           text NOT NULL DEFAULT 'virement',
  reference      text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
CREATE INDEX IF NOT EXISTS idx_clients_commercial ON clients(commercial_id);
CREATE INDEX IF NOT EXISTS idx_projets_client ON projets(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
CREATE INDEX IF NOT EXISTS idx_taches_projet ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_taches_assignee ON taches(assignee_id);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_echeance ON factures(date_echeance);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);

-- ============================================================
-- FONCTIONS updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE TRIGGER trg_collaborateurs_upd BEFORE UPDATE ON collaborateurs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_clients_upd        BEFORE UPDATE ON clients        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_projets_upd        BEFORE UPDATE ON projets        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_taches_upd         BEFORE UPDATE ON taches         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_devis_upd          BEFORE UPDATE ON devis          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_factures_upd       BEFORE UPDATE ON factures       FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- NUMÉROTATION AUTO
-- ============================================================
CREATE OR REPLACE FUNCTION next_numero_devis()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE annee text := to_char(CURRENT_DATE,'YYYY'); n bigint;
BEGIN
  SELECT nextval('devis_numero_seq') INTO n;
  RETURN 'DEV-' || annee || '-' || lpad(n::text, 3, '0');
END; $$;

CREATE OR REPLACE FUNCTION next_numero_facture()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE annee text := to_char(CURRENT_DATE,'YYYY'); n bigint;
BEGIN
  SELECT nextval('factures_numero_seq') INTO n;
  RETURN 'FAC-' || annee || '-' || lpad(n::text, 3, '0');
END; $$;

-- ============================================================
-- RECALCUL TOTAUX DEVIS
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_devis(p_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_rem numeric; v_ht numeric; v_tva numeric;
BEGIN
  SELECT remise_pct INTO v_rem FROM devis WHERE id = p_id;
  SELECT
    COALESCE(SUM(quantite * prix_unitaire_ht * (1 - v_rem/100)), 0),
    COALESCE(SUM(quantite * prix_unitaire_ht * (1 - v_rem/100) * taux_tva / 100), 0)
  INTO v_ht, v_tva FROM lignes_devis WHERE devis_id = p_id;
  UPDATE devis SET total_ht=v_ht, total_tva=v_tva, total_ttc=v_ht+v_tva, updated_at=now()
  WHERE id=p_id;
END; $$;

CREATE OR REPLACE FUNCTION trg_recalc_devis_fn() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM recalc_devis(COALESCE(NEW.devis_id, OLD.devis_id));
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE OR REPLACE TRIGGER trg_lignes_devis
  AFTER INSERT OR UPDATE OR DELETE ON lignes_devis
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_devis_fn();

-- ============================================================
-- RECALCUL TOTAUX FACTURE + MONTANT PAYÉ
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_facture(p_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_rem numeric; v_ht numeric; v_tva numeric; v_paye numeric;
BEGIN
  SELECT remise_pct INTO v_rem FROM factures WHERE id = p_id;
  SELECT
    COALESCE(SUM(quantite * prix_unitaire_ht * (1 - v_rem/100)), 0),
    COALESCE(SUM(quantite * prix_unitaire_ht * (1 - v_rem/100) * taux_tva / 100), 0)
  INTO v_ht, v_tva FROM lignes_facture WHERE facture_id = p_id;
  SELECT COALESCE(SUM(montant), 0) INTO v_paye FROM paiements WHERE facture_id = p_id;
  UPDATE factures SET total_ht=v_ht, total_tva=v_tva, total_ttc=v_ht+v_tva,
    montant_paye=v_paye, updated_at=now() WHERE id=p_id;
END; $$;

CREATE OR REPLACE FUNCTION trg_recalc_facture_fn() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM recalc_facture(COALESCE(NEW.facture_id, OLD.facture_id));
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE OR REPLACE TRIGGER trg_lignes_facture
  AFTER INSERT OR UPDATE OR DELETE ON lignes_facture
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_facture_fn();

CREATE OR REPLACE FUNCTION trg_paiements_fn() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM recalc_facture(COALESCE(NEW.facture_id, OLD.facture_id));
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE OR REPLACE TRIGGER trg_paiements
  AFTER INSERT OR UPDATE OR DELETE ON paiements
  FOR EACH ROW EXECUTE FUNCTION trg_paiements_fn();

-- ============================================================
-- ROW LEVEL SECURITY
-- Politique simple : tout utilisateur authentifié a accès complet.
-- ============================================================
ALTER TABLE collaborateurs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_client         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet_collaborateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_devis         ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_facture       ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements            ENABLE ROW LEVEL SECURITY;

-- Policies : auth.uid() IS NOT NULL → accès complet (V1 simple)
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'collaborateurs','clients','contacts','notes_client',
    'projets','projet_collaborateurs','taches',
    'devis','lignes_devis','factures','lignes_facture','paiements'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "auth_all_%s"
      ON %I FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
    ', tbl, tbl);
  END LOOP;
END $$;

-- Storage buckets (à créer aussi dans Storage → Buckets dans le dashboard)
-- avatars  : public
-- documents: private
