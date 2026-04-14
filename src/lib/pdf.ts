import jsPDF from 'jspdf'
import { formatCurrency, formatDate } from './utils'
import type { Devis, LigneDevis, Facture, LigneFacture, Client } from '@/types'

const MINDEON = {
  nom: 'Mindeon',
  slogan: 'Automatisation & Intelligence Artificielle',
  email: 'contact@mindeon.fr',
  telephone: '+33 1 00 00 00 00',
  siret: '000 000 000 00000',
  tva: 'FR00000000000',
  adresse: '1 rue de l\'Innovation, 75001 Paris',
}

const COLORS = {
  accent: [108, 99, 255] as [number, number, number],
  dark: [8, 8, 15] as [number, number, number],
  surface: [15, 15, 26] as [number, number, number],
  muted: [139, 138, 168] as [number, number, number],
  border: [30, 30, 53] as [number, number, number],
  white: [241, 240, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
}

function drawHeader(pdf: jsPDF, titre: string, numero: string) {
  // Fond header
  pdf.setFillColor(...COLORS.surface)
  pdf.rect(0, 0, 210, 45, 'F')
  // Accent barre
  pdf.setFillColor(...COLORS.accent)
  pdf.rect(0, 0, 4, 45, 'F')

  // Logo texte
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(...COLORS.accent)
  pdf.text('Mindeon', 12, 18)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(MINDEON.slogan, 12, 24)

  // Titre document
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor(...COLORS.white)
  pdf.text(titre, 210 - 12, 16, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.accent)
  pdf.text(numero, 210 - 12, 24, { align: 'right' })

  // Infos Mindeon
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.muted)
  pdf.text([MINDEON.adresse, MINDEON.email, MINDEON.telephone], 12, 31)
}

function drawClientBlock(pdf: jsPDF, client: Client | null | undefined, yStart: number) {
  pdf.setFillColor(...COLORS.surface)
  pdf.roundedRect(12, yStart, 85, 38, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(...COLORS.muted)
  pdf.text('FACTURÉ À', 16, yStart + 6)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...COLORS.white)
  pdf.text(client?.nom_societe ?? 'Client inconnu', 16, yStart + 13)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...COLORS.muted)
  const lines = [
    client?.adresse ?? '',
    [client?.code_postal, client?.ville].filter(Boolean).join(' '),
    client?.email ?? '',
    client?.telephone ?? '',
  ].filter(Boolean)
  pdf.text(lines, 16, yStart + 20)
}

function drawDatesBlock(
  pdf: jsPDF,
  fields: { label: string; value: string }[],
  yStart: number
) {
  pdf.setFillColor(...COLORS.surface)
  pdf.roundedRect(105, yStart, 93, 38, 2, 2, 'F')
  let y = yStart + 8
  for (const f of fields) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(...COLORS.muted)
    pdf.text(f.label, 109, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLORS.white)
    pdf.text(f.value, 180, y, { align: 'right' })
    y += 9
  }
}

function drawLignesTable(
  pdf: jsPDF,
  lignes: (LigneDevis | LigneFacture)[],
  yStart: number
): number {
  // Header table
  pdf.setFillColor(...COLORS.accent)
  pdf.rect(12, yStart, 186, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(255, 255, 255)
  pdf.text('Description', 15, yStart + 5.5)
  pdf.text('Qté', 120, yStart + 5.5, { align: 'right' })
  pdf.text('PU HT', 145, yStart + 5.5, { align: 'right' })
  pdf.text('TVA', 163, yStart + 5.5, { align: 'right' })
  pdf.text('Total HT', 198, yStart + 5.5, { align: 'right' })

  let y = yStart + 8
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i]
    const isEven = i % 2 === 0
    pdf.setFillColor(isEven ? 15 : 20, isEven ? 15 : 20, isEven ? 26 : 32)
    pdf.rect(12, y, 186, 9, 'F')

    const totalHT = l.quantite * l.prix_unitaire_ht
    pdf.setTextColor(...COLORS.white)

    const descLines = pdf.splitTextToSize(l.description, 95)
    pdf.text(descLines[0], 15, y + 6)
    pdf.setTextColor(...COLORS.muted)
    pdf.text(String(l.quantite), 120, y + 6, { align: 'right' })
    pdf.text(formatCurrency(l.prix_unitaire_ht), 145, y + 6, { align: 'right' })
    pdf.text(`${l.taux_tva}%`, 163, y + 6, { align: 'right' })
    pdf.setTextColor(...COLORS.white)
    pdf.text(formatCurrency(totalHT), 198, y + 6, { align: 'right' })
    y += 9
  }

  return y + 4
}

function drawTotaux(
  pdf: jsPDF,
  totalHT: number,
  totalTVA: number,
  totalTTC: number,
  remisePct: number,
  y: number
): number {
  const xLeft = 130
  const xRight = 198
  const lineH = 8

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...COLORS.muted)
  pdf.text('Sous-total HT', xLeft, y)
  pdf.setTextColor(...COLORS.white)
  pdf.text(formatCurrency(totalHT), xRight, y, { align: 'right' })
  y += lineH

  if (remisePct > 0) {
    pdf.setTextColor(...COLORS.muted)
    pdf.text(`Remise (${remisePct}%)`, xLeft, y)
    pdf.setTextColor('#ef4444')
    pdf.text(`-${formatCurrency(totalHT * remisePct / 100)}`, xRight, y, { align: 'right' })
    y += lineH
  }

  pdf.setTextColor(...COLORS.muted)
  pdf.text('TVA', xLeft, y)
  pdf.setTextColor(...COLORS.white)
  pdf.text(formatCurrency(totalTVA), xRight, y, { align: 'right' })
  y += lineH + 2

  // Total TTC
  pdf.setFillColor(...COLORS.accent)
  pdf.roundedRect(xLeft - 3, y - 5, xRight - xLeft + 9, 12, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(255, 255, 255)
  pdf.text('TOTAL TTC', xLeft, y + 3)
  pdf.text(formatCurrency(totalTTC), xRight, y + 3, { align: 'right' })
  y += 16

  return y
}

function drawFooter(pdf: jsPDF, conditions: string | null, mentions: string | null) {
  const pageH = pdf.internal.pageSize.height
  pdf.setFillColor(...COLORS.surface)
  pdf.rect(0, pageH - 28, 210, 28, 'F')
  pdf.setFillColor(...COLORS.accent)
  pdf.rect(0, pageH - 28, 4, 28, 'F')

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...COLORS.muted)

  if (conditions) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Conditions de paiement :', 12, pageH - 22)
    pdf.setFont('helvetica', 'normal')
    pdf.text(conditions, 12, pageH - 17)
  }

  const legalLines = (mentions ?? `SIRET ${MINDEON.siret} | TVA ${MINDEON.tva} | ${MINDEON.adresse}`).split('\n')
  pdf.text(legalLines, 12, pageH - (conditions ? 11 : 20))
}

export function generateDevisPDF(
  devis: Devis,
  lignes: LigneDevis[],
  client: Client | null | undefined
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  drawHeader(pdf, 'DEVIS', devis.numero ?? 'N/A')

  const y0 = 50
  drawClientBlock(pdf, client, y0)
  drawDatesBlock(pdf, [
    { label: 'Date', value: formatDate(devis.date_creation) },
    { label: 'Validité', value: formatDate(devis.date_validite) },
  ], y0)

  let y = y0 + 44
  y = drawLignesTable(pdf, lignes, y)
  y = drawTotaux(pdf, devis.total_ht, devis.total_tva, devis.total_ttc, devis.remise_pct, y + 4)

  drawFooter(pdf, devis.conditions_paiement, devis.mentions_legales)

  pdf.save(`${devis.numero ?? 'devis'}.pdf`)
}

export function generateFacturePDF(
  facture: Facture,
  lignes: LigneFacture[],
  client: Client | null | undefined
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  drawHeader(pdf, 'FACTURE', facture.numero ?? 'N/A')

  const y0 = 50
  drawClientBlock(pdf, client, y0)
  drawDatesBlock(pdf, [
    { label: 'Date d\'émission', value: formatDate(facture.date_emission) },
    { label: 'Date d\'échéance', value: formatDate(facture.date_echeance) },
  ], y0)

  let y = y0 + 44
  y = drawLignesTable(pdf, lignes, y)
  y = drawTotaux(pdf, facture.total_ht, facture.total_tva, facture.total_ttc, facture.remise_pct, y + 4)

  // Montant payé / reste
  if (facture.montant_paye > 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLORS.success)
    pdf.text(`Déjà réglé : ${formatCurrency(facture.montant_paye)}`, 198, y, { align: 'right' })
    y += 7
    pdf.setTextColor(...COLORS.white)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Reste à payer : ${formatCurrency(facture.total_ttc - facture.montant_paye)}`, 198, y, { align: 'right' })
  }

  drawFooter(pdf, facture.conditions_paiement, facture.mentions_legales)

  pdf.save(`${facture.numero ?? 'facture'}.pdf`)
}
