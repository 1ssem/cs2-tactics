import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GanttChart from './components/GanttChart'
import TaskPanel from './components/TaskPanel'
import {
  Action,
  createDefaultTactic,
  generateId,
  Loadout,
  MAP_OPTIONS,
  Tactic,
  WorkspaceData,
} from './types'
import { loadWorkspace, saveWorkspace } from './utils/storage'
import { exportAsHtml, exportAsJson, exportAsPdf, exportAsPng, downloadPublishJson } from './utils/export'
import './App.css'

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspace())
  const [exporting, setExporting] = useState<string | null>(null)
  const [showPublishHelp, setShowPublishHelp] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const activeTactic = useMemo(
    () => workspace.tactics.find((t) => t.id === workspace.activeTacticId) ?? workspace.tactics[0],
    [workspace],
  )

  useEffect(() => {
    saveWorkspace(workspace)
  }, [workspace])

  const updateTactic = (id: string, updates: Partial<Tactic>) => {
    setWorkspace((ws) => ({
      ...ws,
      tactics: ws.tactics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }

  const updateActive = (updates: Partial<Tactic>) => {
    if (!activeTactic) return
    updateTactic(activeTactic.id, updates)
  }

  const addTactic = () => {
    const newTactic = createDefaultTactic(`戰術 ${workspace.tactics.length + 1}`)
    setWorkspace((ws) => ({
      tactics: [...ws.tactics, newTactic],
      activeTacticId: newTactic.id,
    }))
  }

  const deleteTactic = (id: string) => {
    if (workspace.tactics.length <= 1) return
    setWorkspace((ws) => {
      const tactics = ws.tactics.filter((t) => t.id !== id)
      const activeTacticId =
        ws.activeTacticId === id ? tactics[0]?.id ?? '' : ws.activeTacticId
      return { tactics, activeTacticId }
    })
  }

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const data = JSON.parse(await file.text())
        const imported = migrateImport(data)
        if (imported) {
          setWorkspace(imported)
        } else {
          alert('檔案格式不正確')
        }
      } catch {
        alert('無法讀取檔案')
      }
    }
    input.click()
  }, [])

  const handleExport = async (type: 'png' | 'pdf' | 'html' | 'json') => {
    setExporting(type)
    try {
      const filename = getExportFilename(workspace)
      switch (type) {
        case 'png':
          if (chartRef.current) await exportAsPng(chartRef.current, filename)
          break
        case 'pdf':
          if (chartRef.current) await exportAsPdf(chartRef.current, filename)
          break
        case 'html':
          exportAsHtml(workspace.tactics)
          break
        case 'json':
          exportAsJson(workspace)
          break
      }
    } finally {
      setExporting(null)
    }
  }

  if (!activeTactic) return null

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">🎯</span>
          <div>
            <h1>CS2 戰術 Gantt Chart</h1>
            <p>可管理多個戰術，HTML 匯出可按地圖切換查看</p>
          </div>
        </div>
        <div className="header-actions">
          <select
            className="map-select"
            value={activeTactic.map}
            onChange={(e) => updateActive({ map: e.target.value })}
          >
            {MAP_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className="project-name-input"
            type="text"
            value={activeTactic.projectName}
            onChange={(e) => updateActive({ projectName: e.target.value })}
            placeholder="戰術名稱"
          />
        </div>
      </header>

      <div className="tactic-tabs">
        {workspace.tactics.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tactic-tab${t.id === workspace.activeTacticId ? ' active' : ''}`}
            onClick={() => setWorkspace((ws) => ({ ...ws, activeTacticId: t.id }))}
          >
            {t.map} · {t.projectName}
          </button>
        ))}
        <button type="button" className="tactic-tab add-tab" onClick={addTactic}>
          + 新增戰術
        </button>
        {workspace.tactics.length > 1 && (
          <button
            type="button"
            className="btn btn-danger btn-sm delete-tactic-btn"
            onClick={() => deleteTactic(activeTactic.id)}
          >
            刪除目前戰術
          </button>
        )}
      </div>

      <div className="toolbar">
        <span className="toolbar-label">
          匯出（{workspace.tactics.length} 個戰術）：
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            downloadPublishJson(workspace)
            setShowPublishHelp(true)
          }}
        >
          📡 發布線上版
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!!exporting}
          onClick={() => handleExport('html')}
        >
          {exporting === 'html' ? '匯出中…' : '🌐 HTML 合集'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!!exporting}
          onClick={() => handleExport('png')}
        >
          {exporting === 'png' ? '匯出中…' : '🖼 PNG'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!!exporting}
          onClick={() => handleExport('pdf')}
        >
          {exporting === 'pdf' ? '匯出中…' : '📄 PDF'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => handleExport('json')}>
          💾 JSON
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleImport}>
          📂 匯入 JSON
        </button>
      </div>

      {showPublishHelp && (
        <div className="publish-help">
          <div className="publish-help-header">
            <strong>已下載 tactics.json</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPublishHelp(false)}>
              關閉
            </button>
          </div>
          <ol>
            <li>把下載的 <code>tactics.json</code> 放到專案根目錄</li>
            <li>執行 <code>npm run publish</code>（生成 <code>site/index.html</code>，等同 HTML 合集）</li>
            <li><code>git add tactics.json site/index.html && git commit -m "Update tactics" && git push</code></li>
            <li>隊友打開 GitHub Pages 固定網址即可，例如 <code>https://你的帳號.github.io/cs2-tactics/</code></li>
          </ol>
          <p>
            線上只會部署匯出 HTML，編輯器不會上線。詳見 <code>DEPLOY.md</code>。
          </p>
        </div>
      )}

      <main className="app-main">
        <aside className="sidebar">
          <TaskPanel
            members={activeTactic.members}
            actions={activeTactic.actions}
            loadouts={activeTactic.loadouts}
            onAddAction={(action) =>
              updateActive({ actions: [...activeTactic.actions, { ...action, id: generateId() }] })
            }
            onUpdateAction={(id, updates) =>
              updateActive({
                actions: activeTactic.actions.map((a) => (a.id === id ? { ...a, ...updates } : a)),
              })
            }
            onDeleteAction={(id) =>
              updateActive({ actions: activeTactic.actions.filter((a) => a.id !== id) })
            }
            onUpdateMember={(memberId, name) =>
              updateActive({
                members: activeTactic.members.map((m) =>
                  m.id === memberId ? { ...m, name } : m,
                ),
              })
            }
            onUpdateLoadout={(memberId, utility, count) =>
              updateActive({
                loadouts: {
                  ...activeTactic.loadouts,
                  [memberId]: { ...activeTactic.loadouts[memberId], [utility]: count },
                },
              })
            }
          />
        </aside>

        <section className="chart-area">
          <GanttChart
            members={activeTactic.members}
            actions={activeTactic.actions}
            loadouts={activeTactic.loadouts}
            projectName={activeTactic.projectName}
          />

          <div ref={chartRef} id="gantt-export-target" className="chart-export-stack chart-export-hidden" aria-hidden="true">
            {workspace.tactics.map((tactic) => (
              <GanttChart
                key={tactic.id}
                members={tactic.members}
                actions={tactic.actions}
                loadouts={tactic.loadouts}
                projectName={tactic.projectName}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function getExportFilename(workspace: WorkspaceData): string {
  if (workspace.tactics.length === 1) {
    return workspace.tactics[0].projectName.replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'cs2-tactic'
  }
  return `戰術合集_${workspace.tactics.length}`
}

function migrateImport(data: unknown): WorkspaceData | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  if (Array.isArray(d.tactics)) {
    const ws = d as unknown as WorkspaceData
    if (ws.tactics.length > 0 && ws.activeTacticId) return ws
  }

  // single tactic import -> add to new workspace or merge?
  const members = d.members
  const actions = d.actions ?? d.tasks
  if (Array.isArray(members) && members.length === 5 && Array.isArray(actions)) {
    const tactic: Tactic = {
      id: generateId(),
      projectName: (d.projectName as string) || '匯入戰術',
      map: (d.map as string) || 'Mirage',
      members: members as Tactic['members'],
      actions: actions as Action[],
      loadouts: (d.loadouts as Record<string, Loadout>) || {},
    }
    return { tactics: [tactic], activeTacticId: tactic.id }
  }

  return null
}
