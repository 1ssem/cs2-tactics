import { Loadout, Member, UTILITIES, UtilityKey } from '../types'
import './LoadoutPanel.css'

interface Props {
  members: Member[]
  loadouts: Record<string, Loadout>
  onUpdateLoadout: (memberId: string, utility: UtilityKey, count: number) => void
}

export default function LoadoutPanel({ members, loadouts, onUpdateLoadout }: Props) {
  const cycleCount = (memberId: string, utility: UtilityKey, max: number) => {
    const current = loadouts[memberId]?.[utility] ?? 0
    const next = current >= max ? 0 : current + 1
    onUpdateLoadout(memberId, utility, next)
  }

  return (
    <section className="panel-section loadout-section">
      <div className="panel-section-header">
        <h3>回合初始 · 購買道具</h3>
      </div>
      <p className="panel-hint">Freeze Time 期間每位隊友要買的道具，點擊格子切換數量。</p>

      <div className="loadout-table">
        <div className="loadout-header-row">
          <span className="loadout-member-col">隊友</span>
          {UTILITIES.map((u) => (
            <span key={u.key} className="loadout-util-col">
              {u.label}
            </span>
          ))}
        </div>

        {members.map((member) => {
          const loadout = loadouts[member.id] ?? { he: 0, molotov: 0, smoke: 0, flash: 0 }
          return (
            <div key={member.id} className="loadout-row">
              <span className="loadout-member-col">
                <span className="member-color" style={{ background: member.color }} />
                {member.name}
              </span>
              {UTILITIES.map((u) => {
                const count = loadout[u.key]
                return (
                  <button
                    key={u.key}
                    type="button"
                    className={`loadout-cell${count > 0 ? ' active' : ''}`}
                    onClick={() => cycleCount(member.id, u.key, u.max)}
                    title={`${member.name} · ${u.label}：點擊切換 (最多 ${u.max})`}
                  >
                    {count > 0 ? count : '—'}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
