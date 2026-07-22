// GPL-3.0-only verifier for immutable corresponding-source inputs.

import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))

async function fetchBytes(url) {
  const response = await fetch(url, { redirect: 'error' })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return new Uint8Array(await response.arrayBuffer())
}

function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

const sparkleBase = 'https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/'
const sparkleLines = (await readFile(path.join(directory, 'upstream-sparkle', 'SHA256SUMS'), 'utf8'))
  .trim()
  .split(/\r?\n/)
for (const line of sparkleLines) {
  const match = /^([0-9a-f]{64})  (.+)$/.exec(line)
  if (!match) throw new Error(`Invalid Sparkle checksum line: ${line}`)
  const bytes = await fetchBytes(new URL(match[2], sparkleBase))
  if (digest(bytes) !== match[1]) throw new Error(`Sparkle digest mismatch for ${match[2]}`)
}

const sourceBases = {
  fflate: 'https://raw.githubusercontent.com/101arrowz/fflate/d3243651cb142e3e04f3e4bc037b9e985878f444/',
  'protobuf-ts': 'https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/',
}
const sourceLines = (await readFile(path.join(directory, 'vendor-src', 'SOURCE_MANIFEST.tsv'), 'utf8'))
  .trim()
  .split(/\r?\n/)
sourceLines.shift()
for (const line of sourceLines) {
  const [expectedDigest, sizeText, localPath] = line.split('\t')
  const separator = localPath.indexOf('/')
  const component = localPath.slice(0, separator)
  const relativePath = localPath.slice(separator + 1)
  const bytes = await fetchBytes(new URL(relativePath, sourceBases[component]))
  if (bytes.length !== Number(sizeText)) throw new Error(`Size mismatch for ${localPath}`)
  if (digest(bytes) !== expectedDigest) throw new Error(`Digest mismatch for ${localPath}`)
}

console.log(`Verified ${sparkleLines.length + sourceLines.length} corresponding-source files`)
