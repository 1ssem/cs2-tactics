import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'tactics.json')

if (!existsSync(source)) {
  console.error('找不到 tactics.json')
  console.error('請先在編輯器按「發布線上版」下載 tactics.json，放到專案根目錄。')
  process.exit(1)
}

const result = spawnSync('node', [resolve(root, 'scripts/generate-html.mjs')], {
  stdio: 'inherit',
  cwd: root,
})

process.exit(result.status ?? 1)
