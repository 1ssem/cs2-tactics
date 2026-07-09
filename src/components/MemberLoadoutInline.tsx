import { Loadout, UTILITIES } from '../types'
import './MemberLoadoutInline.css'

interface Props {
  loadout: Loadout
}

export default function MemberLoadoutInline({ loadout }: Props) {
  const items = UTILITIES.filter((u) => loadout[u.key] > 0)
  if (items.length === 0) return null

  return (
    <span className="member-loadout-inline">
      {items.map((u) => (
        <span key={u.key} className="loadout-tag">
          {u.label}
          {loadout[u.key] > 1 ? `×${loadout[u.key]}` : ''}
        </span>
      ))}
    </span>
  )
}

export function formatLoadoutText(loadout: Loadout): string {
  const parts: string[] = []
  for (const u of UTILITIES) {
    const n = loadout[u.key]
    if (n > 0) parts.push(n > 1 ? `${u.label}×${n}` : u.label)
  }
  return parts.length > 0 ? parts.join(' ') : '—'
}
