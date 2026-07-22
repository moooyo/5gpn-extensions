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
assert.equal(appleManifest.metadata.version, '1.1.1')
assert.deepEqual(appleManifest.permissions, { persistentStorage: false })
assert.equal(appleManifest.requirements, undefined)
assert.deepEqual(appleManifest.traffic, {
  captureHosts: ['gs-loc.apple.com', 'gs-loc-cn.apple.com'],
})
assert.deepEqual(appleManifest.settings.map(({ key, type, required }) => ({ key, type, required })), [
  { key: 'location', type: 'location', required: true },
  { key: 'failClosed', type: 'boolean', required: true },
])
assert.deepEqual(appleManifest.settings[0].default, { accuracy: 25 })
assert.equal(appleManifest.settings[1].default, true)
assert.equal(appleManifest.actions.length, 1)
const appleAction = appleManifest.actions[0]
assert.equal(appleAction.phase, 'response')
assert.deepEqual(appleAction.match.hosts, appleManifest.traffic.captureHosts)
assert.deepEqual(appleAction.match.schemes, ['https'])
assert.deepEqual(appleAction.match.statusCodes, [200])
assert(new RegExp(appleAction.match.pathRegex).test('/clls/wloc'))
assert(new RegExp(appleAction.match.pathRegex).test('/clls/wloc?source=test'))
assert(!new RegExp(appleAction.match.pathRegex).test('/clls/wloc/extra'))
assert.deepEqual(appleAction.script, {
  source: './wloc.js',
  bodyMode: 'binary',
  timeoutMs: 1500,
  maxBodyBytes: 8388608,
})

const apple = await loadTransform('apple-wloc/wloc.js')
const originalLocation = locationMessage()
const variableMACWiFi = wifiMessage('A:b:0C:d:0e:F', [originalLocation])
const firstCell = cellMessage([originalLocation])
const secondCell = cellMessage([originalLocation])
const rootUnknown = concat([
  fixed64Field(70, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])),
  fixed32Field(71, new Uint8Array([9, 10, 11, 12])),
])
const completePayload = concat([
  rootUnknown,
  lengthField(2, variableMACWiFi),
  lengthField(22, firstCell),
  lengthField(24, secondCell),
])
const suffix = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
const completeFrame = framed(completePayload, suffix)
const target = { longitude: -0.1276, latitude: 51.5072, accuracy: 100000 }
const completeResult = apple.transform({
  settings: { location: target, failClosed: true },
  response: { body: completeFrame },
})
assert(completeResult.response.body instanceof Uint8Array)
assert.deepEqual([...completeResult.response.body.slice(0, 8)], [...completeFrame.slice(0, 8)])
assert.deepEqual([...completeResult.response.body.slice(-suffix.length)], [...suffix])
const completeRoot = parseFields(framedPayload(completeResult.response.body))
assert.deepEqual(
  completeRoot.filter((candidate) => candidate.number === 70 || candidate.number === 71).map((candidate) => [...candidate.raw]),
  parseFields(rootUnknown).map((candidate) => [...candidate.raw]),
)
const patchedLocations = [
  field(parseFields(field(completeRoot, 2, 2).value), 2, 2).value,
  field(parseFields(field(completeRoot, 22, 2).value), 5, 2).value,
  field(parseFields(field(completeRoot, 24, 2).value), 5, 2).value,
]
for (const patchedLocation of patchedLocations) {
  const values = locationValues(patchedLocation)
  assert.equal(values.latitude, 5150720000n)
  assert.equal(values.longitude, -12760000n)
  assert.equal(values.accuracy, 10000n)
  assert.deepEqual([...values.unknown], [...field(parseFields(originalLocation), 4, 2).raw])
}
assert.match(apple.messages.at(-1)[1], /locations=3 wifi=1 cell=2 skipped=0/)

const duplicateMACLastInvalid = concat([
  lengthField(1, encoder.encode('aa:bb:cc:dd:ee:ff')),
  lengthField(1, encoder.encode('not-a-mac')),
  lengthField(2, originalLocation),
])
assert.equal(apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: false },
  response: { body: framed(lengthField(2, duplicateMACLastInvalid)) },
}), null, 'the last singular Wi-Fi identifier must determine upstream MAC recognition')

const duplicateMACLastValid = concat([
  lengthField(1, encoder.encode('not-a-mac')),
  lengthField(1, encoder.encode('a:b:0c:d:0e:f')),
  lengthField(2, originalLocation),
])
const duplicateMACLastValidResult = apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: true },
  response: { body: framed(lengthField(2, duplicateMACLastValid)) },
})
const duplicateMACRoot = parseFields(framedPayload(duplicateMACLastValidResult.response.body))
const duplicateMACWiFi = parseFields(field(duplicateMACRoot, 2, 2).value)
assert.equal(locationValues(field(duplicateMACWiFi, 2, 2).value).latitude, 300000000n)

apple.resetMessages()
const noAccuracy = locationMessage({ includeAccuracy: false })
const noAccuracyResult = apple.transform({
  settings: { location: { longitude: 10, latitude: 20 }, failClosed: true },
  response: { body: framed(lengthField(2, wifiMessage('aa:bb:cc:dd:ee:ff', [noAccuracy]))) },
})
const noAccuracyRoot = parseFields(framedPayload(noAccuracyResult.response.body))
const noAccuracyWiFi = parseFields(field(noAccuracyRoot, 2, 2).value)
assert.equal(locationValues(field(noAccuracyWiFi, 2, 2).value).accuracy, undefined)

apple.resetMessages()
const malformedLocation = new Uint8Array([0x0f])
const partiallyMalformedPayload = concat([
  lengthField(2, wifiMessage('aa:bb:cc:dd:ee:ff', [originalLocation, malformedLocation])),
  lengthField(22, cellMessage([originalLocation, malformedLocation])),
])
const partiallyMalformedResult = apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: true },
  response: { body: framed(partiallyMalformedPayload) },
})
const partiallyMalformedRoot = parseFields(framedPayload(partiallyMalformedResult.response.body))
const partiallyMalformedWiFi = parseFields(field(partiallyMalformedRoot, 2, 2).value)
const partiallyMalformedCell = parseFields(field(partiallyMalformedRoot, 22, 2).value)
assert.deepEqual([...partiallyMalformedWiFi.filter((candidate) => candidate.number === 2)[1].value], [0x0f])
assert.deepEqual([...partiallyMalformedCell.filter((candidate) => candidate.number === 5)[1].value], [0x0f])
assert.equal(locationValues(partiallyMalformedWiFi.filter((candidate) => candidate.number === 2)[0].value).latitude, 300000000n)
assert.equal(locationValues(partiallyMalformedCell.filter((candidate) => candidate.number === 5)[0].value).latitude, 300000000n)
assert.match(apple.messages.at(-1)[1], /locations=2 wifi=1 cell=1 skipped=2/)

const unpatchable = framed(varintField(90, 1))
assert.throws(() => apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: true },
  response: { body: unpatchable },
}), /no patchable location/)
apple.resetMessages()
assert.equal(apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: false },
  response: { body: unpatchable },
}), null)
assert.match(apple.messages.at(-1)[1], /skipped WLOC response/)

const prefixedFrame = concat([new Uint8Array([1, 2, 3]), completeFrame])
assert.equal(apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: false },
  response: { body: prefixedFrame },
}), null, 'non-upstream frame offsets must not be scanned')
assert.equal(apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: false },
  response: { body: completePayload },
}), null, 'raw protobuf roots must not be scanned')
const invalidFieldNumberPayload = concat([
  lengthField(536870912, new Uint8Array([1])),
  lengthField(2, wifiMessage('aa:bb:cc:dd:ee:ff', [originalLocation])),
])
assert.equal(apple.transform({
  settings: { location: { longitude: 2, latitude: 3, accuracy: 25 }, failClosed: false },
  response: { body: framed(invalidFieldNumberPayload) },
}), null, 'invalid protobuf field numbers must not be accepted')
assert.throws(() => apple.transform({
  settings: { location: { longitude: 181, latitude: 3, accuracy: 25 }, failClosed: false },
  response: { body: completeFrame },
}), /longitude is invalid/)
assert.throws(() => apple.transform({
  settings: { location: { longitude: 2, latitude: null, accuracy: 25 }, failClosed: false },
  response: { body: completeFrame },
}), /not configured/)

const testflightManifest = await readManifest('testflight-region-unlock/extension.yaml')
assert.equal(testflightManifest.metadata.id, 'io.5gpn.testflight-region-unlock')
assert.equal(testflightManifest.metadata.version, '1.1.0')
assert.deepEqual(testflightManifest.permissions, { persistentStorage: false })
assert.deepEqual(testflightManifest.requirements, { egressGroup: { required: true } })
assert.deepEqual(testflightManifest.traffic, { captureHosts: ['testflight.apple.com'] })
assert.deepEqual(testflightManifest.settings[0], {
  key: 'storefront',
  type: 'select',
  label: 'Target storefront',
  description: 'Selects the Apple storefront region written into TestFlight install requests.',
  required: true,
  options: ['US', 'GB', 'CA', 'AU', 'JP', 'HK', 'SG', 'CN', 'KR', 'TW'],
  default: 'US',
})
assert.equal(testflightManifest.actions.length, 1)
const testflightAction = testflightManifest.actions[0]
assert.equal(testflightAction.phase, 'request')
assert.deepEqual(testflightAction.match.hosts, ['testflight.apple.com'])
assert.deepEqual(testflightAction.match.schemes, ['http', 'https'])
const testflightPath = new RegExp(testflightAction.match.pathRegex)
assert(testflightPath.test('/v1/accounts/account/install'))
assert(testflightPath.test('/v9/accounts/account/nested/install'))
assert(!testflightPath.test('/v10/accounts/account/install'))
assert(!testflightPath.test('/v1/accounts/account/install?source=test'))
assert(!testflightPath.test('/v1/accounts//install'))
assert.deepEqual(testflightAction.script, {
  source: './rewrite-storefront.js',
  bodyMode: 'text',
  timeoutMs: 500,
  maxBodyBytes: 1048576,
})

const upstreamURLPattern = /^https?:\/\/testflight\.apple\.com\/v\d\/accounts\/.+?\/install$/
for (const scheme of ['http', 'https']) {
  for (const pathValue of [
    '/v1/accounts/account/install',
    '/v9/accounts/account/nested/install',
    '/v10/accounts/account/install',
    '/v1/accounts/account/install?source=test',
  ]) {
    assert.equal(
      testflightPath.test(pathValue),
      upstreamURLPattern.test(`${scheme}://testflight.apple.com${pathValue}`),
      `native matcher differs from the pinned upstream matcher for ${pathValue}`,
    )
  }
}

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
assert.match(appleReadme, /edee9b955f673cc8c4a52eb0a9c687a2e25dde4a/)
assert.match(appleReadme, /ab4d55ceed0593ad1ad8f3424088c291f7db748f/)
assert.match(appleReadme, /d8ae57eb8696af05413e3fbbf0bd57513a4f649407a1d0a7bb891916482fca70/)
assert.match(appleReadme, /016168f87274e55b285bad2f1073567782818f1710f6bd4df8e56f1712e406c0/)
assert.match(appleReadme, /e4a68eac74fbad2e6be287c43b836d21723280eaa6203df65dd23a5f377417fa/)
assert.match(testflightReadme, /License: \[`CC-BY-NC-SA-4\.0`\]/)
assert.match(testflightReadme, /ab6c3182fb2b09bcc34456f496282ec0b8e9217b/)
assert.match(testflightReadme, /c8112507802d0690d8b94d4110945e9c782df40e/)
assert.match(testflightReadme, /a49e5a186a95eef966d9b127eec663eef3fd196beaaeadd32b9302f5e3540c1e/)
assert.match(testflightReadme, /047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98/)
for (const [readme, manifestPath, scriptPath] of [
  [appleReadme, 'apple-wloc/extension.yaml', 'apple-wloc/wloc.js'],
  [testflightReadme, 'testflight-region-unlock/extension.yaml', 'testflight-region-unlock/rewrite-storefront.js'],
]) {
  assert(readme.includes(sha256(await readFile(path.join(root, manifestPath)))))
  assert(readme.includes(sha256(await readFile(path.join(root, scriptPath)))))
  assert(readme.includes('node tests/apple-testflight-fixtures.mjs'))
}

console.log('Apple WLOC and TestFlight fixtures passed')
