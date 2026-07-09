import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function getHtmlExportStyles() {
  return readFileSync(resolve(__dirname, '../src/utils/html-export-styles.css'), 'utf8')
}
