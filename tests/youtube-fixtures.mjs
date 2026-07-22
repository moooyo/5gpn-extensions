import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const source = await readFile(path.join(root, 'youtube-cleaner', 'clean-player.js'), 'utf8')
const requestSource = await readFile(path.join(root, 'youtube-cleaner', 'request-handler.js'), 'utf8')
const manifest = parse(await readFile(path.join(root, 'youtube-cleaner', 'extension.yaml'), 'utf8'))

assert.equal(manifest.metadata.version, '3.0.0')
assert.equal(manifest.permissions.persistentStorage, true)
assert.deepEqual(manifest.permissions.network.origins, ['https://init-stream.maasea.workers.dev'])
assert.deepEqual(manifest.traffic.captureHosts, ['*.googlevideo.com', 'youtubei.googleapis.com'])
assert.equal(manifest.traffic.routingRules, undefined)
assert.deepEqual(
  manifest.settings.map((setting) => [setting.key, setting.default]),
  [
    ['blockUpload', true],
    ['blockImmersive', true],
    ['blockShorts', false],
    ['captionLang', 'off'],
    ['debug', false],
  ],
)
const responseAction = manifest.actions.find((action) => action.id === 'clean-youtube-response')
assert(responseAction)
assert.equal(responseAction.match.methods, undefined)
assert.equal(responseAction.match.statusCodes, undefined)
for (const endpoint of [
  '/youtubei/v1/browse',
  '/youtubei/v1/next',
  '/youtubei/v1/player',
  '/youtubei/v1/search',
  '/youtubei/v1/reel/reel_watch_sequence',
  '/youtubei/v1/guide',
  '/youtubei/v1/account/get_setting',
  '/youtubei/v1/get_watch',
  '/youtubei/v1/config',
  '/youtubei/v1/log_event',
]) {
  assert(new RegExp(responseAction.match.pathRegex).test(endpoint), `manifest does not match ${endpoint}`)
}
const initAction = manifest.actions.find((action) => action.id === 'prepare-onesie-initplayback')
assert(initAction)
assert.equal(initAction.script.bodyMode, 'binary')
assert(new RegExp(initAction.match.pathRegex).test('/initplayback?a=1&ack=1'))
assert(!new RegExp(initAction.match.pathRegex).test('/initplayback?a=1&oad=1'))
const logEventAction = manifest.actions.find((action) => action.id === 'prepare-youtube-log-event')
assert(logEventAction)
assert.equal(logEventAction.script.bodyMode, 'none')

function loadTransform(script) {
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
    encodeURIComponent,
    console: {
      debug: (...args) => messages.push(['debug', ...args]),
      error: (...args) => messages.push(['error', ...args]),
      info: (...args) => messages.push(['info', ...args]),
      log: (...args) => messages.push(['log', ...args]),
      warn: (...args) => messages.push(['warn', ...args]),
    },
  }
  vm.createContext(sandbox)
  new vm.Script(script, { filename: 'youtube-fixture.js' }).runInContext(sandbox)
  assert.equal(typeof sandbox.transform, 'function')
  return { transform: sandbox.transform, messages }
}

const { transform, messages } = loadTransform(source)
const { transform: transformRequest } = loadTransform(requestSource)

function concat(...parts) {
  const flat = parts.flatMap((part) => [...part])
  return new Uint8Array(flat)
}

function varint(value) {
  let remaining = BigInt(value)
  const output = []
  while (remaining >= 0x80n) {
    output.push(Number(remaining & 0x7fn) | 0x80)
    remaining >>= 7n
  }
  output.push(Number(remaining))
  return output
}

function tag(field, wireType) {
  return varint((BigInt(field) << 3n) | BigInt(wireType))
}

function v(field, value) {
  return [...tag(field, 0), ...varint(value)]
}

function b(field, body) {
  const bytes = [...body]
  return [...tag(field, 2), ...varint(bytes.length), ...bytes]
}

function s(field, value) {
  return b(field, Buffer.from(value, 'utf8'))
}

function decodeVarint(bytes, offset) {
  let value = 0n
  for (let index = 0; index < 10; index += 1) {
    const byte = bytes[offset + index]
    assert.notEqual(byte, undefined, 'truncated fixture varint')
    value |= BigInt(byte & 0x7f) << BigInt(index * 7)
    if (byte < 0x80) return { value, length: index + 1 }
  }
  throw new Error('oversized fixture varint')
}

function parseFields(input) {
  const bytes = new Uint8Array(input)
  const output = []
  let offset = 0
  while (offset < bytes.length) {
    const key = decodeVarint(bytes, offset)
    offset += key.length
    const number = Number(key.value >> 3n)
    const wireType = Number(key.value & 7n)
    if (wireType === 0) {
      const value = decodeVarint(bytes, offset)
      output.push({ number, wireType, value: value.value, payload: null })
      offset += value.length
    } else if (wireType === 2) {
      const length = decodeVarint(bytes, offset)
      offset += length.length
      const end = offset + Number(length.value)
      assert(end <= bytes.length, 'fixture field exceeds message')
      output.push({ number, wireType, value: null, payload: bytes.slice(offset, end) })
      offset = end
    } else {
      throw new Error(`unsupported fixture output wire type ${wireType}`)
    }
  }
  return output
}

function all(message, number) {
  return parseFields(message).filter((field) => field.number === number)
}

function last(message, number) {
  const found = all(message, number)
  return found.length ? found[found.length - 1] : null
}

function child(message, number) {
  const field = last(message, number)
  assert(field && field.wireType === 2, `missing message field ${number}`)
  return field.payload
}

function intValue(message, number) {
  const field = last(message, number)
  assert(field && field.wireType === 0, `missing varint field ${number}`)
  return Number(field.value)
}

function stringValue(message, number) {
  return Buffer.from(child(message, number)).toString('utf8')
}

function defaultSettings(overrides = {}) {
  return {
    blockUpload: true,
    blockImmersive: true,
    blockShorts: false,
    captionLang: 'off',
    debug: false,
    ...overrides,
  }
}

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    api: {
      get(key) {
        return values.has(key) ? values.get(key) : null
      },
      set(key, value) {
        values.set(key, value)
        return true
      },
      delete(key) {
        return values.delete(key)
      },
      clear() {
        values.clear()
        return true
      },
    },
  }
}

function run(endpoint, body, options = {}) {
  const context = {
    request: {
      url: `https://youtubei.googleapis.com/youtubei/v1/${endpoint}`,
      headers: options.headers || {},
    },
    response: { body: new Uint8Array(body) },
    settings: defaultSettings(options.settings),
  }
  if (options.storage) context.storage = options.storage.api
  return transform(context)
}

function makeLabel(text) {
  return b(1, s(1, text))
}

function makeRichUnknown(fieldNumber, marker = true, size = 1000) {
  const payload = new Uint8Array(size)
  payload.fill(120)
  if (marker) payload.set(Buffer.from('pagead'), Math.min(100, size - 6))
  return b(fieldNumber, payload)
}

function makeRichRenderer({ eml = '', videoContent = null } = {}) {
  const renderInfo = eml === null ? [] : b(2, b(183314536, s(1, eml)))
  const videoInfo = videoContent === null ? [] : b(1, b(168777401, b(5, videoContent)))
  return b(153515154, b(172660663, concat(videoInfo, renderInfo)))
}

function makeItemSection(richItems) {
  return richItems.map((item) => b(1, item)).flat()
}

function makeBrowseContentWithItems(richItems) {
  const itemSection = b(50195462, makeItemSection(richItems))
  const sectionList = b(1, itemSection)
  return b(49399797, sectionList)
}

function makeBrowseContentWithReelItems(richItems) {
  const reelShelf = richItems.map((item) => b(1, item)).flat()
  const supported = b(51845067, b(5, b(51431404, reelShelf)))
  return b(49399797, b(1, supported))
}

function makeBrowseContentWithTabItems(richItems) {
  const nested = makeBrowseContentWithItems(richItems)
  return b(58173949, b(1, b(58174010, b(4, nested))))
}

function richItemsFromBrowseContent(content) {
  const sectionList = child(content, 49399797)
  const supported = child(sectionList, 1)
  const itemSection = child(supported, 50195462)
  return all(itemSection, 1)
}

// Request handling learns the same two platform slots as upstream, strips the
// log_event negotiation headers, and rewrites only matching encrypted keys to
// the reviewed Worker origin.
{
  const clientKey = new Uint8Array([1, 2, 3, 4])
  const encryptKey = new Uint8Array([9, 8, 7, 6])
  const otherClientKey = new Uint8Array([5, 4, 3, 2])
  const otherEncryptKey = new Uint8Array([6, 7, 8, 9])
  const config = {
    youtube: {
      clientKey: Buffer.from(clientKey).toString('base64'),
      encryptKey: Buffer.from(encryptKey).toString('base64'),
    },
    youtubeMusic: {
      clientKey: Buffer.from(otherClientKey).toString('base64'),
      encryptKey: Buffer.from(otherEncryptKey).toString('base64'),
    },
  }
  const storage = makeStorage({ YouTubeConfig: JSON.stringify(config) })
  const originalURL = 'https://r1.googlevideo.com/initplayback?a=one%20two&ack=1&token=secret'
  const result = transformRequest({
    request: {
      url: originalURL,
      headers: { 'User-Agent': 'com.google.ios.youtube/20.1' },
      body: new Uint8Array(b(3, b(5, encryptKey))),
    },
    settings: defaultSettings({ captionLang: 'zh-Hans' }),
    storage: storage.api,
  })
  const rewritten = new URL(result.request.url)
  assert.equal(rewritten.origin, 'https://init-stream.maasea.workers.dev')
  assert.equal(rewritten.searchParams.get('ck'), config.youtube.clientKey)
  assert.equal(rewritten.searchParams.get('target'), originalURL)
  assert.equal(rewritten.searchParams.get('captionLang'), 'zh-Hans')
  assert.equal(rewritten.searchParams.get('blockUpload'), 'true')
  assert.equal(rewritten.searchParams.get('blockImmersive'), 'true')
  assert.equal(rewritten.searchParams.get('blockShorts'), 'false')
  assert.deepEqual(JSON.parse(storage.values.get('YouTubeConfig')), config)

  const duplicateEnvelope = concat(
    b(3, b(5, new Uint8Array([0]))),
    b(3, b(5, encryptKey)),
  )
  assert.equal(
    new URL(transformRequest({
      request: { url: originalURL, headers: {}, body: duplicateEnvelope },
      settings: defaultSettings(),
      storage: makeStorage({ YouTubeConfig: JSON.stringify(config) }).api,
    }).request.url).origin,
    'https://init-stream.maasea.workers.dev',
  )

  const mismatchStorage = makeStorage({ YouTubeConfig: JSON.stringify(config) })
  const mismatch = transformRequest({
    request: {
      url: originalURL,
      headers: { 'User-Agent': 'youtube music ios' },
      body: new Uint8Array(b(3, b(5, [0, 0, 0, 0]))),
    },
    settings: defaultSettings(),
    storage: mismatchStorage.api,
  })
  assert.equal(mismatch.response.status, 200)
  assert.equal(mismatch.response.headers['Content-Type'], 'text/plain')
  assert.deepEqual([...mismatch.response.body], [])
  assert.deepEqual(JSON.parse(mismatchStorage.values.get('YouTubeConfig')), { youtube: config.youtube })

  const coldStorage = makeStorage()
  const cold = transformRequest({
    request: { url: originalURL, headers: {}, body: new Uint8Array(b(3, b(5, encryptKey))) },
    settings: defaultSettings(),
    storage: coldStorage.api,
  })
  assert.equal(cold.response.status, 200)
  assert.equal(coldStorage.values.has('YouTubeConfig'), false)
  assert.equal(transformRequest({
    request: {
      url: 'https://nested.r1.googlevideo.com/initplayback?a=1&ack=1',
      headers: {},
      body: new Uint8Array(),
    },
    settings: defaultSettings(),
  }), null)

  assert.throws(
    () => transformRequest({
      request: { url: originalURL, headers: {}, body: new Uint8Array([0x1a, 0x05, 0x2a]) },
      settings: defaultSettings(),
      storage: makeStorage({ YouTubeConfig: JSON.stringify(config) }).api,
    }),
    /exceeds its message/,
  )

  const coldLog = transformRequest({
    request: {
      url: 'https://youtubei.googleapis.com/youtubei/v1/log_event?alt=proto',
      headers: {
        'Content-Encoding': 'gzip',
        'X-YouTube-Hot-Hash-Data': 'cold-hash',
        'X-Keep': 'yes',
      },
    },
    settings: defaultSettings(),
    storage: makeStorage().api,
  })
  assert.deepEqual({ ...coldLog.request.headers }, { 'X-Keep': 'yes' })

  const warmLog = transformRequest({
    request: {
      url: 'https://youtubei.googleapis.com/youtubei/v1/log_event',
      headers: {
        'content-encoding': 'br',
        'x-youtube-hot-hash-data': 'warm-hash',
      },
    },
    settings: defaultSettings(),
    storage: makeStorage({ YouTubeConfig: JSON.stringify(config) }).api,
  })
  assert.deepEqual({ ...warmLog.request.headers }, { 'x-youtube-hot-hash-data': 'warm-hash' })
}

// Player: ads, tracking, playback abilities, captions, audio defaults, and
// unknown siblings are all checked in one semantic fixture.
{
  const playability = concat(v(99, 7))
  const tracking = concat(b(1, s(1, 'keep')), b(18, s(1, 'drop')))
  const captionTrack = concat(s(1, 'https://captions.example/timedtext?x=1'), b(2, makeLabel('English')), s(4, 'en'))
  const audioTrack = concat(b(2, varint(0)))
  const captionList = concat(b(1, captionTrack), b(2, audioTrack), b(3, concat(s(1, 'old'))))
  const captions = b(51621377, captionList)
  const player = concat(
    b(1, [0x01]),
    b(2, playability),
    b(7, [0x02]),
    b(9, tracking),
    b(10, captions),
    b(68, [0x03]),
  )
  const result = run('player', player, { settings: { captionLang: 'fr' } })
  const output = result.response.body
  assert.equal(all(output, 7).length, 0)
  assert.equal(all(output, 68).length, 0)
  assert.deepEqual([...child(output, 1)], [0x01])
  const outputTracking = child(output, 9)
  assert.equal(all(outputTracking, 18).length, 0)
  assert.equal(stringValue(child(outputTracking, 1), 1), 'keep')

  const outputPlayability = child(output, 2)
  assert.equal(intValue(outputPlayability, 99), 7)
  const pip = child(child(outputPlayability, 21), 151635310)
  assert.equal(intValue(pip, 1), 1)
  assert.equal(intValue(pip, 8), 1)
  assert.equal(all(pip, 4).length, 0)
  assert.equal(all(pip, 6).length, 0)
  assert.equal(intValue(child(child(outputPlayability, 11), 64657230), 1), 1)

  const outputList = child(child(output, 10), 51621377)
  const tracks = all(outputList, 1)
  assert.equal(tracks.length, 2)
  assert.equal(intValue(tracks[0].payload, 7), 1)
  assert.equal(stringValue(tracks[1].payload, 4), 'fr')
  assert.equal(stringValue(tracks[1].payload, 1), 'https://captions.example/timedtext?x=1&tlang=fr')
  assert.equal(stringValue(child(child(tracks[1].payload, 2), 1), 1), '@Enhance (fr)')
  const outputAudio = child(outputList, 2)
  const outputIndices = all(outputAudio, 2)
  assert.equal(outputIndices.length, 2)
  assert.equal(Number(decodeVarint(outputIndices[0].payload, 0).value), 0)
  assert.equal(Number(outputIndices[1].value), 1)
  assert.equal(intValue(outputAudio, 3), 1)
  assert.equal(intValue(outputAudio, 11), 3)
  assert.equal(all(outputList, 3).length, 11)
}

// Unknown protobuf groups remain byte-identical while an adjacent ad field is
// removed. This exercises wire types 3 and 4 in the native parser.
{
  const group = new Uint8Array([...tag(1, 3), ...v(2, 1), ...tag(1, 4)])
  const fixed64 = new Uint8Array([...tag(3, 1), 1, 2, 3, 4, 5, 6, 7, 8])
  const fixed32 = new Uint8Array([...tag(4, 5), 9, 10, 11, 12])
  const preserved = concat(group, fixed64, fixed32)
  const result = run('player', concat(preserved, b(7, [0x02])))
  assert.deepEqual([...result.response.body], [...preserved])
}

// The pinned English-priority overwrite remains observable: requesting en
// appends a translated English track instead of selecting the existing one.
{
  const english = concat(s(1, 'https://captions.example/en'), s(4, 'en'))
  const captions = b(51621377, b(1, english))
  const result = run('player', concat(b(2, []), b(10, captions)), {
    settings: { captionLang: 'en' },
  })
  const outputList = child(child(result.response.body, 10), 51621377)
  assert.equal(all(outputList, 1).length, 2)
  assert.equal(stringValue(all(outputList, 1)[1].payload, 4), 'en')

  const french = concat(s(1, 'https://captions.example/fr'), s(4, 'fr'))
  const existingResult = run('player', concat(b(2, []), b(10, b(51621377, b(1, french)))), {
    settings: { captionLang: 'fr' },
  })
  const existingList = child(child(existingResult.response.body, 10), 51621377)
  assert.equal(all(existingList, 1).length, 1)
  assert.equal(intValue(all(existingList, 1)[0].payload, 7), 1)

  const emptyResult = run('player', concat(b(2, []), b(10, b(51621377, []))), {
    settings: { captionLang: 'fr' },
  })
  assert.equal(all(child(child(emptyResult.response.body, 10), 51621377), 1).length, 0)
}

// Duplicate singular messages are merged before mutation, then emitted as one
// occurrence just like protobuf-ts. Repeated members from both occurrences are
// retained and every targeted nested field is transformed.
{
  const trackingA = concat(b(1, s(1, 'keep-a')), b(18, s(1, 'drop-a')))
  const trackingB = concat(b(2, s(1, 'keep-b')), b(18, s(1, 'drop-b')))
  const english = concat(s(1, 'https://captions.example/en'), s(4, 'en'))
  const french = concat(s(1, 'https://captions.example/fr'), s(4, 'fr'))
  const player = concat(
    b(2, v(99, 1)),
    b(2, v(100, 2)),
    b(9, trackingA),
    b(9, trackingB),
    b(10, b(51621377, b(1, english))),
    b(10, b(51621377, b(1, french))),
  )
  const result = run('player', player, { settings: { captionLang: 'de' } })
  assert.equal(all(result.response.body, 2).length, 1)
  const playability = child(result.response.body, 2)
  assert.equal(intValue(playability, 99), 1)
  assert.equal(intValue(playability, 100), 2)
  assert.equal(all(playability, 21).length, 1)
  assert.equal(all(playability, 11).length, 1)

  assert.equal(all(result.response.body, 9).length, 1)
  const tracking = child(result.response.body, 9)
  assert.equal(all(tracking, 18).length, 0)
  assert.equal(stringValue(child(tracking, 1), 1), 'keep-a')
  assert.equal(stringValue(child(tracking, 2), 1), 'keep-b')

  assert.equal(all(result.response.body, 10).length, 1)
  const captions = child(result.response.body, 10)
  assert.equal(all(captions, 51621377).length, 1)
  const list = child(captions, 51621377)
  assert.deepEqual(all(list, 1).map((field) => stringValue(field.payload, 4)), ['en', 'fr', 'de'])
}

// Deferred merge views do not rewrite duplicate singular occurrences when the
// endpoint performs no business mutation.
{
  const duplicateBrowse = concat(b(9, v(2, 1)), b(9, v(3, 2)))
  assert.equal(run('browse', duplicateBrowse, { storage: makeStorage() }), null)
}

// A sibling mutation must not canonicalize an untouched duplicate group. The
// two Tracking occurrences remain byte-identical and in order while field 7 is
// removed from the containing Player.
{
  const trackingA = b(9, b(1, s(1, 'raw-a')))
  const trackingB = b(9, b(2, s(1, 'raw-b')))
  const player = concat(trackingA, b(7, [0x02]), trackingB)
  const result = run('player', player)
  assert.equal(all(result.response.body, 9).length, 2)
  assert.deepEqual([...result.response.body], [...concat(trackingA, trackingB)])
}

// Browse learns a black field number, reuses it, and learns a white number.
{
  const storage = makeStorage()
  const adBrowse = b(9, makeBrowseContentWithItems([makeRichUnknown(100, true)]))
  const first = run('browse', adBrowse, { storage })
  assert.equal(richItemsFromBrowseContent(child(first.response.body, 9)).length, 0)
  const learned = JSON.parse(storage.values.get('YouTubeAdvertiseInfo'))
  assert.deepEqual(learned.blackNo, [100])

  const cachedBrowse = b(9, makeBrowseContentWithItems([makeRichUnknown(100, false, 8)]))
  const second = run('browse', cachedBrowse, { storage })
  assert.equal(richItemsFromBrowseContent(child(second.response.body, 9)).length, 0)

  const cleanBrowse = b(9, makeBrowseContentWithItems([makeRichUnknown(101, false)]))
  assert.equal(run('browse', cleanBrowse, { storage }), null)
  const withWhite = JSON.parse(storage.values.get('YouTubeAdvertiseInfo'))
  assert(withWhite.whiteNo.includes(101))
}

// EML classification uses the pinned default blacklist and preserves the
// explicitly excluded shorts pivot layout.
{
  const storage = makeStorage()
  const browse = b(9, makeBrowseContentWithItems([
    makeRichRenderer({ eml: 'inline_injection_entrypoint_layout.eml|variant' }),
    makeRichRenderer({ eml: 'shorts_pivot_item.eml' }),
    makeRichRenderer({ eml: 'shorts_shelf.eml' }),
  ]))
  const result = run('browse', browse, { storage })
  const remaining = richItemsFromBrowseContent(child(result.response.body, 9))
  assert.equal(remaining.length, 1)
  const renderer = child(child(remaining[0].payload, 153515154), 172660663)
  assert.equal(stringValue(child(child(renderer, 2), 183314536), 1), 'shorts_pivot_item.eml')
}

// Larger persisted caches use the same membership semantics through the
// allocation-bounded indexed lookup path.
{
  const state = JSON.stringify({
    version: '1.0',
    whiteNo: [...Array.from({ length: 17 }, (_, index) => 1000 + index), 101],
    blackNo: [...Array.from({ length: 17 }, (_, index) => 2000 + index), 102],
    whiteEml: [],
    blackEml: ['inline_injection_entrypoint_layout.eml'],
  })
  const storage = makeStorage({ YouTubeAdvertiseInfo: state })
  const browse = b(9, makeBrowseContentWithItems([
    makeRichUnknown(101, false, 8),
    makeRichUnknown(102, false, 8),
  ]))
  const result = run('browse', browse, { storage })
  const remaining = richItemsFromBrowseContent(child(result.response.body, 9))
  assert.equal(remaining.length, 1)
  assert.equal(parseFields(remaining[0].payload)[0].number, 101)
}

// A previously unseen EML is learned from an unknown VideoContent field.
{
  const storage = makeStorage()
  const unknownVideoContent = makeRichUnknown(300, true)
  const browse = b(9, makeBrowseContentWithItems([
    makeRichRenderer({ eml: 'new_ad_layout.eml', videoContent: unknownVideoContent }),
  ]))
  const result = run('browse', browse, { storage })
  assert.equal(richItemsFromBrowseContent(child(result.response.body, 9)).length, 0)
  assert(JSON.parse(storage.values.get('YouTubeAdvertiseInfo')).blackEml.includes('new_ad_layout.eml'))
}

// Next and Search reuse the same learned field-number classifier.
{
  const state = JSON.stringify({
    version: '1.0',
    whiteNo: [],
    blackNo: [100],
    whiteEml: [],
    blackEml: ['inline_injection_entrypoint_layout.eml'],
  })
  const nextStorage = makeStorage({ YouTubeAdvertiseInfo: state })
  const nextContent = makeBrowseContentWithItems([makeRichUnknown(100, false, 8)])
  const next = concat(b(7, b(51779735, b(1, nextContent))))
  const nextResult = run('next', next, { storage: nextStorage })
  const nestedContent = child(child(child(nextResult.response.body, 7), 51779735), 1)
  assert.equal(richItemsFromBrowseContent(nestedContent).length, 0)

  const searchStorage = makeStorage({ YouTubeAdvertiseInfo: state })
  const command = b(50195462, makeItemSection([makeRichUnknown(100, false, 8)]))
  const searchResult = run('search', b(7, command), { storage: searchStorage })
  assert.equal(all(child(child(searchResult.response.body, 7), 50195462), 1).length, 0)
}

// Alternate upstream wrappers reach the same classifier: Browse field 10,
// tab recursion, reel shelves, Next field 8, Search field 4, and Search's
// continuation command are all exercised explicitly.
{
  const state = JSON.stringify({
    version: '1.0',
    whiteNo: [],
    blackNo: [100],
    whiteEml: [],
    blackEml: ['inline_injection_entrypoint_layout.eml'],
  })
  const cachedRich = makeRichUnknown(100, false, 8)

  const reelResult = run('browse', b(10, makeBrowseContentWithReelItems([cachedRich])), {
    storage: makeStorage({ YouTubeAdvertiseInfo: state }),
  })
  const reelContent = child(reelResult.response.body, 10)
  const reelSupported = child(child(reelContent, 49399797), 1)
  const reelShelf = child(child(child(reelSupported, 51845067), 5), 51431404)
  assert.equal(all(reelShelf, 1).length, 0)

  const tabResult = run('browse', b(9, makeBrowseContentWithTabItems([cachedRich])), {
    storage: makeStorage({ YouTubeAdvertiseInfo: state }),
  })
  const tabNested = child(child(child(child(child(tabResult.response.body, 9), 58173949), 1), 58174010), 4)
  assert.equal(richItemsFromBrowseContent(tabNested).length, 0)

  const nextResult = run('next', b(8, makeBrowseContentWithItems([cachedRich])), {
    storage: makeStorage({ YouTubeAdvertiseInfo: state }),
  })
  assert.equal(richItemsFromBrowseContent(child(nextResult.response.body, 8)).length, 0)

  const searchContent = run('search', b(4, makeBrowseContentWithItems([cachedRich])), {
    storage: makeStorage({ YouTubeAdvertiseInfo: state }),
  })
  assert.equal(richItemsFromBrowseContent(child(searchContent.response.body, 4)).length, 0)

  const supported = b(50195462, makeItemSection([cachedRich]))
  const continuation = run('search', b(7, b(49399797, b(1, supported))), {
    storage: makeStorage({ YouTubeAdvertiseInfo: state }),
  })
  const continuedSection = child(child(child(continuation.response.body, 7), 49399797), 1)
  assert.equal(all(child(continuedSection, 50195462), 1).length, 0)
}

// Shorts removes only entries explicitly marked as advertisements. A missing
// adClientParams message and an explicit false value are both retained.
{
  const ad = b(1, b(139608561, b(16, v(1, 1))))
  const nonAd = b(1, b(139608561, b(16, [])))
  const missingParams = b(1, b(139608561, []))
  const legacyOverlay = b(1, b(139608561, b(8, [])))
  const result = run('reel/reel_watch_sequence', concat(
    b(2, ad),
    b(2, nonAd),
    b(2, missingParams),
    b(2, legacyOverlay),
  ))
  assert.equal(all(result.response.body, 2).length, 3)
}

function makeGuideRenderer(browseID, useLabel = false) {
  return b(useLabel ? 117501096 : 318370163, s(1, browseID))
}

// Guide defaults remove upgrade/upload/immersive but preserve Shorts.
{
  const renderers = [
    'SPunlimited',
    'FEuploads',
    'FEmusic_immersive',
    'FEshorts',
    'FEkeep',
  ].map((id, index) => b(1, makeGuideRenderer(id, index === 4)))
  const guide = b(4, b(117866661, concat(...renderers)))
  const result = run('guide', guide)
  const section = child(child(result.response.body, 4), 117866661)
  const guideID = (field) => {
    const rendererFields = parseFields(field.payload)
    const entry = rendererFields.find((candidate) => candidate.number === 318370163) ||
      rendererFields.find((candidate) => candidate.number === 117501096)
    return stringValue(entry.payload, 1)
  }
  const ids = all(section, 1).map(guideID)
  assert.deepEqual(ids, ['FEshorts', 'FEkeep'])

  const shortsBlocked = run('guide', guide, { settings: { blockShorts: true } })
  const blockedSection = child(child(shortsBlocked.response.body, 4), 117866661)
  assert.deepEqual(
    all(blockedSection, 1).map(guideID),
    ['FEkeep'],
  )

  const optionalEntries = run('guide', guide, {
    settings: { blockUpload: false, blockImmersive: false, blockShorts: false },
  })
  const optionalSection = child(child(optionalEntries.response.body, 4), 117866661)
  assert.deepEqual(
    all(optionalSection, 1).map(guideID),
    ['FEuploads', 'FEmusic_immersive', 'FEshorts', 'FEkeep'],
  )
}

// Settings inject item 151 and the background/download renderer.
{
  const category = v(4, 10135)
  const setting = b(6, b(66930374, category))
  const result = run('account/get_setting', setting)
  const rootItems = all(result.response.body, 6)
  assert.equal(rootItems.length, 2)
  const outputCategory = child(rootItems[0].payload, 66930374)
  const booleanRenderer = child(child(outputCategory, 3), 61331416)
  const enableData = child(child(child(booleanRenderer, 5), 81212182), 1)
  const disableData = child(child(child(booleanRenderer, 6), 81212182), 1)
  assert.equal(intValue(child(enableData, 1), 1), 151)
  assert.equal(intValue(enableData, 3), 1)
  assert.equal(intValue(child(disableData, 1), 1), 151)
  assert.equal(all(disableData, 3).length, 0)

  const background = child(rootItems[1].payload, 88478200)
  for (const field of [2, 3, 9, 10]) assert.equal(intValue(background, field), 1)
  assert.equal(intValue(child(background, 14), 1), 1093)

  const emptyResult = run('account/get_setting', new Uint8Array())
  assert.equal(all(emptyResult.response.body, 6).length, 1)
  assert(all(all(emptyResult.response.body, 6)[0].payload, 88478200).length === 1)
}

// config and log_event responses cache complete Onesie key pairs under the
// platform selected by the request User-Agent without rewriting the body.
{
  const videoConfig = {
    youtube: {
      clientKey: Buffer.from([1]).toString('base64'),
      encryptKey: Buffer.from([2]).toString('base64'),
    },
  }
  const storage = makeStorage({ YouTubeConfig: JSON.stringify(videoConfig) })
  const clientKey = new Uint8Array([10, 11, 12, 13])
  const encryptKey = new Uint8Array([20, 21, 22, 23])
  const onesie = concat(
    b(1, clientKey),
    b(2, encryptKey),
    v(3, 3600),
    v(30, 1),
  )
  const configBody = b(1, b(16, b(7, b(138536474, b(146311580, onesie)))))
  assert.equal(run('config', configBody, {
    storage,
    headers: { 'user-agent': 'com.google.ios.youtubemusic/20.1' },
    settings: { debug: true },
  }), null)
  assert.deepEqual(JSON.parse(storage.values.get('YouTubeConfig')), {
    ...videoConfig,
    youtubeMusic: {
      clientKey: Buffer.from(clientKey).toString('base64'),
      encryptKey: Buffer.from(encryptKey).toString('base64'),
    },
  })
  assert(messages.some((entry) => entry[0] === 'info' && String(entry[1]).includes('YouTube config transform')))

  const videoStorage = makeStorage()
  const splitConfigBody = b(1, b(16, b(7, b(138536474, concat(
    b(146311580, b(1, clientKey)),
    b(146311580, b(2, encryptKey)),
  )))))
  assert.equal(run('log_event', splitConfigBody, {
    storage: videoStorage,
    headers: { 'User-Agent': 'com.google.ios.youtube/20.1' },
  }), null)
  assert.deepEqual(JSON.parse(videoStorage.values.get('YouTubeConfig')), {
    youtube: {
      clientKey: Buffer.from(clientKey).toString('base64'),
      encryptKey: Buffer.from(encryptKey).toString('base64'),
    },
  })

  const incomplete = b(1, b(16, b(7, b(138536474, b(146311580, b(1, clientKey))))))
  const incompleteStorage = makeStorage()
  assert.equal(run('config', incomplete, { storage: incompleteStorage }), null)
  assert.equal(incompleteStorage.values.has('YouTubeConfig'), false)
  assert(messages.some((entry) => entry[0] === 'warn' && String(entry[1]).includes('complete Onesie key')))

  assert.throws(
    () => run('config', configBody),
    /persistent storage permission/,
  )
  assert.throws(
    () => run('config', configBody, {
      storage: makeStorage({ YouTubeConfig: '{bad json' }),
    }),
    /JSON/,
  )
}

// get_watch transforms nested Player and Next and persists discoveries made by
// the nested classifier, an intentional fix over the pinned wrapper bug.
{
  const storage = makeStorage()
  const nestedPlayerA = concat(b(2, []), b(7, [0x02]))
  const nestedPlayerB = concat(b(68, [0x04]))
  const nestedNext = b(8, makeBrowseContentWithItems([makeRichUnknown(200, true)]))
  const secondPlayer = concat(b(7, [0x03]))
  const watch = concat(
    b(1, concat(b(2, nestedPlayerA), b(2, nestedPlayerB), b(3, nestedNext))),
    b(1, b(2, secondPlayer)),
  )
  const result = run('get_watch', watch, { storage })
  const contents = all(result.response.body, 1)
  assert.equal(contents.length, 2)
  const content = contents[0].payload
  assert.equal(all(content, 2).length, 1)
  const player = child(content, 2)
  assert.equal(all(player, 7).length, 0)
  assert.equal(all(player, 68).length, 0)
  assert(all(child(player, 2), 21).length === 1)
  const next = child(content, 3)
  assert.equal(richItemsFromBrowseContent(child(next, 8)).length, 0)
  assert.equal(all(child(contents[1].payload, 2), 7).length, 0)
  assert(JSON.parse(storage.values.get('YouTubeAdvertiseInfo')).blackNo.includes(200))
}

// No-op, malformed input, invalid settings, and debug logging boundaries.
{
  const storage = makeStorage()
  assert.equal(run('browse', new Uint8Array([0x10, 0x01]), { storage }), null)
  assert.throws(() => run('player', new Uint8Array([0x0a, 0x05, 0x01])), /exceeds the message body/)
  assert.throws(() => run('browse', new Uint8Array([0x48, 0x01]), { storage }), /wrong wire type/)
  assert.throws(() => run('player', new Uint8Array([...tag(1, 3), ...v(2, 1)])), /unterminated protobuf group/)
  assert.throws(() => run('guide', new Uint8Array([0x20, 0x01]), { settings: { captionLang: '../bad' } }), /language code/)
  assert.throws(
    () => run('browse', b(9, makeBrowseContentWithItems([makeRichUnknown(400, true)])), {
      storage: {
        api: {
          get() { return null },
          set() { return false },
        },
      },
    }),
    /failed to persist/,
  )
  assert.throws(
    () => run('browse', new Uint8Array([0x10, 0x01]), {
      storage: makeStorage({ YouTubeAdvertiseInfo: '{bad json' }),
    }),
    /JSON/,
  )

  let deeplyNested = makeBrowseContentWithItems([])
  for (let index = 0; index < 20; index += 1) {
    deeplyNested = b(58173949, b(1, b(58174010, b(4, deeplyNested))))
  }
  assert.throws(
    () => run('browse', b(9, deeplyNested), { storage: makeStorage() }),
    /nesting exceeds/,
  )

  const debugPlayer = concat(b(2, []))
  run('player', debugPlayer, { settings: { debug: true } })
  assert(messages.some((entry) => entry[0] === 'info' && String(entry[1]).includes('YouTube player transform')))
}

console.log('YouTube fixtures passed')
