import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')


const manifest = parseYaml(await readFile(path.join(root, 'bilibili-cleaner', 'extension.yaml'), 'utf8'))

// This extension ships no JavaScript. What was mock-json.js and mock-grpc.js
// is now declared in the manifest, one action per distinct body, the way
// upstream writes one [Map Local] line per body.
const mockBodies = new Map(manifest.actions
  .filter(action => action.script.mock !== undefined)
  .map(action => [action.id, action.script.mock]))
assert.equal(mockBodies.size, 8)
assert.equal(mockBodies.get('mock-live-shopping-json').body, '{}')
assert.equal(mockBodies.get('mock-app-promotions-json').body, '{"code":-404,"message":"-404","ttl":1,"data":null}')
assert.equal(
  Buffer.from(mockBodies.get('mock-grpc-teenagers').base64Body, 'base64').toString('base64'),
  'AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA',
)
for (const id of ['mock-grpc-teenagers', 'mock-grpc-default-words', 'mock-grpc-empty-frames']) {
  assert.equal(mockBodies.get(id).headers['Grpc-Status'], '0', `${id} must carry upstream's grpc-status header`)
}

assert.equal(manifest.metadata.version, '4.0.0')
assert.equal(manifest.permissions.persistentStorage, true)
assert.deepEqual(
  manifest.settings.map(setting => [setting.key, setting.type, setting.default]),
  [
    ['displayUpList', 'select', 'show'],
    ['purifyComment', 'boolean', true],
    ['optimizeRequest', 'boolean', true],
    ['sponsorBlock', 'boolean', true],
    ['logLevel', 'select', 'error'],
  ],
)

// Three kinds of action, and the counts are asserted so that a script cannot
// quietly reappear where an expression or a pinned bundle belongs.
const byKind = { mock: [], jq: [], compat: [], other: [] }
for (const action of manifest.actions) {
  if (typeof action.script.jq === 'string') byKind.jq.push(action.id)
  else if (action.script.entry === 'proxy-compat') byKind.compat.push(action.id)
  else if (action.script.mock !== undefined) byKind.mock.push(action.id)
  else byKind.other.push(action.id)
}
assert.equal(manifest.actions.length, 24)
assert.equal(byKind.mock.length, 8)
assert.equal(byKind.jq.length, 11)
assert.deepEqual(byKind.other, [], 'no action may fall outside the three declared kinds')
assert.deepEqual(byKind.compat, [
  'transform-airborne',
  'transform-optimized-request',
  'clean-live-json',
  'clean-webpage',
  'clean-protobuf-responses',
])

const PIN = 'https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/'
for (const id of byKind.compat) {
  const action = manifest.actions.find(candidate => candidate.id === id)
  assert(action.script.source.startsWith(PIN), `${id} must load the reviewed immutable commit`)
}
for (const id of byKind.jq) {
  const action = manifest.actions.find(candidate => candidate.id === id)
  assert.equal(action.script.bodyMode, 'text', `${id} must take a text body`)
  assert.equal(action.script.source, undefined, `${id} must not also name a script`)
}

// The airborne path is the one that reaches a third party, so its match is
// pinned rather than left to the regex being "obviously right".
const airborne = manifest.actions.find(action => action.id === 'transform-airborne')
assert(new RegExp(airborne.match.pathRegex).test('/bilibili.community.service.dm.v1.DM/DmSegMobile'))
assert(!new RegExp(airborne.match.pathRegex).test('/bilibili.app.viewunite.v1.View/View'))
const optimized = manifest.actions.find(action => action.id === 'transform-optimized-request')
for (const value of ['/bilibili.app.viewunite.v1.View/View', '/bilibili.main.community.reply.v1.Reply/MainList']) {
  assert(new RegExp(optimized.match.pathRegex).test(value), `optimized request action misses ${value}`)
}
assert(!new RegExp(optimized.match.pathRegex).test('/bilibili.app.viewunite.v1.View/ViewProgress'))

// Upstream gates these two entries with the plugin format's own enable=, which
// the core now expresses as an action-level enabledWhen. Before that existed
// both entries ran unconditionally: `optimizeRequest` is read by no pinned
// bundle at all, and the request bundle never reads `sponsorBlock` -- only the
// response bundle does, to gate Chronos -- so turning the airborne helper off
// still queried bsbsb.top and still injected its danmaku. The bindings are
// pinned here because the settings mean nothing without them.
for (const [id, key] of [['transform-airborne', 'sponsorBlock'], ['transform-optimized-request', 'optimizeRequest']]) {
  const action = manifest.actions.find(candidate => candidate.id === id)
  assert.deepEqual(action.enabledWhen, { key, equals: 'true' }, `${id} must be gated on ${key}`)
  const setting = manifest.settings.find(candidate => candidate.key === key)
  assert.equal(setting.type, 'boolean', `${key} must stay boolean for the gate to bind`)
  assert.equal(setting.required, true, `${key} must stay required so the gate always has a value`)
}
assert.equal(
  manifest.actions.filter(action => action.enabledWhen !== undefined).length,
  2,
  'only the two entries upstream gates may carry enabledWhen',
)

console.log('Bilibili fixtures passed')
