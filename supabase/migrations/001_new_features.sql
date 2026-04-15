-- ============================================================
-- Migration 001 — Maintenances + Dépenses
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Enums supplémentaires
DO $$ BEGIN
  CREATE TYPE frequence_maintenance AS ENUM ('mensuel','trimestriel','annuel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE categorie_depense AS ENUM ('logiciels','materiel','services','marketing','salaires','loyer','autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE type_depense AS ENUM ('mensuel','ponctuel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE maintenances
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenances (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  projet_id   uuid NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  description text NOT NULL,
  prix_ht     numeric(12,2) NOT NULL DEFAULT 0,
  taux_tva    numeric(5,2)  NOT NULL DEFAULT 20,
  frequence   text NOT NULL DEFAULT 'mensuel',
  date_debut  date NOT NULL DEFAULT CURRENT_DATE,
  date_fin    date,
  actif       boolean NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER trg_maintenances_upd
  BEFORE UPDATE ON maintenances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_maintenances_projet ON maintenances(projet_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_client ON maintenances(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_actif  ON maintenances(actif);

-- ============================================================
-- TABLE depenses
-- ============================================================
CREATE TABLE IF NOT EXISTS depenses (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description  text NOT NULL,
  montant_ht   numeric(12,2) NOT NULL DEFAULT 0,
  taux_tva     numeric(5,2)  NOT NULL DEFAULT 20,
  categorie    text NOT NULL DEFAULT 'autre',
  type_depense text NOT NULL DEFAULT 'ponctuel',
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  projet_id    uuid REFERENCES projets(id) ON DELETE SET NULL,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER trg_depenses_upd
  BEFORE UPDATE ON depenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_depenses_date      ON depenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses(categorie);
CREATE INDEX IF NOT EXISTS idx_depenses_type      ON depenses(type_depense);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl text; tbls text[] := ARRAY['maintenances', 'depenses'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON %I;', tbl, tbl);
    EXECUTE format('
      CREATE POLICY "auth_all_%s"
      ON %I FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
    ', tbl, tbl);
  END LOOP;
END $$;
