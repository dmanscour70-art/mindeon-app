-- ============================================================
-- CRM Mindeon — Données de démonstration
-- À exécuter APRÈS schema.sql dans Supabase SQL Editor
-- Note : remplacez les user_id par de vrais UUIDs après création
--        des comptes dans Authentication → Users
-- ============================================================

-- Désactiver temporairement les contraintes de FK pour le seed
SET session_replication_role = replica;

-- ============================================================
-- COLLABORATEURS
-- ============================================================
INSERT INTO collaborateurs (id, nom, prenom, email, telephone, role, actif) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Martin', 'Alice', 'alice.martin@mindeon.fr', '+33 6 11 22 33 44', 'admin', true),
  ('11111111-0000-0000-0000-000000000002', 'Leroy', 'Thomas', 'thomas.leroy@mindeon.fr', '+33 6 22 33 44 55', 'chef_projet', true),
  ('11111111-0000-0000-0000-000000000003', 'Chen', 'Sarah', 'sarah.chen@mindeon.fr', '+33 6 33 44 55 66', 'developpeur', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- CLIENTS
-- ============================================================
INSERT INTO clients (id, nom_societe, siret, email, telephone, adresse, ville, code_postal, secteur, statut, commercial_id) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Innovatech SAS', '123 456 789 00012', 'contact@innovatech.fr', '+33 1 40 00 11 22', '15 rue de l''Innovation', 'Paris', '75008', 'Intelligence Artificielle', 'client', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', 'MétalogieInd', '234 567 890 00023', 'direction@metalogieind.fr', '+33 4 72 00 22 33', '88 avenue de l''Industrie', 'Lyon', '69003', 'Industrie', 'client', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000003', 'Cabinet Novae', '345 678 901 00034', 'info@cabinetnovae.fr', '+33 5 56 00 33 44', '3 place des Affaires', 'Bordeaux', '33000', 'Conseil', 'prospect', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000004', 'ShopFlow', '456 789 012 00045', 'tech@shopflow.io', '+33 1 50 00 44 55', '27 rue du Commerce', 'Paris', '75011', 'E-commerce', 'client', '11111111-0000-0000-0000-000000000003'),
  ('22222222-0000-0000-0000-000000000005', 'BankSecure', '567 890 123 00056', 'dsi@banksecure.fr', '+33 1 60 00 55 66', '1 boulevard de la Finance', 'Paris', '75001', 'Finance', 'prospect', '11111111-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CONTACTS
-- ============================================================
INSERT INTO contacts (client_id, prenom, nom, email, telephone, poste, est_principal) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Marc', 'Dupont', 'marc.dupont@innovatech.fr', '+33 6 10 00 11 22', 'CTO', true),
  ('22222222-0000-0000-0000-000000000001', 'Julie', 'Bernard', 'julie.bernard@innovatech.fr', '+33 6 10 00 11 33', 'CEO', false),
  ('22222222-0000-0000-0000-000000000002', 'Pierre', 'Moreau', 'pierre.moreau@metalogieind.fr', '+33 6 20 00 22 33', 'DSI', true),
  ('22222222-0000-0000-0000-000000000003', 'Sophie', 'Petit', 'sophie.petit@cabinetnovae.fr', '+33 6 30 00 33 44', 'Directrice', true),
  ('22222222-0000-0000-0000-000000000004', 'Kevin', 'Laurent', 'kevin@shopflow.io', '+33 6 40 00 44 55', 'CEO', true);

-- ============================================================
-- PROJETS
-- ============================================================
INSERT INTO projets (id, nom, description, client_id, chef_projet_id, statut, progression, date_debut, date_fin_prevue, budget_ht, type_projet) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Plateforme IA Innovatech', 'Développement d''une plateforme d''automatisation IA avec dashboard analytics', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'en_cours', 65, '2024-01-15', '2024-06-30', 85000.00, 'Développement'),
  ('33333333-0000-0000-0000-000000000002', 'ERP Industriel MétalogieInd', 'Intégration et automatisation du système ERP avec connecteurs IoT', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'en_cours', 40, '2024-02-01', '2024-09-30', 120000.00, 'Intégration'),
  ('33333333-0000-0000-0000-000000000003', 'Audit & Stratégie IA Novae', 'Mission de conseil en transformation digitale et IA', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'en_revision', 90, '2024-01-01', '2024-04-30', 25000.00, 'Conseil'),
  ('33333333-0000-0000-0000-000000000004', 'Automatisation ShopFlow', 'Mise en place de workflows d''automatisation e-commerce', '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'termine', 100, '2023-10-01', '2024-01-31', 45000.00, 'Automatisation')
ON CONFLICT (id) DO NOTHING;

-- Équipes projets
INSERT INTO projet_collaborateurs (projet_id, collaborateur_id) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'),
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'),
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TÂCHES
-- ============================================================
INSERT INTO taches (projet_id, titre, assignee_id, statut, priorite, date_echeance, temps_estime, position) VALUES
  -- Projet 1
  ('33333333-0000-0000-0000-000000000001', 'Architecture microservices IA', '11111111-0000-0000-0000-000000000003', 'done', 'urgent', '2024-02-28', 40, 0),
  ('33333333-0000-0000-0000-000000000001', 'API d''inférence modèles ML', '11111111-0000-0000-0000-000000000003', 'in_progress', 'high', '2024-04-15', 60, 1),
  ('33333333-0000-0000-0000-000000000001', 'Dashboard analytics Recharts', '11111111-0000-0000-0000-000000000003', 'todo', 'medium', '2024-05-01', 30, 2),
  ('33333333-0000-0000-0000-000000000001', 'Tests de charge et performance', '11111111-0000-0000-0000-000000000002', 'todo', 'high', '2024-06-01', 20, 3),
  ('33333333-0000-0000-0000-000000000001', 'Documentation technique', '11111111-0000-0000-0000-000000000002', 'todo', 'low', '2024-06-15', 15, 4),
  -- Projet 2
  ('33333333-0000-0000-0000-000000000002', 'Analyse système ERP existant', '11111111-0000-0000-0000-000000000002', 'done', 'high', '2024-02-15', 20, 0),
  ('33333333-0000-0000-0000-000000000002', 'Connecteurs IoT capteurs usine', '11111111-0000-0000-0000-000000000003', 'in_progress', 'urgent', '2024-05-15', 80, 1),
  ('33333333-0000-0000-0000-000000000002', 'Module reporting temps réel', '11111111-0000-0000-0000-000000000003', 'todo', 'high', '2024-07-01', 45, 2),
  ('33333333-0000-0000-0000-000000000002', 'Formation équipes terrain', '11111111-0000-0000-0000-000000000002', 'todo', 'medium', '2024-09-01', 25, 3),
  -- Projet 3
  ('33333333-0000-0000-0000-000000000003', 'Audit processus métier', '11111111-0000-0000-0000-000000000001', 'done', 'high', '2024-02-01', 30, 0),
  ('33333333-0000-0000-0000-000000000003', 'Roadmap transformation IA', '11111111-0000-0000-0000-000000000001', 'review', 'high', '2024-04-15', 20, 1);

-- ============================================================
-- DEVIS
-- ============================================================
INSERT INTO devis (id, numero, client_id, created_by, projet_id, statut, date_creation, date_validite, conditions_paiement, remise_pct, total_ht, total_tva, total_ttc) VALUES
  ('44444444-0000-0000-0000-000000000001', 'DEV-2024-001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'accepte', '2024-01-10', '2024-02-10', '30 jours fin de mois', 5, 80750.00, 16150.00, 96900.00),
  ('44444444-0000-0000-0000-000000000002', 'DEV-2024-002', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'envoye', '2024-03-01', '2024-04-01', '30 jours net', 0, 25000.00, 5000.00, 30000.00),
  ('44444444-0000-0000-0000-000000000003', 'DEV-2024-003', '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', NULL, 'brouillon', '2024-03-15', '2024-04-15', '45 jours net', 0, 60000.00, 12000.00, 72000.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lignes_devis (devis_id, description, quantite, prix_unitaire_ht, taux_tva, position) VALUES
  ('44444444-0000-0000-0000-000000000001', 'Architecture et conception plateforme IA', 1, 15000.00, 20, 0),
  ('44444444-0000-0000-0000-000000000001', 'Développement backend API ML (jours)', 40, 800.00, 20, 1),
  ('44444444-0000-0000-0000-000000000001', 'Intégration et tests', 10, 750.00, 20, 2),
  ('44444444-0000-0000-0000-000000000002', 'Mission audit et diagnostic IA', 5, 2500.00, 20, 0),
  ('44444444-0000-0000-0000-000000000002', 'Livrables stratégiques et roadmap', 1, 12500.00, 20, 1),
  ('44444444-0000-0000-0000-000000000003', 'Audit sécurité systèmes d''information', 1, 20000.00, 20, 0),
  ('44444444-0000-0000-0000-000000000003', 'Développement chatbot IA réglementaire', 1, 35000.00, 20, 1),
  ('44444444-0000-0000-0000-000000000003', 'Formation équipes (2 jours)', 2, 2500.00, 20, 2);

-- ============================================================
-- FACTURES
-- ============================================================
INSERT INTO factures (id, numero, devis_id, client_id, created_by, statut, date_emission, date_echeance, conditions_paiement, remise_pct, total_ht, total_tva, total_ttc, montant_paye) VALUES
  ('55555555-0000-0000-0000-000000000001', 'FAC-2024-001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'payee',              '2024-01-20', '2024-02-20', '30 jours fin de mois', 5, 80750.00, 16150.00, 96900.00, 96900.00),
  ('55555555-0000-0000-0000-000000000002', 'FAC-2024-002', NULL,                                   '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'payee',              '2024-02-01', '2024-03-01', '30 jours net', 0, 50000.00, 10000.00, 60000.00, 60000.00),
  ('55555555-0000-0000-0000-000000000003', 'FAC-2024-003', NULL,                                   '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'payee',              '2024-02-15', '2024-03-15', '30 jours net', 0, 45000.00, 9000.00, 54000.00, 54000.00),
  ('55555555-0000-0000-0000-000000000004', 'FAC-2024-004', NULL,                                   '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'envoyee',            '2024-03-01', '2024-04-30', '30 jours net', 0, 35000.00, 7000.00, 42000.00, 0.00),
  ('55555555-0000-0000-0000-000000000005', 'FAC-2024-005', NULL,                                   '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'en_retard',          '2024-01-15', '2024-02-15', '30 jours net', 0, 18000.00, 3600.00, 21600.00, 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lignes_facture (facture_id, description, quantite, prix_unitaire_ht, taux_tva, position) VALUES
  ('55555555-0000-0000-0000-000000000001', 'Développement plateforme IA — Phase 1', 1, 80750.00, 20, 0),
  ('55555555-0000-0000-0000-000000000002', 'Intégration ERP — Phase 1 (50 jours)', 50, 1000.00, 20, 0),
  ('55555555-0000-0000-0000-000000000003', 'Automatisation workflows e-commerce', 1, 45000.00, 20, 0),
  ('55555555-0000-0000-0000-000000000004', 'Développement connecteurs IoT', 1, 35000.00, 20, 0),
  ('55555555-0000-0000-0000-000000000005', 'Maintenance et support — T1 2024', 3, 6000.00, 20, 0);

-- ============================================================
-- PAIEMENTS
-- ============================================================
INSERT INTO paiements (facture_id, date_paiement, montant, mode, reference) VALUES
  ('55555555-0000-0000-0000-000000000001', '2024-02-18', 96900.00, 'virement', 'VIR-2024-0218-INNOV'),
  ('55555555-0000-0000-0000-000000000002', '2024-02-28', 60000.00, 'virement', 'VIR-2024-0228-METAL'),
  ('55555555-0000-0000-0000-000000000003', '2024-03-14', 54000.00, 'virement', 'VIR-2024-0314-SHOP');

-- ============================================================
-- NOTES
-- ============================================================
INSERT INTO notes_client (client_id, auteur_id, contenu) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Client très satisfait de la phase 1. Souhaite étendre le projet à une phase 2 avec intégration ERP.'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Réunion de suivi le 15/03. Demande d''accélérer les connecteurs IoT — deadline usine en juin.'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Prospect intéressé par une mission plus longue. Relancer après rendu du rapport de phase 1.');

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- Recalcul des totaux (au cas où les triggers ne se déclenchent pas sur les INSERTs du seed)
SELECT recalc_devis(id) FROM devis;
SELECT recalc_facture(id) FROM factures;
