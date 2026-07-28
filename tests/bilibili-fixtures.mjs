import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse as parseYaml } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')

async function loadTransform(relativePath) {
  const filename = path.join(root, relativePath)
  const source = await readFile(filename, 'utf8')
  const sandbox = {
    ArrayBuffer, BigInt, DataView, JSON, Math, Number, Object, RegExp, Set, String, Symbol, Uint8Array,
    encodeURIComponent,
    console: { debug() {}, error() {}, info() {}, log() {}, warn() {} },
  }
  vm.createContext(sandbox)
  new vm.Script(source, { filename }).runInContext(sandbox)
  assert.equal(typeof sandbox.transform, 'function', `${relativePath} has no transform(context)`)
  return sandbox.transform
}

const manifest = parseYaml(await readFile(path.join(root, 'bilibili-cleaner', 'extension.yaml'), 'utf8'))

// The two synthetic-response scripts are the only JavaScript this extension
// still ships. A mock-response-body directive has no input document, so there
// is nothing for jq to transform and no upstream script to load.
const mockJson = await loadTransform('bilibili-cleaner/mock-json.js')
const mockGrpc = await loadTransform('bilibili-cleaner/mock-grpc.js')

{
  const cases = [
    ['https://api.live.bilibili.com/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info?room=1', '{}'],
    ['https://line3-h5-mobile-api.biligame.com/game/live/large_card_material?room=1', '{}'],
    ['https://app.bilibili.com/x/resource/top/activity?build=1', '{"code":-404,"message":"-404","ttl":1,"data":null}'],
    ['https://app.bilibili.com/x/resource/patch/tab/v2?build=1', '{"code":-404,"message":"-404","ttl":1,"data":null}'],
    ['https://app.bilibili.com/x/v2/splash/list?build=1', '{"code":0,"message":"OK","ttl":1,"data":{"max_time":0,"min_interval":31536000,"pull_interval":31536000,"keep_ids":[],"show":[],"list":[{}],"splash_request_id":""}}'],
    ['https://api.bilibili.com/pgc/activity/deliver/material/receive?build=1', '{"code":0,"data":{"closeType":"close_win","container":[],"showTime":""},"message":"success"}'],
  ]
  for (const [url, expected] of cases) {
    const result = mockJson({ request: { url } })
    assert.equal(result.response.status, 200)
    assert.equal(result.response.body, expected)
  }
}

{
  const expected = new Map([
    ['bilibili.app.interface.v1.Teenagers/ModeStatus', 'AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA'],
    ['bilibili.app.interface.v1.Search/DefaultWords', 'AAAAACEaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7KAE='],
    ['bilibili.app.view.v1.View/TFInfo', 'AAAAAAA='],
    ['bilibili.app.viewunite.v1.View/PlayPause', 'AAAAAAA='],
    ['bilibili.app.viewunite.v1.View/ViewEndPage', 'AAAAAAA='],
  ])
  for (const [pathname, encoded] of expected) {
    const result = mockGrpc({ request: { url: `https://grpc.biliapi.net/${pathname}` } })
    assert.equal(Buffer.from(result.response.body).toString('base64'), encoded)
    assert.equal(result.response.headers['Grpc-Status'], '0')
  }
}

assert.equal(manifest.metadata.version, '3.0.0')
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
const byKind = { mock: [], jq: [], compat: [] }
for (const action of manifest.actions) {
  if (typeof action.script.jq === 'string') byKind.jq.push(action.id)
  else if (action.script.entry === 'proxy-compat') byKind.compat.push(action.id)
  else byKind.mock.push(action.id)
}
assert.equal(manifest.actions.length, 21)
assert.equal(byKind.mock.length, 5)
assert.equal(byKind.jq.length, 11)
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

console.log('Bilibili fixtures passed')
