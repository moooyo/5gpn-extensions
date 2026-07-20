import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parseDocument } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const rootReadme = await readFile(path.join(root, 'README.md'), 'utf8')
const licenseSummary = await readFile(path.join(root, 'LICENSE'), 'utf8')
const reusePolicy = await readFile(path.join(root, 'REUSE.toml'), 'utf8')
const thirdPartyNotices = await readFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8')
const packageMetadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const expectedLicenseFiles = new Map([
  ['MIT.txt', 'f41a1117f350375bbafc61e4292c379ed748bc110f46ec8262dd26fffb2fc459'],
  ['GPL-3.0-only.txt', '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986'],
  ['Apache-2.0.txt', 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'],
  ['CC-BY-NC-SA-4.0.txt', '047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98'],
])
for (const [filename, expectedDigest] of expectedLicenseFiles) {
  const content = await readFile(path.join(root, 'LICENSES', filename))
  const actualDigest = createHash('sha256').update(content).digest('hex')
  assert(actualDigest === expectedDigest, `${filename}: license text digest changed`)
}
assert(licenseSummary.includes('multi-licensed repository'), 'root LICENSE does not describe the multi-license boundary')
assert(packageMetadata.license === 'SEE LICENSE IN LICENSE', 'package.json must point to the multi-license boundary')
const expectedExtensions = new Map([
  ['ad-platform-blocker', { license: 'CC-BY-NC-SA-4.0', pin: 'ab6c3182fb2b09bcc34456f496282ec0b8e9217b', licenseDigest: '047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98' }],
  ['apple-wloc', { license: 'MIT', pin: 'edee9b955f673cc8c4a52eb0a9c687a2e25dde4a', licenseDigest: 'e4a68eac74fbad2e6be287c43b836d21723280eaa6203df65dd23a5f377417fa' }],
  ['bilibili-cleaner', { license: 'GPL-3.0-only', pin: '70a4914d7189e0a1da4b5839ba5f60d0206edf11', licenseDigest: '8b1ba204bb69a0ade2bfcf65ef294a920f6bb361b317dba43c7ef29d96332b9b' }],
  ['httpdns-interceptor', { license: 'CC-BY-NC-SA-4.0', pin: 'ab6c3182fb2b09bcc34456f496282ec0b8e9217b', licenseDigest: '047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98' }],
  ['reddit-cleaner', { license: 'GPL-3.0-only', pin: '00944babf9ef1b5e55e87b48df71bd1fc2c855d6', licenseDigest: '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986' }],
  ['spotify-cleaner', { license: 'MIT', pin: '692aec6a28c0d7c1d44d69febb581632a8175e9f', licenseDigest: '63814d59a40b61e1090074dac3bbda145d4c0f6a37486b2ef225075880ea2bac' }],
  ['testflight-region-unlock', { license: 'CC-BY-NC-SA-4.0', pin: 'ab6c3182fb2b09bcc34456f496282ec0b8e9217b', licenseDigest: '047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98' }],
  ['youtube-cleaner', { license: 'Apache-2.0', pin: '26871a1f7b984fa1df39a05b5037898035987239', licenseDigest: 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' }],
])
const entries = await readdir(root, { withFileTypes: true })
const extensionNames = []
const extensionIDs = new Set()
const forbiddenScriptPatterns = [
  [/\$(?:request|response|done|task|httpClient|prefs|argument)\b/, 'proxy-client compatibility global'],
  [/\brequire\s*\(/, 'module loader'],
  [/\bfetch\s*\(/, 'ambient fetch'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bprocess\./, 'process access'],
  [/\bset(?:Timeout|Interval)\s*\(/, 'timer API'],
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertKeys(object, allowed, label) {
  assert(object && typeof object === 'object' && !Array.isArray(object), `${label} must be an object`)
  for (const key of Object.keys(object)) assert(allowed.has(key), `${label} has unknown key ${key}`)
}

function validHost(value) {
  if (typeof value !== 'string' || value !== value.toLowerCase() || value.endsWith('.')) return false
  const host = value.startsWith('*.') ? value.slice(2) : value
  if (!host || host.length > 253 || host === 'localhost' || host.endsWith('.local')) return false
  return host.split('.').length >= 2 && host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
}

for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const directory = path.join(root, entry.name)
  try {
    await stat(path.join(directory, 'extension.yaml'))
  } catch {
    continue
  }
  extensionNames.push(entry.name)

  const manifestText = await readFile(path.join(directory, 'extension.yaml'), 'utf8')
  const document = parseDocument(manifestText, { strict: true, uniqueKeys: true })
  assert(document.errors.length === 0, `${entry.name}: invalid YAML: ${document.errors.join('; ')}`)
  const manifest = document.toJS()
  assertKeys(manifest, new Set(['apiVersion', 'kind', 'metadata', 'permissions', 'requirements', 'traffic', 'settings', 'actions']), `${entry.name}: manifest`)
  assert(manifest.apiVersion === '5gpn.io/v1', `${entry.name}: apiVersion must be 5gpn.io/v1`)
  assert(manifest.kind === 'Extension', `${entry.name}: kind must be Extension`)
  assertKeys(manifest.metadata, new Set(['id', 'name', 'version', 'description']), `${entry.name}: metadata`)
  assert(/^[a-z0-9](?:[a-z0-9.-]{1,38}[a-z0-9])$/.test(manifest.metadata.id), `${entry.name}: invalid metadata.id`)
  assert(!extensionIDs.has(manifest.metadata.id), `${entry.name}: duplicate metadata.id ${manifest.metadata.id}`)
  extensionIDs.add(manifest.metadata.id)
  assert(typeof manifest.metadata.name === 'string' && manifest.metadata.name.trim() !== '', `${entry.name}: metadata.name is required`)
  assert(/^\d+\.\d+\.\d+$/.test(manifest.metadata.version), `${entry.name}: metadata.version must be semantic`)

  assertKeys(manifest.permissions, new Set(['persistentStorage', 'network']), `${entry.name}: permissions`)
  assert(typeof manifest.permissions.persistentStorage === 'boolean', `${entry.name}: persistentStorage must be boolean`)
  if (manifest.permissions.network !== undefined) {
    assertKeys(manifest.permissions.network, new Set(['origins']), `${entry.name}: permissions.network`)
    assert(Array.isArray(manifest.permissions.network.origins), `${entry.name}: network origins must be an array`)
    for (const origin of manifest.permissions.network.origins) {
      const parsed = new URL(origin)
      assert(['http:', 'https:'].includes(parsed.protocol) && parsed.origin === origin && parsed.username === '' && parsed.password === '', `${entry.name}: invalid network origin ${origin}`)
    }
  }

  if (manifest.requirements !== undefined) {
    assertKeys(manifest.requirements, new Set(['egressGroup']), `${entry.name}: requirements`)
    assertKeys(manifest.requirements.egressGroup, new Set(['required']), `${entry.name}: requirements.egressGroup`)
    assert(typeof manifest.requirements.egressGroup.required === 'boolean', `${entry.name}: egressGroup.required must be boolean`)
  }

  assertKeys(manifest.traffic, new Set(['captureHosts', 'upstreamMappings']), `${entry.name}: traffic`)
  const captureHosts = manifest.traffic.captureHosts
  assert(Array.isArray(captureHosts) && captureHosts.length > 0 && captureHosts.length <= 256, `${entry.name}: captureHosts must contain 1 to 256 entries`)
  assert(new Set(captureHosts).size === captureHosts.length, `${entry.name}: captureHosts must be unique`)
  for (const host of captureHosts) assert(validHost(host), `${entry.name}: invalid capture host ${host}`)
  const captureSet = new Set(captureHosts)

  const actions = manifest.actions ?? []
  const mappings = manifest.traffic.upstreamMappings ?? []
  assert(Array.isArray(actions) && Array.isArray(mappings) && actions.length + mappings.length > 0, `${entry.name}: at least one action or mapping is required`)
  assert(actions.length + mappings.length <= 256, `${entry.name}: action and mapping limit exceeded`)
  const actionIDs = new Set()
  for (const action of actions) {
    assertKeys(action, new Set(['id', 'phase', 'match', 'script']), `${entry.name}: action`)
    assert(typeof action.id === 'string' && action.id !== '' && !actionIDs.has(action.id), `${entry.name}: invalid or duplicate action id`)
    actionIDs.add(action.id)
    assert(['request', 'response'].includes(action.phase), `${entry.name}: invalid phase in ${action.id}`)
    assertKeys(action.match, new Set(['hosts', 'schemes', 'methods', 'pathRegex', 'statusCodes']), `${entry.name}: ${action.id}.match`)
    assert(Array.isArray(action.match.hosts) && action.match.hosts.length > 0, `${entry.name}: ${action.id} has no hosts`)
    for (const host of action.match.hosts) assert(captureSet.has(host), `${entry.name}: ${action.id} host ${host} is outside captureHosts`)
    assert(Array.isArray(action.match.schemes) && action.match.schemes.every((scheme) => scheme === 'http' || scheme === 'https'), `${entry.name}: ${action.id} has invalid schemes`)
    assert(typeof action.match.pathRegex === 'string' && action.match.pathRegex.startsWith('^'), `${entry.name}: ${action.id} pathRegex must be anchored`)
    assertKeys(action.script, new Set(['source', 'inline', 'bodyMode', 'timeoutMs', 'maxBodyBytes']), `${entry.name}: ${action.id}.script`)
    const hasSource = typeof action.script.source === 'string'
    const hasInline = typeof action.script.inline === 'string'
    assert(hasSource !== hasInline, `${entry.name}: ${action.id} must declare exactly one script source`)
    if (hasSource) {
      assert(action.script.source.startsWith('./') && !action.script.source.includes('..'), `${entry.name}: ${action.id} must use a local relative script`)
      const scriptPath = path.join(directory, action.script.source.slice(2))
      const script = await readFile(scriptPath, 'utf8')
      new vm.Script(script, { filename: scriptPath })
      assert(/function\s+transform\s*\(\s*context\s*\)/.test(script), `${entry.name}: ${action.id} script has no transform(context)`)
      for (const [pattern, label] of forbiddenScriptPatterns) assert(!pattern.test(script), `${entry.name}: ${action.id} uses forbidden ${label}`)
    }
  }

  const readme = await readFile(path.join(directory, 'README.md'), 'utf8')
  const expected = expectedExtensions.get(entry.name)
  assert(expected !== undefined, `${entry.name}: no reviewed license policy`)
  assert(/SHA-256/i.test(readme), `${entry.name}: README has no SHA-256 provenance`)
  assert(/## (Updating|Maintenance and updates)/.test(readme), `${entry.name}: README has no update procedure`)
  assert(/## (Verification|Validation)/.test(readme), `${entry.name}: README has no verification procedure`)
  assert(readme.includes(`License: [\`${expected.license}\`]`), `${entry.name}: README has no exact license banner`)
  assert(readme.includes(expected.pin), `${entry.name}: README has no reviewed upstream pin`)
  assert(readme.includes(expected.licenseDigest), `${entry.name}: README has no governing upstream license digest`)
  const reuseAnnotations = reusePolicy
    .split(/\r?\n\s*\r?\n/)
    .filter((paragraph) => paragraph.includes(`${entry.name}/`))
  assert(reuseAnnotations.length > 0, `${entry.name}: missing from REUSE.toml`)
  assert(reuseAnnotations.every((annotation) => annotation.includes(`SPDX-License-Identifier = "${expected.license}"`)), `${entry.name}: REUSE.toml license mismatch`)
  if (expected.license === 'CC-BY-NC-SA-4.0') {
    assert(readme.includes('../KELEEONE-LICENSE.md'), `${entry.name}: README has no shared license link`)
    assert(/CC BY-NC-SA 4\.0/.test(readme), `${entry.name}: README has no adapted-material license`)
  }
  if (entry.name === 'spotify-cleaner') {
    const script = await readFile(path.join(directory, 'clean-response.js'), 'utf8')
    assert(actions.length === 2 && manifest.settings === undefined, 'spotify-cleaner: unlicensed candidate features returned')
    for (const excluded of ['publish-playlist', 'ios-system-your-plan-sidedrawer', 'ios-feature-navigation', 'ios-feature-share']) {
      assert(!script.includes(excluded), `spotify-cleaner: unlicensed candidate behavior returned: ${excluded}`)
    }
  }
  if (entry.name === 'bilibili-cleaner') {
    assert(actions.length === 7 && manifest.settings === undefined, 'bilibili-cleaner: generated GPL endpoint returned')
  }
  assert(rootReadme.includes(`\`${entry.name}\``), `${entry.name}: missing from root catalog table`)
}

extensionNames.sort()
assert(extensionNames.length === expectedExtensions.size, 'extension catalog and license policy differ')
assert(thirdPartyNotices.includes('Copyright (c) 2026 WLOC ProxyPin Contributors'), 'Apple upstream MIT notice is missing')
assert(thirdPartyNotices.includes('Copyright (c) 2020 SVE1R'), 'Spotify upstream MIT notice is missing')
try {
  await stat(path.join(root, 'bilibili-cleaner', 'clean-protobuf.js'))
  throw new Error('bilibili-cleaner: generated GPL output must not be distributed without complete corresponding source')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
console.log(`Validated ${extensionNames.length} extensions: ${extensionNames.join(', ')}`)
