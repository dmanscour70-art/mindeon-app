import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Building2, FolderKanban,
  FileText, Receipt, Settings, Zap, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/shared/avatar'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/collaborateurs', label: 'Collaborateurs',   icon: Users },
  { to: '/clients',        label: 'Clients',          icon: Building2 },
  { to: '/projets',        label: 'Projets',          icon: FolderKanban },
  { to: '/devis',          label: 'Devis',            icon: FileText },
  { to: '/factures',       label: 'Factures',         icon: Receipt },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { collaborateur } = useAuthStore()
  const { signOut } = useAuth()

  const navItem = (to: string, label: string, Icon: typeof LayoutDashboard) => (
    <NavLink
      key={to}
      to={to}
      title={collapsed ? label : undefined}
      onClick={onMobileClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-muted hover:text-text-primary hover:bg-accent-soft',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: '#0a0a14' }}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border-color flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-glow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-white truncate">Mindeon</span>
          )}
        </div>
        {/* Mobile close */}
        <button onClick={onMobileClose} className="ml-auto lg:hidden text-text-muted hover:text-text-primary">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map(({ to, label, icon: Icon }) => navItem(to, label, Icon))}
      </nav>

      {/* Bas */}
      <div className="py-3 px-2 border-t border-border-color space-y-0.5">
        {navItem('/parametres', 'Paramètres', Settings)}

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-accent-soft transition-all',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span>Réduire</span></>}
        </button>

        {/* Avatar */}
        {collaborateur && (
          <div className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg', collapsed && 'justify-center px-2')}>
            <Avatar prenom={collaborateur.prenom} nom={collaborateur.nom} src={collaborateur.avatar_url} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">{collaborateur.prenom} {collaborateur.nom}</p>
                <p className="text-xs text-text-muted truncate">{collaborateur.role}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 left-0 h-full z-40 border-r border-border-color transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="relative w-60 flex-shrink-0 border-r border-border-color">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
