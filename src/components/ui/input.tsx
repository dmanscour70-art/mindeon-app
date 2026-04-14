import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}

export function Input({ label, error, leftIcon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </span>
        )}
        <input
          {...props}
          className={cn(
            'w-full bg-bg-surface border border-border-color rounded-lg text-text-primary placeholder-text-muted',
            'px-3 py-2 text-sm',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-9',
            error && 'border-danger focus:border-danger focus:ring-danger/30',
            className
          )}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <select
        {...props}
        className={cn(
          'w-full bg-bg-surface border border-border-color rounded-lg text-text-primary',
          'px-3 py-2 text-sm',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
          'transition-colors duration-150 appearance-none',
          error && 'border-danger',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <textarea
        {...props}
        className={cn(
          'w-full bg-bg-surface border border-border-color rounded-lg text-text-primary placeholder-text-muted',
          'px-3 py-2 text-sm resize-none',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
          'transition-colors duration-150',
          error && 'border-danger',
          className
        )}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
