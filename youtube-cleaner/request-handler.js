// Apache-2.0 native port of Maasea/sgmodule's pinned YouTube request behavior.
// The implementation handles only the reviewed log_event and initplayback
// paths. It does not include the upstream generated runtime or client adapters.

const CONFIG_KEY = 'YouTubeConfig'
const CONFIG_MAX_BYTES = 60000
const KEY_MAX_BYTES = 4096
const MAX_FIELDS = 4096
const MAX_DEPTH = 16
const MAX_WORKER_URL_BYTES = 16384
const WORKER_ORIGIN = 'https://init-stream.maasea.workers.dev'
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/
const INITPLAYBACK_PATTERN = /^https?:\/\/[\w-]+\.googlevideo\.com\/initplayback.+&ack.*$/

function headerValue(headers, target) {
  for (const [name, value] of Object.entries(headers || {})) {
    if (name.toLowerCase() !== target) continue
    return Array.isArray(value) ? (value[0] || '') : String(value)
  }
  return ''
}

function platformKey(headers) {
  return headerValue(headers, 'user-agent').includes('music') ? 'youtubeMusic' : 'youtube'
}

function validBase64(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= KEY_MAX_BYTES * 2 &&
    value.length % 4 === 0 &&
    BASE64_PATTERN.test(value)
}

function validatePlatformConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid YouTube key config')
  if (!validBase64(value.clientKey) || !validBase64(value.encryptKey)) throw new Error('invalid YouTube key material')
  return { clientKey: value.clientKey, encryptKey: value.encryptKey }
}

function loadConfig(context) {
  if (!context.storage || typeof context.storage.get !== 'function' || typeof context.storage.set !== 'function') {
    throw new Error('YouTube request handling requires persistent storage permission')
  }
  const raw = context.storage.get(CONFIG_KEY)
  if (raw === null || raw === undefined || raw === '') return {}
  if (typeof raw !== 'string' || raw.length > CONFIG_MAX_BYTES) throw new Error('invalid YouTube key config encoding')
  const parsed = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid YouTube key config')
  const config = {}
  for (const key of Object.keys(parsed)) {
    if (key !== 'youtube' && key !== 'youtubeMusic') throw new Error('invalid YouTube key config platform')
    config[key] = validatePlatformConfig(parsed[key])
  }
  return config
}

function saveConfig(context, config) {
  const raw = JSON.stringify(config)
  if (raw.length > CONFIG_MAX_BYTES) throw new Error('YouTube key config exceeds its storage bound')
  if (!context.storage.set(CONFIG_KEY, raw)) throw new Error('failed to persist YouTube key config')
}

function decodeVarint(bytes, offset) {
  let value = 0n
  for (let index = 0; index < 10; index += 1) {
    if (offset + index >= bytes.length) throw new Error('unexpected end of protobuf varint')
    const byte = bytes[offset + index]
    if (index === 9 && byte > 1) throw new Error('protobuf varint overflows uint64')
    value |= BigInt(byte & 0x7f) << BigInt(index * 7)
    if (byte < 0x80) return { value, length: index + 1 }
  }
  throw new Error('protobuf varint is too long')
}

function skipWireValue(bytes, offset, wireType, fieldNumber, depth, budget) {
  if (depth > MAX_DEPTH) throw new Error('protobuf nesting exceeds its bound')
  if (wireType === 0) return offset + decodeVarint(bytes, offset).length
  if (wireType === 1) return offset + 8
  if (wireType === 2) {
    const length = decodeVarint(bytes, offset)
    const start = offset + length.length
    if (length.value > BigInt(bytes.length - start)) throw new Error('protobuf field exceeds its message')
    return start + Number(length.value)
  }
  if (wireType === 3) {
    let cursor = offset
    while (cursor < bytes.length) {
      budget.count += 1
      if (budget.count > MAX_FIELDS) throw new Error('protobuf field count exceeds its bound')
      const tag = decodeVarint(bytes, cursor)
      cursor += tag.length
      const numberValue = tag.value >> 3n
      const nestedType = Number(tag.value & 7n)
      if (numberValue === 0n || numberValue > 536870911n) throw new Error('invalid protobuf field number')
      const nestedNumber = Number(numberValue)
      if (nestedType === 4) {
        if (nestedNumber !== fieldNumber) throw new Error('protobuf group end does not match its start')
        return cursor
      }
      cursor = skipWireValue(bytes, cursor, nestedType, nestedNumber, depth + 1, budget)
      if (cursor > bytes.length) throw new Error('protobuf field exceeds its message')
    }
    throw new Error('unterminated protobuf group')
  }
  if (wireType === 4) throw new Error('unexpected protobuf end-group tag')
  if (wireType === 5) return offset + 4
  throw new Error(`unsupported protobuf wire type ${wireType}`)
}

function forEachLengthField(bytes, wantedNumber, depth, budget, visitor) {
  if (depth > MAX_DEPTH) throw new Error('protobuf nesting exceeds its bound')
  let offset = 0
  while (offset < bytes.length) {
    budget.count += 1
    if (budget.count > MAX_FIELDS) throw new Error('protobuf field count exceeds its bound')
    const tag = decodeVarint(bytes, offset)
    offset += tag.length
    const numberValue = tag.value >> 3n
    const wireType = Number(tag.value & 7n)
    if (numberValue === 0n || numberValue > 536870911n) throw new Error('invalid protobuf field number')
    const number = Number(numberValue)
    if (wireType === 2) {
      const length = decodeVarint(bytes, offset)
      offset += length.length
      if (length.value > BigInt(bytes.length - offset)) throw new Error('protobuf field exceeds its message')
      const end = offset + Number(length.value)
      if (number === wantedNumber) visitor(bytes.subarray(offset, end))
      offset = end
    } else {
      offset = skipWireValue(bytes, offset, wireType, number, depth, budget)
    }
    if (offset > bytes.length) throw new Error('protobuf field exceeds its message')
  }
}

function encryptedClientKey(body) {
  const budget = { count: 0 }
  let key = null
  forEachLengthField(body, 3, 0, budget, (root) => {
    forEachLengthField(root, 5, 1, budget, (value) => { key = value })
  })
  return key
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64Bytes(value) {
  if (!validBase64(value)) throw new Error('invalid YouTube base64 key')
  const padding = value.endsWith('==') ? 2 : (value.endsWith('=') ? 1 : 0)
  const output = new Uint8Array((value.length / 4) * 3 - padding)
  let offset = 0
  for (let index = 0; index < value.length; index += 4) {
    const a = BASE64_ALPHABET.indexOf(value[index])
    const b = BASE64_ALPHABET.indexOf(value[index + 1])
    const c = value[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 2])
    const d = value[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 3])
    if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error('invalid YouTube base64 key')
    const combined = (a << 18) | (b << 12) | (c << 6) | d
    if (offset < output.length) output[offset++] = (combined >> 16) & 0xff
    if (offset < output.length) output[offset++] = (combined >> 8) & 0xff
    if (offset < output.length) output[offset++] = combined & 0xff
  }
  if (output.length > KEY_MAX_BYTES) throw new Error('YouTube key exceeds its bound')
  return output
}

function equalBytes(left, right) {
  if (!left || left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

function captionLanguage(settings) {
  const value = settings && settings.captionLang !== undefined ? settings.captionLang : 'off'
  if (typeof value !== 'string') throw new Error('captionLang must be a string')
  const trimmed = value.trim()
  if (trimmed === 'off') return trimmed
  if (trimmed.length > 32 || !LANGUAGE_PATTERN.test(trimmed)) {
    throw new Error('captionLang is not a bounded language code or off')
  }
  return trimmed
}

function workerURL(context, clientKey) {
  const params = [
    `ck=${encodeURIComponent(clientKey)}`,
    `target=${encodeURIComponent(context.request.url)}`,
    `captionLang=${encodeURIComponent(captionLanguage(context.settings))}`,
    'blockUpload=true',
    'blockImmersive=true',
    'blockShorts=false',
  ]
  const url = `${WORKER_ORIGIN}/?${params.join('&')}`
  if (url.length > MAX_WORKER_URL_BYTES) throw new Error('YouTube Worker URL exceeds its native bound')
  return url
}

function patchLogEvent(context, config, key) {
  const headers = { ...(context.request.headers || {}) }
  let changed = false
  const hasClientKey = Boolean(config[key] && config[key].clientKey)
  for (const name of Object.keys(headers)) {
    const lower = name.toLowerCase()
    if (lower === 'content-encoding' || (!hasClientKey && lower === 'x-youtube-hot-hash-data')) {
      delete headers[name]
      changed = true
    }
  }
  return changed ? { request: { headers } } : null
}

function patchInitPlayback(context, config, key) {
  const body = context.request.body
  if (!(body instanceof Uint8Array)) throw new Error('YouTube initplayback request is not a binary body')
  const cached = config[key]
  if (cached) {
    const requestKey = encryptedClientKey(body)
    if (requestKey && equalBytes(requestKey, base64Bytes(cached.encryptKey))) {
      return { request: { url: workerURL(context, cached.clientKey) } }
    }
    delete config[key]
    saveConfig(context, config)
  }
  return {
    response: {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: new Uint8Array(0),
    },
  }
}

function transform(context) {
  const path = context.request.url.split('?', 1)[0]
  if (path.endsWith('/youtubei/v1/log_event')) {
    const config = loadConfig(context)
    return patchLogEvent(context, config, platformKey(context.request.headers))
  }
  if (path.includes('/initplayback')) {
    if (!INITPLAYBACK_PATTERN.test(context.request.url)) return null
    const config = loadConfig(context)
    return patchInitPlayback(context, config, platformKey(context.request.headers))
  }
  throw new Error('unexpected YouTube request endpoint')
}
