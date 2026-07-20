import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const directories = await readdir(root, { withFileTypes: true })
let verified = 0

for (const directory of directories) {
  if (!directory.isDirectory()) continue
  const readmePath = path.join(root, directory.name, 'README.md')
  let readme
  try {
    readme = await readFile(readmePath, 'utf8')
  } catch {
    continue
  }
  const urls = new Set(
    [...readme.matchAll(/https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[0-9a-f]{40}\/[A-Za-z0-9_.@/-]+/g)]
      .map((match) => match[0].replace(/[.,;:]+$/, ''))
      .filter((url) => !url.includes('/moooyo/5gpn-extensions/')),
  )
  for (const url of urls) {
    const response = await fetch(url, { redirect: 'error' })
    if (!response.ok) throw new Error(`${directory.name}: upstream fetch returned ${response.status} for ${url}`)
    const body = new Uint8Array(await response.arrayBuffer())
    const digest = createHash('sha256').update(body).digest('hex')
    if (!readme.includes(digest)) {
      throw new Error(`${directory.name}: README does not record ${digest} for ${url}`)
    }
    verified += 1
    console.log(`${directory.name}: ${digest} ${url}`)
  }
}

if (verified === 0) throw new Error('no immutable upstream URLs were verified')
console.log(`Verified ${verified} immutable upstream artifacts`)
