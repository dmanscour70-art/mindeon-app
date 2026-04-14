import { useState } from 'react'
import { Menu, Search, Bell, LogOut } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { SearchModal } from '@/components/shared/search-modal'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { collaborateur } = useAuthStore()
  const { signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Cmd+K global
  useState(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  })

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-60 h-16 z-30 flex items-center gap-3 px-4 border-b border-border-color" style={{ background: '#08080f' }}>
        {/* Mobile menu */}
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent-soft">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 flex-1 max-w-sm px-3 py-2 rounded-lg border border-border-color bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary transition-all text-sm"
        >
          <Search className="w-4 h-4" />
          <span>Rechercher...</span>
          <kbd className="ml-auto text-xs bg-border-color px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Notifs */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-border-color bg-bg-surface text-text-muted hover:text-text-primary hover:border-accent/40 transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          </button>

          {/* User dropdown */}
          {collaborateur && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border-color bg-bg-surface hover:border-accent/40 transition-all"
              >
                <Avatar prenom={collaborateur.prenom} nom={collaborateur.nom} src={collaborateur.avatar_url} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-text-primary leading-none">{collaborateur.prenom} {collaborateur.nom}</p>
                  <p className="text-xs text-text-muted mt-0.5">{collaborateur.role}</p>
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-bg-surface border border-border-color rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button
                      onClick={() => { signOut(); setDropdownOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
