import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const manifest = parse(await readFile(path.join(root, 'ad-platform-blocker', 'extension.yaml'), 'utf8'))
const readme = await readFile(path.join(root, 'ad-platform-blocker', 'README.md'), 'utf8')
const script = await readFile(path.join(root, 'ad-platform-blocker', 'block.js'), 'utf8')

const captureHosts = manifest.traffic.captureHosts
const routingRules = manifest.traffic.routingRules
const pathActions = manifest.actions

function coveredBySuffixes(host, suffixes) {
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

assert.equal(manifest.metadata.version, '2.1.0')
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

const sandbox = {}
vm.createContext(sandbox)
new vm.Script(script, { filename: 'ad-platform-blocker/block.js' }).runInContext(sandbox)
assert.equal(typeof sandbox.transform, 'function')
assert.deepEqual({ ...sandbox.transform({}) }, { abort: true })

assert(readme.includes('277 hosts in `traffic.captureHosts`'))
assert(readme.includes('Host-wide blocking is owned exclusively by the typed routing rules'))
assert(readme.includes('47.110.187.87/32'))
assert(readme.includes('does not acquire hard-coded IP traffic'))

console.log('Ad platform fixtures passed')
