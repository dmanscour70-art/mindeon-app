import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeNotifications } from '@/hooks/useRealtime'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  useRealtimeNotifications()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center animate-pulse">
            <span className="text-white font-heading font-bold text-xl">M</span>
          </div>
          <p className="text-text-muted text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-bg-app overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto pt-16 scrollbar-thin">
          <div className="p-4 md:p-6 max-w-screen-2xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
