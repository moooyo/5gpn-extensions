import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const root = path.resolve(import.meta.dirname, '..')

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
  assert.equal(typeof sandbox.transform, 'function', `${relativePath} has no transform`)
  return { transform: sandbox.transform, messages }
}

function varint(value) {
  const bytes = []
  let remaining = BigInt(value)
  while (remaining >= 0x80n) {
    bytes.push(Number(remaining & 0x7fn) | 0x80)
    remaining >>= 7n
  }
  bytes.push(Number(remaining))
  return bytes
}

function varintField(field, value) {
  return [...varint(BigInt(field << 3)), ...varint(value)]
}

function lengthField(field, bytes) {
  return [...varint(BigInt((field << 3) | 2)), ...varint(BigInt(bytes.length)), ...bytes]
}

{
  const { transform } = await loadTransform('ad-platform-blocker/block.js')
  assert.equal(transform({}).abort, true)
}

{
  const { transform } = await loadTransform('httpdns-interceptor/block.js')
  assert.equal(transform({}).abort, true)
}

{
  const { transform } = await loadTransform('testflight-region-unlock/rewrite-storefront.js')
  const result = transform({ settings: { storefront: 'HK' }, request: { body: '{"storefrontId":"143441-19,29"}' } })
  assert.equal(result.request.body, '{"storefrontId":"143463-19,29"}')
  assert.equal(transform({ settings: { storefront: 'US' }, request: { body: '{}' } }), null)
}

{
  const { transform } = await loadTransform('youtube-cleaner/block-initplayback.js')
  const result = transform({ request: { url: 'https://r1.googlevideo.com/initplayback?a=1&oad=1' } })
  assert.equal(result.response.status, 200)
}

{
  const { transform } = await loadTransform('youtube-cleaner/clean-player.js')
  const unrelated = lengthField(1, [0x01])
  const player = new Uint8Array([
    ...unrelated,
    ...lengthField(7, [0x02]),
    ...lengthField(68, [0x03]),
  ])
  const result = transform({
    request: { url: 'https://youtubei.googleapis.com/youtubei/v1/player' },
    response: { body: player },
  })
  assert.deepEqual([...result.response.body], unrelated)
}

{
  const { transform } = await loadTransform('bilibili-cleaner/mock-json.js')
  const result = transform({})
  assert.equal(result.response.status, 200)
  assert.deepEqual(JSON.parse(result.response.body), {})
}

{
  const { transform } = await loadTransform('bilibili-cleaner/clean-json.js')
  const result = transform({
    request: { url: 'https://app.bilibili.com/x/v2/feed/index' },
    response: {
      body: JSON.stringify({
        code: 0,
        data: {
          items: [
            { id: 'ad', card_goto: 'av', card_type: 'small_cover_v2', ad_info: {} },
            { id: 'keep', card_goto: 'av', card_type: 'small_cover_v2' },
          ],
        },
      }),
    },
  })
  assert.deepEqual(JSON.parse(result.response.body).data.items, [{ id: 'keep', card_goto: 'av', card_type: 'small_cover_v2' }])

  const tabResult = transform({
    request: { url: 'https://app.bilibili.com/x/resource/show/tab/v2' },
    response: { body: JSON.stringify({ code: 0, data: {} }) },
  })
  const tabData = JSON.parse(tabResult.response.body).data
  assert.deepEqual(tabData.tab.map((item) => item.id), [731, 477, 478, 3502, 3503])
}

{
  const { transform } = await loadTransform('bilibili-cleaner/mock-grpc.js')
  const result = transform({ request: { url: 'https://grpc.biliapi.net/bilibili.app.interface.v1.Teenagers/ModeStatus' } })
  assert.equal(result.response.status, 200)
  assert(result.response.body instanceof Uint8Array)
  assert(result.response.body.length > 5)
}

{
  const { transform } = await loadTransform('apple-wloc/wloc.js')
  const location = [...varintField(1, 1), ...varintField(2, 2), ...varintField(3, 99)]
  const wifi = [...lengthField(1, [...Buffer.from('aa:bb:cc:dd:ee:ff')]), ...lengthField(2, location)]
  const payload = lengthField(2, wifi)
  const frame = new Uint8Array(10 + payload.length)
  frame[8] = payload.length >> 8
  frame[9] = payload.length & 0xff
  frame.set(payload, 10)
  const result = transform({
    response: { body: frame },
    settings: { location: { longitude: -0.1276, latitude: 51.5072, accuracy: 25 }, failClosed: true },
  })
  assert(result.response.body instanceof Uint8Array)
  assert.notDeepEqual([...result.response.body], [...frame])
}

console.log('Runtime fixtures passed')
