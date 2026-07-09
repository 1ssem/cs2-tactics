export interface Member {
  id: string
  name: string
  color: string
}

export type UtilityKey = 'he' | 'molotov' | 'smoke' | 'flash'

export interface Loadout {
  he: number
  molotov: number
  smoke: number
  flash: number
}

export const UTILITIES: { key: UtilityKey; label: string; max: number }[] = [
  { key: 'he', label: '雷', max: 1 },
  { key: 'molotov', label: '火', max: 1 },
  { key: 'smoke', label: '煙', max: 1 },
  { key: 'flash', label: '閃', max: 2 },
]

export interface Action {
  id: string
  title: string
  desc: string
  memberId: string
  startSlot: number
  endSlot: number
}

export interface ProjectData {
  projectName: string
  map: string
  members: Member[]
  actions: Action[]
  loadouts: Record<string, Loadout>
}

export interface Tactic extends ProjectData {
  id: string
}

export interface WorkspaceData {
  tactics: Tactic[]
  activeTacticId: string
}

export const SLOT_COUNT = 5
export const SLOTS = [1, 2, 3, 4, 5] as const

export const MAP_OPTIONS = [
  'Mirage',
  'Dust II',
  'Inferno',
  'Nuke',
  'Ancient',
  'Anubis',
  'Vertigo',
  'Overpass',
] as const

export const DEFAULT_MEMBERS: Member[] = [
  { id: 'm1', name: '第一身位', color: '#3b82f6' },
  { id: 'm2', name: '第二身位', color: '#10b981' },
  { id: 'm3', name: '第三身位', color: '#f59e0b' },
  { id: 'm4', name: '第四身位', color: '#ef4444' },
  { id: 'm5', name: '第五身位', color: '#8b5cf6' },
]

export function createDefaultLoadouts(members: Member[]): Record<string, Loadout> {
  const empty = (): Loadout => ({ he: 0, molotov: 0, smoke: 0, flash: 0 })
  const map: Record<string, Loadout> = {}
  for (const m of members) map[m.id] = empty()

  map['m1'] = { he: 0, molotov: 0, smoke: 0, flash: 2 }
  map['m2'] = { he: 1, molotov: 0, smoke: 0, flash: 0 }
  map['m3'] = { he: 0, molotov: 0, smoke: 0, flash: 1 }
  map['m4'] = { he: 0, molotov: 0, smoke: 1, flash: 1 }
  map['m5'] = { he: 0, molotov: 1, smoke: 0, flash: 0 }

  return map
}

export function createDefaultTactic(name = '新戰術'): Tactic {
  const members = DEFAULT_MEMBERS.map((m) => ({ ...m }))
  return {
    id: generateId(),
    projectName: name,
    map: 'Mirage',
    members,
    loadouts: createDefaultLoadouts(members),
    actions: [],
  }
}

export function createDefaultProject(): ProjectData {
  const members = DEFAULT_MEMBERS.map((m) => ({ ...m }))
  return {
    projectName: 'B 點 Execute',
    map: 'Mirage',
    members,
    loadouts: createDefaultLoadouts(members),
    actions: [
      { id: 'a1', title: 'B 門煙', desc: 'CT 門口單點煙', memberId: 'm4', startSlot: 1, endSlot: 1 },
      { id: 'a2', title: '窗戶閃', desc: '窗戶反清閃', memberId: 'm1', startSlot: 2, endSlot: 2 },
      { id: 'a3', title: '架槍', desc: '大坑架槍等進點', memberId: 'm2', startSlot: 2, endSlot: 4 },
      { id: 'a4', title: 'GO B', desc: '喊 GO 全員進點', memberId: 'm1', startSlot: 3, endSlot: 3 },
      { id: 'a5', title: '進點', desc: '第一時間進 B 點', memberId: 'm1', startSlot: 3, endSlot: 4 },
      { id: 'a6', title: '補槍', desc: '跟 entry 補槍', memberId: 'm4', startSlot: 3, endSlot: 4 },
      { id: 'a7', title: '下水道動靜', desc: '製造假動靜', memberId: 'm5', startSlot: 5, endSlot: 5 },
    ],
  }
}

export function createDefaultWorkspace(): WorkspaceData {
  const project = createDefaultProject()
  const id = generateId()
  return {
    tactics: [{ ...project, id }],
    activeTacticId: id,
  }
}

export function createSecondDefaultTactic(): Tactic {
  const members = DEFAULT_MEMBERS.map((m) => ({ ...m }))
  return {
    id: generateId(),
    projectName: 'A 點 Default',
    map: 'Dust II',
    members,
    loadouts: createDefaultLoadouts(members),
    actions: [
      { id: 'b1', title: '長廊煙', desc: '長廊入口煙', memberId: 'm4', startSlot: 1, endSlot: 1 },
      { id: 'b2', title: '清點閃', desc: '清點反清', memberId: 'm1', startSlot: 2, endSlot: 2 },
      { id: 'b3', title: 'GO A', desc: '喊 GO 進 A', memberId: 'm3', startSlot: 3, endSlot: 3 },
    ],
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
