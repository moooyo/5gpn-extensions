import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseDocument } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const checkOnly = process.argv.length === 3 && process.argv[2] === '--check'
if (process.argv.length > (checkOnly ? 3 : 2)) throw new Error('usage: node scripts/sync-routing-rules.mjs [--check]')

const sources = {
  'ad-platform-blocker': {
    url: 'https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/BlockAdvertisers.lpx',
    sha256: '3974936ec21be3675db2496bdcbf05fa20af8f0be8c105e61bbada9b86e01c3e',
    version: '2.0.0',
  },
  'httpdns-interceptor': {
    url: 'https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx',
    sha256: '08429c4f1c677d79e87eb3cd41e880868f7a71381dc1d6c81b393734fd5df21a',
    version: '2.0.0',
  },
}

function section(text, name) {
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  const start = lines.indexOf(`[${name}]`)
  if (start < 0) throw new Error(`missing [${name}] section`)
  const out = []
  for (const line of lines.slice(start + 1)) {
    if (/^\[[^\]]+\]$/.test(line.trim())) break
    if (line.trim() && !line.trim().startsWith('#')) out.push(line.trim())
  }
  return out
}

function simpleRule(line) {
  const match = /^(DOMAIN|DOMAIN-SUFFIX|DOMAIN-KEYWORD|IP-CIDR6?),\s*([^,]+),\s*(REJECT|DIRECT)(?:,\s*no-resolve)?$/i.exec(line)
  if (!match) return null
  const [, kind, rawValue, rawAction] = match
  const rule = { action: rawAction.toLowerCase() }
  const value = rawValue.trim().toLowerCase()
  if (kind.toUpperCase() === 'DOMAIN') rule.domain = value
  else if (kind.toUpperCase() === 'DOMAIN-SUFFIX') rule.domainSuffix = value
  else if (kind.toUpperCase() === 'DOMAIN-KEYWORD') rule.allDomainKeywords = [value]
  else rule.ipCIDR = canonicalCIDR(value)
  return rule
}

function canonicalCIDR(value) {
  const slash = value.lastIndexOf('/')
  if (slash <= 0) throw new Error(`invalid CIDR: ${value}`)
  const address = value.slice(0, slash)
  const prefix = Number(value.slice(slash + 1))
  if (address.includes(':')) {
    if (!Number.isInteger(prefix) || prefix !== 128) throw new Error(`unsupported IPv6 CIDR: ${value}`)
    return `${address.toLowerCase()}/${prefix}`
  }
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255) ||
      !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`invalid IPv4 CIDR: ${value}`)
  }
  const numeric = (((octets[0] << 24) >>> 0) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const network = (numeric & mask) >>> 0
  return `${network >>> 24}.${(network >>> 16) & 255}.${(network >>> 8) & 255}.${network & 255}/${prefix}`
}

function adCompositeRules(line) {
  const compact = line.replaceAll(/\s+/g, '')
  if (compact.startsWith('AND,((DOMAIN-KEYWORD,tnc),(OR,')) {
    return ['capcutapi.com', 'zijieapi.com', 'isnssdk.com', 'toutiaoapi.com', 'bytedance.com', 'snssdk.com', 'sgsnssdk.com']
      .map((domainSuffix) => ({ action: 'direct', domainSuffix, allDomainKeywords: ['tnc'] }))
  }
  if (compact === 'AND,((OR,((DOMAIN-KEYWORD,api-access),(DOMAIN-KEYWORD,log-api))),(DOMAIN-KEYWORD,pangolin-sdk-toutiao)),REJECT') {
    return ['api-access', 'log-api'].map((keyword) => ({ action: 'reject', allDomainKeywords: [keyword, 'pangolin-sdk-toutiao'].sort() }))
  }
  const pairs = [
    ['AND,((DOMAIN-KEYWORD,-ad-),(DOMAIN-SUFFIX,byteimg.com)),REJECT', 'byteimg.com', ['-ad-']],
    ['AND,((DOMAIN-KEYWORD,ads),(DOMAIN-KEYWORD,normal),(DOMAIN-SUFFIX,zijieapi.com)),REJECT', 'zijieapi.com', ['ads', 'normal']],
    ['AND,((DOMAIN-KEYWORD,adash),(DOMAIN-SUFFIX,ut.taobao.com)),REJECT', 'ut.taobao.com', ['adash']],
  ]
  for (const [expected, domainSuffix, allDomainKeywords] of pairs) {
    if (compact === expected) return [{ action: 'reject', domainSuffix, allDomainKeywords: [...allDomainKeywords].sort() }]
  }
  throw new Error(`unsupported ad-platform composite rule: ${line}`)
}

function normalizedRules(name, text) {
  const rules = []
  for (const line of section(text, 'Rule')) {
    const simple = simpleRule(line)
    if (simple) {
      rules.push(simple)
      continue
    }
    if (name === 'ad-platform-blocker' && line.startsWith('AND,')) {
      rules.push(...adCompositeRules(line))
      continue
    }
    if (name === 'httpdns-interceptor' && (line.startsWith('URL-REGEX,') || line.startsWith('^http'))) continue
    throw new Error(`${name}: unsupported routing rule: ${line}`)
  }
  const seen = new Set()
  return rules.filter((rule) => {
    const key = JSON.stringify(rule)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

for (const [name, source] of Object.entries(sources)) {
  const response = await fetch(source.url)
  if (!response.ok) throw new Error(`${name}: fetch failed: ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== source.sha256) throw new Error(`${name}: source digest changed`)
  const rules = normalizedRules(name, new TextDecoder().decode(bytes))
  const manifestPath = path.join(root, name, 'extension.yaml')
  const document = parseDocument(await readFile(manifestPath, 'utf8'), { strict: true, uniqueKeys: true })
  if (document.errors.length) throw new Error(`${name}: ${document.errors.join('; ')}`)
  document.setIn(['metadata', 'version'], source.version)
  document.setIn(['traffic', 'routingRules'], rules)
  const rendered = String(document)
  if (checkOnly) {
    const current = await readFile(manifestPath, 'utf8')
    if (current !== rendered) throw new Error(`${name}: manifest routing rules are not synchronized`)
    console.log(`${name}: verified ${rules.length} reviewed routing rules`)
  } else {
    await writeFile(manifestPath, rendered, 'utf8')
    console.log(`${name}: synchronized ${rules.length} reviewed routing rules`)
  }
}
