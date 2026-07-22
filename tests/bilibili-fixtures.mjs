import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { gzipSync } from 'node:zlib'
import { parse as parseYaml } from 'yaml'

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
    Number,
    Object,
    RegExp,
    Set,
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
  new vm.Script(source, { filename }).runInContext(sandbox)
  assert.equal(typeof sandbox.transform, 'function', `${relativePath} has no transform(context)`)
  return { transform: sandbox.transform, messages }
}

function concat(...parts) {
  const flat = parts.flatMap(part => Array.from(part))
  return new Uint8Array(flat)
}

function varint(value) {
  let remaining = BigInt(value)
  const bytes = []
  while (remaining >= 0x80n) {
    bytes.push(Number(remaining & 0x7fn) | 0x80)
    remaining >>= 7n
  }
  bytes.push(Number(remaining))
  return new Uint8Array(bytes)
}

function varintField(number, value) {
  return concat(varint(number << 3), varint(value))
}

function bytesField(number, bytes) {
  return concat(varint((number << 3) | 2), varint(bytes.length), bytes)
}

function stringField(number, value) {
  return bytesField(number, new TextEncoder().encode(value))
}

function messageField(number, ...fields) {
  return bytesField(number, concat(...fields))
}

function readVarint(bytes, start) {
  let value = 0n
  let shift = 0n
  let offset = start
  while (offset < bytes.length) {
    const byte = bytes[offset]
    value |= BigInt(byte & 0x7f) << shift
    offset += 1
    if (!(byte & 0x80)) return { value, offset }
    shift += 7n
    if (shift > 70n) throw new Error('Invalid fixture varint')
  }
  throw new Error('Truncated fixture varint')
}

function parseFields(bytes) {
  const output = []
  let offset = 0
  while (offset < bytes.length) {
    const start = offset
    const tag = readVarint(bytes, offset)
    offset = tag.offset
    const number = Number(tag.value >> 3n)
    const wire = Number(tag.value & 7n)
    let value
    if (wire === 0) {
      const decoded = readVarint(bytes, offset)
      value = decoded.value
      offset = decoded.offset
    } else if (wire === 1) {
      value = bytes.slice(offset, offset + 8)
      offset += 8
    } else if (wire === 2) {
      const length = readVarint(bytes, offset)
      offset = length.offset
      value = bytes.slice(offset, offset + Number(length.value))
      offset += Number(length.value)
    } else if (wire === 5) {
      value = bytes.slice(offset, offset + 4)
      offset += 4
    } else {
      throw new Error(`Unsupported fixture wire type ${wire}`)
    }
    if (offset > bytes.length) throw new Error('Truncated fixture field')
    output.push({ number, wire, value, raw: bytes.slice(start, offset) })
  }
  return output
}

function fieldList(bytes, number) {
  return parseFields(bytes).filter(field => field.number === number)
}

function onlyField(bytes, number) {
  const matches = fieldList(bytes, number)
  assert.equal(matches.length, 1, `expected one field ${number}, got ${matches.length}`)
  return matches[0]
}

function text(field) {
  assert.equal(field.wire, 2)
  return new TextDecoder().decode(field.value)
}

function grpcFrame(message, compressed = false) {
  const body = compressed ? new Uint8Array(gzipSync(message)) : message
  return concat(
    new Uint8Array([
      compressed ? 1 : 0,
      body.length >>> 24,
      (body.length >>> 16) & 0xff,
      (body.length >>> 8) & 0xff,
      body.length & 0xff,
    ]),
    body,
  )
}

function grpcMessage(frame) {
  assert.equal(frame[0], 0, 'native output must be an uncompressed gRPC frame')
  const length = ((frame[1] << 24) | (frame[2] << 16) | (frame[3] << 8) | frame[4]) >>> 0
  assert.equal(length, frame.length - 5)
  return frame.slice(5)
}

function responseContext(pathname, body, settings = {}, headers = {}) {
  return {
    phase: 'response',
    request: {
      url: `https://grpc.biliapi.net/${pathname}`,
      method: 'POST',
      headers,
    },
    response: { status: 200, headers: { 'Content-Type': 'application/grpc' }, body },
    settings,
  }
}

function transformResponse(transform, pathname, message, settings = {}, headers = {}, compressed = false) {
  const result = transform(responseContext(pathname, grpcFrame(message, compressed), settings, headers))
  assert.ok(result?.response?.body instanceof Uint8Array, `${pathname} did not return a binary body`)
  return grpcMessage(result.response.body)
}

const { transform: protobufTransform, messages: protobufLogs } = await loadTransform('bilibili-cleaner/protobuf.js')

{
  const dynamicList = messageField(
    1,
    messageField(1, varintField(1, 15)),
    messageField(1, varintField(1, 18)),
    messageField(1, varintField(1, 1)),
  )
  const upList = messageField(
    2,
    messageField(2),
    varintField(4, 1),
    messageField(10),
  )
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.dynamic.v2.Dynamic/DynAll',
    concat(dynamicList, upList, bytesField(3, new Uint8Array([1]))),
    { showUpList: 'auto' },
  )
  assert.equal(fieldList(output, 3).length, 0)
  const list = onlyField(output, 1).value
  assert.equal(fieldList(list, 1).length, 1)
  assert.equal(onlyField(onlyField(list, 1).value, 1).value, 1n)
  const processedUpList = onlyField(output, 2).value
  assert.equal(fieldList(processedUpList, 2).length, 2)
  assert.equal(fieldList(processedUpList, 10).length, 0)
  assert.equal(onlyField(fieldList(processedUpList, 2)[0].value, 11).value, 1n)
}

{
  const arcConf = concat(
    varintField(1, 1),
    varintField(2, 1),
    messageField(3, stringField(1, 'blocked')),
    varintField(4, 9),
  )
  const mapEntry = concat(varintField(1, 9), messageField(2, arcConf))
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.playerunite.v1.Player/PlayViewUnite',
    concat(messageField(2, messageField(1, mapEntry)), messageField(9, bytesField(2, new Uint8Array([1])))),
  )
  assert.equal(fieldList(onlyField(output, 9).value, 2).length, 0)
  const conf = onlyField(onlyField(onlyField(output, 2).value, 1).value, 2).value
  assert.equal(onlyField(conf, 1).value, 1n)
  assert.equal(fieldList(conf, 2).length, 0)
  assert.equal(fieldList(conf, 3).length, 0)
  assert.equal(fieldList(conf, 4).length, 0)
}

{
  const disabled = concat(varintField(2, 1), messageField(3), varintField(4, 8))
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.playurl.v1.PlayURL/PlayView',
    messageField(5, messageField(1, disabled), messageField(3, disabled)),
  )
  const playArc = onlyField(output, 5).value
  for (const number of [1, 3]) {
    const conf = onlyField(playArc, number).value
    assert.equal(onlyField(conf, 1).value, 1n)
    assert.equal(fieldList(conf, 2).length, 0)
    assert.equal(fieldList(conf, 3).length, 0)
    assert.equal(fieldList(conf, 4).length, 0)
  }
}

{
  const recommended = messageField(1, messageField(1, stringField(14, 'recommend')))
  const advertised = messageField(
    1,
    messageField(1, bytesField(12, new Uint8Array([1])), stringField(14, 'recommend')),
  )
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.show.v1.Popular/Index',
    concat(messageField(1, bytesField(10, new Uint8Array([1]))), messageField(1, recommended), messageField(1, advertised), messageField(1)),
  )
  assert.equal(fieldList(output, 1).length, 2)
}

{
  const unknown = stringField(99, 'preserve')
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.view.v1.View/View',
    concat(
      messageField(4, bytesField(9, new Uint8Array([1]))),
      messageField(10, bytesField(28, new Uint8Array([1]))),
      messageField(10),
      bytesField(23, new Uint8Array([1])),
      bytesField(30, new Uint8Array([1])),
      bytesField(31, new Uint8Array([1])),
      bytesField(41, new Uint8Array([1])),
      bytesField(50, new Uint8Array([1])),
      unknown,
    ),
  )
  for (const number of [23, 30, 31, 41, 50]) assert.equal(fieldList(output, number).length, 0)
  assert.equal(fieldList(onlyField(output, 4).value, 9).length, 0)
  assert.equal(fieldList(output, 10).length, 1)
  assert.deepEqual(Array.from(onlyField(output, 99).raw), Array.from(unknown))
}

{
  const chronos = concat(stringField(1, 'unknown'), stringField(2, 'old'), stringField(3, 'signature'))
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.view.v1.View/ViewProgress',
    concat(bytesField(1, new Uint8Array([1])), messageField(2, chronos)),
  )
  assert.equal(fieldList(output, 1).length, 0)
  const processed = onlyField(output, 2).value
  assert.equal(text(onlyField(processed, 1)), 'ecca73e42e160074e0caf4b3ddb54a52')
  assert.match(text(onlyField(processed, 2)), /a96c334eb6e46d4403740c0258d064d33321a03a\/ecca73e42e160074e0caf4b3ddb54a52\.zip$/)
  assert.equal(fieldList(processed, 3).length, 0)
  assert.ok(protobufLogs.some(message => message[0] === 'warn' && String(message[1]).includes('MD5 mismatch')))

  const disabled = transformResponse(
    protobufTransform,
    'bilibili.app.view.v1.View/ViewProgress',
    concat(bytesField(1, new Uint8Array([1])), messageField(2, chronos)),
    { airborne: false },
  )
  const unchanged = onlyField(disabled, 2).value
  assert.equal(text(onlyField(unchanged, 1)), 'unknown')
  assert.equal(text(onlyField(unchanged, 2)), 'old')
  assert.equal(text(onlyField(unchanged, 3)), 'signature')
}

{
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.viewunite.v1.View/RelatesFeed',
    concat(
      messageField(1, varintField(1, 4)),
      messageField(1, bytesField(11, new Uint8Array([1]))),
      messageField(1, messageField(12, stringField(6, 'unique'))),
      messageField(1, varintField(1, 1)),
    ),
  )
  assert.equal(fieldList(output, 1).length, 1)
  assert.equal(onlyField(fieldList(output, 1)[0].value, 1).value, 1n)
}

{
  const blockedModule = concat(varintField(1, 18))
  const headlineModule = concat(varintField(1, 3), messageField(5, bytesField(1, new Uint8Array([1]))))
  const relatedCards = messageField(
    22,
    messageField(1, varintField(1, 4)),
    messageField(1, varintField(1, 1)),
  )
  const relatedModule = concat(varintField(1, 28), relatedCards)
  const introduction = messageField(
    2,
    messageField(2, blockedModule),
    messageField(2, headlineModule),
    messageField(2, relatedModule),
    messageField(2),
  )
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.viewunite.v1.View/View',
    concat(messageField(3, bytesField(7, new Uint8Array([1]))), messageField(5, messageField(1, introduction)), bytesField(7, new Uint8Array([1]))),
  )
  assert.equal(fieldList(output, 7).length, 0)
  assert.equal(fieldList(onlyField(output, 3).value, 7).length, 0)
  const tabModule = onlyField(onlyField(output, 5).value, 1).value
  const modules = fieldList(onlyField(tabModule, 2).value, 2)
  assert.equal(modules.length, 3)
  const headline = modules.find(module => fieldList(module.value, 1)[0]?.value === 3n)
  assert.equal(fieldList(onlyField(headline.value, 5).value, 1).length, 0)
  const related = modules.find(module => fieldList(module.value, 1)[0]?.value === 28n)
  assert.equal(fieldList(onlyField(related.value, 22).value, 1).length, 1)
}

{
  const chronos = concat(stringField(1, 'unknown'), stringField(2, 'old'), stringField(3, 'signature'))
  const output = transformResponse(
    protobufTransform,
    'bilibili.app.viewunite.v1.View/ViewProgress',
    concat(messageField(2, chronos), bytesField(4, new Uint8Array([1]))),
    {},
    { 'User-Agent': 'bili-hd/8.0' },
  )
  assert.equal(fieldList(output, 4).length, 0)
  assert.equal(text(onlyField(onlyField(output, 2).value, 1)), '932002070dc1b51241198a074d2279fc')
}

{
  const output = transformResponse(
    protobufTransform,
    'bilibili.community.service.dm.v1.DM/DmView',
    concat(stringField(18, 'activity'), messageField(22, bytesField(1, new Uint8Array([1])))),
  )
  assert.equal(fieldList(output, 18).length, 0)
  assert.equal(fieldList(onlyField(output, 22).value, 1).length, 0)
}

{
  const cleanReply = messageField(14, messageField(12, stringField(1, 'clean')))
  const messageAd = messageField(14, messageField(12, stringField(1, 'https://b23.tv/cm/example')))
  const mapEntry = concat(stringField(1, 'https://b23.tv/mall/example'), messageField(2))
  const urlAd = messageField(14, messageField(12, messageField(5, mapEntry)))
  const output = transformResponse(
    protobufTransform,
    'bilibili.main.community.reply.v1.Reply/MainList',
    concat(
      bytesField(11, new Uint8Array([1])),
      cleanReply,
      messageAd,
      urlAd,
      messageField(28, varintField(1, 3)),
      messageField(28, varintField(1, 1)),
    ),
  )
  assert.equal(fieldList(output, 11).length, 0)
  assert.equal(fieldList(output, 14).length, 1)
  assert.equal(fieldList(output, 28).length, 1)
  const unfiltered = transformResponse(
    protobufTransform,
    'bilibili.main.community.reply.v1.Reply/MainList',
    concat(cleanReply, messageAd, urlAd),
    { purifyTopReplies: false },
  )
  assert.equal(fieldList(unfiltered, 14).length, 3)
}

{
  const output = transformResponse(
    protobufTransform,
    'bilibili.pgc.gateway.player.v2.PlayURL/PlayView',
    concat(
      messageField(5, bytesField(8, new Uint8Array([1]))),
      messageField(6, messageField(3, varintField(1, 5), stringField(2, 'blocked'))),
    ),
  )
  assert.equal(fieldList(onlyField(output, 5).value, 8).length, 0)
  const castTips = onlyField(onlyField(output, 6).value, 3).value
  assert.equal(fieldList(castTips, 1).length, 0)
  assert.equal(fieldList(castTips, 2).length, 0)
}

{
  const output = transformResponse(
    protobufTransform,
    'bilibili.polymer.app.search.v1.Search/SearchAll',
    concat(messageField(4, stringField(4, 'video_ad_item')), messageField(4, stringField(4, 'video'))),
    {},
    {},
    true,
  )
  assert.equal(fieldList(output, 4).length, 1)
  assert.equal(text(onlyField(fieldList(output, 4)[0].value, 4)), 'video')

  const trailerResult = protobufTransform({
    ...responseContext(
      'bilibili.polymer.app.search.v1.Search/SearchAll',
      grpcFrame(messageField(4, stringField(4, 'video'))),
    ),
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/grpc' },
      trailers: { 'Grpc-Status': '0', 'Grpc-Message': '' },
      body: grpcFrame(messageField(4, stringField(4, 'video'))),
    },
  })
  assert.deepEqual(trailerResult.response.trailers, { 'Grpc-Status': '0', 'Grpc-Message': '' })
}

{
  const oversized = new Uint8Array(8 * 1024 * 1024 + 1)
  const result = protobufTransform(
    responseContext(
      'bilibili.polymer.app.search.v1.Search/SearchAll',
      grpcFrame(oversized, true),
      { logLevel: 'off' },
    ),
  )
  assert.equal(result, null, 'oversized decompressed gRPC messages must be rejected')
}

{
  const noOp = protobufTransform(
    responseContext('bilibili.app.view.v1.View/RelatesFeed', grpcFrame(new Uint8Array()), {}),
  )
  assert.equal(noOp, null)
  const malformed = protobufTransform(
    responseContext('bilibili.app.show.v1.Popular/Index', new Uint8Array([0, 0]), { logLevel: 'error' }),
  )
  assert.equal(malformed, null)
  assert.ok(protobufLogs.some(message => message[0] === 'error'))
  const logCount = protobufLogs.length
  assert.equal(
    protobufTransform(
      responseContext('bilibili.app.show.v1.Popular/Index', new Uint8Array([0, 0]), { logLevel: 'off' }),
    ),
    null,
  )
  assert.equal(protobufLogs.length, logCount)
  const debugCount = protobufLogs.length
  protobufTransform(
    responseContext(
      'bilibili.polymer.app.search.v1.Search/SearchAll',
      grpcFrame(new Uint8Array()),
      { logLevel: 'debug' },
    ),
  )
  assert.ok(protobufLogs.slice(debugCount).some(message => message[0] === 'debug'))
}

{
  const requestBody = grpcFrame(concat(varintField(1, 170001), varintField(2, 123), varintField(3, 1)))
  const replayBody = grpcFrame(new Uint8Array())
  const calls = []
  const network = {
    request(options) {
      calls.push(options)
      if (options.url.startsWith('https://bsbsb.top/')) {
        return {
          url: options.url,
          status: 200,
          headers: { 'Content-Type': ['application/json'] },
          body: new Uint8Array(),
          text: JSON.stringify([
            { actionType: 'skip', segment: [10, 20] },
            { actionType: 'skip', segment: [1, 5] },
          ]),
        }
      }
      return {
        url: options.url,
        status: 200,
        headers: { 'Content-Type': ['application/grpc'], 'Content-Length': ['5'] },
        trailers: { 'Grpc-Status': ['0'], 'Grpc-Message': [''] },
        body: replayBody,
      }
    },
  }
  const result = protobufTransform({
    phase: 'request',
    request: {
      url: 'https://grpc.biliapi.net/bilibili.community.service.dm.v1.DM/DmSegMobile',
      method: 'POST',
      headers: {
        Authorization: 'token',
        Connection: 'keep-alive',
        Host: 'grpc.biliapi.net',
        'Content-Length': String(requestBody.length),
        TE: 'trailers',
      },
      body: requestBody,
    },
    settings: { airborne: true },
    network,
  })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://grpc.biliapi.net/bilibili.community.service.dm.v1.DM/DmSegMobile')
  assert.deepEqual(Object.entries(calls[0].headers).sort(), [['Authorization', 'token'], ['TE', 'trailers']])
  assert.match(calls[1].url, /^https:\/\/bsbsb\.top\/api\/skipSegments\?videoID=BV/)
  assert.equal(result.response.status, 200)
  assert.equal(result.response.headers['Content-Length'], undefined)
  assert.deepEqual(result.response.trailers, { 'Grpc-Status': ['0'], 'Grpc-Message': [''] })
  const response = grpcMessage(result.response.body)
  const danmaku = onlyField(response, 1).value
  assert.equal(onlyField(danmaku, 2).value, 12000n)
  assert.equal(text(onlyField(danmaku, 7)), '空指部已就位')
  assert.equal(text(onlyField(danmaku, 10)), 'airborne:20000')
  let disabledCalls = 0
  assert.equal(
    protobufTransform({
      phase: 'request',
      request: { url: calls[0].url, method: 'POST', headers: {}, body: requestBody },
      settings: { airborne: false },
      network: { request() { disabledCalls += 1 } },
    }),
    null,
  )
  assert.equal(disabledCalls, 0)

  assert.equal(
    protobufTransform({
      phase: 'request',
      request: { url: calls[0].url, method: 'POST', headers: {}, body: requestBody },
      settings: { airborne: true, logLevel: 'off' },
      network: { request() { throw new Error('replay unavailable') } },
    }),
    null,
  )

  let sponsorCalls = 0
  const sponsorFailure = protobufTransform({
    phase: 'request',
    request: { url: calls[0].url, method: 'POST', headers: {}, body: requestBody },
    settings: { airborne: true, logLevel: 'off' },
    network: {
      request() {
        sponsorCalls += 1
        if (sponsorCalls === 1) {
          return { url: calls[0].url, status: 200, headers: {}, trailers: { 'Grpc-Status': ['0'] }, body: replayBody }
        }
        throw new Error('sponsor unavailable')
      },
    },
  })
  assert.equal(sponsorCalls, 2)
  assert.deepEqual(Array.from(sponsorFailure.response.body), Array.from(replayBody))
  assert.deepEqual(sponsorFailure.response.trailers, { 'Grpc-Status': ['0'] })

  let invalidTEHeaders
  protobufTransform({
    phase: 'request',
    request: { url: calls[0].url, method: 'POST', headers: { TE: 'gzip' }, body: requestBody },
    settings: { airborne: true, logLevel: 'off' },
    network: {
      request(options) {
        invalidTEHeaders = options.headers
        return { url: options.url, status: 500, headers: {}, trailers: {}, body: new Uint8Array() }
      },
    },
  })
  assert.equal(Object.keys(invalidTEHeaders).length, 0)
}

const { transform: cleanJson } = await loadTransform('bilibili-cleaner/clean-json.js')
const { transform: mockJson } = await loadTransform('bilibili-cleaner/mock-json.js')
const { transform: mockGrpc } = await loadTransform('bilibili-cleaner/mock-grpc.js')
const { transform: rewriteChannel } = await loadTransform('bilibili-cleaner/rewrite-channel.js')
const { transform: injectLivePage } = await loadTransform('bilibili-cleaner/inject-live-page.js')

function cleanDocument(url, document) {
  const result = cleanJson({ request: { url }, response: { body: JSON.stringify(document) }, settings: {} })
  return JSON.parse(result.response.body)
}

{
  const output = cleanDocument('https://app.bilibili.com/x/resource/show/tab/v2?fnval=1', { data: {} })
  assert.equal(output.data.tab.length, 5)
  assert.equal(output.data.top.length, 1)
  assert.deepEqual(output.data.bottom.map(item => item.id), [177, 179, 181])
}

{
  const output = cleanDocument('https://app.bilibili.com/x/v2/account/mine?build=1', {
    data: {
      answer: true,
      live_tip: true,
      vip_section: {},
      vip_section_v2: {},
      modular_vip_section: {},
      vip_type: 0,
      vip: { status: 0, retained: 'yes' },
      sections_v2: [{}],
      ipad_sections: [{}],
      ipad_upper_sections: [{}],
      ipad_recommend_sections: [{}],
      ipad_more_sections: [{}],
    },
  })
  for (const key of ['answer', 'live_tip', 'vip_section', 'vip_section_v2', 'modular_vip_section']) {
    assert.equal(key in output.data, false)
  }
  assert.equal(output.data.vip_type, 2)
  assert.deepEqual(
    { status: output.data.vip.status, type: output.data.vip.type, due_date: output.data.vip.due_date, role: output.data.vip.role },
    { status: 1, type: 2, due_date: 9005270400000, role: 15 },
  )
  assert.equal(output.data.vip.retained, 'yes')
  assert.deepEqual(output.data.sections_v2.map(section => section.items.map(item => item.id)), [
    [396, 397, 3072, 2830],
    [402, 622, 404, 406],
    [407, 410],
  ])
  assert.deepEqual(output.data.ipad_sections.map(item => item.id), [747, 748, 749, 750])
  assert.deepEqual(output.data.ipad_upper_sections.map(item => item.id), [752])
  assert.deepEqual(output.data.ipad_recommend_sections.map(item => item.id), [755, 756])
  assert.deepEqual(output.data.ipad_more_sections.map(item => item.id), [763, 764])
}

{
  const promoted = cleanDocument('https://app.bilibili.com/x/v2/account/myinfo?build=1', {
    data: { vip: { status: 0, label: 'keep' } },
  })
  assert.equal(promoted.data.vip.status, 1)
  assert.equal(promoted.data.vip.label, 'keep')
  const active = cleanDocument('https://app.bilibili.com/x/v2/account/myinfo?build=1', {
    data: { vip: { status: 1, type: 9 } },
  })
  assert.deepEqual(active.data.vip, { status: 1, type: 9 })
  const missing = cleanDocument('https://app.bilibili.com/x/v2/account/myinfo?build=1', { data: {} })
  assert.equal(missing.data.vip, null)
}

{
  const output = cleanDocument('https://api.bilibili.com/x/pd-proxy/tracker?build=1', {
    data: [[1, 2], { first: 3, second: 4 }],
  })
  assert.deepEqual(output.data, [
    ['stun.chat.bilibili.com:3478', 'stun.chat.bilibili.com:3478'],
    { first: 'stun.chat.bilibili.com:3478', second: 'stun.chat.bilibili.com:3478' },
  ])
}

{
  const output = cleanDocument('https://api.live.bilibili.com/xlive/app-interface/v2/index/feed?build=1', {
    data: {
      play_together_info: {},
      play_together_info_v2: {},
      activity_banner_info: {},
      function_card: { first: 1, second: 2 },
      new_tab_info: { outer_list: [{ biz_id: 33 }, { biz_id: 1 }] },
      card_list: [{ card_type: 'banner_v2' }, { card_type: 'video' }],
      show_reserve_status: 1,
      reserve_info: { show_reserve_status: 1 },
      shopping_info: { is_show: 1 },
    },
  })
  assert.equal('play_together_info' in output.data, false)
  assert.deepEqual(output.data.function_card, { first: null, second: null })
  assert.deepEqual(output.data.new_tab_info.outer_list, [{ biz_id: 1 }])
  assert.deepEqual(output.data.card_list, [{ card_type: 'video' }])
  assert.equal(output.data.show_reserve_status, false)
  assert.equal(output.data.reserve_info.show_reserve_status, false)
  assert.equal(output.data.shopping_info.is_show, 0)
}

{
  const output = cleanDocument('https://app.bilibili.com/x/v2/feed/index/story?build=1', {
    data: {
      items: [
        { card_goto: 'vertical_ad_av' },
        { card_goto: 'vertical_av', story_cart_icon: 1, game_info: 1 },
      ],
    },
  })
  assert.deepEqual(output.data.items, [{ card_goto: 'vertical_av' }])
}

{
  const cases = [
    ['https://api.live.bilibili.com/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info?room=1', '{}'],
    ['https://line3-h5-mobile-api.biligame.com/game/live/large_card_material?room=1', '{}'],
    ['https://app.bilibili.com/x/resource/top/activity?build=1', '{"code":-404,"message":"-404","ttl":1,"data":null}'],
    ['https://api.bilibili.com/pgc/activity/deliver/material/receive?build=1', '{"code":0,"data":{"closeType":"close_win","container":[],"showTime":""},"message":"success"}'],
  ]
  for (const [url, expected] of cases) {
    const result = mockJson({ request: { url } })
    assert.equal(result.response.status, 200)
    assert.equal(result.response.body, expected)
  }
}

{
  const rewritten = rewriteChannel({
    request: { url: 'https://api.bilibili.com/pgc/page/channel?foo=1&mobi_app=iphone&bar=2' },
  })
  assert.match(rewritten.request.url, /mobi_app=iphone_i/)
  assert.equal(
    rewriteChannel({ request: { url: 'https://api.bilibili.com/pgc/page/channel?mobi_app=iphone&bar=2' } }),
    null,
  )
}

{
  const expected = new Map([
    ['Teenagers/ModeStatus', 'AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA'],
    ['Search/DefaultWords', 'AAAAACkaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7IgAoAToAQgBKAA=='],
    ['View/TFInfo', 'AAAAAAIIAQ=='],
  ])
  for (const [suffix, encoded] of expected) {
    const prefix = suffix.startsWith('Teenagers') || suffix.startsWith('Search')
      ? 'bilibili.app.interface.v1.'
      : 'bilibili.app.view.v1.'
    const result = mockGrpc({ request: { url: `https://grpc.biliapi.net/${prefix}${suffix}` } })
    assert.equal(Buffer.from(result.response.body).toString('base64'), encoded)
    assert.equal(result.response.trailers['Grpc-Status'], '0')
  }
}

{
  const html = '<!doctype html><html><head><title>Live</title></head><body></body></html>'
  assert.equal(
    injectLivePage({
      settings: { purifyWebpage: false },
      response: { headers: { 'Content-Type': 'text/html' }, body: html },
    }),
    null,
  )
  assert.equal(
    injectLivePage({
      settings: { purifyWebpage: true },
      response: { headers: { 'Content-Type': 'application/json' }, body: html },
    }),
    null,
  )
  const injected = injectLivePage({
    settings: { purifyWebpage: true },
    response: { headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: html },
  }).response.body
  assert.match(injected, /<script>[\s\S]+__BILIACT_EVAPAGEDATA__[\s\S]+<\/script><\/head>/)
  const clientSource = /<script>([\s\S]+)<\/script>/.exec(injected)[1]
  const appended = []
  const clientSandbox = {
    URL,
    window: {
      __BILIACT_EVAPAGEDATA__: {
        layerTree: [
          {
            name: 'EvaLayoutContainer',
            uuid: 'outer',
            slots: [{ children: [{ name: 'EvaLinkButton', uuid: 'link', props: { jumpAddress: 'https://ads.example/' }, slots: [] }] }],
          },
          {
            name: 'EvaLinkButton',
            uuid: 'internal',
            props: { jumpAddress: 'https://live.bilibili.com/' },
            slots: [],
          },
        ],
      },
    },
    document: {
      createElement: () => ({ textContent: '' }),
      head: { append: element => appended.push(element) },
    },
  }
  vm.createContext(clientSandbox)
  new vm.Script(clientSource).runInContext(clientSandbox)
  assert.equal(appended.length, 1)
  assert.equal(appended[0].textContent, '#outer{display:none!important}#link{display:none!important}')

  const tricky = '<!-- fake </head> --><html><head><title>literal </head></title><meta name="x"></head><body></body></html>'
  const trickyOutput = injectLivePage({
    settings: { purifyWebpage: true },
    response: { headers: { 'Content-Type': 'text/html' }, body: tricky },
  }).response.body
  assert.ok(trickyOutput.startsWith('<!-- fake </head> -->'))
  assert.ok(trickyOutput.indexOf('<script>') > trickyOutput.indexOf('</title>'))
  assert.ok(trickyOutput.indexOf('<script>') < trickyOutput.lastIndexOf('</head>'))
}

const bundle = await readFile(path.join(root, 'bilibili-cleaner', 'protobuf.js'))
assert.equal(bundle.length, 237494)
assert.equal(createHash('sha256').update(bundle).digest('hex'), '7e125ea7868bc4de730073c8f2c21876d3df01cc9efb5b33da9eec2f2829e662')

const manifest = parseYaml(await readFile(path.join(root, 'bilibili-cleaner', 'extension.yaml'), 'utf8'))
assert.deepEqual(manifest.traffic.captureHosts, [
  'api.bilibili.com',
  'api.live.bilibili.com',
  'app.bilibili.com',
  'grpc.biliapi.net',
  'line3-h5-mobile-api.biligame.com',
  'live.bilibili.com',
])
assert.deepEqual(manifest.permissions.network.origins, [
  'https://app.bilibili.com',
  'https://bsbsb.top',
  'https://grpc.biliapi.net',
])
assert.deepEqual(manifest.traffic.routingRules, [
  { action: 'reject', domain: 'api.biliapi.com' },
  { action: 'reject', domain: 'app.biliapi.com' },
  { action: 'reject', domain: 'api.biliapi.net' },
  { action: 'reject', domain: 'app.biliapi.net' },
  {
    action: 'reject',
    domainSuffix: 'chat.bilibili.com',
    domainKeywords: ['stun', 'tracker'],
  },
])
assert.deepEqual(
  manifest.settings.map(setting => [setting.key, setting.type, setting.default]),
  [
    ['showUpList', 'select', 'show'],
    ['purifyTopReplies', 'boolean', true],
    ['purifyWebpage', 'boolean', true],
    ['airborne', 'boolean', true],
    ['logLevel', 'select', 'info'],
  ],
)
assert.deepEqual(
  manifest.actions.map(action => action.id),
  [
    'rewrite-channel-request',
    'mock-grpc-promotions',
    'mock-live-shopping-json',
    'mock-game-live-card-json',
    'mock-app-promotions-json',
    'mock-api-delivery-json',
    'add-airborne-danmaku',
    'clean-app-json',
    'clean-api-json',
    'clean-live-json',
    'clean-protobuf-responses',
    'purify-live-activity-page',
  ],
)
assert.equal(manifest.actions.find(action => action.id === 'add-airborne-danmaku').script.bodyMode, 'binary')
assert.equal(manifest.actions.find(action => action.id === 'clean-protobuf-responses').script.maxBodyBytes, 8388608)

const sourceRoot = path.join(root, 'bilibili-cleaner', 'source')
const lock = JSON.parse(await readFile(path.join(sourceRoot, 'package-lock.json'), 'utf8'))
assert.equal(lock.packages['node_modules/@protobuf-ts/runtime'].version, '2.11.1')
assert.equal(lock.packages['node_modules/@protobuf-ts/plugin'].version, '2.11.1')
assert.equal(lock.packages['node_modules/fflate'].version, '0.8.2')
assert.equal(lock.packages['node_modules/esbuild'].version, '0.25.6')
for (const [filename, size, digest] of [
  ['protobuf-ts-runtime-2.11.1.tgz', 54285, '3bb18cb373565b5c95e466c1db76e4b1d8166b62276a15e3547c36f9e25b502b'],
  ['fflate-0.8.2.tgz', 168507, '61fd5061e2fc8e5e3e3129f7f2fec7bd78a313e1bf4becbf1cc1cc9998d141dc'],
]) {
  const archive = await readFile(path.join(sourceRoot, 'vendor', filename))
  assert.equal(archive.length, size)
  assert.equal(createHash('sha256').update(archive).digest('hex'), digest)
}

async function countFiles(directory, suffix) {
  let count = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) count += await countFiles(target, suffix)
    else if (entry.name.endsWith(suffix)) count += 1
  }
  return count
}

assert.equal(await countFiles(path.join(sourceRoot, 'proto'), '.proto'), 15)
assert.equal(await countFiles(path.join(sourceRoot, 'generated'), '.ts'), 15)
const upstreamRoot = path.join(sourceRoot, 'upstream-sparkle')
const checksumLines = (await readFile(path.join(upstreamRoot, 'SHA256SUMS'), 'utf8')).trim().split(/\r?\n/)
assert.equal(checksumLines.length, 26)
for (const line of checksumLines) {
  const match = /^([0-9a-f]{64})  (.+)$/.exec(line)
  assert.ok(match, `invalid upstream checksum line: ${line}`)
  const source = await readFile(path.join(upstreamRoot, ...match[2].split('/')))
  assert.equal(createHash('sha256').update(source).digest('hex'), match[1], match[2])
}

const bundleInputs = JSON.parse(await readFile(path.join(sourceRoot, 'bundle-inputs.json'), 'utf8'))
assert.ok(bundleInputs.some(input => input.path.endsWith('@protobuf-ts/runtime/build/es2015/binary-reader.js')))
assert.ok(bundleInputs.some(input => input.path.endsWith('fflate/esm/browser.js')))
assert.equal(bundleInputs.some(input => input.path.includes('protobufjs-utf8')), false)

const vendorSourceRoot = path.join(sourceRoot, 'vendor-src')
const sourceManifest = (await readFile(path.join(vendorSourceRoot, 'SOURCE_MANIFEST.tsv'), 'utf8'))
  .trim()
  .split(/\r?\n/)
assert.equal(sourceManifest.shift(), 'sha256\tsize\tpath')
assert.equal(sourceManifest.length, 49)
for (const line of sourceManifest) {
  const [digest, size, relativePath] = line.split('\t')
  assert.match(digest, /^[0-9a-f]{64}$/)
  const source = await readFile(path.join(vendorSourceRoot, ...relativePath.split('/')))
  assert.equal(source.length, Number(size), relativePath)
  assert.equal(createHash('sha256').update(source).digest('hex'), digest, relativePath)
}

console.log('Bilibili fixtures passed')
