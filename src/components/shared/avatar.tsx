import { cn, initiales } from '@/lib/utils'

const COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500', 'bg-cyan-500',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface AvatarProps {
  prenom: string
  nom: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeCls = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
}

export function Avatar({ prenom, nom, src, size = 'md', className }: AvatarProps) {
  const bg = colorForName(prenom + nom)
  const inits = initiales(prenom, nom)
  return (
    <div className={cn('rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 font-semibold text-white', sizeCls[size], bg, className)}>
      {src ? (
        <img src={src} alt={`${prenom} ${nom}`} className="w-full h-full object-cover" />
      ) : (
        inits
      )}
    </div>
  )
}
