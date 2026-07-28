import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const encoder = new TextEncoder()

async function loadTransform(relativePath) {
  const filename = path.join(root, relativePath)
  const source = await readFile(filename, 'utf8')
  const messages = []
  const sandbox = {
    ArrayBuffer,
    BigInt,
    DataView,
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    String,
    Symbol,
    Uint8Array,
    console: {
      debug: (...args) => messages.push(['debug', ...args]),
      error: (...args) => messages.push(['error', ...args]),
      info: (...args) => messages.push(['info', ...args]),
      log: (...args) => messages.push(['log', ...args]),
      warn: (...args) => messages.push(['warn', ...args]),
    },
  }
  vm.createContext(sandbox)
  new vm.Script(source, { filename }).runInContext(sandbox)
  assert.equal(typeof sandbox.transform, 'function', `${relativePath} has no transform(context)`)
  assert.equal(sandbox.onRequest, undefined, `${relativePath} exposes a compatibility request hook`)
  assert.equal(sandbox.onResponse, undefined, `${relativePath} exposes a compatibility response hook`)
  return {
    transform: sandbox.transform,
    messages,
    resetMessages: () => messages.splice(0, messages.length),
  }
}

function concat(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0)
  const output = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

function encodeVarint(input) {
  let value = BigInt.asUintN(64, BigInt(input))
  const output = []
  while (value >= 0x80n) {
    output.push(Number(value & 0x7fn) | 0x80)
    value >>= 7n
  }
  output.push(Number(value))
  return new Uint8Array(output)
}

function decodeVarint(bytes, offset = 0) {
  let value = 0n
  for (let index = 0; index < 10; index += 1) {
    assert(offset + index < bytes.length, 'truncated fixture varint')
    const byte = bytes[offset + index]
    value |= BigInt(byte & 0x7f) << BigInt(index * 7)
    if (byte < 0x80) return { value, length: index + 1 }
  }
  assert.fail('oversized fixture varint')
}

function varintField(number, value) {
  return concat([encodeVarint(BigInt(number) << 3n), encodeVarint(value)])
}

function lengthField(number, value) {
  const bytes = new Uint8Array(value)
  return concat([
    encodeVarint((BigInt(number) << 3n) | 2n),
    encodeVarint(bytes.length),
    bytes,
  ])
}

function fixed64Field(number, value) {
  assert.equal(value.length, 8)
  return concat([encodeVarint((BigInt(number) << 3n) | 1n), new Uint8Array(value)])
}

function fixed32Field(number, value) {
  assert.equal(value.length, 4)
  return concat([encodeVarint((BigInt(number) << 3n) | 5n), new Uint8Array(value)])
}

function parseFields(bytes) {
  const fields = []
  let offset = 0
  while (offset < bytes.length) {
    const start = offset
    const key = decodeVarint(bytes, offset)
    offset += key.length
    const number = Number(key.value >> 3n)
    const wireType = Number(key.value & 7n)
    let value
    let decoded
    if (wireType === 0) {
      decoded = decodeVarint(bytes, offset)
      value = bytes.slice(offset, offset + decoded.length)
      offset += decoded.length
    } else if (wireType === 1) {
      value = bytes.slice(offset, offset + 8)
      offset += 8
    } else if (wireType === 2) {
      const length = decodeVarint(bytes, offset)
      offset += length.length
      value = bytes.slice(offset, offset + Number(length.value))
      offset += Number(length.value)
    } else if (wireType === 5) {
      value = bytes.slice(offset, offset + 4)
      offset += 4
    } else {
      assert.fail(`unsupported fixture wire type ${wireType}`)
    }
    assert(offset <= bytes.length, 'fixture field exceeds its message')
    fields.push({
      number,
      wireType,
      value,
      decoded: decoded?.value,
      raw: bytes.slice(start, offset),
    })
  }
  return fields
}

function locationMessage({ latitude = 1, longitude = 2, accuracy = 99, includeAccuracy = true } = {}) {
  const parts = [
    varintField(1, latitude),
    varintField(2, longitude),
  ]
  if (includeAccuracy) parts.push(varintField(3, accuracy))
  parts.push(lengthField(4, new Uint8Array([0xaa, 0xbb])))
  return concat(parts)
}

function wifiMessage(mac, locations) {
  return concat([
    lengthField(1, encoder.encode(mac)),
    ...locations.map((location) => lengthField(2, location)),
  ])
}

function cellMessage(locations) {
  return concat(locations.map((location) => lengthField(5, location)))
}

function framed(payload, suffix = new Uint8Array()) {
  assert(payload.length <= 65535)
  return concat([
    new Uint8Array([0x57, 0x4c, 0x4f, 0x43, 1, 2, 3, 4]),
    new Uint8Array([payload.length >> 8, payload.length & 0xff]),
    payload,
    suffix,
  ])
}

function framedPayload(body) {
  const length = body[8] * 256 + body[9]
  return body.slice(10, 10 + length)
}

function field(fields, number, wireType) {
  const found = fields.find((candidate) => candidate.number === number && candidate.wireType === wireType)
  assert(found, `missing field ${number}/${wireType}`)
  return found
}

function locationValues(bytes) {
  const fields = parseFields(bytes)
  return {
    latitude: BigInt.asIntN(64, field(fields, 1, 0).decoded),
    longitude: BigInt.asIntN(64, field(fields, 2, 0).decoded),
    accuracy: fields.find((candidate) => candidate.number === 3 && candidate.wireType === 0)?.decoded,
    unknown: field(fields, 4, 2).raw,
  }
}

async function readManifest(relativePath) {
  return parse(await readFile(path.join(root, relativePath), 'utf8'))
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

const appleManifest = await readManifest('apple-wloc/extension.yaml')
assert.equal(appleManifest.metadata.id, 'io.5gpn.apple-wloc')
assert.equal(appleManifest.metadata.version, '2.0.0')
// The picker page saves a coordinate into extension-scoped storage, which is
// why this revision declares storage where the previous one declared none.
assert.deepEqual(appleManifest.permissions, { persistentStorage: true })
assert.equal(appleManifest.requirements, undefined)
assert.deepEqual(appleManifest.traffic, {
  captureHosts: ['gs-loc.apple.com', 'gs-loc-cn.apple.com'],
})
// The four settings are upstream's [Argument] block verbatim, including its
// types and defaults, so they reach the scripts as the object Loon supplies.
assert.deepEqual(appleManifest.settings.map(({ key, type, default: value }) => ({ key, type, value })), [
  { key: 'longitude', type: 'text', value: '113.94114' },
  { key: 'latitude', type: 'text', value: '22.544577' },
  { key: 'accuracy', type: 'text', value: '25' },
  { key: 'logLevel', type: 'select', value: 'info' },
])

assert.equal(appleManifest.actions.length, 2)
const [wlocAction, settingsAction] = appleManifest.actions
assert.equal(wlocAction.phase, 'response')
assert.equal(settingsAction.phase, 'request')
for (const action of appleManifest.actions) {
  assert.deepEqual(action.match.hosts, appleManifest.traffic.captureHosts)
  assert.deepEqual(action.match.schemes, ['https'])
  assert.equal(action.script.entry, 'proxy-compat')
  assert(action.script.source.startsWith('https://raw.githubusercontent.com/Yu9191/wloc/eec07a8dc8de6dbaee8eac1fb376e4d03020154a/dist/'), `${action.id} must load the reviewed immutable commit`)
}
assert(new RegExp(wlocAction.match.pathRegex).test('/clls/wloc'))
assert(new RegExp(wlocAction.match.pathRegex).test('/clls/wloc?source=test'))
assert(!new RegExp(wlocAction.match.pathRegex).test('/clls/wloc/extra'))
assert(new RegExp(settingsAction.match.pathRegex).test('/wloc-settings/save?longitude=1'))
assert(!new RegExp(settingsAction.match.pathRegex).test('/wloc-settings/load'))
// The response action previously pinned statusCodes: [200]. Upstream matches
// every response on the path, and narrowing it here would silently skip a
// non-200 body the scripts still handle.
assert.equal(wlocAction.match.statusCodes, undefined)

const testflight = await loadTransform('testflight-region-unlock/rewrite-storefront.js')
const upstreamBody = '{"storefrontId" : "143444-19,29","other":true}'
const upstreamUS = testflight.transform({ settings: { storefront: 'US' }, request: { body: upstreamBody } })
assert.equal(upstreamUS.request.body, '{"storefrontId":"143441-19,29","other":true}')
assert.match(testflight.messages.at(-1)[1], /with upstream syntax/)

const storefronts = {
  US: '143441-19,29',
  GB: '143444-19,29',
  CA: '143455-19,29',
  AU: '143460-19,29',
  JP: '143462-19,29',
  HK: '143463-19,29',
  SG: '143464-19,29',
  CN: '143465-19,29',
  KR: '143466-19,29',
  TW: '143470-19,29',
}
for (const [region, storefrontID] of Object.entries(storefronts)) {
  const result = testflight.transform({
    settings: { storefront: region },
    request: { body: '{"storefrontId":"999999-99,99"}' },
  })
  assert.equal(result.request.body, `{"storefrontId":"${storefrontID}"}`)
}

const flexibleBody = '{"storefrontId"  :\t"143441-19,29"}'
assert.equal(testflight.transform({
  settings: { storefront: 'HK' },
  request: { body: flexibleBody },
}).request.body, '{"storefrontId"  :\t"143463-19,29"}')

const duplicateBody = '{"storefrontId":"143441-19,29","storefrontId":"143444-19,29"}'
assert.equal(testflight.transform({
  settings: { storefront: 'HK' },
  request: { body: duplicateBody },
}).request.body, '{"storefrontId":"143463-19,29","storefrontId":"143444-19,29"}')

testflight.resetMessages()
assert.equal(testflight.transform({
  settings: { storefront: 'US' },
  request: { body: '{"storefrontId":"143441-19,29"}' },
}), null)
assert.deepEqual(testflight.messages.at(-1), ['info', 'TestFlight storefront is already set to US'])
testflight.resetMessages()
assert.equal(testflight.transform({ settings: { storefront: 'US' }, request: { body: '{}' } }), null)
assert.deepEqual(testflight.messages.at(-1), ['warn', 'TestFlight install request has no recognized storefrontId'])
assert.throws(() => testflight.transform({
  settings: { storefront: 'ZZ' },
  request: { body: upstreamBody },
}), /unsupported TestFlight storefront setting/)
assert.throws(() => testflight.transform({
  settings: { storefront: '__proto__' },
  request: { body: upstreamBody },
}), /unsupported TestFlight storefront setting/)
assert.throws(() => testflight.transform({
  settings: { storefront: 'US' },
  request: { body: new Uint8Array() },
}), /body is not text/)

const appleReadme = await readFile(path.join(root, 'apple-wloc/README.md'), 'utf8')
const testflightReadme = await readFile(path.join(root, 'testflight-region-unlock/README.md'), 'utf8')
assert.match(appleReadme, /License: \[`MIT`\]/)
assert.match(appleReadme, /eec07a8dc8de6dbaee8eac1fb376e4d03020154a/)
assert.match(appleReadme, /d385c624efd59bdd2cff56bf819a770b40c4abf0f970818877f1dca4174f256a/)
assert.match(appleReadme, /b4e9d69e69c703b3fab485a559825aaedc9e3a1fd9c06e81cb35d10bbdcd13d2/)
assert.match(appleReadme, /1fb451616fb17242849f72490f016afcdb8aa81a0b086f6dd5f94e1af3d58ee1/)
// The upstream repository has no LICENSE file. The README has to say so, and
// the three accepted costs have to remain visible rather than being quietly
// dropped in a later edit.
assert.match(appleReadme, /upstream publishes no license file/i)
assert.match(appleReadme, /failClosed/)
assert.match(testflightReadme, /License: \[`CC-BY-NC-SA-4\.0`\]/)
assert.match(testflightReadme, /ab6c3182fb2b09bcc34456f496282ec0b8e9217b/)
assert.match(testflightReadme, /c8112507802d0690d8b94d4110945e9c782df40e/)
assert.match(testflightReadme, /a49e5a186a95eef966d9b127eec663eef3fd196beaaeadd32b9302f5e3540c1e/)
assert.match(testflightReadme, /047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98/)
for (const [readme, manifestPath, scriptPath] of [
  [appleReadme, 'apple-wloc/extension.yaml'],
  [testflightReadme, 'testflight-region-unlock/extension.yaml', 'testflight-region-unlock/rewrite-storefront.js'],
]) {
  assert(readme.includes(sha256(await readFile(path.join(root, manifestPath)))))
  if (scriptPath !== undefined) {
    assert(readme.includes(sha256(await readFile(path.join(root, scriptPath)))))
  }
  assert(readme.includes('node tests/apple-testflight-fixtures.mjs'))
}

console.log('Apple WLOC and TestFlight fixtures passed')
