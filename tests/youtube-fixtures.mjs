import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const source = await readFile(path.join(root, 'youtube-cleaner', 'clean-player.js'), 'utf8')
const blockSource = await readFile(path.join(root, 'youtube-cleaner', 'block-initplayback.js'), 'utf8')
const manifest = parse(await readFile(path.join(root, 'youtube-cleaner', 'extension.yaml'), 'utf8'))

assert.equal(manifest.metadata.version, '2.0.0')
assert.equal(manifest.permissions.persistentStorage, true)
assert.deepEqual(manifest.permissions.network.origins, ['https://translate.google.com'])
assert.deepEqual(manifest.traffic.captureHosts, ['*.googlevideo.com', 'youtubei.googleapis.com'])
assert.deepEqual(
  manifest.settings.map((setting) => [setting.key, setting.default]),
  [
    ['blockUpload', true],
    ['blockImmersive', true],
    ['blockShorts', false],
    ['captionLang', 'off'],
    ['lyricLang', 'off'],
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
]) {
  assert(new RegExp(responseAction.match.pathRegex).test(endpoint), `manifest does not match ${endpoint}`)
}

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
const { transform: blockInitPlayback } = loadTransform(blockSource)

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
    lyricLang: 'off',
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
    request: { url: `https://youtubei.googleapis.com/youtubei/v1/${endpoint}` },
    response: { body: new Uint8Array(body) },
    settings: defaultSettings(options.settings),
  }
  if (options.storage) context.storage = options.storage.api
  if (options.network) context.network = options.network
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

function makeTimedBrowseContent(text, footer = 'Footer') {
  const timed = b(465160965, b(4, concat(b(1, s(1, text)), s(2, footer))))
  return makeBrowseContentWithItems([makeRichRenderer({ eml: '', videoContent: timed })])
}

function timedTextFromRichItem(item) {
  const renderer = child(child(item.payload, 153515154), 172660663)
  const timed = child(child(child(child(renderer, 1), 168777401), 5), 465160965)
  return stringValue(child(child(timed, 4), 1), 1)
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

{
  const result = blockInitPlayback({
    request: { url: 'https://r1.googlevideo.com/initplayback?a=1&oad=1' },
  })
  assert.equal(result.response.status, 200)
  assert.equal(result.response.body, '')
  assert.equal(
    blockInitPlayback({ request: { url: 'https://nested.r1.googlevideo.com/initplayback?a=1&oad=1' } }),
    null,
  )
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

// Token-free, exact-origin lyric translation is exercised with a description
// response. The request must never contain the excluded upstream token.
{
  const param = concat(s(1, 'browse_id'), s(2, 'MPLYt_fixture'))
  const responseContext = b(6, b(2, param))
  const musicShelf = concat(b(3, makeLabel('你好')), b(10, makeLabel('Footer')))
  const supported = b(221496734, musicShelf)
  const content = b(49399797, b(1, supported))
  const browse = concat(b(1, responseContext), b(9, content))
  const storage = makeStorage()
  let observed
  const network = {
    request(options) {
      observed = options
      return {
        status: 200,
        text: JSON.stringify([[['Hello', '你好', null, null, 10]], null, 'zh-CN']),
      }
    },
  }
  const result = run('browse', browse, {
    storage,
    network,
    settings: { lyricLang: 'en' },
  })
  assert.equal(observed.method, 'GET')
  assert(observed.url.startsWith('https://translate.google.com/translate_a/single?'))
  assert(observed.url.includes('tl=en'))
  assert(!observed.url.includes('tk='))
  const outputShelf = child(child(child(result.response.body, 9), 49399797), 1)
  const renderer = child(outputShelf, 221496734)
  assert.equal(stringValue(child(child(renderer, 3), 1), 1), '你好Hello')
  assert.equal(stringValue(child(child(renderer, 10), 1), 1), 'Footer & Translated by Google')

  assert.throws(
    () => run('browse', browse, { storage: makeStorage(), settings: { lyricLang: 'en' } }),
    /network permission/,
  )
  assert.throws(
    () => run('browse', browse, {
      storage: makeStorage(),
      network: { request() { return { status: 503, text: 'unavailable' } } },
      settings: { lyricLang: 'en' },
    }),
    /unusable response/,
  )
  assert.throws(
    () => run('browse', browse, {
      storage: makeStorage(),
      network: { request() { return { status: 200, text: '{bad json' } } },
      settings: { lyricLang: 'en' },
    }),
    /JSON/,
  )

  const oversizedShelf = concat(b(3, makeLabel('你'.repeat(1500))), b(10, makeLabel('Footer')))
  const oversizedBrowse = concat(
    b(1, responseContext),
    b(9, b(49399797, b(1, b(221496734, oversizedShelf)))),
  )
  assert.throws(
    () => run('browse', oversizedBrowse, {
      storage: makeStorage(),
      network,
      settings: { lyricLang: 'en' },
    }),
    /URL exceeds/,
  )
}

// Timed lyrics preserve each original line, append its translation, and mark
// the footer using the same exact-origin request path.
{
  const param = concat(s(1, 'browse_id'), s(2, 'MPLYt_timed'))
  const responseContext = b(6, b(2, param))
  const timed = concat(b(1, s(1, '一')), b(1, s(1, '二')), s(2, 'Lyrics'))
  const videoContent = b(465160965, b(4, timed))
  const content = makeBrowseContentWithItems([makeRichRenderer({ eml: '', videoContent })])
  const network = {
    request() {
      return {
        status: 200,
        text: JSON.stringify([[['One', '一'], ['Two', '二']], null, 'zh-CN']),
      }
    },
  }
  const result = run('browse', concat(b(1, responseContext), b(9, content)), {
    storage: makeStorage(),
    network,
    settings: { lyricLang: 'en' },
  })
  const rich = richItemsFromBrowseContent(child(result.response.body, 9))[0].payload
  const renderer = child(child(rich, 153515154), 172660663)
  const outputTimed = child(child(child(child(renderer, 1), 168777401), 5), 465160965)
  const lyricContent = child(outputTimed, 4)
  assert.deepEqual(
    all(lyricContent, 1).map((field) => stringValue(field.payload, 1)),
    ['一\nOne', '二\nTwo'],
  )
  assert.equal(stringValue(lyricContent, 2), 'Lyrics & Translated by Google')
}

// The pinned generic iterator pushes candidates in property/array order and
// consumes them LIFO. The last browse_id and last lyrics candidate therefore
// win when a response contains multiple candidates.
{
  const params = concat(
    b(2, concat(s(1, 'browse_id'), s(2, 'NOT_MUSIC'))),
    b(2, concat(s(1, 'browse_id'), s(2, 'MPLYt_lifo'))),
  )
  const responseContext = b(6, params)
  const firstTimed = b(465160965, b(4, concat(b(1, s(1, 'first')), s(2, 'First footer'))))
  const secondTimed = b(465160965, b(4, concat(b(1, s(1, 'second')), s(2, 'Second footer'))))
  const content = makeBrowseContentWithItems([
    makeRichRenderer({ eml: '', videoContent: firstTimed }),
    makeRichRenderer({ eml: '', videoContent: secondTimed }),
  ])
  const network = {
    request() {
      return { status: 200, text: JSON.stringify([[['Last', 'second']], null, 'en']) }
    },
  }
  const result = run('browse', concat(b(1, responseContext), b(9, content)), {
    storage: makeStorage(),
    network,
    settings: { lyricLang: 'de' },
  })
  const items = richItemsFromBrowseContent(child(result.response.body, 9))
  assert.equal(timedTextFromRichItem(items[0]), 'first')
  assert.equal(timedTextFromRichItem(items[1]), 'second\nLast')
}

// Interleaved duplicate singular fields retain the property position of their
// first occurrence. For #9 A, #10 B, #9 C, pinned Object.keys is #9 then #10,
// so LIFO traversal selects B before the merged A/C value.
{
  const responseContext = b(6, b(2, concat(s(1, 'browse_id'), s(2, 'MPLYt_interleaved'))))
  const contentA = makeTimedBrowseContent('A')
  const contentB = makeTimedBrowseContent('B')
  const contentC = makeTimedBrowseContent('C')
  const browse = concat(
    b(1, responseContext),
    b(9, contentA),
    b(10, contentB),
    b(9, contentC),
  )
  const result = run('browse', browse, {
    storage: makeStorage(),
    network: {
      request() {
        return { status: 200, text: JSON.stringify([[['Translated B', 'B']], null, 'en']) }
      },
    },
    settings: { lyricLang: 'de' },
  })
  const untouchedNine = all(result.response.body, 9)
  assert.equal(untouchedNine.length, 2)
  assert.deepEqual([...untouchedNine[0].payload], [...contentA])
  assert.deepEqual([...untouchedNine[1].payload], [...contentC])
  const selected = richItemsFromBrowseContent(child(result.response.body, 10))[0]
  assert.equal(timedTextFromRichItem(selected), 'B\nTranslated B')
}

// Shorts retains an empty-but-present overlay and removes a missing overlay.
{
  const keep = b(1, b(139608561, b(8, [])))
  const drop = b(1, b(139608561, []))
  const result = run('reel/reel_watch_sequence', concat(b(2, keep), b(2, drop)))
  assert.equal(all(result.response.body, 2).length, 1)
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
