import { Plus, Trash2, GripVertical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface Ligne {
  id: string
  description: string
  quantite: number
  prix_unitaire_ht: number
  taux_tva: number
}

interface Props {
  lignes: Ligne[]
  onChange: (lignes: Ligne[]) => void
  remise_pct?: number
}

function uid() { return Math.random().toString(36).slice(2) }

function newLigne(): Ligne {
  return { id: uid(), description: '', quantite: 1, prix_unitaire_ht: 0, taux_tva: 20 }
}

export function LignesEditor({ lignes, onChange, remise_pct = 0 }: Props) {
  const update = (i: number, patch: Partial<Ligne>) => {
    const next = [...lignes]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const remove = (i: number) => onChange(lignes.filter((_, j) => j !== i))
  const add = () => onChange([...lignes, newLigne()])

  const totalHT = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire_ht, 0)
  const remise = totalHT * remise_pct / 100
  const apresRemise = totalHT - remise
  const totalTVA = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire_ht * (1 - remise_pct / 100) * l.taux_tva / 100, 0)
  const totalTTC = apresRemise + totalTVA

  const inputCls = 'w-full px-2 py-1.5 bg-bg-app border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_80px_110px_70px_80px_32px] gap-2 px-2 text-xs font-semibold text-text-muted">
        <span className="w-5" />
        <span>Description</span>
        <span className="text-right">Qté</span>
        <span className="text-right">PU HT</span>
        <span className="text-right">TVA %</span>
        <span className="text-right">Total HT</span>
        <span />
      </div>

      {lignes.map((l, i) => {
        const lineTotal = l.quantite * l.prix_unitaire_ht
        return (
          <div key={l.id} className="grid grid-cols-[auto_1fr_80px_110px_70px_80px_32px] gap-2 items-center">
            <GripVertical className="w-5 h-5 text-text-muted/50 cursor-grab" />
            <input value={l.description} onChange={e => update(i, { description: e.target.value })} placeholder="Description de la prestation" className={inputCls} />
            <input type="number" value={l.quantite} min={0} step={0.01} onChange={e => update(i, { quantite: Number(e.target.value) })} className={inputCls + ' text-right'} />
            <input type="number" value={l.prix_unitaire_ht} min={0} step={0.01} onChange={e => update(i, { prix_unitaire_ht: Number(e.target.value) })} className={inputCls + ' text-right'} />
            <select value={l.taux_tva} onChange={e => update(i, { taux_tva: Number(e.target.value) })} className={inputCls}>
              <option value={0}>0%</option>
              <option value={5.5}>5.5%</option>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
            </select>
            <p className="text-right text-sm font-medium text-text-primary font-heading">{formatCurrency(lineTotal)}</p>
            <button onClick={() => remove(i)} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      })}

      <button onClick={add} className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover font-medium py-1 transition-colors">
        <Plus className="w-4 h-4" /> Ajouter une ligne
      </button>

      {/* Totaux */}
      <div className="border-t border-border-color mt-4 pt-4">
        <div className="flex justify-end">
          <div className="space-y-2 min-w-64">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Sous-total HT</span>
              <span className="text-text-primary font-heading">{formatCurrency(totalHT)}</span>
            </div>
            {remise_pct > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Remise ({remise_pct}%)</span>
                <span className="text-danger font-heading">-{formatCurrency(remise)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">TVA</span>
              <span className="text-text-primary font-heading">{formatCurrency(totalTVA)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border-color pt-2">
              <span className="text-text-primary">TOTAL TTC</span>
              <span className="text-accent font-heading">{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
