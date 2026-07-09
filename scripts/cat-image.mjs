import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

export function getCatDataUri() {
  const buffer = readFileSync(resolve(root, 'public/cat.png'))
  return `data:image/png;base64,${buffer.toString('base64')}`
}
