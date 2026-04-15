import { useState, useEffect } from 'react'
import { Send, Copy, Check, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Devis, Facture } from '@/types'

interface Props {
  clientId: string | null
  clientEmail?: string | null
  clientNom?: string | null
  devis?: Devis[]
  factures?: Facture[]
}

type TemplateKey = 'libre' | 'envoi_devis' | 'envoi_facture' | 'relance_paiement' | 'bienvenue'

const TEMPLATES: Record<TemplateKey, { label: string; subject: (ctx: TemplateCtx) => string; body: (ctx: TemplateCtx) => string }> = {
  libre: {
    label: 'Message libre',
    subject: () => '',
    body: () => '',
  },
  envoi_devis: {
    label: 'Envoi d\'un devis',
    subject: ctx => `Devis ${ctx.docNum} — ${ctx.agenceNom}`,
    body: ctx => `Bonjour,\n\nVeuillez trouver ci-joint votre devis ${ctx.docNum}${ctx.docMontant ? ` d'un montant de ${ctx.docMontant} TTC` : ''}.\n\nCe devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question.\n\nCordialement,\n${ctx.expediteur}`,
  },
  envoi_facture: {
    label: 'Envoi d\'une facture',
    subject: ctx => `Facture ${ctx.docNum} — ${ctx.agenceNom}`,
    body: ctx => `Bonjour,\n\nVeuillez trouver ci-joint votre facture ${ctx.docNum}${ctx.docMontant ? ` d'un montant de ${ctx.docMontant} TTC` : ''}.\n\nMerci de procéder au règlement selon les conditions convenues.\n\nCordialement,\n${ctx.expediteur}`,
  },
  relance_paiement: {
    label: 'Relance paiement',
    subject: ctx => `Relance — Facture ${ctx.docNum} en attente de règlement`,
    body: ctx => `Bonjour,\n\nSauf erreur de notre part, la facture ${ctx.docNum}${ctx.docMontant ? ` de ${ctx.docMontant} TTC` : ''} est toujours en attente de règlement.\n\nPourriez-vous nous confirmer la date de paiement prévue ?\n\nNous restons disponibles pour tout renseignement.\n\nCordialement,\n${ctx.expediteur}`,
  },
  bienvenue: {
    label: 'Bienvenue client',
    subject: ctx => `Bienvenue chez ${ctx.agenceNom}`,
    body: ctx => `Bonjour ${ctx.clientNom},\n\nNous sommes ravis de vous compter parmi nos clients.\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement,\n${ctx.expediteur}`,
  },
}

interface TemplateCtx {
  clientNom: string
  agenceNom: string
  expediteur: string
  docNum: string
  docMontant: string
}

export function EmailTab({ clientId, clientEmail, clientNom, devis = [], factures = [] }: Props) {
  const [template, setTemplate] = useState<TemplateKey>('libre')
  const [to, setTo] = useState(clientEmail ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const agenceNom = 'Mindeon'
  const expediteur = 'L\'équipe Mindeon'

  const buildCtx = (): TemplateCtx => {
    const doc = [...devis, ...factures].find(d => d.id === selectedDoc)
    const docNum = (doc as Devis | Facture | undefined)?.numero ?? ''
    const docMontant = (doc as Facture | undefined)?.total_ttc != null
      ? formatCurrency((doc as Facture).total_ttc)
      : (doc as Devis | undefined)?.total_ttc != null
        ? formatCurrency((doc as Devis).total_ttc)
        : ''
    return { clientNom: clientNom ?? 'Madame, Monsieur', agenceNom, expediteur, docNum, docMontant }
  }

  useEffect(() => {
    if (template === 'libre') { setSubject(''); setBody(''); return }
    const tpl = TEMPLATES[template]
    const ctx = buildCtx()
    setSubject(tpl.subject(ctx))
    setBody(tpl.body(ctx))
  }, [template, selectedDoc, clientNom])

  const openMailto = () => {
    if (!to) { toast.error('Adresse email destinataire requise'); return }
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url, '_blank')
  }

  const copyBody = () => {
    navigator.clipboard.writeText(`À : ${to}\nObjet : ${subject}\n\n${body}`)
    setCopied(true)
    toast.success('Email copié dans le presse-papiers')
    setTimeout(() => setCopied(false), 2000)
  }

  const allDocs: Array<{ id: string; label: string }> = [
    ...devis.map(d => ({ id: d.id, label: `Devis ${d.numero}` })),
    ...factures.map(f => ({ id: f.id, label: `Facture ${f.numero}` })),
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          {/* Template */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Modèle</label>
              <select
                value={template}
                onChange={e => setTemplate(e.target.value as TemplateKey)}
                className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {(Object.entries(TEMPLATES) as [TemplateKey, typeof TEMPLATES[TemplateKey]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            {allDocs.length > 0 && (
              <div>
                <label className="block text-xs text-text-muted mb-1">Document lié (optionnel)</label>
                <select
                  value={selectedDoc}
                  onChange={e => setSelectedDoc(e.target.value)}
                  className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">— Aucun —</option>
                  {allDocs.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* To */}
          <div>
            <label className="block text-xs text-text-muted mb-1">À</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="email@client.com"
                className="w-full bg-bg-app border border-border-color rounded-lg pl-9 pr-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Objet</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Objet de l'email"
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Corps du message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              placeholder="Rédigez votre message..."
              className="w-full bg-bg-app border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent resize-none font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={copyBody}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier'}
            </Button>
            <Button size="sm" onClick={openMailto}>
              <Send className="w-4 h-4" /> Ouvrir dans le client mail
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="text-xs text-text-muted text-center">
        Cliquez sur "Ouvrir dans le client mail" pour envoyer via votre logiciel de messagerie (Outlook, Mail, Gmail…)
      </p>
    </div>
  )
}
