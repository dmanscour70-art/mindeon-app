import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/auth/Login'
import { DashboardPage } from '@/pages/dashboard/Dashboard'
import { CollaborateursPage } from '@/pages/collaborateurs/Collaborateurs'
import { ClientsPage } from '@/pages/clients/Clients'
import { ClientDetailPage } from '@/pages/clients/ClientDetail'
import { ProjetsPage } from '@/pages/projets/Projets'
import { ProjetDetailPage } from '@/pages/projets/ProjetDetail'
import { DevisPage } from '@/pages/devis/Devis'
import { DevisDetailPage } from '@/pages/devis/DevisDetail'
import { DevisFormPage } from '@/pages/devis/DevisForm'
import { FacturesPage } from '@/pages/factures/Factures'
import { FactureDetailPage } from '@/pages/factures/FactureDetail'
import { FactureFormPage } from '@/pages/factures/FactureForm'
import { ParametresPage } from '@/pages/Parametres'

export default function App() {
  return (
    <>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f0f1a',
            border: '1px solid #1e1e35',
            color: '#f1f0ff',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/collaborateurs" element={<CollaborateursPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/projets" element={<ProjetsPage />} />
          <Route path="/projets/:id" element={<ProjetDetailPage />} />
          <Route path="/devis" element={<DevisPage />} />
          <Route path="/devis/nouveau" element={<DevisFormPage />} />
          <Route path="/devis/:id" element={<DevisDetailPage />} />
          <Route path="/devis/:id/modifier" element={<DevisFormPage />} />
          <Route path="/factures" element={<FacturesPage />} />
          <Route path="/factures/nouvelle" element={<FactureFormPage />} />
          <Route path="/factures/:id" element={<FactureDetailPage />} />
          <Route path="/factures/:id/modifier" element={<FactureFormPage />} />
          <Route path="/parametres" element={<ParametresPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
