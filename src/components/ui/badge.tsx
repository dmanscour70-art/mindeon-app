import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'accent'
  className?: string
}

const variantMap = {
  default: 'bg-accent/10 text-accent border-accent/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  muted: 'bg-white/5 text-text-muted border-border-color',
  accent: 'bg-accent text-white border-accent',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Badges sémantiques prêts à l'emploi
export function StatutProjetBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    en_attente: { label: 'En attente', variant: 'warning' },
    en_cours:   { label: 'En cours',   variant: 'accent'  },
    en_revision:{ label: 'En révision',variant: 'default' },
    termine:    { label: 'Terminé',    variant: 'success' },
    annule:     { label: 'Annulé',     variant: 'danger'  },
  }
  const cfg = map[statut] ?? { label: statut, variant: 'muted' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StatutDevisBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    brouillon: { label: 'Brouillon', variant: 'muted'   },
    envoye:    { label: 'Envoyé',    variant: 'warning' },
    accepte:   { label: 'Accepté',  variant: 'success' },
    refuse:    { label: 'Refusé',   variant: 'danger'  },
    expire:    { label: 'Expiré',   variant: 'muted'   },
  }
  const cfg = map[statut] ?? { label: statut, variant: 'muted' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StatutFactureBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    brouillon:          { label: 'Brouillon',    variant: 'muted'   },
    envoyee:            { label: 'Envoyée',      variant: 'warning' },
    partiellement_payee:{ label: 'Part. payée',  variant: 'accent'  },
    payee:              { label: 'Payée',         variant: 'success' },
    en_retard:          { label: 'En retard',    variant: 'danger'  },
    annulee:            { label: 'Annulée',      variant: 'muted'   },
  }
  const cfg = map[statut] ?? { label: statut, variant: 'muted' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function PrioriteBadge({ priorite }: { priorite: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    low:    { label: 'Basse',  variant: 'muted'   },
    medium: { label: 'Moyenne',variant: 'accent'  },
    high:   { label: 'Haute',  variant: 'warning' },
    urgent: { label: 'Urgent', variant: 'danger'  },
  }
  const cfg = map[priorite] ?? { label: priorite, variant: 'muted' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StatutClientBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    prospect: { label: 'Prospect', variant: 'warning' },
    client:   { label: 'Client',   variant: 'success' },
    inactif:  { label: 'Inactif',  variant: 'muted'   },
  }
  const cfg = map[statut] ?? { label: statut, variant: 'muted' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
