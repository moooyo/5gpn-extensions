import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
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
  // Yu9191/wloc publishes no LICENSE file. That is recorded rather than
  // papered over: the README must say so, because "no upstream license digest"
  // and "we forgot to record one" must not look the same.
  ['apple-wloc', { license: 'MIT', pin: 'eec07a8dc8de6dbaee8eac1fb376e4d03020154a', unlicensed: true }],
  ['bilibili-cleaner', { license: 'GPL-3.0-only', pin: '12e89d6d93d72d39eb283ef81d2b58eb204cdb58' }],
  ['testflight-region-unlock', { license: 'CC-BY-NC-SA-4.0', pin: 'ab6c3182fb2b09bcc34456f496282ec0b8e9217b' }],
  ['weatherkit', { license: 'Apache-2.0', pin: '1a2f64883d866a6974a9a5369a82191c49413617' }],
  ['youtube-cleaner', { license: 'Apache-2.0', pin: '65075cdb388fc5e3094afd7e7314c67b243f3525' }],
  ['zhihu-cleaner', { license: 'CC-BY-NC-SA-4.0', pin: '8d0e2791f531d4a02e1bd00d0f64427984bc999a' }],
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

// A [Host] target carries its form in Loon's own encoding, so an entry lifted
// from an upstream plugin transcribes unchanged:
//
//   1.2.3.4            an address
//   other.example.com  an alias
//   server:1.1.1.1     a resolver (comma-separated, at most four)
//
// The address form refuses everything the gateway must never be pointed at.
// That is not defence in depth here, it is the only defence: the rendered
// private-range denies are all no-resolve, so they stop an IP-form routing
// target and nothing else, and the egress anchor resolves ahead of the rule
// list entirely. The core refuses the same set; this is the copy that fails in
// CI instead of at import.
function validHostMappingAddress(value) {
  const octets = value.split('.')
  if (octets.length !== 4) return false
  const parts = octets.map((octet) => Number(octet))
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(value)) return false
  const [a, b] = parts
  if (a === 0 || a === 127 || a === 10) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 169 && b === 254) return false
  if (a === 100 && b >= 64 && b <= 127) return false // carrier-grade NAT
  if (a >= 224) return false // multicast and reserved
  return true
}

function validHostMappingTarget(value) {
  if (typeof value !== 'string' || value !== value.trim()) return false
  if (value.startsWith('server:')) {
    const specs = value.slice('server:'.length).split(',').map((spec) => spec.trim()).filter(Boolean)
    return specs.length > 0 && specs.length <= 4
  }
  if (/^\d/.test(value)) return validHostMappingAddress(value)
  return validHost(value) && !value.startsWith('*.')
}

for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const directory = path.join(root, entry.name)
  try {
    await stat(path.join(directory, 'extension.yaml'))
  } catch {
    continue
  }
  const readme = await readFile(path.join(directory, 'README.md'), 'utf8')
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
  // One boolean. The origin list is gone from the format, and an extension that
  // still carries one would import with a grant broader than its author asked
  // for, so the shape is refused here rather than ignored.
  if (manifest.permissions.network !== undefined) {
    assert(manifest.permissions.network === true, `${entry.name}: permissions.network must be true when declared`)
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
  for (const [index, mapping] of mappings.entries()) {
    assert(validHostMappingTarget(mapping.target), `${entry.name}: upstreamMappings[${index}].target is invalid`)
  }
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
    assertKeys(action, new Set(['id', 'phase', 'enabledWhen', 'match', 'script']), `${entry.name}: action`)
    assert(typeof action.id === 'string' && action.id !== '' && !actionIDs.has(action.id), `${entry.name}: invalid or duplicate action id`)
    actionIDs.add(action.id)
    // An upstream plugin format switches a script entry on and off from outside
    // the script, so a bundle carrying such a switch never reads the key. The
    // gate has to name a required boolean setting: an enabled extension's
    // required settings always carry a value, so the gate always has a
    // decidable state, and the core refuses anything else at import.
    if (action.enabledWhen !== undefined) {
      assertKeys(action.enabledWhen, new Set(['key', 'equals']), `${entry.name}: ${action.id}.enabledWhen`)
      const gate = (manifest.settings ?? []).find((setting) => setting.key === action.enabledWhen.key)
      assert(gate !== undefined, `${entry.name}: ${action.id} enabledWhen names an undeclared setting ${action.enabledWhen.key}`)
      assert(gate.required === true, `${entry.name}: ${action.id} enabledWhen must name a required setting`)
      assert(typeof action.enabledWhen.equals === 'string' && action.enabledWhen.equals !== '', `${entry.name}: ${action.id} enabledWhen needs a value to compare against`)
      // Comparing against a value the operator can never choose compiles to an
      // action that never runs, which is the failure nobody sees.
      if (gate.type === 'select') {
        assert(gate.options.includes(action.enabledWhen.equals), `${entry.name}: ${action.id} enabledWhen compares against an option ${gate.key} does not offer`)
      }
      if (gate.type === 'boolean') {
        assert(['true', 'false'].includes(action.enabledWhen.equals), `${entry.name}: ${action.id} enabledWhen compares a boolean against ${action.enabledWhen.equals}`)
      }
    }
    assert(['request', 'response'].includes(action.phase), `${entry.name}: invalid phase in ${action.id}`)
    assertKeys(action.match, new Set(['hosts', 'schemes', 'methods', 'pathRegex', 'statusCodes']), `${entry.name}: ${action.id}.match`)
    assert(Array.isArray(action.match.hosts) && action.match.hosts.length > 0, `${entry.name}: ${action.id} has no hosts`)
    for (const host of action.match.hosts) assert(captureSet.has(host), `${entry.name}: ${action.id} host ${host} is outside captureHosts`)
    assert(Array.isArray(action.match.schemes) && action.match.schemes.every((scheme) => scheme === 'http' || scheme === 'https'), `${entry.name}: ${action.id} has invalid schemes`)
    assert(typeof action.match.pathRegex === 'string' && action.match.pathRegex.startsWith('^'), `${entry.name}: ${action.id} pathRegex must be anchored`)
    assertKeys(action.script, new Set(['source', 'inline', 'bodyMode', 'entry', 'jq', 'reject', 'mock', 'headers', 'rewrite', 'replaceBody', 'timeoutMs', 'maxBodyBytes']), `${entry.name}: ${action.id}.script`)
    // The repository-level no-JavaScript gate below only sees `.js` files, so an
    // inline body would carry JavaScript in the YAML past it and past the
    // forbidden-pattern lint, which only reads a local file. The published
    // marketplace already refuses `inline`; refuse it here too, where the error
    // arrives before a manifest is built rather than after.
    assert(action.script.inline === undefined, `${entry.name}: ${action.id} must load a script from a source, not inline it`)
    const scriptEntry = action.script.entry ?? 'native'
    assert(scriptEntry === 'native' || scriptEntry === 'proxy-compat', `${entry.name}: ${action.id} has an unknown script entry`)
    // Three declarative kinds carry what the published modules declare and run
    // no code at all. Exactly one kind applies to an action.
    const kinds = ['jq', 'reject', 'mock', 'headers', 'rewrite', 'replaceBody', 'source', 'inline'].filter((key) => action.script[key] !== undefined)
    assert(kinds.length === 1, `${entry.name}: ${action.id} must declare exactly one action kind, found ${kinds.join(', ') || 'none'}`)
    for (const [key, allowed] of [
      ['headers', new Set(['set', 'remove'])],
      ['rewrite', new Set(['pattern', 'to', 'status'])],
      ['replaceBody', new Set(['pattern', 'to', 'valueMap'])],
    ]) {
      if (action.script[key] === undefined) continue
      assertKeys(action.script[key], allowed, `${entry.name}: ${action.id}.script.${key}`)
      assert(action.script.entry === undefined, `${entry.name}: ${action.id} declares an entry without a script`)
    }
    if (action.script.headers !== undefined) {
      for (const [name, value] of Object.entries(action.script.headers.set ?? {})) {
        assert(!/[\r\n]/.test(String(value)), `${entry.name}: ${action.id} header ${name} contains a newline`)
      }
      continue
    }
    if (action.script.rewrite !== undefined) {
      const rewrite = action.script.rewrite
      new RegExp(rewrite.pattern ?? '')
      assert(typeof rewrite.to === 'string' && rewrite.to !== '', `${entry.name}: ${action.id} rewrite needs a target`)
      if (rewrite.status !== undefined) {
        assert(rewrite.status === 302 || rewrite.status === 307, `${entry.name}: ${action.id} rewrite status must be 302 or 307`)
      }
      continue
    }
    if (action.script.replaceBody !== undefined) {
      const replace = action.script.replaceBody
      new RegExp(replace.pattern)
      assert(typeof replace.to === 'string', `${entry.name}: ${action.id} replaceBody needs a replacement`)
      continue
    }
    if (action.script.reject !== undefined) {
      assert(action.script.reject === true, `${entry.name}: ${action.id} reject must be true`)
      assert(action.script.entry === undefined, `${entry.name}: ${action.id} rejects and cannot declare an entry`)
      continue
    }
    if (action.script.mock !== undefined) {
      const mock = action.script.mock
      assertKeys(mock, new Set(['status', 'headers', 'body', 'base64Body']), `${entry.name}: ${action.id}.script.mock`)
      assert(action.script.entry === undefined, `${entry.name}: ${action.id} mocks and cannot declare an entry`)
      assert(!(mock.body !== undefined && mock.base64Body !== undefined), `${entry.name}: ${action.id} declares both body and base64Body`)
      if (mock.status !== undefined) assert(Number.isInteger(mock.status) && mock.status >= 100 && mock.status <= 599, `${entry.name}: ${action.id} mock status is not an HTTP status`)
      for (const [name, value] of Object.entries(mock.headers ?? {})) {
        // A raw newline is folded away by YAML, but a double-quoted escape
        // survives and would let a mock put a second response on the wire.
        assert(!/[\r\n]/.test(String(value)), `${entry.name}: ${action.id} mock header ${name} contains a newline`)
        assert(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name), `${entry.name}: ${action.id} mock header name ${name} is invalid`)
      }
      if (mock.base64Body !== undefined) {
        assert(Buffer.from(mock.base64Body, 'base64').toString('base64').replace(/=+$/, '') === String(mock.base64Body).replace(/=+$/, ''), `${entry.name}: ${action.id} mock base64Body is not base64`)
      }
      continue
    }
    if (action.script.jq !== undefined) {
      assert(typeof action.script.jq === 'string' && action.script.jq.trim() !== '', `${entry.name}: ${action.id} jq must be a non-empty expression`)
      assert(action.script.jq.length <= 32768, `${entry.name}: ${action.id} jq expression is too long`)
      assert(action.script.entry === undefined, `${entry.name}: ${action.id} declares both jq and an entry`)
      assert(action.script.bodyMode === 'text', `${entry.name}: ${action.id} jq requires a text body`)
      assert(action.script.source === undefined && action.script.inline === undefined, `${entry.name}: ${action.id} declares both jq and a script`)
      continue
    }
    const hasSource = typeof action.script.source === 'string'
    assert(hasSource, `${entry.name}: ${action.id} must declare a script source`)
    if (scriptEntry === 'proxy-compat') {
      // A published bundle is fetched by URL and is not ours to lint: it is
      // async, it defines no transform(context), and it uses the proxy-client
      // globals on purpose. Its provenance is bound by the README record and by
      // the immutable revision in the URL itself.
      const parsed = new URL(action.script.source)
      assert(parsed.protocol === 'https:', `${entry.name}: ${action.id} bundle source must be HTTPS`)
      assert(readme.includes(action.script.source), `${entry.name}: ${action.id} bundle is not recorded in the README`)
    } else {
      // No extension currently ships a local script, and the repository-level
      // gate below keeps it that way. This branch is the contract a reintroduced
      // one would have to meet, kept so that adding it is a deliberate decision
      // against a stated boundary rather than an unreviewed new capability.
      assert(action.script.source.startsWith('./') && !action.script.source.includes('..'), `${entry.name}: ${action.id} must use a local relative script`)
      const scriptPath = path.join(directory, action.script.source.slice(2))
      const script = await readFile(scriptPath, 'utf8')
      new vm.Script(script, { filename: scriptPath })
      assert(/function\s+transform\s*\(\s*context\s*\)/.test(script), `${entry.name}: ${action.id} script has no transform(context)`)
      for (const [pattern, label] of forbiddenScriptPatterns) assert(!pattern.test(script), `${entry.name}: ${action.id} uses forbidden ${label}`)
    }
  }

  const expected = expectedExtensions.get(entry.name)
  assert(expected !== undefined, `${entry.name}: no reviewed license policy`)
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
    `network=${manifest.permissions.network === true}`,
    `upstreamMappings=${mappings.length}`,
    `egressRequired=${manifest.requirements?.egressGroup?.required === true}`,
  ].map((value) => `\`${value}\``).join('; ')
  assert(migrationSection.includes(`| Current manifest | ${manifestContract}. |`), `${entry.name}: migration manifest baseline differs from extension.yaml`)
  assert((readme.match(/^## Verification$/gm) ?? []).length === 1, `${entry.name}: README must have exactly one verification procedure`)
  assert(readme.includes(`License: [\`${expected.license}\`]`), `${entry.name}: README has no exact license banner`)
  assert(readme.includes(expected.pin), `${entry.name}: README has no reviewed upstream pin`)
  // Byte-level pinning is gone, but an upstream that grants no license at all
  // still has to be recorded as such: "no digest" and "no grant" must not look
  // the same.
  if (expected.unlicensed) {
    assert(/upstream publishes no license file/i.test(readme), `${entry.name}: README must state that upstream publishes no license`)
  }
  const reuseAnnotations = reusePolicy
    .split(/\r?\n\s*\r?\n/)
    .filter((paragraph) => paragraph.includes(`${entry.name}/`))
  assert(reuseAnnotations.length > 0, `${entry.name}: missing from REUSE.toml`)
  if (entry.name === 'bilibili-cleaner') {
    assert(reuseAnnotations.some((annotation) => annotation.includes('SPDX-License-Identifier = "GPL-3.0-only"')), 'bilibili-cleaner: GPL aggregate mapping is missing')
  } else if (entry.name === 'weatherkit') {
    // The bundle is fetched at runtime, so this repository distributes no
    // upstream bytes and the compound generated-bundle mapping is gone with it.
    assert(reuseAnnotations.every((annotation) => annotation.includes('SPDX-License-Identifier = "Apache-2.0"')), 'weatherkit: Apache mapping is missing')
  } else {
    assert(reuseAnnotations.every((annotation) => annotation.includes(`SPDX-License-Identifier = "${expected.license}"`)), `${entry.name}: REUSE.toml license mismatch`)
  }
  if (expected.license === 'CC-BY-NC-SA-4.0') {
    assert(readme.includes('../KELEEONE-LICENSE.md'), `${entry.name}: README has no shared license link`)
    assert(/CC BY-NC-SA 4\.0/.test(readme), `${entry.name}: README has no adapted-material license`)
  }
  if (entry.name === 'bilibili-cleaner') {
    assert(migrationSection.includes('| License review gate |'), 'bilibili-cleaner: migration contract has no aggregate-license review gate')
    assert(actions.length === 24 && manifest.settings?.length === 5 && manifest.permissions.network === true && manifest.requirements?.egressGroup?.required === false, 'bilibili-cleaner: pinned LPX capability set is incomplete')
    // Nothing GPL is redistributed any more: the scripts are fetched by the
    // gateway from immutable URLs. What has to stay true is that no upstream
    // bytes crept back into the directory, and that every script action still
    // points at the reviewed commit.
    const shipped = (await relativeFiles(directory)).filter((name) => name.endsWith('.js'))
    assert(shipped.length === 0, `bilibili-cleaner: unexpected JavaScript in the directory: ${shipped.join(', ')}`)
    assert(actions.filter((action) => action.script.mock !== undefined).length === 8, 'bilibili-cleaner: the eight reviewed synthetic responses are incomplete')
    const compat = actions.filter((action) => action.script.entry === 'proxy-compat')
    assert(compat.length === 5, 'bilibili-cleaner: the five upstream transformers must all be loaded')
    for (const action of compat) {
      assert(action.script.source.startsWith('https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/'), `bilibili-cleaner: ${action.id} is not the reviewed immutable commit`)
    }
    assert(actions.filter((action) => typeof action.script.jq === 'string').length === 11, 'bilibili-cleaner: the eleven reviewed rewrite expressions are incomplete')
  }
  if (entry.name === 'youtube-cleaner') {
    assert(actions.length === 3 && manifest.settings?.length === 5 && manifest.permissions.persistentStorage && manifest.permissions.network === true && routingRules.length === 0, 'youtube-cleaner: application parity capability set is incomplete')
    assert(actions.every((action) => action.script.entry === 'proxy-compat'), 'youtube-cleaner: every action must run the published bundle')
    // Two entries, one per upstream transformer: the request script serves both
    // request actions and the response script serves the response action.
    const bundleSources = new Set(actions.map((action) => action.script.source))
    assert(bundleSources.size === 2, 'youtube-cleaner: actions must pin exactly the two upstream transformers')
    for (const source of bundleSources) {
      assert(source.startsWith('https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/'), `youtube-cleaner: ${source} is not the reviewed immutable commit`)
    }
  }
  if (entry.name === 'weatherkit') {
    assert(
      actions.length === 4 && manifest.settings?.length === 11 && manifest.permissions.persistentStorage && manifest.permissions.network === true && routingRules.length === 4,
      'weatherkit: reviewed two-mode capability set is incomplete',
    )
    // Upstream publishes the same two paths twice: a release module that runs
    // the bundle in the client and a repository module that rewrites both paths
    // to a cloud endpoint. Both are carried, and one select chooses between
    // them, so "both at once" is not a state an operator can reach.
    const scripted = actions.filter((action) => action.script.entry === 'proxy-compat')
    const cloud = actions.filter((action) => action.script.rewrite !== undefined)
    assert(scripted.length === 2 && cloud.length === 2 && scripted.length + cloud.length === actions.length, 'weatherkit: each mode must declare exactly the two upstream paths')
    assert(scripted.every((action) => action.enabledWhen?.key === 'Mode' && action.enabledWhen.equals === 'Script' && action.phase === 'response'), 'weatherkit: every bundle action must be a response action gated on Mode=Script')
    assert(cloud.every((action) => action.enabledWhen?.key === 'Mode' && action.enabledWhen.equals === 'Cloud' && action.phase === 'request'), 'weatherkit: every cloud rewrite must be a request action gated on Mode=Cloud')
    const mode = manifest.settings.find((setting) => setting.key === 'Mode')
    assert(mode?.type === 'select' && mode.required === true, 'weatherkit: Mode must be a required select')
    // The default keeps every byte on this gateway. Cloud mode is opt-in
    // because it hands the captured request to someone else.
    assert(mode.default === 'Script' && mode.options.join(',') === 'Script,Cloud', 'weatherkit: Mode must default to the gateway')
    // Both modes must select the same exchanges, so Mode changes only how a
    // request is handled and never which requests the extension touches.
    const selectorsOf = (list) => JSON.stringify(list.map((action) => `${action.match.pathRegex}|${(action.match.methods ?? []).join(',')}`).sort())
    assert(selectorsOf(scripted) === selectorsOf(cloud), 'weatherkit: the two modes must cover the same paths and methods')
    // Every endpoint an operator can select is a third party this extension may
    // hand a captured Apple request to, so the README has to name all of them
    // and the rewrite must resolve to exactly that setting. Two, not upstream's
    // three: the third stopped resolving and the exclusions record the check.
    const endpoint = manifest.settings.find((setting) => setting.key === 'Endpoint')
    assert(endpoint?.type === 'select' && endpoint.required === true && endpoint.options.length === 2, 'weatherkit: Endpoint must offer the two reachable upstream endpoints')
    for (const option of endpoint.options) {
      assert(validHost(option) && !option.startsWith('*.'), `weatherkit: Endpoint option ${option} is not a host`)
      assert(readme.includes(option), `weatherkit: README does not record the cloud endpoint ${option}`)
    }
    for (const action of cloud) {
      assert(action.script.rewrite.to.startsWith('https://{{settings.Endpoint}}/'), `weatherkit: ${action.id} must resolve its host from the Endpoint setting`)
      assert(action.script.rewrite.to.endsWith('$1'), `weatherkit: ${action.id} must carry the rest of the URL through`)
      assert(action.script.rewrite.pattern.includes(String.raw`weatherkit\.apple\.com`), `weatherkit: ${action.id} must rewrite only the captured host`)
    }
    // Without this the bundle's switch reads persistent storage and discards
    // $argument, so every other setting on the page silently does nothing.
    const storage = manifest.settings.find((setting) => setting.key === 'Storage')
    assert(storage?.default === '$argument' && storage.options?.length === 1, 'weatherkit: settings must be declared as reaching the bundle through $argument')
    // The bundle is remote and no longer digest-pinned, so what this still binds
    // is that both script actions load the same reviewed release.
    const bundleSources = new Set(scripted.map((action) => action.script.source))
    assert(bundleSources.size === 1, 'weatherkit: actions must load the same bundle release')
    const [bundleSource] = bundleSources
    assert(/^https:\/\/github\.com\/NSRingo\/WeatherKit\/releases\/download\//.test(bundleSource), 'weatherkit: bundle must come from the reviewed upstream release')
    assert(readme.includes(bundleSource), 'weatherkit: README does not record the bundle URL')
    assert(reuseParagraphFor('weatherkit/extension.yaml', 'Apache-2.0'), 'weatherkit: manifest license mapping is missing')
  }
  if (entry.name === 'zhihu-cleaner') {
    assert(captureHosts.length === 5, 'zhihu-cleaner: reviewed capture hosts are incomplete')
    assert(actions.length === 18 && actions.filter((action) => action.phase === 'request').length === 5 && actions.filter((action) => action.phase === 'response').length === 13, 'zhihu-cleaner: reviewed action set is incomplete')
    assert((await relativeFiles(directory)).filter((name) => name.endsWith('.js')).length === 0, 'zhihu-cleaner: this extension ships no JavaScript')
    assert(actions.filter((action) => action.phase === 'response').every((action) => typeof action.script.jq === 'string'), 'zhihu-cleaner: every response action must be a jq expression, not a script')
    assert((manifest.settings?.length ?? 0) === 0 && !manifest.permissions.persistentStorage && manifest.permissions.network === undefined && routingRules.length === 5 && mappings.length === 0 && manifest.requirements?.egressGroup?.required !== true, 'zhihu-cleaner: unexpected permission or routing expansion')
    assert(routingRules.every((rule) => rule.action === 'reject' && rule.network === 'udp' && rule.destinationPort === 443 && captureSet.has(rule.domain)), 'zhihu-cleaner: UDP/443 fallback rules are incomplete')
  }
  assert(rootReadme.includes(`\`${entry.name}\``), `${entry.name}: missing from root catalog table`)
}

extensionNames.sort()
assert(extensionNames.length === expectedExtensions.size, 'extension catalog and license policy differ')
assert(thirdPartyNotices.includes('Copyright (c) 2026 WLOC ProxyPin Contributors'), 'Apple upstream MIT notice is missing')
// No extension vendors upstream source any more, so the notices record what is
// loaded and pinned rather than what is redistributed. What still has to be
// stated is where a grant is absent: Yu9191/wloc publishes no license at all.
assert(thirdPartyNotices.includes('publishes no `LICENSE` file'), 'notices do not record the upstream without a license')
assert(!existsSync(path.join(root, 'LICENSES', 'BSD-3-Clause.txt')), 'an unused license text would fail the REUSE gate')
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
  'Relevant upstream files and their pinned commits',
  'Fetch and review date',
  'Settings keys, types, options, and defaults',
  'Persistent-storage keys and schemas',
  'Capture hosts and actions',
  'Network permission and data disclosure',
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
// No extension ships JavaScript any more: every action is declarative or loads
// a pinned upstream script. This is asserted at the repository level so that a
// reintroduced local script is a deliberate decision with a test to match,
// rather than something that reappears one file at a time.
const strayScripts = []
for (const name of extensionNames) {
  for (const file of await relativeFiles(path.join(root, name))) {
    if (file.endsWith('.js')) strayScripts.push(`${name}/${file}`)
  }
}
assert(strayScripts.length === 0, `extensions ship no JavaScript; found ${strayScripts.join(', ')}`)
console.log(`Validated ${extensionNames.length} extensions: ${extensionNames.join(', ')}`)
