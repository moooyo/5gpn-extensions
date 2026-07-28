import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const directories = await readdir(root, { withFileTypes: true })
let verified = 0
let inlined = 0

function referenceBlocks(readme, url) {
  const lines = readme.split(/\r?\n/)
  const blocks = []
  for (let index = 0; index < lines.length; index++) {
    if (!lines[index].includes(url)) continue
    if (lines[index].trimStart().startsWith('|')) {
      const pipeCount = (lines[index].match(/\|/g) ?? []).length
      if (pipeCount > 3) {
        blocks.push(lines[index])
        continue
      }
      let start = index
      let end = index + 1
      while (start > 0 && lines[start - 1].trimStart().startsWith('|')) start--
      while (end < lines.length && lines[end].trimStart().startsWith('|')) end++
      const table = lines.slice(start, end).join('\n')
      const immutableURLs = table.match(/https:\/\/raw\.githubusercontent\.com\//g) ?? []
      blocks.push(immutableURLs.length === 1 ? table : lines[index])
      continue
    }
    let start = index
    let end = index + 1
    while (start > 0 && lines[start - 1].trim() !== '') start--
    while (end < lines.length && lines[end].trim() !== '') end++
    blocks.push(lines.slice(start, end).join('\n'))
  }
  return blocks
}

function blockRecordsArtifact(block, digest, size) {
  const withoutSeparators = block.replaceAll(',', '')
  return block.includes(digest) && new RegExp(`\\b${size}\\s+bytes\\b`).test(withoutSeparators)
}

// A jq program is the one upstream artifact this repository does not fetch at
// run time: a jq action carries its expression in the manifest, so the bytes
// are copied in. Downloading the file and checking it against the README digest
// only proves upstream has not moved; it says nothing about whether the copy
// still matches. Both halves are needed, and this is the second one.
function inlinedJQPrograms(manifest) {
  return (manifest?.actions ?? [])
    .flatMap((action) => (typeof action?.script?.jq === 'string' ? [action] : []))
    .map((action) => ({ id: action.id, jq: normalizeJQ(action.script.jq) }))
}

function normalizeJQ(text) {
  return text.replaceAll('\r\n', '\n').trimEnd()
}

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
  for (const match of readme.matchAll(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/releases\/download\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.@-]+/g)) {
    urls.add(match[0].replace(/[.,;:]+$/, ''))
  }
  let programs = []
  try {
    programs = inlinedJQPrograms(parse(await readFile(path.join(root, directory.name, 'extension.yaml'), 'utf8')))
  } catch {
    programs = []
  }
  for (const url of urls) {
    const response = await fetch(url, { redirect: url.includes('/releases/download/') ? 'follow' : 'error' })
    if (!response.ok) throw new Error(`${directory.name}: upstream fetch returned ${response.status} for ${url}`)
    const body = new Uint8Array(await response.arrayBuffer())
    const digest = createHash('sha256').update(body).digest('hex')
    if (!referenceBlocks(readme, url).some((block) => blockRecordsArtifact(block, digest, body.length))) {
      throw new Error(`${directory.name}: README does not bind ${url} to ${body.length} bytes and ${digest}`)
    }
    verified += 1
    console.log(`${directory.name}: ${digest} ${url}`)
    if (!url.endsWith('.jq')) continue
    const upstream = normalizeJQ(Buffer.from(body).toString('utf8'))
    const carrier = programs.find((program) => program.jq === upstream)
    if (carrier === undefined) {
      throw new Error(`${directory.name}: no action carries ${url} verbatim; the inlined copy has drifted from upstream`)
    }
    inlined += 1
    console.log(`${directory.name}: ${carrier.id} carries ${path.posix.basename(new URL(url).pathname)} verbatim`)
  }
}

if (verified === 0) throw new Error('no pinned upstream URLs were verified')
console.log(`Verified ${verified} pinned upstream artifacts and ${inlined} inlined jq programs`)
