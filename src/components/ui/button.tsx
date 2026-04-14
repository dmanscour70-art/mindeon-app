import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary:   'bg-accent hover:bg-accent-hover text-white shadow-sm',
  secondary: 'bg-bg-surface border border-border-color text-text-primary hover:bg-border-color',
  ghost:     'text-text-muted hover:text-text-primary hover:bg-white/5',
  danger:    'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
  outline:   'border border-accent/40 text-accent hover:bg-accent/10',
}

const sizes = {
  sm:   'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md:   'px-4 py-2 text-sm rounded-lg gap-2',
  lg:   'px-5 py-2.5 text-base rounded-xl gap-2',
  icon: 'p-2 rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
