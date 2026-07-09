import { Action, Loadout, Member, SLOTS, UtilityKey } from '../types'
import LoadoutPanel from './LoadoutPanel'
import { formatSlotRange, SLOT_COUNT } from '../utils/timeline'
import './TaskPanel.css'

interface Props {
  members: Member[]
  actions: Action[]
  loadouts: Record<string, Loadout>
  onAddAction: (action: Omit<Action, 'id'>) => void
  onUpdateAction: (id: string, updates: Partial<Action>) => void
  onDeleteAction: (id: string) => void
  onUpdateMember: (id: string, name: string) => void
  onUpdateLoadout: (memberId: string, utility: UtilityKey, count: number) => void
}

export default function TaskPanel({
  members,
  actions,
  loadouts,
  onAddAction,
  onUpdateAction,
  onDeleteAction,
  onUpdateMember,
  onUpdateLoadout,
}: Props) {
  const handleAdd = () => {
    onAddAction({
      title: '新動作',
      desc: '',
      memberId: members[0]?.id ?? '',
      startSlot: 1,
      endSlot: 1,
    })
  }

  const handleSlotChange = (
    action: Action,
    field: 'startSlot' | 'endSlot',
    value: number,
  ) => {
    const slot = Math.max(1, Math.min(SLOT_COUNT, value))

    if (field === 'startSlot') {
      const startSlot = slot
      const endSlot = startSlot > action.endSlot ? startSlot : action.endSlot
      onUpdateAction(action.id, { startSlot, endSlot })
    } else {
      const endSlot = slot
      const startSlot = endSlot < action.startSlot ? endSlot : action.startSlot
      onUpdateAction(action.id, { startSlot, endSlot })
    }
  }

  return (
    <div className="task-panel">
      <LoadoutPanel
        members={members}
        loadouts={loadouts}
        onUpdateLoadout={onUpdateLoadout}
      />

      <section className="panel-section">
        <div className="panel-section-header">
          <h3>隊伍（5 人）</h3>
        </div>
        <div className="member-list">
          {members.map((m) => (
            <div key={m.id} className="member-edit-row">
              <span className="member-color" style={{ background: m.color }} />
              <input
                type="text"
                value={m.name}
                onChange={(e) => onUpdateMember(m.id, e.target.value)}
                placeholder="隊友名稱"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <div className="panel-section-header">
          <h3>戰術動作</h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd}>
            + 新增動作
          </button>
        </div>
        <p className="panel-hint">時間軸固定 5 格。動作名稱顯示在 chart，描述填詳細做法。</p>

        {actions.length === 0 ? (
          <p className="empty-hint">尚未添加動作，點擊上方按鈕開始規劃戰術。</p>
        ) : (
          <div className="task-list">
            {actions.map((action) => (
              <div key={action.id} className="task-card">
                <input
                  className="task-title-input"
                  type="text"
                  value={action.title}
                  onChange={(e) => onUpdateAction(action.id, { title: e.target.value })}
                  placeholder="動作名稱，例如：B 門煙"
                />
                <label className="task-desc-label">
                  描述
                  <textarea
                    className="task-desc-input"
                    value={action.desc}
                    onChange={(e) => onUpdateAction(action.id, { desc: e.target.value })}
                    placeholder="詳細說明，例如：站在 X 點丟 CT 門煙"
                    rows={2}
                  />
                </label>
                <div className="task-fields">
                  <label>
                    隊友
                    <select
                      value={action.memberId}
                      onChange={(e) => onUpdateAction(action.id, { memberId: e.target.value })}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    起始格
                    <select
                      value={action.startSlot}
                      onChange={(e) =>
                        handleSlotChange(action, 'startSlot', Number(e.target.value))
                      }
                    >
                      {SLOTS.map((s) => (
                        <option key={s} value={s}>
                          第 {s} 格
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    結束格
                    <select
                      value={action.endSlot}
                      onChange={(e) =>
                        handleSlotChange(action, 'endSlot', Number(e.target.value))
                      }
                    >
                      {SLOTS.map((s) => (
                        <option key={s} value={s}>
                          第 {s} 格
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="offset-hint">{formatSlotRange(action.startSlot, action.endSlot)}</p>
                <button
                  type="button"
                  className="btn btn-danger btn-sm task-delete"
                  onClick={() => onDeleteAction(action.id)}
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
