import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'tactics.json')
const outDir = resolve(root, 'site')
const outFile = resolve(outDir, 'index.html')

const UTILITIES = [
  { key: 'he', label: '雷' },
  { key: 'molotov', label: '火' },
  { key: 'smoke', label: '煙' },
  { key: 'flash', label: '閃' },
]

const SLOTS = [1, 2, 3, 4, 5]

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatSlotRange(start, end) {
  if (start === end) return `第 ${start} 格`
  return `第 ${start}–${end} 格`
}

function formatLoadoutText(loadout) {
  const parts = []
  for (const u of UTILITIES) {
    const n = loadout[u.key] ?? 0
    if (n > 0) parts.push(n > 1 ? `${u.label}×${n}` : u.label)
  }
  return parts.length > 0 ? parts.join(' ') : '—'
}

function renderTacticPanel(tactic, active) {
  const memberMap = Object.fromEntries(tactic.members.map((m) => [m.id, m]))

  const actionRows = tactic.actions
    .map((a) => {
      const m = memberMap[a.memberId]
      return `<tr>
        <td>${escapeHtml(a.title)}</td>
        <td>${escapeHtml(a.desc || '—')}</td>
        <td><span class="badge" style="background:${m?.color ?? '#999'}">${escapeHtml(m?.name ?? '—')}</span></td>
        <td>${formatSlotRange(a.startSlot, a.endSlot)}</td>
      </tr>`
    })
    .join('\n')

  const ganttHeader = SLOTS.map((s) => `<div class="gantt-cell gantt-header">第 ${s} 格</div>`).join('')
  const ganttRows = tactic.members
    .map((m) => {
      const loadout = tactic.loadouts[m.id]
      const loadoutText = loadout ? formatLoadoutText(loadout) : ''
      const memberActions = tactic.actions.filter((a) => a.memberId === m.id)

      const bars = memberActions
        .map((a) => {
          const left = ((a.startSlot - 1) / 5) * 100
          const width = ((a.endSlot - a.startSlot + 1) / 5) * 100
          return `<div class="gantt-bar" style="background:${m.color};left:calc(${left}% + 4px);width:calc(${width}% - 8px)" title="${escapeHtml(a.desc || a.title)}">${escapeHtml(a.title)}</div>`
        })
        .join('')

      return `<div class="gantt-cell gantt-member">${escapeHtml(m.name)}${loadoutText && loadoutText !== '—' ? `<span class="loadout-tag">${escapeHtml(loadoutText)}</span>` : ''}</div>
        <div class="gantt-cell" style="grid-column: span 5; position:relative; min-height:44px;">${bars}</div>`
    })
    .join('')

  return `<section class="tactic-panel${active ? ' active' : ''}" data-map="${escapeHtml(tactic.map)}" data-tactic-id="${escapeHtml(tactic.id)}">
    <h2 class="tactic-title">${escapeHtml(tactic.map)} · ${escapeHtml(tactic.projectName)}</h2>

    <h2>時間軸</h2>
    <div class="gantt-grid">
      <div class="gantt-cell gantt-header">隊友</div>
      ${ganttHeader}
      ${ganttRows}
    </div>

    <h2>戰術動作明細</h2>
    <table>
      <thead>
        <tr><th>動作</th><th>描述</th><th>隊友</th><th>時間格</th></tr>
      </thead>
      <tbody>${actionRows || '<tr><td colspan="4">—</td></tr>'}</tbody>
    </table>
  </section>`
}

export function generateHtmlFromTactics(tactics, options = {}) {
  const title = options.title ?? 'CS2 戰術手冊'
  const publishedAt = options.publishedAt
  const maps = [...new Set(tactics.map((t) => t.map))]

  const mapTabs = maps
    .map(
      (map, i) =>
        `<button type="button" class="map-tab${i === 0 ? ' active' : ''}" data-map="${escapeHtml(map)}">${escapeHtml(map)}</button>`,
    )
    .join('')

  const tacticMeta = tactics.map((t) => ({
    id: t.id,
    map: t.map,
    name: t.projectName,
  }))

  const tacticTabs = tactics
    .map((t, i) => {
      const hidden = t.map !== maps[0] ? ' hidden' : ''
      const active = i === 0 && t.map === maps[0] ? ' active' : ''
      return `<button type="button" class="tactic-tab${active}${hidden}" data-map="${escapeHtml(t.map)}" data-tactic-id="${escapeHtml(t.id)}">${escapeHtml(t.projectName)}</button>`
    })
    .join('')

  const panels = tactics
    .map((t, i) => renderTacticPanel(t, i === 0 && t.map === maps[0]))
    .join('\n')

  const metaLine = publishedAt
    ? `更新時間：${new Date(publishedAt).toLocaleString('zh-Hant')} · 共 ${tactics.length} 個戰術 · ${maps.length} 張地圖`
    : `匯出時間：${new Date().toLocaleString('zh-Hant')} · 共 ${tactics.length} 個戰術 · ${maps.length} 張地圖`

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #f1f5f9; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    .meta { color: #94a3b8; margin-bottom: 20px; font-size: 14px; }
    .nav { position: sticky; top: 0; z-index: 10; background: #0f172a; padding: 16px 0 12px; margin-bottom: 20px; border-bottom: 1px solid #334155; }
    .nav-label { font-size: 12px; color: #64748b; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .map-tabs, .tactic-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .map-tab, .tactic-tab { padding: 8px 14px; border: 1px solid #334155; border-radius: 8px; background: #1e293b; color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer; }
    .map-tab:hover, .tactic-tab:hover { border-color: #3b82f6; }
    .map-tab.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    .tactic-tab.active { background: #f59e0b; border-color: #f59e0b; color: #0f172a; }
    .tactic-tab.hidden { display: none; }
    .tactic-panel { display: none; }
    .tactic-panel.active { display: block; }
    .tactic-title { font-size: 22px; color: #fbbf24; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; font-size: 13px; color: #94a3b8; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 600; }
    h2 { font-size: 16px; color: #fbbf24; margin: 24px 0 12px; }
    .gantt-grid { display: grid; grid-template-columns: 140px repeat(5, 1fr); gap: 1px; background: #334155; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    .gantt-cell { background: #1e293b; padding: 10px 8px; font-size: 12px; min-height: 44px; position: relative; }
    .gantt-header { background: #0f172a; font-weight: 700; color: #94a3b8; text-align: center; }
    .gantt-member { font-weight: 600; }
    .gantt-bar { position: absolute; top: 8px; bottom: 8px; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; padding: 0 8px; overflow: hidden; line-height: 1.3; word-break: break-all; }
    .loadout-tag { font-size: 10px; color: #fbbf24; margin-left: 4px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${metaLine}</p>

  <div class="nav">
    <div class="nav-label">地圖</div>
    <div class="map-tabs" id="mapTabs">${mapTabs}</div>
    <div class="nav-label">戰術</div>
    <div class="tactic-tabs" id="tacticTabs">${tacticTabs}</div>
  </div>

  <div id="panels">${panels}</div>

  <script>
    const tactics = ${JSON.stringify(tacticMeta)};
    let activeMap = ${JSON.stringify(maps[0] ?? '')};

    function selectMap(map) {
      activeMap = map;
      document.querySelectorAll('.map-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.map === map);
      });
      document.querySelectorAll('.tactic-tab').forEach((btn) => {
        const show = btn.dataset.map === map;
        btn.classList.toggle('hidden', !show);
        btn.classList.remove('active');
      });
      const first = tactics.find((t) => t.map === map);
      if (first) selectTactic(first.id);
    }

    function selectTactic(id) {
      document.querySelectorAll('.tactic-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.tacticId === id);
      });
      document.querySelectorAll('.tactic-tab').forEach((btn) => {
        if (!btn.classList.contains('hidden')) {
          btn.classList.toggle('active', btn.dataset.tacticId === id);
        }
      });
    }

    document.getElementById('mapTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.map-tab');
      if (btn) selectMap(btn.dataset.map);
    });

    document.getElementById('tacticTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tactic-tab');
      if (btn && !btn.classList.contains('hidden')) selectTactic(btn.dataset.tacticId);
    });

    if (tactics.length > 0) selectTactic(tactics[0].id);
  </script>
</body>
</html>`
}

function main() {
  const raw = JSON.parse(readFileSync(source, 'utf8'))
  const tactics = raw.tactics
  if (!Array.isArray(tactics) || tactics.length === 0) {
    console.error('tactics.json 內沒有戰術資料')
    process.exit(1)
  }

  const html = generateHtmlFromTactics(tactics, { publishedAt: raw.publishedAt })
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outFile, html, 'utf8')
  console.log(`已生成 ${outFile}`)
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.endsWith('generate-html.mjs')) {
  main()
}
