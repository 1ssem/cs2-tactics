import { useCallback, useEffect, useMemo, useState } from 'react'
import GanttChart from './components/GanttChart'
import { WorkspaceData } from './types'
import { formatSlotRange } from './utils/timeline'
import './ViewerApp.css'

interface PublishedWorkspace extends WorkspaceData {
  publishedAt?: string
}

export default function ViewerApp() {
  const [workspace, setWorkspace] = useState<PublishedWorkspace | null>(null)
  const [activeMap, setActiveMap] = useState('')
  const [activeTacticId, setActiveTacticId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspace = useCallback((data: PublishedWorkspace) => {
    if (!data.tactics?.length) {
      setError('戰術資料為空')
      setWorkspace(null)
      return
    }
    setWorkspace(data)
    setError(null)
    const maps = [...new Set(data.tactics.map((t) => t.map))]
    const firstMap = maps[0] ?? ''
    setActiveMap(firstMap)
    const firstTactic = data.tactics.find((t) => t.map === firstMap) ?? data.tactics[0]
    setActiveTacticId(firstTactic.id)
  }, [])

  useEffect(() => {
    fetch('./tactics.json')
      .then((res) => {
        if (!res.ok) throw new Error('找不到 tactics.json')
        return res.json()
      })
      .then((data) => loadWorkspace(data as PublishedWorkspace))
      .catch(() => setError('尚未發布戰術，或 tactics.json 載入失敗'))
      .finally(() => setLoading(false))
  }, [loadWorkspace])

  const maps = useMemo(
    () => (workspace ? [...new Set(workspace.tactics.map((t) => t.map))] : []),
    [workspace],
  )

  const visibleTactics = useMemo(
    () => workspace?.tactics.filter((t) => t.map === activeMap) ?? [],
    [workspace, activeMap],
  )

  const activeTactic = useMemo(
    () => workspace?.tactics.find((t) => t.id === activeTacticId) ?? visibleTactics[0],
    [workspace, activeTacticId, visibleTactics],
  )

  const handleMapChange = (map: string) => {
    setActiveMap(map)
    const first = workspace?.tactics.find((t) => t.map === map)
    if (first) setActiveTacticId(first.id)
  }

  const handleFileUpload = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as PublishedWorkspace
      loadWorkspace(data)
      setLoading(false)
    } catch {
      setError('無法讀取 JSON 檔案')
    }
  }

  if (loading) {
    return (
      <div className="viewer-page">
        <p className="viewer-status">載入戰術中…</p>
      </div>
    )
  }

  if (error || !workspace || !activeTactic) {
    return (
      <div className="viewer-page viewer-empty">
        <h1>CS2 戰術手冊</h1>
        <p className="viewer-status">{error ?? '沒有可顯示的戰術'}</p>
        <label className="viewer-upload">
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
          />
          手動載入 tactics.json
        </label>
      </div>
    )
  }

  const memberMap = Object.fromEntries(activeTactic.members.map((m) => [m.id, m]))

  return (
    <div className="viewer-page">
      <header className="viewer-header">
        <div>
          <h1>CS2 戰術手冊</h1>
          <p className="viewer-meta">
            共 {workspace.tactics.length} 個戰術 · {maps.length} 張地圖
            {workspace.publishedAt && (
              <> · 更新於 {new Date(workspace.publishedAt).toLocaleString('zh-Hant')}</>
            )}
          </p>
        </div>
      </header>

      <nav className="viewer-nav">
        <div className="viewer-nav-group">
          <span className="viewer-nav-label">地圖</span>
          <div className="viewer-tabs">
            {maps.map((map) => (
              <button
                key={map}
                type="button"
                className={`viewer-tab map-tab${map === activeMap ? ' active' : ''}`}
                onClick={() => handleMapChange(map)}
              >
                {map}
              </button>
            ))}
          </div>
        </div>
        <div className="viewer-nav-group">
          <span className="viewer-nav-label">戰術</span>
          <div className="viewer-tabs">
            {visibleTactics.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`viewer-tab tactic-tab${t.id === activeTacticId ? ' active' : ''}`}
                onClick={() => setActiveTacticId(t.id)}
              >
                {t.projectName}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section className="viewer-content">
        <h2 className="viewer-tactic-title">
          {activeTactic.map} · {activeTactic.projectName}
        </h2>

        <GanttChart
          members={activeTactic.members}
          actions={activeTactic.actions}
          loadouts={activeTactic.loadouts}
          projectName={activeTactic.projectName}
        />

        <h3 className="viewer-section-title">戰術動作明細</h3>
        <div className="viewer-table-wrap">
          <table className="viewer-table">
            <thead>
              <tr>
                <th>動作</th>
                <th>描述</th>
                <th>隊友</th>
                <th>時間格</th>
              </tr>
            </thead>
            <tbody>
              {activeTactic.actions.length === 0 ? (
                <tr>
                  <td colSpan={4}>—</td>
                </tr>
              ) : (
                activeTactic.actions.map((a) => {
                  const m = memberMap[a.memberId]
                  return (
                    <tr key={a.id}>
                      <td>{a.title}</td>
                      <td>{a.desc || '—'}</td>
                      <td>
                        <span className="viewer-badge" style={{ background: m?.color ?? '#999' }}>
                          {m?.name ?? '—'}
                        </span>
                      </td>
                      <td>{formatSlotRange(a.startSlot, a.endSlot)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
