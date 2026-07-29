import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { isIP } from 'node:net'
import path from 'node:path'
import { parse } from 'yaml'
import { httpdnsPathActions, resolveBlockActions } from '../scripts/sync-routing-rules.mjs'

const root = path.resolve(import.meta.dirname, '..')
const manifest = parse(await readFile(path.join(root, 'httpdns-interceptor', 'extension.yaml'), 'utf8'))

// This manifest is generated. `npm run routing:check` re-renders it from the
// pinned upstream and compares byte for byte, but that needs the network and
// runs as a separate CI step, so a hand edit to the actions used to pass
// `npm test` on the machine that made it and fail later. Deciding what these
// actions should be needs no upstream bytes, so that half is asserted here.
assert.deepEqual(
  manifest.actions,
  resolveBlockActions(httpdnsPathActions),
  'httpdns-interceptor actions were edited by hand; change scripts/sync-routing-rules.mjs and re-run it instead',
)

assert.equal(manifest.metadata.id, 'io.5gpn.httpdns-interceptor')
assert.equal(manifest.metadata.version, '2.3.0')
assert.deepEqual(manifest.permissions, { persistentStorage: false })
assert.equal(manifest.settings, undefined)
assert.equal(manifest.requirements, undefined)
assert.equal(manifest.traffic.upstreamMappings, undefined)

const routeDomains = manifest.traffic.routingRules.flatMap((rule) => rule.domain === undefined ? [] : [rule.domain])
const routeCIDRs = manifest.traffic.routingRules.flatMap((rule) => rule.ipCIDR === undefined ? [] : [rule.ipCIDR])
assert.equal(manifest.traffic.routingRules.length, 117)
assert.equal(routeDomains.length, 58)
assert.equal(routeCIDRs.length, 59)
assert.equal(new Set(routeDomains).size, routeDomains.length)
assert(manifest.traffic.routingRules.every((rule) => rule.action === 'reject'))

// Declarative rejection: these seven actions used to share a 57-byte script
// whose whole body was `return { abort: true }`.
//
// The two spellings are not interchangeable. Loon's `reject` closes the
// connection; its `reject-dict` answers 200 with the empty JSON object. The
// five upstream `reject` directives therefore carry `reject: true`, and the two
// `reject-dict` directives carry the mock that reproduces their reply. Both
// forms were previously the abort, which is why this fixture pins which action
// gets which.
const script = {
  reject: true,
  bodyMode: 'none',
  timeoutMs: 200,
  maxBodyBytes: 1024,
}
const dictScript = {
  mock: {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  },
  bodyMode: 'none',
  timeoutMs: 200,
  maxBodyBytes: 1024,
}
const expectedActions = [
  {
    id: 'block-huya-httpdns-launch',
    phase: 'request',
    match: { hosts: ['cdn.wup.huya.com'], schemes: ['http'], pathRegex: '^/launch/queryHttpDns' },
    script,
  },
  {
    id: 'block-huya-httpdns-monitor',
    phase: 'request',
    match: { hosts: ['cdn.wup.huya.com'], schemes: ['http', 'https'], pathRegex: String.raw`^/monitor/monitor\.jsp` },
    script,
  },
  {
    id: 'block-ximalaya-httpdns-login',
    phase: 'request',
    match: { hosts: ['xmc.ximalaya.com'], schemes: ['http'], pathRegex: '^/xmlymain-login-web/login/' },
    script,
  },
  {
    id: 'block-weibo-httpdns-config',
    phase: 'request',
    match: { hosts: ['api.weibo.cn'], schemes: ['http'], pathRegex: '^/(?:2/)?httpdns/config' },
    script,
  },
  {
    id: 'block-mail-httpdns-config',
    phase: 'request',
    match: { hosts: ['appconf.mail.163.com'], schemes: ['http', 'https'], pathRegex: String.raw`^/mailmaster/api/http/urlConfig\.do$` },
    script: dictScript,
  },
  {
    id: 'block-91160-httpdns-broker',
    phase: 'request',
    match: { hosts: ['msglb.91160.com'], schemes: ['https'], pathRegex: '^/msg/outer/broker/get$' },
    script: dictScript,
  },
  {
    id: 'block-ximalaya-httpdns-linkeye',
    phase: 'request',
    match: { hosts: ['gslbali.ximalaya.com'], schemes: ['https'], pathRegex: '^/linkeye-cloud/httpdns/' },
    script,
  },
]
assert.deepEqual(manifest.actions, expectedActions)

const actionHosts = manifest.actions.flatMap((action) => action.match.hosts)
const expectedCaptureHosts = [...new Set([...routeDomains, ...actionHosts])].sort()
assert.deepEqual(manifest.traffic.captureHosts, expectedCaptureHosts)
assert.equal(manifest.traffic.captureHosts.length, 64)
assert(manifest.traffic.captureHosts.every((host) => isIP(host) === 0))

const pathCases = new Map([
  ['block-huya-httpdns-launch', { matches: ['/launch/queryHttpDns', '/launch/queryHttpDnsExtra'], misses: ['/Launch/queryHttpDns'] }],
  ['block-huya-httpdns-monitor', { matches: ['/monitor/monitor.jsp', '/monitor/monitor.jsp?x=1'], misses: ['/monitor/monitorXjsp'] }],
  ['block-ximalaya-httpdns-login', { matches: ['/xmlymain-login-web/login/user'], misses: ['/xmlymain-login-web/login'] }],
  ['block-weibo-httpdns-config', { matches: ['/httpdns/config', '/2/httpdns/config?x=1', '/httpdns/config-extra'], misses: ['/3/httpdns/config'] }],
  ['block-mail-httpdns-config', { matches: ['/mailmaster/api/http/urlConfig.do'], misses: ['/mailmaster/api/http/urlConfig.do?x=1'] }],
  ['block-91160-httpdns-broker', { matches: ['/msg/outer/broker/get'], misses: ['/msg/outer/broker/get?x=1'] }],
  ['block-ximalaya-httpdns-linkeye', { matches: ['/linkeye-cloud/httpdns/query'], misses: ['/linkeye-cloud/httpdns'] }],
])
for (const action of manifest.actions) {
  const expression = new RegExp(action.match.pathRegex)
  const cases = pathCases.get(action.id)
  assert(cases, `${action.id}: path fixture is missing`)
  for (const value of cases.matches) assert(expression.test(value), `${action.id}: expected ${value} to match`)
  for (const value of cases.misses) assert(!expression.test(value), `${action.id}: expected ${value} not to match`)
}

console.log('HTTPDNS fixtures passed')
