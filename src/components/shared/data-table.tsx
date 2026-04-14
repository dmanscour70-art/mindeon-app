import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<T>({
  columns, data, keyExtractor, onRowClick,
  page = 1, pageSize = 20, total, onPageChange,
  emptyMessage = 'Aucune donnée',
  loading,
}: DataTableProps<T>) {
  const totalPages = total ? Math.ceil(total / pageSize) : 1

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-surface border-b border-border-color">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-color/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 rounded bg-border-color animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-border-color/50 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent-soft',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-text-primary', col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-color">
          <p className="text-xs text-text-muted">
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} sur {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-text-muted px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost" size="icon"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
