import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'accent' | 'success' | 'warning' | 'danger'
  trend?: { value: number; positive?: boolean }
  className?: string
}

const colorMap = {
  accent:  { icon: 'text-accent bg-accent/10',   trend: 'text-accent bg-accent/10' },
  success: { icon: 'text-success bg-success/10', trend: 'text-success bg-success/10' },
  warning: { icon: 'text-warning bg-warning/10', trend: 'text-warning bg-warning/10' },
  danger:  { icon: 'text-danger bg-danger/10',   trend: 'text-danger bg-danger/10' },
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'accent', trend, className }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn('bg-bg-surface border border-border-color rounded-xl p-5 transition-shadow hover:shadow-glow', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.trend)}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="font-heading font-bold text-2xl text-text-primary leading-none">{value}</p>
      <p className="text-sm text-text-muted mt-1">{title}</p>
      {subtitle && <p className="text-xs text-text-muted/70 mt-1">{subtitle}</p>}
    </div>
  )
}
