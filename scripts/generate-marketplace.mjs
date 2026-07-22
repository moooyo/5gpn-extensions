import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import { isIP } from 'node:net'
import path from 'node:path'
import { isAlias, isMap, isSeq, parseDocument } from 'yaml'

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const rawBase = 'https://raw.githubusercontent.com/moooyo/5gpn-extensions/main'
const githubBase = 'https://github.com/moooyo/5gpn-extensions/blob/main'
const revisionPattern = /^[0-9a-f]{40}$/
const directoryPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const tagPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const spdxPattern = /^[A-Za-z0-9][A-Za-z0-9.+-]*$/

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertObject(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
}

function assertKeys(value, allowed, label) {
  assertObject(value, label)
  for (const key of Object.keys(value)) assert(allowed.has(key), `${label} has unknown key ${key}`)
}

function assertString(value, label) {
  assert(typeof value === 'string' && value.trim() !== '', `${label} must be a non-empty string`)
}

function validHost(value) {
  if (typeof value !== 'string' || value !== value.toLowerCase() || value.endsWith('.')) return false
  const host = value.startsWith('*.') ? value.slice(2) : value
  if (!host || host.length > 253 || host === 'localhost' || host.endsWith('.local')) return false
  return host.split('.').length >= 2 && host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
}

function validCIDR(value) {
  if (typeof value !== 'string' || value !== value.trim()) return false
  const slash = value.lastIndexOf('/')
  if (slash <= 0) return false
  const address = value.slice(0, slash)
  const family = isIP(address)
  const prefix = Number(value.slice(slash + 1))
  return family !== 0 && Number.isInteger(prefix) && prefix >= 0 && prefix <= (family === 4 ? 32 : 128)
}

function validateRoutingRules(rules, directory) {
  assert(Array.isArray(rules) && rules.length <= 256, `${directory}: routingRules must be a bounded array`)
  const seenRules = new Set()
  for (const [index, rule] of rules.entries()) {
    const label = `${directory}: routingRules[${index}]`
    assertKeys(rule, new Set(['action', 'domain', 'domainSuffix', 'domainKeywords', 'allDomainKeywords', 'ipCIDR', 'network', 'destinationPort']), label)
    assert(rule.action === 'reject' || rule.action === 'direct', `${label} action is invalid`)
    const primaries = ['domain', 'domainSuffix', 'ipCIDR'].filter((key) => Object.hasOwn(rule, key))
    const anyKeywords = rule.domainKeywords
    const allKeywords = rule.allDomainKeywords
    if (anyKeywords !== undefined) assert(Array.isArray(anyKeywords) && anyKeywords.length >= 2 && anyKeywords.length <= 8, `${label} domainKeywords must contain 2 to 8 entries`)
    if (allKeywords !== undefined) assert(Array.isArray(allKeywords) && allKeywords.length >= 1 && allKeywords.length <= 8, `${label} allDomainKeywords must contain 1 to 8 entries`)
    const any = anyKeywords ?? []
    const all = allKeywords ?? []
    assert(primaries.length <= 1 && (primaries.length === 1 || any.length + all.length > 0), `${label} selector is invalid`)
    if (rule.domain !== undefined) assert(validHost(rule.domain) && !rule.domain.startsWith('*.'), `${label} domain is invalid`)
    if (rule.domainSuffix !== undefined) assert(validHost(rule.domainSuffix) && !rule.domainSuffix.startsWith('*.'), `${label} domainSuffix is invalid`)
    if (rule.ipCIDR !== undefined) assert(validCIDR(rule.ipCIDR) && any.length + all.length === 0, `${label} ipCIDR is invalid`)
    const combined = [...any, ...all]
    assert(combined.every((keyword) => typeof keyword === 'string' && keyword.length <= 64 && /^[a-z0-9._-]+$/.test(keyword)), `${label} keyword is invalid`)
    assert(new Set(combined).size === combined.length, `${label} keywords must be unique across groups`)
    assert(any.every((value, offset) => offset === 0 || any[offset - 1] < value), `${label} domainKeywords must be sorted`)
    assert(all.every((value, offset) => offset === 0 || all[offset - 1] < value), `${label} allDomainKeywords must be sorted`)
    if (rule.network !== undefined) assert(rule.network === 'tcp' || rule.network === 'udp', `${label} network is invalid`)
    if (rule.destinationPort !== undefined) assert(Number.isInteger(rule.destinationPort) && rule.destinationPort >= 1 && rule.destinationPort <= 65535, `${label} destinationPort is invalid`)
    const identity = JSON.stringify({
      action: rule.action,
      domain: rule.domain ?? null,
      domainSuffix: rule.domainSuffix ?? null,
      domainKeywords: any,
      allDomainKeywords: all,
      ipCIDR: rule.ipCIDR ?? null,
      network: rule.network ?? null,
      destinationPort: rule.destinationPort ?? null,
    })
    assert(!seenRules.has(identity), `${label} duplicates an earlier rule`)
    seenRules.add(identity)
  }
}

function sha256(body) {
  return createHash('sha256').update(body).digest('hex')
}

function rejectUnsafeYAML(node, label) {
  if (!node) return
  assert(!isAlias(node) && !node.anchor, `${label} cannot use YAML aliases or anchors`)
  if (isMap(node)) {
    for (const pair of node.items) {
      assert(pair.key?.value !== '<<', `${label} cannot use YAML merge keys`)
      rejectUnsafeYAML(pair.key, label)
      rejectUnsafeYAML(pair.value, label)
    }
    return
  }
  if (isSeq(node)) for (const item of node.items) rejectUnsafeYAML(item, label)
}

function parseStrictManifest(body, directory) {
  const document = parseDocument(body.toString('utf8'), { strict: true, uniqueKeys: true })
  assert(document.errors.length === 0, `${directory}: invalid YAML: ${document.errors.join('; ')}`)
  assert(document.contents, `${directory}: manifest is empty`)
  rejectUnsafeYAML(document.contents, `${directory}: manifest`)
  const manifest = document.toJS()

  assertKeys(manifest, new Set(['apiVersion', 'kind', 'metadata', 'permissions', 'requirements', 'traffic', 'settings', 'actions']), `${directory}: manifest`)
  assert(manifest.apiVersion === '5gpn.io/v1', `${directory}: unsupported apiVersion`)
  assert(manifest.kind === 'Extension', `${directory}: unsupported kind`)

  assertKeys(manifest.metadata, new Set(['id', 'name', 'version', 'description']), `${directory}: metadata`)
  assertString(manifest.metadata.id, `${directory}: metadata.id`)
  assertString(manifest.metadata.name, `${directory}: metadata.name`)
  assert(/^\d+\.\d+\.\d+$/.test(manifest.metadata.version), `${directory}: metadata.version must use x.y.z syntax`)
  assertString(manifest.metadata.description, `${directory}: metadata.description`)

  assertKeys(manifest.permissions, new Set(['persistentStorage', 'network']), `${directory}: permissions`)
  assert(typeof manifest.permissions.persistentStorage === 'boolean', `${directory}: persistentStorage must be boolean`)
  const network = manifest.permissions.network
  if (network !== undefined) {
    assertKeys(network, new Set(['origins']), `${directory}: permissions.network`)
    assert(Array.isArray(network.origins), `${directory}: permissions.network.origins must be an array`)
    for (const origin of network.origins) assertString(origin, `${directory}: network origin`)
  }

  if (manifest.requirements !== undefined) {
    assertKeys(manifest.requirements, new Set(['egressGroup']), `${directory}: requirements`)
    assertKeys(manifest.requirements.egressGroup, new Set(['required']), `${directory}: requirements.egressGroup`)
    assert(typeof manifest.requirements.egressGroup.required === 'boolean', `${directory}: egressGroup.required must be boolean`)
  }

  assertKeys(manifest.traffic, new Set(['captureHosts', 'upstreamMappings', 'routingRules']), `${directory}: traffic`)
  assert(Array.isArray(manifest.traffic.captureHosts) && manifest.traffic.captureHosts.length > 0, `${directory}: captureHosts must not be empty`)
  assert(new Set(manifest.traffic.captureHosts).size === manifest.traffic.captureHosts.length, `${directory}: captureHosts must be unique`)
  for (const host of manifest.traffic.captureHosts) assertString(host, `${directory}: capture host`)
  const mappings = manifest.traffic.upstreamMappings ?? []
  assert(Array.isArray(mappings), `${directory}: upstreamMappings must be an array`)
  for (const [index, mapping] of mappings.entries()) {
    assertKeys(mapping, new Set(['host', 'target']), `${directory}: upstreamMappings[${index}]`)
    assertString(mapping.host, `${directory}: upstreamMappings[${index}].host`)
    assertString(mapping.target, `${directory}: upstreamMappings[${index}].target`)
  }
  const routingRules = manifest.traffic.routingRules ?? []
  validateRoutingRules(routingRules, directory)

  const settings = manifest.settings ?? []
  assert(Array.isArray(settings), `${directory}: settings must be an array`)
  const settingKeys = new Set()
  for (const [index, setting] of settings.entries()) {
    assertKeys(setting, new Set(['key', 'type', 'label', 'description', 'required', 'options', 'min', 'max', 'default']), `${directory}: settings[${index}]`)
    assertString(setting.key, `${directory}: settings[${index}].key`)
    assert(!settingKeys.has(setting.key), `${directory}: duplicate setting key ${setting.key}`)
    settingKeys.add(setting.key)
  }

  const actions = manifest.actions ?? []
  assert(Array.isArray(actions), `${directory}: actions must be an array`)
  const actionIDs = new Set()
  for (const [index, action] of actions.entries()) {
    assertKeys(action, new Set(['id', 'phase', 'match', 'script']), `${directory}: actions[${index}]`)
    assertString(action.id, `${directory}: actions[${index}].id`)
    assert(!actionIDs.has(action.id), `${directory}: duplicate action id ${action.id}`)
    actionIDs.add(action.id)
    assertKeys(action.match, new Set(['hosts', 'schemes', 'methods', 'pathRegex', 'statusCodes']), `${directory}: action ${action.id}.match`)
    assertKeys(action.script, new Set(['source', 'inline', 'bodyMode', 'timeoutMs', 'maxBodyBytes']), `${directory}: action ${action.id}.script`)
    assert(action.script.inline === undefined, `${directory}: published actions must use immutable local script sources`)
    assertString(action.script.source, `${directory}: action ${action.id}.script.source`)
  }
  assert(actions.length + mappings.length > 0, `${directory}: at least one action or mapping is required`)
  return manifest
}

function validateMetadata(metadata) {
  assertKeys(metadata, new Set(['metadata', 'entries']), 'marketplace metadata')
  assertKeys(metadata.metadata, new Set(['id', 'name', 'description', 'homepage', 'repository']), 'marketplace metadata.metadata')
  assert(metadata.metadata.id === 'io.5gpn.official', 'marketplace metadata id must be io.5gpn.official')
  for (const field of ['name', 'description', 'homepage', 'repository']) assertString(metadata.metadata[field], `marketplace metadata.${field}`)
  assert(metadata.metadata.homepage === 'https://github.com/moooyo/5gpn-extensions', 'marketplace homepage is not canonical')
  assert(metadata.metadata.repository === 'https://github.com/moooyo/5gpn-extensions', 'marketplace repository is not canonical')
  assert(Array.isArray(metadata.entries) && metadata.entries.length <= 512, 'marketplace metadata.entries must be an array with at most 512 entries')

  const directories = new Set()
  for (const [index, entry] of metadata.entries.entries()) {
    assertKeys(entry, new Set(['directory', 'licenseSpdx', 'tags']), `marketplace metadata.entries[${index}]`)
    assert(directoryPattern.test(entry.directory), `marketplace metadata.entries[${index}].directory is invalid`)
    assert(!directories.has(entry.directory), `marketplace metadata has duplicate directory ${entry.directory}`)
    directories.add(entry.directory)
    assert(spdxPattern.test(entry.licenseSpdx), `${entry.directory}: invalid SPDX identifier`)
    assert(Array.isArray(entry.tags) && entry.tags.length > 0 && entry.tags.length <= 16, `${entry.directory}: tags must contain 1 to 16 entries`)
    assert(new Set(entry.tags).size === entry.tags.length, `${entry.directory}: tags must be unique`)
    for (const tag of entry.tags) assert(tagPattern.test(tag), `${entry.directory}: invalid tag ${tag}`)
  }
  return directories
}

function safeResourcePath(source, directory) {
  assert(source.startsWith('./'), `${directory}: script source must start with ./`)
  assert(!source.includes('\\') && !source.includes('?') && !source.includes('#'), `${directory}: script source must be a plain POSIX path`)
  const relative = path.posix.normalize(source.slice(2))
  assert(relative !== '' && relative !== '.' && relative !== '..' && !relative.startsWith('../') && !path.posix.isAbsolute(relative), `${directory}: script source escapes its extension directory`)
  return relative
}

function urlPath(...segments) {
  return segments.flatMap((segment) => segment.split('/')).map(encodeURIComponent).join('/')
}

async function extensionDirectories(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const directories = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !directoryPattern.test(entry.name)) continue
    try {
      const info = await stat(path.join(root, entry.name, 'extension.yaml'))
      if (info.isFile()) directories.push(entry.name)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return directories.sort()
}

async function buildResources(root, directory, actions) {
  const extensionRoot = await realpath(path.join(root, directory))
  const paths = [...new Set(actions.map((action) => safeResourcePath(action.script.source, directory)))].sort()
  const resources = []
  for (const relative of paths) {
    const filename = path.join(extensionRoot, ...relative.split('/'))
    const resolved = await realpath(filename)
    const escape = path.relative(extensionRoot, resolved)
    assert(escape !== '..' && !escape.startsWith(`..${path.sep}`) && !path.isAbsolute(escape), `${directory}: script source resolves outside its extension directory`)
    const info = await stat(resolved)
    assert(info.isFile(), `${directory}: script source ${relative} is not a regular file`)
    const body = await readFile(resolved)
    resources.push({
      path: relative,
      url: `${rawBase}/${urlPath(directory, relative)}`,
      sha256: sha256(body),
      size: body.length,
    })
  }
  return resources
}

export async function generateMarketplace({ root = repositoryRoot, revision }) {
  assert(revisionPattern.test(revision), 'revision must be a lowercase 40-character Git commit')
  const metadataBody = await readFile(path.join(root, 'marketplace', 'metadata.json'), 'utf8')
  const metadata = JSON.parse(metadataBody)
  const declaredDirectories = validateMetadata(metadata)
  const discoveredDirectories = await extensionDirectories(root)
  assert(discoveredDirectories.length === declaredDirectories.size, 'marketplace metadata and extension directory counts differ')
  for (const directory of discoveredDirectories) assert(declaredDirectories.has(directory), `${directory}: missing marketplace metadata`)
  for (const directory of declaredDirectories) assert(discoveredDirectories.includes(directory), `${directory}: marketplace metadata has no extension manifest`)

  const entries = []
  const ids = new Set()
  for (const definition of [...metadata.entries].sort((left, right) => compareText(left.directory, right.directory))) {
    const directory = definition.directory
    const manifestPath = path.join(root, directory, 'extension.yaml')
    const manifestBody = await readFile(manifestPath)
    const manifest = parseStrictManifest(manifestBody, directory)
    assert(!ids.has(manifest.metadata.id), `${directory}: duplicate extension id ${manifest.metadata.id}`)
    ids.add(manifest.metadata.id)
    const licensePath = path.join(root, 'LICENSES', `${definition.licenseSpdx}.txt`)
    const licenseInfo = await stat(licensePath)
    assert(licenseInfo.isFile(), `${directory}: license text ${definition.licenseSpdx}.txt is missing`)
    const documentationInfo = await stat(path.join(root, directory, 'README.md'))
    assert(documentationInfo.isFile(), `${directory}: README.md is missing`)
    const resources = await buildResources(root, directory, manifest.actions ?? [])
    entries.push({
      id: manifest.metadata.id,
      name: manifest.metadata.name.trim(),
      version: manifest.metadata.version,
      description: manifest.metadata.description.trim(),
      tags: [...definition.tags].sort(),
      license: {
        spdx: definition.licenseSpdx,
        url: `${rawBase}/LICENSES/${encodeURIComponent(definition.licenseSpdx)}.txt`,
      },
      documentationUrl: `${githubBase}/${urlPath(directory, 'README.md')}`,
      manifest: {
        url: `${rawBase}/${urlPath(directory, 'extension.yaml')}`,
        sha256: sha256(manifestBody),
        size: manifestBody.length,
      },
      resources,
      capabilities: {
        captureHostCount: manifest.traffic.captureHosts.length,
        actionCount: (manifest.actions ?? []).length,
        settingCount: (manifest.settings ?? []).length,
        networkOrigins: [...(manifest.permissions.network?.origins ?? [])].sort(),
        persistentStorage: manifest.permissions.persistentStorage,
        upstreamMappingCount: (manifest.traffic.upstreamMappings ?? []).length,
        routingRuleCount: (manifest.traffic.routingRules ?? []).length,
        egressGroupRequired: manifest.requirements?.egressGroup?.required ?? false,
      },
    })
  }
  entries.sort((left, right) => compareText(left.id, right.id))

  return `${JSON.stringify({
    apiVersion: '5gpn.io/marketplace/v1',
    kind: 'ExtensionMarketplace',
    metadata: {
      id: metadata.metadata.id,
      name: metadata.metadata.name,
      description: metadata.metadata.description,
      homepage: metadata.metadata.homepage,
      source: { repository: metadata.metadata.repository, revision },
    },
    entries,
  }, null, 2)}\n`
}

function parseArguments(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 2) {
    const option = argv[index]
    const value = argv[index + 1]
    assert(value !== undefined, `${option} requires a value`)
    assert(['--revision', '--output', '--check'].includes(option), `unknown option ${option}`)
    assert(options[option] === undefined, `duplicate option ${option}`)
    options[option] = value
  }
  assert(options['--revision'], '--revision is required')
  assert(Boolean(options['--output']) !== Boolean(options['--check']), 'exactly one of --output or --check is required')
  return options
}

export async function runCLI(argv) {
  const options = parseArguments(argv)
  const generated = await generateMarketplace({ revision: options['--revision'] })
  if (options['--output']) {
    const output = path.resolve(options['--output'])
    await mkdir(path.dirname(output), { recursive: true })
    await writeFile(output, generated, 'utf8')
    return
  }
  const existing = await readFile(path.resolve(options['--check']), 'utf8')
  assert(existing === generated, `${options['--check']} is not the deterministic marketplace output for ${options['--revision']}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  await runCLI(process.argv.slice(2))
}
