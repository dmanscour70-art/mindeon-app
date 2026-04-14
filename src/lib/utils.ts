import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date: string | Date | null | undefined,
  fmt = 'd MMM yyyy'
): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: fr })
  } catch {
    return '—'
  }
}

export function formatDateShort(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy')
}

export function daysLate(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  return Math.max(0, differenceInDays(new Date(), parseISO(dateStr)))
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    chef_projet: 'Chef de projet',
    developpeur: 'Développeur·se',
    commercial: 'Commercial·e',
    designer: 'Designer',
  }
  return map[role] ?? role
}

export function getStatutProjetLabel(s: string) {
  return ({ en_attente: 'En attente', en_cours: 'En cours', en_revision: 'En révision', termine: 'Terminé', annule: 'Annulé' })[s] ?? s
}
export function getStatutDevisLabel(s: string) {
  return ({ brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré' })[s] ?? s
}
export function getStatutFactureLabel(s: string) {
  return ({ brouillon: 'Brouillon', envoyee: 'Envoyée', partiellement_payee: 'Part. payée', payee: 'Payée', en_retard: 'En retard', annulee: 'Annulée' })[s] ?? s
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const v = row[h]
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    }).join(';')
  )
  const csv = [headers.join(';'), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

export function calcLignes(lignes: { quantite: number; prix_unitaire_ht: number; taux_tva: number }[], remise_pct = 0) {
  let ht = 0, tva = 0
  for (const l of lignes) {
    const lineHT = l.quantite * l.prix_unitaire_ht * (1 - remise_pct / 100)
    ht += lineHT
    tva += lineHT * (l.taux_tva / 100)
  }
  return { ht, tva, ttc: ht + tva }
}
