import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { adPathActions, resolveBlockActions } from '../scripts/sync-routing-rules.mjs'

const root = path.resolve(import.meta.dirname, '..')
const manifest = parse(await readFile(path.join(root, 'ad-platform-blocker', 'extension.yaml'), 'utf8'))
const readme = await readFile(path.join(root, 'ad-platform-blocker', 'README.md'), 'utf8')

const captureHosts = manifest.traffic.captureHosts
const routingRules = manifest.traffic.routingRules
const pathActions = manifest.actions

// This manifest is generated; see the note in tests/httpdns-fixtures.mjs. The
// offline half of `npm run routing:check` is asserted here so a hand-edited
// action fails in `npm test` rather than in the later CI step.
assert.deepEqual(
  pathActions,
  resolveBlockActions(adPathActions),
  'ad-platform-blocker actions were edited by hand; change scripts/sync-routing-rules.mjs and re-run it instead',
)

function coveredBySuffixes(host, suffixes) {
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

assert.equal(manifest.metadata.version, '2.2.0')
assert.equal(routingRules.length, 201)
assert.equal(captureHosts.length, 277)
assert.equal(pathActions.length, 3)
assert.deepEqual(captureHosts, [...captureHosts].sort())
assert.equal(new Set(captureHosts).size, captureHosts.length)

const suffixes = [...new Set(routingRules
  .filter((rule) => rule.domainSuffix !== undefined)
  .map((rule) => rule.domainSuffix))]
assert.equal(suffixes.length, 101)
for (const suffix of suffixes) {
  assert(captureHosts.includes(suffix), `missing capture apex for ${suffix}`)
  assert(captureHosts.includes(`*.${suffix}`), `missing capture wildcard for ${suffix}`)
}

const exactRoutingHosts = [...new Set(routingRules
  .filter((rule) => rule.domain !== undefined)
  .map((rule) => rule.domain))]
  .filter((host) => !coveredBySuffixes(host, suffixes))
const expectedCaptureHosts = [...new Set([
  ...suffixes.flatMap((suffix) => [suffix, `*.${suffix}`]),
  ...exactRoutingHosts,
  ...manifest.actions.flatMap((action) => action.match.hosts),
])].sort()
assert.deepEqual(captureHosts, expectedCaptureHosts)

for (const rule of routingRules.filter((candidate) => candidate.domain !== undefined)) {
  assert(
    captureHosts.includes(rule.domain) || captureHosts.some((host) => host.startsWith('*.') && rule.domain.endsWith(host.slice(1))),
    `exact routing domain is not acquired: ${rule.domain}`,
  )
}

assert.deepEqual(pathActions.map((action) => ({
  id: action.id,
  hosts: action.match.hosts,
  schemes: action.match.schemes,
  pathRegex: action.match.pathRegex,
})), [
  {
    id: 'block-pdd-video-dsp',
    hosts: ['video-dsp.pddpic.com'],
    schemes: ['https'],
    pathRegex: '^/market-dsp-video/',
  },
  {
    id: 'block-pdd-dsp-callback',
    hosts: ['t-dsp.pinduoduo.com'],
    schemes: ['https'],
    pathRegex: '^/dspcb/i/mrk_',
  },
  {
    id: 'block-pdd-marketing-images',
    hosts: ['images.pinduoduo.com'],
    schemes: ['https'],
    pathRegex: '^/(mrk/|marketing_api/)',
  },
])
for (const action of pathActions) assert(captureHosts.includes(action.match.hosts[0]))

const keywordOnlyRules = routingRules.filter((rule) =>
  rule.domain === undefined && rule.domainSuffix === undefined && rule.ipCIDR === undefined)
assert.equal(keywordOnlyRules.length, 10)
assert.deepEqual(routingRules.filter((rule) => rule.ipCIDR !== undefined), [
  { action: 'reject', ipCIDR: '47.110.187.87/32' },
])

// The three path actions block declaratively. They used to share a 57-byte
// script whose whole body was `return { abort: true }`.
for (const action of pathActions) {
  assert.equal(action.script.reject, true, `${action.id} must reject declaratively`)
  assert.equal(action.script.source, undefined, `${action.id} must ship no script`)
}

assert(readme.includes('277 hosts in `traffic.captureHosts`'))
assert(readme.includes('Host-wide blocking is owned exclusively by the typed routing rules'))
assert(readme.includes('47.110.187.87/32'))
assert(readme.includes('does not acquire hard-coded IP traffic'))

console.log('Ad platform fixtures passed')
