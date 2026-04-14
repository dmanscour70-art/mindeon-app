import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'accent' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  className?: string
  height?: string
}

const colorMap = {
  accent:  'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
}

export function ProgressBar({ value, max = 100, color = 'accent', showLabel, className, height = 'h-1.5' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const c = pct >= 70 ? 'success' : pct >= 40 ? 'accent' : pct >= 20 ? 'warning' : 'danger'
  const finalColor = colorMap[color === 'accent' ? c : color]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-border-color rounded-full overflow-hidden', height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-700', finalColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-muted w-8 text-right font-heading">{Math.round(pct)}%</span>
      )}
    </div>
  )
}
