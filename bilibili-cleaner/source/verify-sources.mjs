// GPL-3.0-only verifier for immutable corresponding-source inputs.

import crypto from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
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

function relativeParts(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.includes('\\')) throw new Error(`Invalid local source path: ${relativePath}`)
  const parts = relativePath.split('/')
  if (parts.length === 0 || parts.some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error(`Invalid local source path: ${relativePath}`)
  }
  return parts
}

async function localBytes(relativePath) {
  return new Uint8Array(await readFile(path.join(directory, ...relativeParts(relativePath))))
}

async function listFiles(relativeRoot, nested = '') {
  const absoluteRoot = path.join(directory, relativeRoot, ...nested.split('/').filter(Boolean))
  const entries = await readdir(absoluteRoot, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relativePath = nested ? `${nested}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await listFiles(relativeRoot, relativePath))
    } else if (entry.isFile()) {
      files.push(relativePath)
    } else {
      throw new Error(`Unsupported filesystem entry in ${relativeRoot}: ${relativePath}`)
    }
  }
  return files.sort()
}

async function verifyInventory(relativeRoot, expectedPaths) {
  const actualPaths = await listFiles(relativeRoot)
  const expected = [...expectedPaths].sort()
  if (JSON.stringify(actualPaths) !== JSON.stringify(expected)) {
    throw new Error(`${relativeRoot} file inventory differs from its manifest`)
  }
}

async function verifyRemoteAndLocal(url, relativePath, expectedDigest, expectedSize) {
  const remote = await fetchBytes(url)
  if (expectedSize !== undefined && remote.length !== expectedSize) throw new Error(`Remote size mismatch for ${relativePath}`)
  if (digest(remote) !== expectedDigest) throw new Error(`Remote digest mismatch for ${relativePath}`)
  const local = await localBytes(relativePath)
  if (local.length !== remote.length) throw new Error(`Local size mismatch for ${relativePath}`)
  if (digest(local) !== expectedDigest) throw new Error(`Local digest mismatch for ${relativePath}`)
}

const sparkleBase = 'https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/'
const sparkleLines = (await readFile(path.join(directory, 'upstream-sparkle', 'SHA256SUMS'), 'utf8'))
  .trim()
  .split(/\r?\n/)
const sparklePaths = []
for (const line of sparkleLines) {
  const match = /^([0-9a-f]{64})  (.+)$/.exec(line)
  if (!match) throw new Error(`Invalid Sparkle checksum line: ${line}`)
  sparklePaths.push(match[2])
  await verifyRemoteAndLocal(new URL(match[2], sparkleBase), `upstream-sparkle/${match[2]}`, match[1])
}
await verifyInventory('upstream-sparkle', [...sparklePaths, 'SHA256SUMS'])

const protoLines = (await readFile(path.join(directory, 'proto', 'SHA256SUMS'), 'utf8'))
  .trim()
  .split(/\r?\n/)
const protoPaths = []
for (const line of protoLines) {
  const match = /^([0-9a-f]{64})  (.+\.proto)$/.exec(line)
  if (!match) throw new Error(`Invalid Protobuf checksum line: ${line}`)
  protoPaths.push(match[2])
  await verifyRemoteAndLocal(new URL(`proto/${match[2]}`, sparkleBase), `proto/${match[2]}`, match[1])
}
await verifyInventory('proto', [...protoPaths, 'SHA256SUMS'])

const sourceBases = {
  fflate: 'https://raw.githubusercontent.com/101arrowz/fflate/dcb3714a6c25db3a2748641019c5277413d09714/',
  'protobuf-ts': 'https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/',
}
const sourceLines = (await readFile(path.join(directory, 'vendor-src', 'SOURCE_MANIFEST.tsv'), 'utf8'))
  .trim()
  .split(/\r?\n/)
sourceLines.shift()
const vendorSourcePaths = []
for (const line of sourceLines) {
  const [expectedDigest, sizeText, localPath] = line.split('\t')
  const separator = localPath.indexOf('/')
  const component = localPath.slice(0, separator)
  const relativePath = localPath.slice(separator + 1)
  if (!sourceBases[component]) throw new Error(`Unknown vendor source component: ${component}`)
  vendorSourcePaths.push(localPath)
  await verifyRemoteAndLocal(
    new URL(relativePath, sourceBases[component]),
    `vendor-src/${localPath}`,
    expectedDigest,
    Number(sizeText),
  )
}
await verifyInventory('vendor-src', [...vendorSourcePaths, 'SOURCE_MANIFEST.tsv'])

const localArtifacts = [
  { path: 'package.json', size: 540, digest: '541b42863f455c1c4e6e70b099653cd35726541f68d49956e30812754a5fd30d' },
  { path: 'package-lock.json', size: 24859, digest: '4c798f44c0e401c0dacae27571a821b83fe363708134aab661f44ab080a8482a' },
  {
    path: 'vendor/fflate-0.8.3.tgz',
    size: 173034,
    digest: '38c2cd824402407b43153c782274aec2ea83ea688e4aa0b743c5f2c305857d92',
    url: 'https://registry.npmjs.org/fflate/-/fflate-0.8.3.tgz',
  },
  {
    path: 'vendor/protobuf-ts-runtime-2.11.1.tgz',
    size: 54285,
    digest: '3bb18cb373565b5c95e466c1db76e4b1d8166b62276a15e3547c36f9e25b502b',
    url: 'https://registry.npmjs.org/@protobuf-ts/runtime/-/runtime-2.11.1.tgz',
  },
]
for (const artifact of localArtifacts) {
  const local = await localBytes(artifact.path)
  if (local.length !== artifact.size) throw new Error(`Local size mismatch for ${artifact.path}`)
  if (digest(local) !== artifact.digest) throw new Error(`Local digest mismatch for ${artifact.path}`)
  if (artifact.url) {
    const remote = await fetchBytes(artifact.url)
    if (remote.length !== artifact.size) throw new Error(`Remote size mismatch for ${artifact.path}`)
    if (digest(remote) !== artifact.digest) throw new Error(`Remote digest mismatch for ${artifact.path}`)
  }
}
await verifyInventory('vendor', ['fflate-0.8.3.tgz', 'protobuf-ts-runtime-2.11.1.tgz'])

console.log(`Verified ${sparkleLines.length + protoLines.length + sourceLines.length + 2} pinned upstream artifacts and ${sparkleLines.length + protoLines.length + sourceLines.length + localArtifacts.length} local source/build artifacts`)
