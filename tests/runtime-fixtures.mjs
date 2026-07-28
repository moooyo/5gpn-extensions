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

// weatherkit no longer ships a local script: it runs a published upstream
// bundle under the proxy-compat contract, and that behavior is covered by the
// sidecar runtime tests rather than here.

{
  const { transform } = await loadTransform('zhihu-cleaner/mock-json.js')
  const result = transform({ request: { url: 'https://api.zhihu.com/commercial_api/banner' } })
  assert.equal(result.response.status, 200)
  assert.deepEqual(JSON.parse(result.response.body), {})
}

{
  const { transform } = await loadTransform('bilibili-cleaner/mock-json.js')
  const result = transform({})
  assert.equal(result.response.status, 200)
  assert.deepEqual(JSON.parse(result.response.body), {})
}


{
  const { transform } = await loadTransform('bilibili-cleaner/mock-grpc.js')
  const result = transform({ request: { url: 'https://grpc.biliapi.net/bilibili.app.interface.v1.Teenagers/ModeStatus' } })
  assert.equal(result.response.status, 200)
  assert(result.response.body instanceof Uint8Array)
  assert(result.response.body.length > 5)
}


console.log('Runtime fixtures passed')
