export * from './database'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SearchResult {
  id: string
  label: string
  subtitle?: string
  href: string
  type: 'client' | 'projet' | 'devis' | 'facture'
}
