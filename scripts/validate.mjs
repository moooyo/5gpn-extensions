import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { isIP } from 'node:net'
import path from 'node:path'
import vm from 'node:vm'
import { parseDocument } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const maxCaptureHosts = 512
const rootReadme = await readFile(path.join(root, 'README.md'), 'utf8')
const rootReadmeZh = await readFile(path.join(root, 'README.zh-CN.md'), 'utf8')
const migrationPlaybook = await readFile(path.join(root, 'MIGRATION.md'), 'utf8')
const licenseSummary = await readFile(path.join(root, 'LICENSE'), 'utf8')
const reusePolicy = await readFile(path.join(root, 'REUSE.toml'), 'utf8')
const thirdPartyNotices = await readFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8')
const packageMetadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const expectedLicenseFiles = new Map([
  ['MIT.txt', 'f41a1117f350375bbafc61e4292c379ed748bc110f46ec8262dd26fffb2fc459'],
  ['GPL-3.0-only.txt', '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986'],
  ['Apache-2.0.txt', 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'],
  ['BSD-3-Clause.txt', '331ff828cd69efbb82098684450a752a05f05cd4b8f181f4829ba14795d1b5ca'],
  ['CC-BY-NC-SA-4.0.txt', '1349a4b6148492b44f629e64eed676612e234fe9a839e4f3b277c1482c8849f1'],
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
  ['bilibili-cleaner', { license: 'GPL-3.0-only', pin: '12e89d6d93d72d39eb283ef81d2b58eb204cdb58', licenseDigest: '8b1ba204bb69a0ade2bfcf65ef294a920f6bb361b317dba43c7ef29d96332b9b' }],
  ['httpdns-interceptor', { license: 'CC-BY-NC-SA-4.0', pin: 'ab6c3182fb2b09bcc34456f496282ec0b8e9217b', licenseDigest: '047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98' }],
  ['testflight-region-unlock', { license: 'CC-BY-NC-SA-4.0', pin: 'ab6c3182fb2b09bcc34456f496282ec0b8e9217b', licenseDigest: '047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98' }],
  ['youtube-cleaner', { license: 'Apache-2.0', pin: '65075cdb388fc5e3094afd7e7314c67b243f3525', licenseDigest: 'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' }],
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

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function validCIDR(value) {
  if (typeof value !== 'string' || value.trim() !== value || value === '') return false
  const parts = value.split('/')
  if (parts.length !== 2 || !/^\d+$/.test(parts[1])) return false
  const family = isIP(parts[0])
  const prefix = Number(parts[1])
  return family !== 0 && prefix >= 0 && prefix <= (family === 4 ? 32 : 128)
}

function sortedUnique(values) {
  return values.every((value, index) => index === 0 || values[index - 1] < value)
}

function reuseParagraphFor(pathPattern, license) {
  return reusePolicy
    .split(/\r?\n\s*\r?\n/)
    .some((paragraph) => paragraph.includes(`"${pathPattern}"`) && paragraph.includes(`SPDX-License-Identifier = "${license}"`))
}

async function relativeFiles(directory, prefix = '') {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...await relativeFiles(path.join(directory, entry.name), relativePath))
    } else if (entry.isFile()) {
      files.push(relativePath)
    }
  }
  return files
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

  assertKeys(manifest.traffic, new Set(['captureHosts', 'upstreamMappings', 'routingRules']), `${entry.name}: traffic`)
  const captureHosts = manifest.traffic.captureHosts
  assert(Array.isArray(captureHosts) && captureHosts.length > 0 && captureHosts.length <= maxCaptureHosts, `${entry.name}: captureHosts must contain 1 to ${maxCaptureHosts} entries`)
  assert(new Set(captureHosts).size === captureHosts.length, `${entry.name}: captureHosts must be unique`)
  for (const host of captureHosts) assert(validHost(host), `${entry.name}: invalid capture host ${host}`)
  const captureSet = new Set(captureHosts)

  const actions = manifest.actions ?? []
  const mappings = manifest.traffic.upstreamMappings ?? []
  const routingRules = manifest.traffic.routingRules ?? []
  if (hasOwn(manifest.traffic, 'routingRules')) assert(Array.isArray(manifest.traffic.routingRules), `${entry.name}: routingRules must be an array when declared`)
  assert(Array.isArray(routingRules) && routingRules.length <= 256, `${entry.name}: routing rule limit exceeded`)
  const routingRuleSignatures = new Set()
  for (const [index, rule] of routingRules.entries()) {
    const label = `${entry.name}: routingRules[${index}]`
    assertKeys(rule, new Set(['action', 'domain', 'domainSuffix', 'domainKeywords', 'allDomainKeywords', 'ipCIDR', 'network', 'destinationPort']), label)
    assert(rule.action === 'reject' || rule.action === 'direct', `${label} action is invalid`)

    const primaryKeys = ['domain', 'domainSuffix', 'ipCIDR'].filter((key) => hasOwn(rule, key))
    const hasAnyKeywords = hasOwn(rule, 'domainKeywords')
    const hasAllKeywords = hasOwn(rule, 'allDomainKeywords')
    const anyKeywords = hasAnyKeywords ? rule.domainKeywords : []
    const allKeywords = hasAllKeywords ? rule.allDomainKeywords : []
    if (hasAnyKeywords) {
      assert(Array.isArray(anyKeywords) && anyKeywords.length > 0 && anyKeywords.length <= 8, `${label} domainKeywords must contain 1 to 8 entries when declared`)
      assert(anyKeywords.length !== 1, `${label} a single keyword must use allDomainKeywords`)
    }
    if (hasAllKeywords) assert(Array.isArray(allKeywords) && allKeywords.length > 0 && allKeywords.length <= 8, `${label} allDomainKeywords must contain 1 to 8 entries when declared`)
    for (const keyword of [...anyKeywords, ...allKeywords]) {
      assert(typeof keyword === 'string' && keyword.length <= 64 && /^[a-z0-9._-]+$/.test(keyword), `${label} keyword is invalid`)
    }
    assert(sortedUnique(anyKeywords), `${label} domainKeywords must be sorted and unique`)
    assert(sortedUnique(allKeywords), `${label} allDomainKeywords must be sorted and unique`)
    const keywordSet = new Set(anyKeywords)
    assert(allKeywords.every((keyword) => !keywordSet.has(keyword)), `${label} repeats a keyword across any/all groups`)

    assert(primaryKeys.length <= 1 && (primaryKeys.length === 1 || anyKeywords.length + allKeywords.length > 0), `${label} selector is invalid`)
    if (hasOwn(rule, 'domain')) assert(typeof rule.domain === 'string' && rule.domain !== '' && validHost(rule.domain) && !rule.domain.startsWith('*.'), `${label} domain is invalid`)
    if (hasOwn(rule, 'domainSuffix')) assert(typeof rule.domainSuffix === 'string' && rule.domainSuffix !== '' && validHost(rule.domainSuffix) && !rule.domainSuffix.startsWith('*.'), `${label} suffix is invalid`)
    if (hasOwn(rule, 'ipCIDR')) {
      assert(validCIDR(rule.ipCIDR), `${label} CIDR is invalid`)
      assert(anyKeywords.length + allKeywords.length === 0, `${label} CIDR cannot be combined with domain keywords`)
    }
    if (hasOwn(rule, 'network')) assert(typeof rule.network === 'string' && (rule.network === 'tcp' || rule.network === 'udp'), `${label} network is invalid`)
    if (hasOwn(rule, 'destinationPort')) assert(Number.isInteger(rule.destinationPort) && rule.destinationPort >= 1 && rule.destinationPort <= 65535, `${label} port is invalid`)

    const signature = JSON.stringify({
      action: rule.action,
      domain: rule.domain ?? null,
      domainSuffix: rule.domainSuffix ?? null,
      domainKeywords: anyKeywords,
      allDomainKeywords: allKeywords,
      ipCIDR: rule.ipCIDR ?? null,
      network: rule.network ?? null,
      destinationPort: rule.destinationPort ?? null,
    })
    assert(!routingRuleSignatures.has(signature), `${label} duplicates an earlier routing rule`)
    routingRuleSignatures.add(signature)
  }
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
  const migrationHeadings = readme.match(/^## Migration and rollback$/gm) ?? []
  assert(migrationHeadings.length === 1, `${entry.name}: README must have exactly one migration and rollback procedure`)
  const migrationStart = readme.indexOf('## Migration and rollback')
  const migrationEnd = readme.indexOf('\n## ', migrationStart + 1)
  const migrationSection = readme.slice(migrationStart, migrationEnd < 0 ? readme.length : migrationEnd)
  assert((migrationSection.match(/^### Migration contract$/gm) ?? []).length === 1, `${entry.name}: README must have exactly one migration contract`)
  assert((migrationSection.match(/^### Repeatable migration$/gm) ?? []).length === 1, `${entry.name}: README must have exactly one repeatable migration procedure`)
  assert((migrationSection.match(/^### Rollback$/gm) ?? []).length === 1, `${entry.name}: README must have exactly one rollback procedure`)
  assert(migrationSection.includes('../MIGRATION.md'), `${entry.name}: README migration procedure does not reference the shared playbook`)
  assert(migrationSection.includes(manifest.metadata.id), `${entry.name}: migration contract does not bind metadata.id`)
  assert(migrationSection.includes('metadata.version'), `${entry.name}: migration contract does not define version handling`)
  assert(migrationSection.includes('persistentStorage'), `${entry.name}: migration contract does not classify persistent state`)
  const stateClass = manifest.permissions.persistentStorage ? 'Stateful' : 'Stateless'
  assert(migrationSection.includes(`| State class | ${stateClass}.`), `${entry.name}: migration state class differs from extension.yaml`)
  assert(/publisher-managed revert-forward/i.test(migrationSection), `${entry.name}: migration contract does not define the publisher rollback boundary`)
  assert(/manual review/i.test(migrationSection), `${entry.name}: migration contract does not require manual upstream selection`)
  assert(/disabled/i.test(migrationSection), `${entry.name}: migration contract does not require disabled replacement`)
  const manifestContract = [
    `version=${manifest.metadata.version}`,
    `persistentStorage=${manifest.permissions.persistentStorage}`,
    `settings=${manifest.settings?.length ?? 0}`,
    `captureHosts=${captureHosts.length}`,
    `actions=${actions.length}`,
    `routingRules=${routingRules.length}`,
    `networkOrigins=${manifest.permissions.network?.origins?.length ?? 0}`,
    `upstreamMappings=${mappings.length}`,
    `egressRequired=${manifest.requirements?.egressGroup?.required === true}`,
  ].map((value) => `\`${value}\``).join('; ')
  assert(migrationSection.includes(`| Current manifest | ${manifestContract}. |`), `${entry.name}: migration manifest baseline differs from extension.yaml`)
  assert((readme.match(/^## Verification$/gm) ?? []).length === 1, `${entry.name}: README must have exactly one verification procedure`)
  assert(readme.includes(`License: [\`${expected.license}\`]`), `${entry.name}: README has no exact license banner`)
  assert(readme.includes(expected.pin), `${entry.name}: README has no reviewed upstream pin`)
  assert(readme.includes(expected.licenseDigest), `${entry.name}: README has no governing upstream license digest`)
  const reuseAnnotations = reusePolicy
    .split(/\r?\n\s*\r?\n/)
    .filter((paragraph) => paragraph.includes(`${entry.name}/`))
  assert(reuseAnnotations.length > 0, `${entry.name}: missing from REUSE.toml`)
  if (entry.name === 'bilibili-cleaner') {
    assert(reuseAnnotations.some((annotation) => annotation.includes('SPDX-License-Identifier = "GPL-3.0-only"')), 'bilibili-cleaner: GPL aggregate mapping is missing')
  } else {
    assert(reuseAnnotations.every((annotation) => annotation.includes(`SPDX-License-Identifier = "${expected.license}"`)), `${entry.name}: REUSE.toml license mismatch`)
  }
  if (expected.license === 'CC-BY-NC-SA-4.0') {
    assert(readme.includes('../KELEEONE-LICENSE.md'), `${entry.name}: README has no shared license link`)
    assert(/CC BY-NC-SA 4\.0/.test(readme), `${entry.name}: README has no adapted-material license`)
  }
  if (entry.name === 'bilibili-cleaner') {
    assert(migrationSection.includes('| License review gate |'), 'bilibili-cleaner: migration contract has no aggregate-license review gate')
    assert(actions.length === 11 && manifest.settings?.length === 5 && manifest.permissions.network?.origins?.length === 3 && manifest.requirements?.egressGroup?.required === true, 'bilibili-cleaner: pinned LPX capability set is incomplete')
    const sourceRoot = path.join(directory, 'source')
    const finalBundle = await readFile(path.join(directory, 'protobuf.js'), 'utf8')
    assert(finalBundle.startsWith('// SPDX-License-Identifier: GPL-3.0-only AND BSD-3-Clause\n'), 'bilibili-cleaner: final bundle SPDX expression is incomplete')
    assert(finalBundle.includes('Copyright 2008 Google Inc.  All rights reserved.'), 'bilibili-cleaner: final bundle omits the Google BSD copyright')
    assert(finalBundle.includes('THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS'), 'bilibili-cleaner: final bundle omits the Google BSD disclaimer')
    const componentDigests = new Map([
      ['licenses/fflate-MIT.txt', '0a1df3a083d0c010560aa342e87959c8c1070e6fd54545741f083f22d0c8b551'],
      ['licenses/goog-varint-BSD-3-Clause.txt', '182a1bc8985a586e8e0ca3b5a3af1ff3c28bd3475833a07f50b42b53dd7ac889'],
      ['licenses/protobuf-ts-Apache-2.0.txt', '5e3400b93bbb099e83e52bab885e7441750673c21f97988ca3f1240639b63283'],
      ['licenses/protobufjs-BSD-3-Clause.txt', '331ff828cd69efbb82098684450a752a05f05cd4b8f181f4829ba14795d1b5ca'],
    ])
    for (const [relativePath, expectedDigest] of componentDigests) {
      const content = await readFile(path.join(sourceRoot, ...relativePath.split('/')))
      assert(createHash('sha256').update(content).digest('hex') === expectedDigest, `bilibili-cleaner: ${relativePath} digest changed`)
    }
    const bundleInputs = JSON.parse(await readFile(path.join(sourceRoot, 'bundle-inputs.json'), 'utf8'))
    const bundlePaths = bundleInputs.map((input) => input.path)
    assert(bundlePaths.some((inputPath) => inputPath.startsWith('node_modules/@protobuf-ts/runtime/')), 'bilibili-cleaner: protobuf-ts runtime is absent from the bundle projection')
    assert(bundlePaths.some((inputPath) => inputPath.endsWith('/goog-varint.js')), 'bilibili-cleaner: Google BSD varint code is absent from the bundle projection')
    assert(bundlePaths.some((inputPath) => inputPath.startsWith('node_modules/fflate/')), 'bilibili-cleaner: fflate is absent from the bundle projection')
    assert(!bundlePaths.some((inputPath) => inputPath.endsWith('/protobufjs-utf8.js')), 'bilibili-cleaner: BSD protobufjs UTF-8 code unexpectedly reached the final bundle')
    assert(reuseParagraphFor('bilibili-cleaner/protobuf.js', 'GPL-3.0-only AND BSD-3-Clause'), 'bilibili-cleaner: final bundle compound mapping is missing')
    assert(reuseParagraphFor('bilibili-cleaner/source/licenses/goog-varint-BSD-3-Clause.txt', 'BSD-3-Clause'), 'bilibili-cleaner: Google BSD notice mapping is missing')
    assert(reuseParagraphFor('bilibili-cleaner/source/generated/**', 'GPL-3.0-only'), 'bilibili-cleaner: generated source GPL mapping is missing')
    assert(reuseParagraphFor('bilibili-cleaner/source/upstream-sparkle/**', 'GPL-3.0-only'), 'bilibili-cleaner: Sparkle source GPL mapping is missing')
    assert(reuseParagraphFor('bilibili-cleaner/source/vendor-src/fflate/**', 'MIT'), 'bilibili-cleaner: fflate MIT mapping is missing')
    assert(reuseParagraphFor('bilibili-cleaner/source/vendor/fflate-0.8.3.tgz', 'MIT'), 'bilibili-cleaner: fflate archive MIT mapping is missing')
    const protobufSourceRoot = path.join(sourceRoot, 'vendor-src', 'protobuf-ts')
    for (const relativePath of await relativeFiles(protobufSourceRoot)) {
      const reusePath = `bilibili-cleaner/source/vendor-src/protobuf-ts/${relativePath}`
      const expectedLicense = relativePath === 'packages/runtime/src/protobufjs-utf8.ts' || relativePath === 'packages/runtime/src/goog-varint.ts' ? 'BSD-3-Clause' : 'Apache-2.0'
      assert(reuseParagraphFor(reusePath, expectedLicense), `bilibili-cleaner: ${relativePath} ${expectedLicense} mapping is missing`)
    }
    assert(reuseParagraphFor('bilibili-cleaner/source/vendor/protobuf-ts-runtime-2.11.1.tgz', 'Apache-2.0 AND BSD-3-Clause'), 'bilibili-cleaner: runtime archive compound mapping is missing')
    const reuseParagraphs = reusePolicy.split(/\r?\n\s*\r?\n/)
    const bundleAnnotation = reuseParagraphs.find((paragraph) => paragraph.includes('"bilibili-cleaner/protobuf.js"')) ?? ''
    const runtimeArchiveAnnotation = reuseParagraphs.find((paragraph) => paragraph.includes('"bilibili-cleaner/source/vendor/protobuf-ts-runtime-2.11.1.tgz"')) ?? ''
    assert(bundleAnnotation.includes('"2008 Google Inc."'), 'bilibili-cleaner: final bundle Google copyright mapping is missing')
    assert(runtimeArchiveAnnotation.includes('"2008 Google Inc."'), 'bilibili-cleaner: runtime archive Google copyright mapping is missing')
  }
  if (entry.name === 'ad-platform-blocker') {
    assert(routingRules.length === 201, 'ad-platform-blocker: reviewed upstream routing rules are incomplete')
    assert(captureHosts.length === 277, 'ad-platform-blocker: reviewed routing domains are not fully acquired')
    assert(actions.length === 3 && actions.every((action) => action.match.hosts.length === 1), 'ad-platform-blocker: reviewed path actions are incomplete')
  }
  if (entry.name === 'httpdns-interceptor') {
    assert(routingRules.length === 117, 'httpdns-interceptor: reviewed hostname/CIDR routing rules are incomplete')
    const routeDomains = routingRules.flatMap((rule) => rule.domain === undefined ? [] : [rule.domain])
    const routeCIDRs = routingRules.flatMap((rule) => rule.ipCIDR === undefined ? [] : [rule.ipCIDR])
    const requiredCaptureHosts = new Set([...routeDomains, ...actions.flatMap((action) => action.match.hosts)])
    assert(routeDomains.length === 58 && routeCIDRs.length === 59, 'httpdns-interceptor: routing selector split is incomplete')
    assert(actions.length === 7, 'httpdns-interceptor: reviewed hostname path actions are incomplete')
    assert(
      captureHosts.length === 64 && captureHosts.length === requiredCaptureHosts.size &&
        captureHosts.every((host) => requiredCaptureHosts.has(host)),
      'httpdns-interceptor: every domain route and action host must acquire traffic exactly once',
    )
  }
  if (entry.name === 'youtube-cleaner') {
    assert(actions.length === 3 && manifest.settings?.length === 5 && manifest.permissions.persistentStorage && manifest.permissions.network?.origins?.length === 1 && routingRules.length === 0, 'youtube-cleaner: application parity capability set is incomplete')
  }
  assert(rootReadme.includes(`\`${entry.name}\``), `${entry.name}: missing from root catalog table`)
}

extensionNames.sort()
assert(extensionNames.length === expectedExtensions.size, 'extension catalog and license policy differ')
assert(thirdPartyNotices.includes('Copyright (c) 2026 WLOC ProxyPin Contributors'), 'Apple upstream MIT notice is missing')
assert(thirdPartyNotices.includes('Copyright (c) 2026 Arjun Barrett'), 'fflate upstream MIT notice is missing')
assert(thirdPartyNotices.includes('Copyright (c) 2016 Daniel Wirtz'), 'protobufjs BSD notice is missing')
assert(thirdPartyNotices.includes('Copyright 2008 Google Inc.'), 'Google BSD notice is missing')
assert(thirdPartyNotices.includes('goog-varint.js'), 'retained Google BSD bundle scope is undocumented')
assert(thirdPartyNotices.includes('tree-shakes'), 'Bilibili BSD tree-shaking scope is not documented')
assert(licenseSummary.includes('LICENSES/BSD-3-Clause.txt'), 'root LICENSE does not describe the BSD component boundary')
assert(rootReadme.includes('MIGRATION.md'), 'root README does not reference the migration playbook')
assert(rootReadmeZh.includes('MIGRATION.md'), 'Chinese root README does not reference the migration playbook')
assert(migrationPlaybook.includes('| Candidate selection | `manual-only` |'), 'migration playbook does not require manual-only selection')
assert(migrationPlaybook.includes('| Automatic discovery | `forbidden` |'), 'migration playbook does not forbid automatic discovery')
assert(migrationPlaybook.includes('| Installed update | `explicit-only` |'), 'migration playbook does not require explicit updates')
assert(migrationPlaybook.includes('| Post-update state | `disabled` |'), 'migration playbook does not require disabled replacements')
assert(migrationPlaybook.includes('## Required migration record'), 'migration playbook has no required record template')
assert(migrationPlaybook.includes('| Surface | Baseline | Candidate | Decision and evidence |'), 'migration playbook has no migration record table')
for (const surface of [
  'Extension repository revision',
  '5gpn core verification revision',
  '`metadata.version`',
  'Upstream repository and revision',
  'Relevant upstream files, sizes, and SHA-256',
  'Fetch and review date',
  'Settings keys, types, options, and defaults',
  'Persistent-storage keys and schemas',
  'Capture hosts and actions',
  'Network origins and data disclosure',
  'Upstream mappings and routing rules',
  'Required egress and execution order',
  'Licenses, notices, and preferred source',
  'Deliberate exclusions and limitations',
  'Rollback candidate and state compatibility',
  'Focused fixtures and end-to-end evidence',
]) {
  assert(migrationPlaybook.includes(`| ${surface} | | | |`), `migration playbook record is missing ${surface}`)
}
assert(migrationPlaybook.includes('## Repeatable port migration'), 'migration playbook has no repeatable port procedure')
assert(migrationPlaybook.includes('## Repeatable installed rollout'), 'migration playbook has no installed rollout procedure')
assert(migrationPlaybook.includes('## Repeatable rollback'), 'migration playbook has no rollback procedure')
assert((await stat(path.join(root, 'bilibili-cleaner', 'protobuf.js'))).isFile(), 'bilibili-cleaner: deterministic protobuf bundle is missing')
assert((await stat(path.join(root, 'bilibili-cleaner', 'source', 'package-lock.json'))).isFile(), 'bilibili-cleaner: corresponding GPL build inputs are missing')
console.log(`Validated ${extensionNames.length} extensions: ${extensionNames.join(', ')}`)
