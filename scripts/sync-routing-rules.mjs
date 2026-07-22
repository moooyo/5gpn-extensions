import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { isIP } from 'node:net'
import path from 'node:path'
import { parseDocument } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const checkOnly = process.argv.length === 3 && process.argv[2] === '--check'
if (process.argv.length > (checkOnly ? 3 : 2)) throw new Error('usage: node scripts/sync-routing-rules.mjs [--check]')

const sources = {
  'ad-platform-blocker': {
    url: 'https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/BlockAdvertisers.lpx',
    sha256: '3974936ec21be3675db2496bdcbf05fa20af8f0be8c105e61bbada9b86e01c3e',
    version: '2.1.0',
  },
  'httpdns-interceptor': {
    url: 'https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx',
    sha256: '08429c4f1c677d79e87eb3cd41e880868f7a71381dc1d6c81b393734fd5df21a',
    version: '2.1.0',
    excludedIPAddressPathRules: 48,
    inertPathLines: 3,
  },
}

function blockAction(id, host, schemes, pathRegex, timeoutMs = 200) {
  return {
    id,
    phase: 'request',
    match: {
      hosts: [host],
      schemes,
      pathRegex,
    },
    script: {
      source: './block.js',
      bodyMode: 'none',
      timeoutMs,
      maxBodyBytes: 1024,
    },
  }
}

const httpdnsPathActions = [
  {
    sources: [
      ['Rule', String.raw`URL-REGEX, "^http:\/\/cdn\.wup\.huya\.com\/launch\/queryHttpDns", REJECT`],
    ],
    action: blockAction('block-huya-httpdns-launch', 'cdn.wup.huya.com', ['http'], '^/launch/queryHttpDns'),
  },
  {
    sources: [
      ['Rewrite', String.raw`^https?:\/\/cdn\.wup\.huya\.com\/monitor\/monitor\.jsp reject`],
    ],
    action: blockAction('block-huya-httpdns-monitor', 'cdn.wup.huya.com', ['http', 'https'], String.raw`^/monitor/monitor\.jsp`),
  },
  {
    sources: [
      ['Rule', String.raw`URL-REGEX, "^http:\/\/xmc\.ximalaya\.com\/xmlymain-login-web\/login\/", REJECT`],
    ],
    action: blockAction('block-ximalaya-httpdns-login', 'xmc.ximalaya.com', ['http'], '^/xmlymain-login-web/login/'),
  },
  {
    sources: [
      ['Rule', String.raw`URL-REGEX, "^http:\/\/api\.weibo\.cn\/2\/httpdns\/config", REJECT`],
      ['Rule', String.raw`URL-REGEX, "^http:\/\/api\.weibo\.cn\/httpdns\/config", REJECT`],
    ],
    action: blockAction('block-weibo-httpdns-config', 'api.weibo.cn', ['http'], '^/(?:2/)?httpdns/config'),
  },
  {
    sources: [
      ['Rewrite', String.raw`^https?:\/\/appconf\.mail\.163\.com\/mailmaster\/api\/http\/urlConfig\.do$ reject-dict`],
    ],
    action: blockAction('block-mail-httpdns-config', 'appconf.mail.163.com', ['http', 'https'], String.raw`^/mailmaster/api/http/urlConfig\.do$`),
  },
  {
    sources: [
      ['Rewrite', String.raw`^https:\/\/msglb\.91160\.com\/msg\/outer\/broker\/get$ reject-dict`],
    ],
    action: blockAction('block-91160-httpdns-broker', 'msglb.91160.com', ['https'], '^/msg/outer/broker/get$'),
  },
  {
    sources: [
      ['Rewrite', String.raw`^https:\/\/gslbali\.ximalaya\.com\/linkeye-cloud\/httpdns\/ reject`],
    ],
    action: blockAction('block-ximalaya-httpdns-linkeye', 'gslbali.ximalaya.com', ['https'], '^/linkeye-cloud/httpdns/'),
  },
]

const adPathActions = [
  {
    sources: [String.raw`^https:\/\/video-dsp\.pddpic\.com\/market-dsp-video\/ reject`],
    action: blockAction('block-pdd-video-dsp', 'video-dsp.pddpic.com', ['https'], '^/market-dsp-video/', 500),
  },
  {
    sources: [String.raw`^https:\/\/t-dsp\.pinduoduo\.com\/dspcb\/i\/mrk_ reject`],
    action: blockAction('block-pdd-dsp-callback', 't-dsp.pinduoduo.com', ['https'], '^/dspcb/i/mrk_', 500),
  },
  {
    sources: [
      String.raw`^https:\/\/images\.pinduoduo\.com\/mrk\/ reject`,
      String.raw`^https:\/\/images\.pinduoduo\.com\/marketing_api\/ reject`,
    ],
    action: blockAction('block-pdd-marketing-images', 'images.pinduoduo.com', ['https'], '^/(mrk/|marketing_api/)', 500),
  },
]

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
  const tncSuffixes = ['capcutapi.com', 'zijieapi.com', 'isnssdk.com', 'toutiaoapi.com', 'bytedance.com', 'snssdk.com', 'sgsnssdk.com']
  const tncSource = `AND,((DOMAIN-KEYWORD,tnc),(OR,(${tncSuffixes.map((suffix) => `(DOMAIN-SUFFIX,${suffix})`).join(',')}))),DIRECT`
  if (compact === tncSource) {
    return tncSuffixes.map((domainSuffix) => ({ action: 'direct', domainSuffix, allDomainKeywords: ['tnc'] }))
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

function coveredBySuffixes(host, suffixes) {
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

function reviewedAdPaths(text) {
  const expectedRewriteLines = adPathActions.flatMap((entry) => entry.sources)
  const actualRewriteLines = section(text, 'Rewrite')
  if (JSON.stringify(actualRewriteLines) !== JSON.stringify(expectedRewriteLines)) {
    throw new Error('ad-platform-blocker: reviewed rewrite sources changed')
  }

  const expectedHosts = adPathActions.map((entry) => entry.action.match.hosts[0])
  const mitmLines = section(text, 'MitM')
  if (mitmLines.length !== 1 || !mitmLines[0].startsWith('hostname=')) {
    throw new Error('ad-platform-blocker: unsupported [MitM] section')
  }
  const actualHosts = mitmLines[0].slice('hostname='.length).split(',').map((host) => host.trim())
  if (JSON.stringify(actualHosts) !== JSON.stringify(expectedHosts)) {
    throw new Error('ad-platform-blocker: [MitM] hosts do not match the reviewed path actions')
  }
  return adPathActions.map((entry) => entry.action)
}

function adCaptureHosts(rules, actions) {
  const suffixes = [...new Set(rules
    .filter((rule) => rule.domainSuffix !== undefined)
    .map((rule) => rule.domainSuffix))]
  const exactRoutingHosts = [...new Set(rules
    .filter((rule) => rule.domain !== undefined)
    .map((rule) => rule.domain))]
    .filter((host) => !coveredBySuffixes(host, suffixes))
  const actionHosts = actions.flatMap((action) => action.match.hosts)
  return [...new Set([
    ...suffixes.flatMap((suffix) => [suffix, `*.${suffix}`]),
    ...exactRoutingHosts,
    ...actionHosts,
  ])].sort()
}

function pathAuthority(pattern) {
  const separator = pattern.indexOf(String.raw`:\/\/`)
  if (separator < 0) throw new Error(`unsupported path pattern: ${pattern}`)
  const remainder = pattern.slice(separator + 5)
  const slash = remainder.search(/\\?\//)
  if (slash <= 0) throw new Error(`path pattern has no authority boundary: ${pattern}`)
  return remainder.slice(0, slash)
    .replaceAll(String.raw`\.`, '.')
    .replaceAll(String.raw`\[`, '[')
    .replaceAll(String.raw`\]`, ']')
}

function isIPAddressFormAuthority(authority) {
  let host = authority
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  const port = /^(\d+(?:\.\d+){3}):\d+$/.exec(host)
  if (port) host = port[1]
  return isIP(host) !== 0 || /^\d+(?:\.\d+){3}$/.test(host)
}

function sourcePathLine(sectionName, line) {
  if (sectionName === 'Rule') {
    const active = /^URL-REGEX,\s+"(.+)",\s+REJECT$/i.exec(line)
    if (active) return { active: true, authority: pathAuthority(active[1]) }
    if (line.startsWith('^http')) return { active: false, authority: pathAuthority(line) }
    return null
  }
  if (sectionName === 'Rewrite') {
    const active = /^(.+)\s+(reject|reject-dict)$/i.exec(line)
    if (active) return { active: true, authority: pathAuthority(active[1]) }
    if (line.startsWith('^http')) return { active: false, authority: pathAuthority(line) }
  }
  return null
}

function reviewedHTTPDNSPaths(text, source) {
  const expected = new Map()
  for (const entry of httpdnsPathActions) {
    for (const [sectionName, line] of entry.sources) {
      const key = `${sectionName}\n${line}`
      if (expected.has(key)) throw new Error(`httpdns-interceptor: duplicate reviewed path source: ${line}`)
      expected.set(key, entry.action.id)
    }
  }

  const seen = new Set()
  let excludedIPAddressPathRules = 0
  let inertPathLines = 0
  for (const sectionName of ['Rule', 'Rewrite']) {
    for (const line of section(text, sectionName)) {
      if (sectionName === 'Rule' && simpleRule(line)) continue
      const key = `${sectionName}\n${line}`
      if (expected.has(key)) {
        seen.add(key)
        continue
      }
      const parsed = sourcePathLine(sectionName, line)
      if (!parsed) throw new Error(`httpdns-interceptor: unsupported ${sectionName} path line: ${line}`)
      if (!parsed.active) {
        inertPathLines += 1
        continue
      }
      if (!isIPAddressFormAuthority(parsed.authority)) {
        throw new Error(`httpdns-interceptor: unreviewed hostname path rule: ${line}`)
      }
      excludedIPAddressPathRules += 1
    }
  }

  for (const key of expected.keys()) {
    if (!seen.has(key)) throw new Error(`httpdns-interceptor: reviewed path source disappeared: ${key.replace('\n', ': ')}`)
  }
  if (excludedIPAddressPathRules !== source.excludedIPAddressPathRules) {
    throw new Error(`httpdns-interceptor: expected ${source.excludedIPAddressPathRules} excluded IP-address-form path rules, got ${excludedIPAddressPathRules}`)
  }
  if (inertPathLines !== source.inertPathLines) {
    throw new Error(`httpdns-interceptor: expected ${source.inertPathLines} inert path lines, got ${inertPathLines}`)
  }
  return {
    actions: httpdnsPathActions.map((entry) => entry.action),
    excludedIPAddressPathRules,
    inertPathLines,
  }
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
  let detail = `${rules.length} reviewed routing rules`
  if (name === 'ad-platform-blocker') {
    const pathActions = reviewedAdPaths(new TextDecoder().decode(bytes))
    const actions = pathActions
    const captureHosts = adCaptureHosts(rules, actions)
    document.setIn(['traffic', 'captureHosts'], captureHosts)
    document.setIn(['actions'], actions)
    detail += `, ${captureHosts.length} capture hosts, and ${pathActions.length} path actions; host-wide blocking is owned by the typed routing rules`
  } else if (name === 'httpdns-interceptor') {
    const pathReview = reviewedHTTPDNSPaths(new TextDecoder().decode(bytes), source)
    const routeHosts = rules.flatMap((rule) => rule.domain === undefined ? [] : [rule.domain])
    const actionHosts = pathReview.actions.flatMap((action) => action.match.hosts)
    const captureHosts = [...new Set([...routeHosts, ...actionHosts])].sort()
    document.setIn(['traffic', 'captureHosts'], captureHosts)
    document.setIn(['actions'], pathReview.actions)
    detail += `, ${captureHosts.length} capture hosts, ${pathReview.actions.length} path actions, ${pathReview.excludedIPAddressPathRules} excluded IP-address-form path rules, and ${pathReview.inertPathLines} inert source lines`
  }
  const rendered = String(document)
  if (checkOnly) {
    const current = await readFile(manifestPath, 'utf8')
    if (current !== rendered) throw new Error(`${name}: manifest routing rules are not synchronized`)
    console.log(`${name}: verified ${detail}`)
  } else {
    await writeFile(manifestPath, rendered, 'utf8')
    console.log(`${name}: synchronized ${detail}`)
  }
}
