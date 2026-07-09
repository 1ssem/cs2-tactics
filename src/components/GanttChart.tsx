import { useMemo } from 'react'
import { Action, Loadout, Member, SLOTS } from '../types'
import MemberLoadoutInline from './MemberLoadoutInline'
import { formatSlotRange, slotToIndex } from '../utils/timeline'
import './GanttChart.css'

interface Props {
  members: Member[]
  actions: Action[]
  loadouts: Record<string, Loadout>
  projectName: string
}

const SLOT_WIDTH = 120
const ROW_HEIGHT = 60
const LABEL_WIDTH = 200

export default function GanttChart({ members, actions, loadouts, projectName }: Props) {
  const chartWidth = SLOTS.length * SLOT_WIDTH

  const actionsByMember = useMemo(() => {
    const map = new Map<string, Action[]>()
    for (const m of members) map.set(m.id, [])
    for (const a of actions) {
      const list = map.get(a.memberId)
      if (list) list.push(a)
    }
    return map
  }, [members, actions])

  return (
    <div className="gantt-wrapper">
      <div className="gantt-header">
        <h2>{projectName}</h2>
        <div className="gantt-legend">
          {members.map((m) => (
            <span key={m.id} className="legend-chip">
              <span className="legend-dot" style={{ background: m.color }} />
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <div className="gantt-scroll">
        <div className="gantt-chart" style={{ minWidth: LABEL_WIDTH + chartWidth }}>
          <div className="gantt-row gantt-axis-row">
            <div className="gantt-label gantt-label-header" style={{ width: LABEL_WIDTH }}>
              隊友 · 道具
            </div>
            <div className="gantt-timeline axis-timeline" style={{ width: chartWidth }}>
              {SLOTS.map((slot) => (
                <div key={slot} className="axis-tick" style={{ width: SLOT_WIDTH }}>
                  <span className="axis-tick-label">{slot}</span>
                  <span className="axis-tick-sub">第 {slot} 格</span>
                </div>
              ))}
            </div>
          </div>

          {members.map((member) => {
            const memberActions = actionsByMember.get(member.id) ?? []
            return (
              <div key={member.id} className="gantt-row gantt-member-row" style={{ height: ROW_HEIGHT }}>
                <div className="gantt-label member-label" style={{ width: LABEL_WIDTH }}>
                  <span className="member-dot" style={{ background: member.color }} />
                  <span className="member-name-row">
                    <span className="member-name">{member.name}</span>
                    <MemberLoadoutInline
                      loadout={loadouts[member.id] ?? { he: 0, molotov: 0, smoke: 0, flash: 0 }}
                    />
                  </span>
                </div>
                <div className="gantt-timeline member-timeline" style={{ width: chartWidth, height: ROW_HEIGHT }}>
                  {SLOTS.map((slot, i) => (
                    <div
                      key={slot}
                      className="grid-line"
                      style={{ left: i * SLOT_WIDTH, width: SLOT_WIDTH }}
                    />
                  ))}

                  {memberActions.map((action) => {
                    const startIdx = slotToIndex(action.startSlot)
                    const endIdx = slotToIndex(action.endSlot)
                    const span = endIdx - startIdx + 1
                    const left = startIdx * SLOT_WIDTH + 4
                    const width = span * SLOT_WIDTH - 8

                    return (
                      <div
                        key={action.id}
                        className="task-bar"
                        style={{
                          left,
                          width: Math.max(width, SLOT_WIDTH - 8),
                          background: member.color,
                        }}
                        title={
                          action.desc
                            ? `${action.title}\n${action.desc}\n${formatSlotRange(action.startSlot, action.endSlot)}`
                            : `${action.title}\n${formatSlotRange(action.startSlot, action.endSlot)}`
                        }
                      >
                        <span className="task-bar-label">{action.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
