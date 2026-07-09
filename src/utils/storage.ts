import {
  Action,
  createDefaultLoadouts,
  createDefaultWorkspace,
  DEFAULT_MEMBERS,
  generateId,
  Loadout,
  Member,
  ProjectData,
  SLOT_COUNT,
  Tactic,
  WorkspaceData,
} from '../types'

const STORAGE_KEY = 'ganttchart-project'

const POSITION_NAMES = Object.fromEntries(DEFAULT_MEMBERS.map((m) => [m.id, m.name]))

const LEGACY_MEMBER_NAMES = new Set([
  '成員 A',
  '成員 B',
  '成員 C',
  '成員 D',
  '成員 E',
  '突破 (Entry)',
  '狙擊 (AWPer)',
  '指揮 (IGL)',
  '道具 (Support)',
  '迂迴 (Lurker)',
])

function migrateMembers(members: Member[]): Member[] {
  return members.map((m) => ({
    ...m,
    name: LEGACY_MEMBER_NAMES.has(m.name) ? (POSITION_NAMES[m.id] ?? m.name) : m.name,
  }))
}

export function loadWorkspace(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultWorkspace()
    return migrateWorkspace(JSON.parse(raw))
  } catch {
    return createDefaultWorkspace()
  }
}

export function saveWorkspace(data: WorkspaceData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function migrateAction(item: Record<string, unknown>, i: number): Action {
  const base = {
    id: (item.id as string) || `migrated-${i}`,
    title: (item.title as string) || '動作',
    desc: typeof item.desc === 'string' ? item.desc : '',
    memberId: item.memberId as string,
  }

  if (typeof item.startSlot === 'number' && typeof item.endSlot === 'number') {
    return { ...base, startSlot: item.startSlot, endSlot: item.endSlot }
  }

  const rawStart = (item.startSlot ?? item.startOffset ?? 1) as number
  const rawEnd = (item.endSlot ?? item.endOffset ?? 1) as number
  const start = rawStart < 1 ? Math.max(1, Math.min(SLOT_COUNT, rawStart + 3)) : Math.max(1, Math.min(SLOT_COUNT, rawStart))
  const end = rawEnd < 1 ? Math.max(1, Math.min(SLOT_COUNT, rawEnd + 3)) : Math.max(1, Math.min(SLOT_COUNT, rawEnd))
  return {
    ...base,
    startSlot: Math.min(start, end),
    endSlot: Math.max(start, end),
  }
}

function migrateSingleProject(data: Record<string, unknown>): Tactic | null {
  if (!Array.isArray(data.members) || data.members.length !== 5) return null
  const rawItems = (data.actions ?? data.tasks) as Record<string, unknown>[] | undefined
  if (!Array.isArray(rawItems)) return null

  const members = migrateMembers(data.members as Member[])
  return {
    id: generateId(),
    projectName: (data.projectName as string) || '戰術規劃',
    map: (data.map as string) || 'Mirage',
    members,
    actions: rawItems.map(migrateAction),
    loadouts: (data.loadouts as Record<string, Loadout>) || createDefaultLoadouts(members),
  }
}

function migrateWorkspace(data: unknown): WorkspaceData {
  if (!data || typeof data !== 'object') return createDefaultWorkspace()
  const d = data as Record<string, unknown>

  if (Array.isArray(d.tactics)) {
    const tactics = (d.tactics as Record<string, unknown>[]).map((t) => {
      const migrated = migrateSingleProject(t)
      if (migrated) {
        return {
          ...migrated,
          id: (t.id as string) || generateId(),
          map: (t.map as string) || migrated.map,
        }
      }
      return null
    }).filter(Boolean) as Tactic[]

    if (tactics.length > 0) {
      return {
        tactics,
        activeTacticId: (d.activeTacticId as string) || tactics[0].id,
      }
    }
  }

  const single = migrateSingleProject(d)
  if (single) {
    return { tactics: [single], activeTacticId: single.id }
  }

  return createDefaultWorkspace()
}

// legacy exports
export function loadProject(): ProjectData | null {
  const ws = loadWorkspace()
  const active = ws.tactics.find((t) => t.id === ws.activeTacticId) ?? ws.tactics[0]
  return active ?? null
}

export function saveProject(data: ProjectData): void {
  const ws = loadWorkspace()
  const activeId = ws.activeTacticId
  saveWorkspace({
    ...ws,
    tactics: ws.tactics.map((t) =>
      t.id === activeId ? { ...t, ...data } : t,
    ),
  })
}
