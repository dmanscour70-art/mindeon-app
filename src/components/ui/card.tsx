import { cn } from '@/lib/utils'
import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  glow?: boolean
}

export function Card({ children, glow, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'bg-bg-surface border border-border-color rounded-xl',
        glow && 'shadow-glow',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4 border-b border-border-color flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-heading font-semibold text-text-primary text-base', className)}>
      {children}
    </h3>
  )
}
