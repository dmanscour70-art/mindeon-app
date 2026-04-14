'use client'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, FolderKanban, FileText, Receipt, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SearchResult } from '@/types'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]) }
  }, [open])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const term = `%${query}%`
      const [c, p, d, f] = await Promise.all([
        supabase.from('clients').select('id,nom_societe,ville').ilike('nom_societe', term).limit(4),
        supabase.from('projets').select('id,nom,statut').ilike('nom', term).limit(4),
        supabase.from('devis').select('id,numero,statut').ilike('numero', term).limit(4),
        supabase.from('factures').select('id,numero,statut').ilike('numero', term).limit(4),
      ])
      const res: SearchResult[] = [
        ...(c.data ?? []).map(x => ({ id: x.id, label: x.nom_societe, subtitle: x.ville ?? undefined, href: `/clients/${x.id}`, type: 'client' as const })),
        ...(p.data ?? []).map(x => ({ id: x.id, label: x.nom, subtitle: x.statut, href: `/projets/${x.id}`, type: 'projet' as const })),
        ...(d.data ?? []).map(x => ({ id: x.id, label: x.numero ?? x.id, subtitle: x.statut, href: `/devis/${x.id}`, type: 'devis' as const })),
        ...(f.data ?? []).map(x => ({ id: x.id, label: x.numero ?? x.id, subtitle: x.statut, href: `/factures/${x.id}`, type: 'facture' as const })),
      ]
      setResults(res)
      setLoading(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open ? onClose() : undefined }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const icons = { client: Building2, projet: FolderKanban, devis: FileText, facture: Receipt }
  const labels = { client: 'Clients', projet: 'Projets', devis: 'Devis', facture: 'Factures' }
  const grouped = results.reduce<Record<string, SearchResult[]>>((a, r) => {
    (a[r.type] ??= []).push(r); return a
  }, {})

  const handleSelect = (href: string) => { navigate(href); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-bg-surface border border-border-color rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-color">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher clients, projets, devis, factures..."
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-xs bg-border-color text-text-muted px-1.5 py-0.5 rounded">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2 scrollbar-thin">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">Recherche...</div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">Aucun résultat</div>
          )}
          {!loading && Object.entries(grouped).map(([type, items]) => {
            const Icon = icons[type as keyof typeof icons]
            return (
              <div key={type}>
                <p className="px-4 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {labels[type as keyof typeof labels]}
                </p>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent-soft text-left transition-colors"
                  >
                    <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm text-text-primary flex-1 truncate">{item.label}</span>
                    {item.subtitle && (
                      <span className="text-xs text-text-muted">{item.subtitle}</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
          {!query && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Commencez à taper pour rechercher...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
