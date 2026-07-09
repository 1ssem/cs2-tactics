import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { SLOTS, Tactic, WorkspaceData } from '../types'
import { formatLoadoutText } from '../components/MemberLoadoutInline'
import { formatSlotRange, sortActionsByMemberAndTime } from './timeline'
import htmlExportStyles from './html-export-styles.css?raw'

export async function exportAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${filename}.pdf`)
}

export function exportAsHtml(tactics: Tactic[]): void {
  const title = 'CS2 戰術手冊'
  const maps = [...new Set(tactics.map((t) => t.map))]

  const mapTabs = maps
    .map(
      (map, i) =>
        `<button type="button" class="map-tab${i === 0 ? ' active' : ''}" data-map="${escapeAttr(map)}">${escapeHtml(map)}</button>`,
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
      return `<button type="button" class="tactic-tab${active}${hidden}" data-map="${escapeAttr(t.map)}" data-tactic-id="${escapeAttr(t.id)}">${escapeHtml(t.projectName)}</button>`
    })
    .join('')

  const panels = tactics
    .map((t, i) => renderTacticPanel(t, i === 0 && t.map === maps[0]))
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    ${htmlExportStyles}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">匯出時間：${new Date().toLocaleString('zh-Hant')} · 共 ${tactics.length} 個戰術 · ${maps.length} 張地圖</p>

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

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const link = document.createElement('a')
  link.download = `${sanitizeFilename(title)}.html`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

function renderTacticPanel(tactic: Tactic, active: boolean): string {
  const memberMap = Object.fromEntries(tactic.members.map((m) => [m.id, m]))

  const actionRows = sortActionsByMemberAndTime(tactic.actions, tactic.members)
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
          return `<div class="gantt-bar" style="background:${m.color};left:calc(${left}% + 4px);width:calc(${width}% - 8px)" title="${escapeAttr(a.desc || a.title)}"><span class="gantt-bar-text">${escapeHtml(a.title)}</span></div>`
        })
        .join('')

      return `<div class="gantt-cell gantt-member">${escapeHtml(m.name)}${loadoutText ? `<span class="loadout-tag">${escapeHtml(loadoutText)}</span>` : ''}</div>
        <div class="gantt-cell gantt-timeline-cell">${bars}</div>`
    })
    .join('')

  return `<section class="tactic-panel${active ? ' active' : ''}" data-map="${escapeAttr(tactic.map)}" data-tactic-id="${escapeAttr(tactic.id)}">
    <h2 class="tactic-title">${escapeHtml(tactic.map)} · ${escapeHtml(tactic.projectName)}</h2>

    <h2>時間軸</h2>
    <p class="gantt-scroll-hint">← 左右滑動查看完整時間軸 →</p>
    <div class="gantt-scroll">
      <div class="gantt-grid">
        <div class="gantt-cell gantt-header">隊友</div>
        ${ganttHeader}
        ${ganttRows}
      </div>
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

export function exportAsJson(workspace: WorkspaceData): void {
  const name =
    workspace.tactics.length === 1
      ? workspace.tactics[0].projectName
      : `戰術合集_${workspace.tactics.length}`
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `${sanitizeFilename(name)}.json`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

export function downloadPublishJson(workspace: WorkspaceData): void {
  const payload = {
    ...workspace,
    publishedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = 'tactics.json'
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'cs2-tactic'
}
