// GPL-3.0-only native port of pinned kokoryh/Sparkle Bilibili Protobuf handlers.

import type { MessageType } from '@protobuf-ts/runtime'
import { Gunzip } from 'fflate'
import { DynAllReply, DynamicType } from './generated/bilibili/app/dynamic/v2/dynamic'
import { PlayViewUniteReply } from './generated/bilibili/app/playerunite/v1/player'
import { PlayViewReply } from './generated/bilibili/app/playurl/v1/playurl'
import { PopularReply } from './generated/bilibili/app/show/popular/v1/popular'
import {
  Chronos,
  RelatesFeedReply as IpadRelatesFeedReply,
  ViewReply as IpadViewReply,
  ViewProgressReply as IpadViewProgressReply,
} from './generated/bilibili/app/view/v1/view'
import {
  Module,
  ModuleType,
  RelateCard,
  RelateCardType,
  RelatesFeedReply,
  ViewReply,
  ViewProgressReply,
} from './generated/bilibili/app/viewunite/v1/view'
import {
  DanmakuElem,
  DmColorfulType,
  DmSegMobileReply,
  DmSegMobileReq,
  DmViewReply,
} from './generated/bilibili/community/service/dm/v1/dm'
import { MainListReply, Type } from './generated/bilibili/main/community/reply/v1/reply'
import { PlayViewReply as IpadPlayViewReply } from './generated/bilibili/pgc/gateway/player/v2/playurl'
import { SearchAllResponse } from './generated/bilibili/polymer/app/search/v1/search'

type HeaderValues = Record<string, string | string[]>

interface NetworkOptions {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string | Uint8Array
}

interface NetworkResult {
  url: string
  status: number
  headers: HeaderValues
  trailers?: HeaderValues
  body: Uint8Array
  text?: string
}

interface TransformContext {
  phase: 'request' | 'response'
  request: {
    url: string
    method?: string
    headers: Record<string, string>
    body?: Uint8Array
  }
  response?: {
    status: number
    headers: Record<string, string>
    trailers?: Record<string, string>
    body?: Uint8Array
  }
  settings: {
    displayUpList?: 'show' | 'hide' | 'auto'
    purifyComment?: boolean
    optimizeRequest?: boolean
    sponsorBlock?: boolean
    logLevel?: 'off' | 'error' | 'warn' | 'info' | 'debug'
  }
  network?: {
    request(options: NetworkOptions): NetworkResult
    // Present only on runtimes that expose the asynchronous entry point. Older
    // gateways ship `request` alone, so every caller feature-detects this and
    // keeps a synchronous path rather than failing on them.
    requestAsync?(options: NetworkOptions): Promise<NetworkResult>
  }
}

class NativeTextEncoder {
  encode(input = ''): Uint8Array {
    const output: number[] = []
    for (let index = 0; index < input.length; index += 1) {
      let codePoint = input.charCodeAt(index)
      if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
        const low = input.charCodeAt(index + 1)
        if (low >= 0xdc00 && low <= 0xdfff) {
          codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + low - 0xdc00
          index += 1
        } else {
          codePoint = 0xfffd
        }
      } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
        codePoint = 0xfffd
      }
      if (codePoint <= 0x7f) {
        output.push(codePoint)
      } else if (codePoint <= 0x7ff) {
        output.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
      } else if (codePoint <= 0xffff) {
        output.push(
          0xe0 | (codePoint >> 12),
          0x80 | ((codePoint >> 6) & 0x3f),
          0x80 | (codePoint & 0x3f),
        )
      } else {
        output.push(
          0xf0 | (codePoint >> 18),
          0x80 | ((codePoint >> 12) & 0x3f),
          0x80 | ((codePoint >> 6) & 0x3f),
          0x80 | (codePoint & 0x3f),
        )
      }
    }
    return new Uint8Array(output)
  }
}

class NativeTextDecoder {
  decode(input: Uint8Array): string {
    let output = ''
    for (let index = 0; index < input.length; ) {
      const first = input[index]
      let codePoint = 0
      let length = 0
      let minimum = 0
      if (first <= 0x7f) {
        codePoint = first
        length = 1
      } else if (first >= 0xc2 && first <= 0xdf) {
        codePoint = first & 0x1f
        length = 2
        minimum = 0x80
      } else if (first >= 0xe0 && first <= 0xef) {
        codePoint = first & 0x0f
        length = 3
        minimum = 0x800
      } else if (first >= 0xf0 && first <= 0xf4) {
        codePoint = first & 0x07
        length = 4
        minimum = 0x10000
      } else {
        throw new TypeError('Invalid UTF-8 sequence')
      }
      if (index + length > input.length) {
        throw new TypeError('Truncated UTF-8 sequence')
      }
      for (let offset = 1; offset < length; offset += 1) {
        const next = input[index + offset]
        if ((next & 0xc0) !== 0x80) {
          throw new TypeError('Invalid UTF-8 continuation byte')
        }
        codePoint = (codePoint << 6) | (next & 0x3f)
      }
      if (
        codePoint < minimum ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        throw new TypeError('Invalid UTF-8 code point')
      }
      if (codePoint <= 0xffff) {
        output += String.fromCharCode(codePoint)
      } else {
        codePoint -= 0x10000
        output += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff))
      }
      index += length
    }
    return output
  }
}

if (typeof globalThis.TextEncoder === 'undefined') {
  ;(globalThis as unknown as { TextEncoder: typeof NativeTextEncoder }).TextEncoder = NativeTextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  ;(globalThis as unknown as { TextDecoder: typeof NativeTextDecoder }).TextDecoder = NativeTextDecoder
}

const CHRONOS_MD5: Record<string, string> = Object.freeze({
  universal: 'e5a968f1a5055bbe5c12e67b100a6dcb',
  hd: 'f993a054969a4f6ae6b20a65f1292e47',
  inter: '8c3feda2e92bf60e8a7aeade1a231586',
  '45b564f5ba1fdd3746406937059addd8': 'e5a968f1a5055bbe5c12e67b100a6dcb',
  c29bd8f2b64a8f57f49c3622c0f763db: 'ecca73e42e160074e0caf4b3ddb54a52',
  c218977c14e5dfdafd51edf3ae49ed02: 'f993a054969a4f6ae6b20a65f1292e47',
  '8232ffb6ee43b687b5fe5add5b3e97de': 'feaca416bbc1174b8e935cf87ff8f0b5',
  '325e7073ffc6fb5263682fecdcd1058f': '932002070dc1b51241198a074d2279fc',
  '3a14beddd23328eaddfe9f0eb048d713': '8c3feda2e92bf60e8a7aeade1a231586',
})
const CHRONOS_COMMIT = '69a8996b1f1311b606021e3f194b0390280ab618'

const MAX_GRPC_MESSAGE_BYTES = 8 * 1024 * 1024
const GZIP_INPUT_CHUNK_BYTES = 1024
const REQUEST_PATH_PATTERN = /^https?:\/\/[^/?#]+([^?#]*)/i
const REQUEST_HOST_PATTERN = /^https?:\/\/([^/:?#]+)(?::[0-9]+)?(?:[/?#]|$)/i
const REQUEST_HOST_REPLACE_PATTERN = /^(https?:\/\/)[^/:?#]+/i
const BILI_HD_UA_PATTERN = /^bili-hd/i
const COMMENT_LINK_PATTERN = /https:\/\/b23\.tv\/(?:cm|mall)/
const COMMENT_KEYWORD_PATTERN = /淘宝|某宝|天猫|京东|狗东|拼多多|饿了么|美团|转转|妙界|神气小鹿/
const SEARCH_AD_LINK_PATTERN = /_ad_?/
const LOG_LEVEL_VALUES = Object.freeze({ debug: 1, info: 2, warn: 3, error: 4, off: 5 })
const BILIBILI_REPLAY_HOSTS = Object.freeze(['grpc.biliapi.net', 'app.bilibili.com'])
const POPULAR_BLOCKED = new Set(['rcmdOneItem', 'smallCoverV5Ad', 'topicList'])
const INTRODUCTION_BLOCKED = new Set([
  ModuleType.ACTIVITY,
  ModuleType.PAY_BAR,
  ModuleType.SPECIALTAG,
  ModuleType.MERCHANDISE,
  ModuleType.VIDEO_MENTIONS,
])
const REQUEST_BLOCKED_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'trailer',
  'transfer-encoding',
  'upgrade',
])
const TRAILER_BLOCKED_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const RELATE_BLOCKED = new Set([
  RelateCardType.GAME,
  RelateCardType.CM_TYPE,
  RelateCardType.LIVE,
  RelateCardType.AI_RECOMMEND,
  RelateCardType.COURSE,
])

function requestPath(url: string): string {
  const match = REQUEST_PATH_PATTERN.exec(url)
  if (!match) throw new Error('Invalid request URL')
  return match[1] || '/'
}

function headerValue(headers: HeaderValues, name: string): string {
  const wanted = name.toLowerCase()
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === wanted) return Array.isArray(value) ? value[0] || '' : value
  }
  return ''
}

function hasHeader(headers: HeaderValues, name: string): boolean {
  const wanted = name.toLowerCase()
  return Object.keys(headers || {}).some(key => key.toLowerCase() === wanted)
}

function shouldLog(context: TransformContext, level: 'error' | 'warn' | 'info' | 'debug'): boolean {
  const configured = context.settings.logLevel || 'error'
  return LOG_LEVEL_VALUES[level] >= LOG_LEVEL_VALUES[configured]
}

function logError(context: TransformContext, error: unknown): void {
  if (shouldLog(context, 'error')) console.error(`Bilibili Protobuf transform failed: ${String(error)}`)
}

function logDebug(context: TransformContext, ...values: unknown[]): void {
  if (shouldLog(context, 'debug')) console.debug(...values)
}

function logWarn(context: TransformContext, ...values: unknown[]): void {
  if (shouldLog(context, 'warn')) console.warn(...values)
}

function boundedGunzip(input: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = []
  let total = 0
  const stream = new Gunzip((chunk) => {
    total += chunk.length
    if (total > MAX_GRPC_MESSAGE_BYTES) {
      throw new Error(`Decompressed gRPC message exceeds ${MAX_GRPC_MESSAGE_BYTES} bytes`)
    }
    chunks.push(chunk.slice())
  })
  for (let offset = 0; offset < input.length; offset += GZIP_INPUT_CHUNK_BYTES) {
    const end = Math.min(offset + GZIP_INPUT_CHUNK_BYTES, input.length)
    stream.push(input.subarray(offset, end), end === input.length)
  }
  if (!input.length) stream.push(input, true)
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

function decodeFrame<T extends object>(type: MessageType<T>, frame: Uint8Array): T {
  if (!(frame instanceof Uint8Array) || frame.length < 5) throw new Error('Invalid gRPC frame')
  const compressed = frame.subarray(5)
  if (!frame[0] && compressed.length > MAX_GRPC_MESSAGE_BYTES) {
    throw new Error(`gRPC message exceeds ${MAX_GRPC_MESSAGE_BYTES} bytes`)
  }
  const body = frame[0] ? boundedGunzip(compressed) : compressed
  return type.fromBinary(body)
}

function encodeFrame<T extends object>(type: MessageType<T>, message: T): Uint8Array {
  const body = type.toBinary(message)
  const output = new Uint8Array(body.length + 5)
  output[1] = body.length >>> 24
  output[2] = (body.length >>> 16) & 0xff
  output[3] = (body.length >>> 8) & 0xff
  output[4] = body.length & 0xff
  output.set(body, 5)
  return output
}

function isIpad(context: TransformContext): boolean {
  return BILI_HD_UA_PATTERN.test(headerValue(context.request.headers, 'user-agent'))
}

function appEdition(context: TransformContext): 'universal' | 'hd' | 'inter' {
  const userAgent = headerValue(context.request.headers, 'user-agent')
  if (userAgent.startsWith('bili-hd')) return 'hd'
  if (userAgent.startsWith('bili-inter')) return 'inter'
  return 'universal'
}

function processChronos(context: TransformContext, chronos: Chronos): void {
  let processed = CHRONOS_MD5[chronos.md5]
  if (!processed) {
    logWarn(context, `Bilibili Chronos MD5 mismatch: ${chronos.md5}; file=${chronos.file}`)
    processed = CHRONOS_MD5[appEdition(context)]
  }
  chronos.md5 = processed
  chronos.file = `https://raw.githubusercontent.com/kokoryh/chronos/${CHRONOS_COMMIT}/${processed}.zip`
  delete chronos.sign
}

function filterRelateCard(card: RelateCard): boolean {
  return !RELATE_BLOCKED.has(card.relateCardType) && !card.cmStock.length && !card.basicInfo?.uniqueId
}

function transformResponse(context: TransformContext, path: string, frame: Uint8Array): Uint8Array | null {
  logDebug(context, 'Bilibili Protobuf response', context.request.url, context.settings)
  const sponsorBlock = context.settings.sponsorBlock !== false
  if (path.endsWith('/bilibili.app.dynamic.v2.Dynamic/DynAll')) {
    const message = decodeFrame(DynAllReply, frame)
    delete message.topicList
    if (message.dynamicList) {
      message.dynamicList.list = message.dynamicList.list.filter(
        item => item.cardType !== DynamicType.AD && item.cardType !== DynamicType.LIVE_RCMD,
      )
    }
    const mode = context.settings.displayUpList || 'show'
    if (mode !== 'show' && !isIpad(context) && message.upList) {
      if (mode === 'hide' || !message.upList.showLiveNum) {
        delete message.upList
      } else {
        const last = message.upList.listSecond[message.upList.listSecond.length - 1]
        if (last) {
          last.separator = true
          message.upList.list = [...message.upList.listSecond, ...message.upList.list]
          message.upList.listSecond.length = 0
        }
      }
    }
    return encodeFrame(DynAllReply, message)
  }
  if (path.endsWith('/bilibili.app.playerunite.v1.Player/PlayViewUnite')) {
    const message = decodeFrame(PlayViewUniteReply, frame)
    delete message.viewInfo?.promptBar
    if (message.playArcConf?.arcConfs) {
      for (const item of Object.values(message.playArcConf.arcConfs)) {
        if (item.isSupport && item.disabled) {
          item.disabled = false
          item.extraContent = undefined
          item.unsupportScene.length = 0
        }
      }
    }
    return encodeFrame(PlayViewUniteReply, message)
  }
  if (path.endsWith('/bilibili.app.playurl.v1.PlayURL/PlayView')) {
    const message = decodeFrame(PlayViewReply, frame)
    const { backgroundPlayConf, castConf } = message.playArc || {}
    for (const item of [backgroundPlayConf, castConf]) {
      if (item && (!item.isSupport || item.disabled)) {
        item.isSupport = true
        item.disabled = false
        item.extraContent = undefined
        item.unsupportScene.length = 0
      }
    }
    return encodeFrame(PlayViewReply, message)
  }
  if (path.endsWith('/bilibili.app.show.v1.Popular/Index')) {
    const message = decodeFrame(PopularReply, frame)
    message.items = message.items.filter(item => {
      if (item.item.oneofKind === 'smallCoverV5') {
        const card = item.item.smallCoverV5
        return card.base?.fromType === 'recommend' && !card.base.adInfo.length
      }
      return !POPULAR_BLOCKED.has(item.item.oneofKind as string)
    })
    return encodeFrame(PopularReply, message)
  }
  if (path.endsWith('/bilibili.app.view.v1.View/View')) {
    const message = decodeFrame(IpadViewReply, frame)
    delete message.label
    delete message.cmIpad
    delete message.cmConfig
    delete message.reqUser?.elecPlusBtn
    message.cms.length = 0
    message.specialCellNew.length = 0
    message.relates = message.relates.filter(item => !item.cm.length)
    return encodeFrame(IpadViewReply, message)
  }
  if (path.endsWith('/bilibili.app.view.v1.View/ViewProgress')) {
    const message = decodeFrame(IpadViewProgressReply, frame)
    delete message.videoGuide
    if (sponsorBlock && message.chronos) processChronos(context, message.chronos)
    return encodeFrame(IpadViewProgressReply, message)
  }
  if (path.endsWith('/bilibili.app.view.v1.View/RelatesFeed')) {
    const message = decodeFrame(IpadRelatesFeedReply, frame)
    message.list = message.list.filter(item => !item.cm.length)
    return encodeFrame(IpadRelatesFeedReply, message)
  }
  if (path.endsWith('/bilibili.app.viewunite.v1.View/RelatesFeed')) {
    const message = decodeFrame(RelatesFeedReply, frame)
    message.relates = message.relates.filter(filterRelateCard)
    return encodeFrame(RelatesFeedReply, message)
  }
  if (path.endsWith('/bilibili.app.viewunite.v1.View/View')) {
    const message = decodeFrame(ViewReply, frame)
    delete message.cm
    delete message.reqUser?.elecPlusBtn
    for (const tabModule of message.tab?.tabModule || []) {
      if (tabModule.tab.oneofKind !== 'introduction') continue
      tabModule.tab.introduction.modules = tabModule.tab.introduction.modules.reduce(
        (modules: Module[], module) => {
          if (INTRODUCTION_BLOCKED.has(module.type)) {
            return modules
          }
          if (module.type === ModuleType.UGC_HEADLINE && module.data.oneofKind === 'headLine') {
            delete module.data.headLine.label
          } else if (module.type === ModuleType.RELATED_RECOMMEND && module.data.oneofKind === 'relates') {
            module.data.relates.cards = module.data.relates.cards.filter(filterRelateCard)
          }
          modules.push(module)
          return modules
        },
        [],
      )
    }
    return encodeFrame(ViewReply, message)
  }
  if (path.endsWith('/bilibili.app.viewunite.v1.View/ViewProgress')) {
    const message = decodeFrame(ViewProgressReply, frame)
    delete message.dm
    if (sponsorBlock && message.chronos) processChronos(context, message.chronos)
    return encodeFrame(ViewProgressReply, message)
  }
  if (path.endsWith('/bilibili.community.service.dm.v1.DM/DmView')) {
    const message = decodeFrame(DmViewReply, frame)
    delete message.qoe
    message.activityMeta.length = 0
    if (message.command?.commandDms.length) message.command.commandDms.length = 0
    return encodeFrame(DmViewReply, message)
  }
  if (path.endsWith('/bilibili.main.community.reply.v1.Reply/MainList')) {
    const message = decodeFrame(MainListReply, frame)
    delete message.cm
    message.subjectTopCards = message.subjectTopCards.filter(
      item => item.type !== Type.CM && item.type !== Type.OPERATION,
    )
    if (context.settings.purifyComment !== false) {
      message.topReplies = message.topReplies.filter(reply => {
        const urls = reply.content?.urls || {}
        const text = reply.content?.message || ''
        return (
          !Object.keys(urls).some(url => COMMENT_LINK_PATTERN.test(url)) &&
          !COMMENT_LINK_PATTERN.test(text) &&
          !COMMENT_KEYWORD_PATTERN.test(text)
        )
      })
    }
    return encodeFrame(MainListReply, message)
  }
  if (path.endsWith('/bilibili.pgc.gateway.player.v2.PlayURL/PlayView')) {
    const message = decodeFrame(IpadPlayViewReply, frame)
    delete message.viewInfo?.tryWatchPromptBar
    if (message.playExtConf?.castTips) message.playExtConf.castTips = { code: 0, message: '' }
    return encodeFrame(IpadPlayViewReply, message)
  }
  if (path.endsWith('/bilibili.polymer.app.search.v1.Search/SearchAll')) {
    const message = decodeFrame(SearchAllResponse, frame)
    message.item = message.item.filter(item => !SEARCH_AD_LINK_PATTERN.test(item.linktype))
    return encodeFrame(SearchAllResponse, message)
  }
  return null
}

const BV_ALPHABET = 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf'
const BV_XOR = 23442827791579n
const BV_MAX_AID = 1n << 51n
const BV_BASE = 58n

function avToBv(avid: string): string {
  const bytes = ['B', 'V', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0']
  let index = bytes.length - 1
  let value = (BV_MAX_AID | BigInt(avid)) ^ BV_XOR
  while (value > 0n) {
    bytes[index] = BV_ALPHABET[Number(value % BV_BASE)]
    value /= BV_BASE
    index -= 1
  }
  ;[bytes[3], bytes[9]] = [bytes[9], bytes[3]]
  ;[bytes[4], bytes[7]] = [bytes[7], bytes[4]]
  return bytes.join('')
}

function sanitizeRequestHeaders(headers: Record<string, string>): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [name, value] of Object.entries(headers || {})) {
    const lower = name.toLowerCase()
    if (lower === 'te') {
      if (value === 'trailers') output.TE = 'trailers'
    } else if (!REQUEST_BLOCKED_HEADERS.has(lower)) {
      output[name] = value
    }
  }
  return output
}

function sanitizeResponseHeaders(headers: HeaderValues): HeaderValues {
  return Object.fromEntries(
    Object.entries(headers || {}).filter(
      ([name]) => {
        const lower = name.toLowerCase()
        return lower !== 'content-length' && lower !== 'transfer-encoding'
      },
    ),
  )
}

function sanitizeTrailers(headers: HeaderValues): HeaderValues {
  return Object.fromEntries(
    Object.entries(headers || {}).filter(([name]) => !TRAILER_BLOCKED_HEADERS.has(name.toLowerCase())),
  )
}

function addGrpcStatusHeader(
  context: TransformContext,
  headers: HeaderValues,
  hasTrailers: boolean,
): HeaderValues {
  if (hasTrailers) return headers
  const engineType = headerValue(context.request.headers, 'x-bili-moss-engine-type')
  if (!engineType) return headers
  if (engineType !== '1') {
    if (shouldLog(context, 'error')) console.error(`x-bili-moss-engine-type: ${engineType}`)
    return headers
  }
  if (hasHeader(headers, 'grpc-status')) return headers
  return { ...headers, 'Grpc-Status': '0' }
}

function requestHostname(url: string): string {
  const match = REQUEST_HOST_PATTERN.exec(url)
  if (!match) throw new Error('Invalid request URL')
  return match[1].toLowerCase()
}

function replaceRequestHostname(url: string, hostname: string): string {
  const replaced = url.replace(REQUEST_HOST_REPLACE_PATTERN, `$1${hostname}`)
  if (replaced === url && requestHostname(url) !== hostname) throw new Error('Invalid request URL')
  return replaced
}

function replayOptions(context: TransformContext, hostname: string): NetworkOptions {
  return {
    url: replaceRequestHostname(context.request.url, hostname),
    method: context.request.method || 'POST',
    headers: sanitizeRequestHeaders(context.request.headers),
    body: context.request.body,
  }
}

function usableReplay(context: TransformContext, url: string, response: NetworkResult): NetworkResult | null {
  if (response.status === 200 && response.body instanceof Uint8Array) return response
  logDebug(context, 'Bilibili replay returned an invalid response', url, response.status)
  return null
}

function replayHosts(context: TransformContext, maxAttempts: number): string[] {
  if (!context.network || !context.request.body) return []
  const start = BILIBILI_REPLAY_HOSTS.indexOf(requestHostname(context.request.url))
  if (start < 0) return []
  return BILIBILI_REPLAY_HOSTS.slice(start, Math.min(start + maxAttempts, BILIBILI_REPLAY_HOSTS.length))
}

// Walks the host list in order and stops at the first usable reply. The list is
// a fallback chain, not a set of interchangeable mirrors, so these stay
// sequential: issuing them together would send every later host a request the
// first one already made unnecessary.
function replayBilibili(context: TransformContext, maxAttempts = 2): NetworkResult | null {
  for (const hostname of replayHosts(context, maxAttempts)) {
    const options = replayOptions(context, hostname)
    try {
      const usable = usableReplay(context, options.url, context.network!.request(options))
      if (usable) return usable
    } catch (error) {
      logDebug(context, 'Bilibili replay failed', options.url, String(error))
    }
  }
  return null
}

async function replayBilibiliAsync(context: TransformContext): Promise<NetworkResult | null> {
  for (const hostname of replayHosts(context, 1)) {
    const options = replayOptions(context, hostname)
    try {
      const usable = usableReplay(context, options.url, await context.network!.requestAsync!(options))
      if (usable) return usable
    } catch (error) {
      logDebug(context, 'Bilibili replay failed', options.url, String(error))
    }
  }
  return null
}

function syntheticResponse(
  context: TransformContext,
  replay: NetworkResult,
  body: Uint8Array,
): Record<string, unknown> {
  const hasTrailers = replay.trailers !== undefined
  const response: Record<string, unknown> = {
    status: replay.status,
    headers: addGrpcStatusHeader(context, sanitizeResponseHeaders(replay.headers), hasTrailers),
    body,
  }
  if (hasTrailers) response.trailers = sanitizeTrailers(replay.trailers || {})
  return response
}

function skipSegmentOptions(videoId: string, cid: string): NetworkOptions {
  return {
    url: `https://bsbsb.top/api/skipSegments?videoID=${encodeURIComponent(videoId)}&cid=${encodeURIComponent(cid)}&category=sponsor`,
    method: 'GET',
    headers: {
      origin: 'https://github.com/kokoryh/Sparkle/blob/master/release/surge/module/bilibili.sgmodule',
      'x-ext-version': '1.0.0',
    },
  }
}

function parseSkipSegments(context: TransformContext, result: NetworkResult): number[][] {
  logDebug(context, 'Bilibili SponsorBlock response', result.status, result.text || '')
  if (result.status !== 200 || typeof result.text !== 'string') return []
  const items = JSON.parse(result.text)
  if (!Array.isArray(items)) return []
  return items.reduce((segments: number[][], item: unknown) => {
    if (!item || typeof item !== 'object') return segments
    const value = item as { actionType?: unknown; segment?: unknown }
    if (
      value.actionType === 'skip' &&
      Array.isArray(value.segment) &&
      value.segment.length === 2 &&
      value.segment.every(number => typeof number === 'number' && Number.isFinite(number)) &&
      value.segment[1] - value.segment[0] >= 8
    ) {
      segments.push([value.segment[0], value.segment[1]])
    }
    return segments
  }, [])
}

function skipSegmentsFailed(context: TransformContext, error: unknown): number[][] {
  if (shouldLog(context, 'error')) console.error(`Bilibili SponsorBlock request failed: ${String(error)}`)
  return []
}

function getSkipSegments(context: TransformContext, videoId: string, cid: string): number[][] {
  try {
    return parseSkipSegments(context, context.network!.request(skipSegmentOptions(videoId, cid)))
  } catch (error) {
    return skipSegmentsFailed(context, error)
  }
}

async function getSkipSegmentsAsync(
  context: TransformContext,
  videoId: string,
  cid: string,
): Promise<number[][]> {
  try {
    return parseSkipSegments(context, await context.network!.requestAsync!(skipSegmentOptions(videoId, cid)))
  } catch (error) {
    return skipSegmentsFailed(context, error)
  }
}

function airborneDanmaku(segments: number[][]): DanmakuElem[] {
  return segments.map((segment, index) => {
    const id = String(index + 1)
    return {
      id,
      progress: Math.floor(segment[0] * 1000) + 2000,
      mode: 5,
      fontsize: 50,
      color: 16777215,
      midHash: '1948dd5d',
      content: '空指部已就位',
      ctime: '1735660800',
      weight: 11,
      action: `airborne:${Math.floor(segment[1] * 1000)}`,
      pool: 0,
      idStr: id,
      attr: 1310724,
      animation: '',
      extra: '',
      colorful: DmColorfulType.NONE_TYPE,
      type: 1,
      oid: '212364987',
      dmFrom: 1,
    }
  })
}

function airborneResponse(
  context: TransformContext,
  replay: NetworkResult,
  segments: number[][],
): object {
  let body = replay.body
  if (segments.length) {
    const response = decodeFrame(DmSegMobileReply, replay.body)
    response.elems.push(...airborneDanmaku(segments))
    body = encodeFrame(DmSegMobileReply, response)
  }
  return { response: syntheticResponse(context, replay, body) }
}

// The replay and the SponsorBlock lookup answer different questions of
// different hosts, and neither reads the other's result, so upstream issues
// them together. Rejections are absorbed here because a promise escaping this
// function would bypass `transform`'s error handling.
async function transformAirborneConcurrent(
  context: TransformContext,
  videoId: string,
  cid: string,
): Promise<object | null> {
  try {
    const [replay, segments] = await Promise.all([
      replayBilibiliAsync(context),
      getSkipSegmentsAsync(context, videoId, cid),
    ])
    if (!replay) return null
    return airborneResponse(context, replay, segments)
  } catch (error) {
    logError(context, error)
    return null
  }
}

function transformAirborne(context: TransformContext): object | Promise<object | null> | null {
  if (context.settings.sponsorBlock === false || !context.network || !context.request.body) return null
  const request = decodeFrame(DmSegMobileReq, context.request.body)
  if (request.type !== 1) return null
  const videoId = avToBv(request.pid)
  const cid = request.oid !== '0' ? request.oid : ''
  if (typeof context.network.requestAsync === 'function') {
    return transformAirborneConcurrent(context, videoId, cid)
  }
  const replay = replayBilibili(context, 1)
  if (!replay) return null
  return airborneResponse(context, replay, getSkipSegments(context, videoId, cid))
}

function transformOptimizedRequest(context: TransformContext, path: string): object | null {
  if (context.settings.optimizeRequest === false || !context.network || !context.request.body) return null
  if (
    !path.endsWith('/bilibili.app.viewunite.v1.View/View') &&
    !path.endsWith('/bilibili.main.community.reply.v1.Reply/MainList')
  ) {
    return null
  }
  const replay = replayBilibili(context)
  if (!replay) return null
  const body = transformResponse(context, path, replay.body)
  if (!body) return null
  return { response: syntheticResponse(context, replay, body) }
}

function transform(context: TransformContext): object | Promise<object | null> | null {
  try {
    const path = requestPath(context.request.url)
    if (context.phase === 'request') {
      if (path.endsWith('/bilibili.community.service.dm.v1.DM/DmSegMobile')) {
        return transformAirborne(context)
      }
      return transformOptimizedRequest(context, path)
    }
    const body = context.response?.body
    if (!(body instanceof Uint8Array)) return null
    const transformed = transformResponse(context, path, body)
    if (!transformed) return null
    const response: Record<string, unknown> = { body: transformed }
    const hasTrailers = context.response?.trailers !== undefined
    if (hasTrailers) response.trailers = sanitizeTrailers(context.response?.trailers || {})
    const headers = addGrpcStatusHeader(context, context.response?.headers || {}, hasTrailers)
    if (headers !== context.response?.headers) response.headers = headers
    return { response }
  } catch (error) {
    logError(context, error)
    return null
  }
}

;(globalThis as unknown as { transform: typeof transform }).transform = transform
