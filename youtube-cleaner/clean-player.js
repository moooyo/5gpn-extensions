// Apache-2.0 native port of the pinned Maasea/sgmodule YouTube behavior.
// The implementation operates on bounded protobuf wire messages. It does not
// include the upstream generated runtime or proxy-client adapters.

const MAX_MESSAGE_DEPTH = 64
const MAX_PARSED_FIELDS = 250000
const MAX_MERGED_FIELD_REFERENCES = 500000
const MAX_STRING_BYTES = 1048576
const MAX_AD_SCAN_BYTES = 16777216
const MAX_CACHE_ENTRIES = 512
const MAX_CACHE_STRING_BYTES = 512
const MAX_STORAGE_BYTES = 60000
const MAX_KEY_BYTES = 4096
const MAX_OUTPUT_BYTES = 33554432
const MAX_SERIALIZATION_WORK_BYTES = 134217728
const AD_STATE_KEY = 'YouTubeAdvertiseInfo'
const AD_STATE_VERSION = '1.0'
const CONFIG_KEY = 'YouTubeConfig'
const PAGEAD_MARKER = [112, 97, 103, 101, 97, 100]
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/
const SHORTS_EML_PATTERN = /shorts(?!_pivot_item)/
const PAGEAD_SKIP = new Array(256).fill(PAGEAD_MARKER.length + 1)
for (let index = 0; index < PAGEAD_MARKER.length; index += 1) {
  PAGEAD_SKIP[PAGEAD_MARKER[index]] = PAGEAD_MARKER.length - index
}
let serializationWorkBytes = 0
let mergedFieldReferences = 0

function message(name, repeated) {
  return { kind: 'message', name, repeated: Boolean(repeated) }
}

function stringField(name) {
  return { kind: 'string', name }
}

function intField(name, repeated) {
  return { kind: repeated ? 'repeatedInt32' : 'int32', name }
}

function boolField(name) {
  return { kind: 'bool', name }
}

function bytesField(name) {
  return { kind: 'bytes', name }
}

// These declarations are transcribed from the immutable generated bundle.
// They are field facts only; no generated protobuf runtime is embedded.
const SCHEMAS = {
  Label: {
    1: message('Run', true),
  },
  Run: {
    1: stringField('text'),
  },
  ResponseContext: {
    6: message('ServiceTrackingParam', true),
  },
  ServiceTrackingParam: {
    1: intField('service'),
    2: message('Param', true),
  },
  Param: {
    1: stringField('key'),
    2: stringField('value'),
  },

  Browse: {
    1: message('ResponseContext'),
    9: message('BrowseContent'),
    10: message('BrowseContent'),
  },
  BrowseContent: {
    58173949: message('SingleColumnResultsRenderer'),
    153515154: message('ElementRenderer'),
    49399797: message('SectionListRenderer'),
  },
  SingleColumnResultsRenderer: {
    1: message('BrowseTabSupportedRenderer', true),
  },
  BrowseTabSupportedRenderer: {
    58174010: message('TabRenderer'),
  },
  TabRenderer: {
    4: message('BrowseContent'),
  },
  SectionListRenderer: {
    1: message('SectionListSupportedRenderer', true),
  },
  SectionListSupportedRenderer: {
    50195462: message('ItemSectionRenderer'),
    51845067: message('ShelfRenderer'),
    221496734: message('MusicDescriptionShelfRenderer'),
  },
  ItemSectionRenderer: {
    1: message('RichItemContent', true),
  },
  RichItemContent: {
    153515154: message('ElementRenderer'),
  },
  ElementRenderer: {
    172660663: message('VideoRendererContent'),
  },
  VideoRendererContent: {
    1: message('VideoInfo'),
    2: message('RenderInfo'),
  },
  VideoInfo: {
    168777401: message('VideoContext'),
  },
  VideoContext: {
    5: message('VideoContent'),
  },
  VideoContent: {
    465160965: message('TimedLyricsRender'),
  },
  TimedLyricsRender: {
    4: message('TimedLyricsContent'),
  },
  TimedLyricsContent: {
    1: message('Run', true),
    2: stringField('footerLabel'),
  },
  RenderInfo: {
    183314536: message('LayoutRender'),
  },
  LayoutRender: {
    1: stringField('eml'),
  },
  ShelfRenderer: {
    5: message('RichSectionContent'),
  },
  RichSectionContent: {
    51431404: message('ReelShelfRenderer'),
  },
  ReelShelfRenderer: {
    1: message('RichItemContent', true),
  },
  MusicDescriptionShelfRenderer: {
    3: message('Label'),
    10: message('Label'),
  },

  Next: {
    7: message('NextContent'),
    8: message('BrowseContent'),
  },
  NextContent: {
    51779735: message('NextResult'),
  },
  NextResult: {
    1: message('BrowseContent'),
  },
  Search: {
    4: message('BrowseContent'),
    7: message('OnResponseReceivedCommand'),
  },
  OnResponseReceivedCommand: {
    50195462: message('ItemSectionRenderer'),
    49399797: message('SectionListRenderer'),
  },

  Shorts: {
    2: message('ShortsEntry', true),
  },
  ShortsEntry: {
    1: message('ShortsCommand'),
  },
  ShortsCommand: {
    139608561: message('ReelWatchEndpoint'),
  },
  ReelWatchEndpoint: {
    8: message('Overlay'),
    16: message('AdClientParams'),
  },
  AdClientParams: {
    1: boolField('isAd'),
  },
  Overlay: {
    139970731: message('ReelPlayerOverlayRenderer'),
  },
  ReelPlayerOverlayRenderer: {
    12: intField('style'),
  },

  Guide: {
    4: message('GuideItem', true),
    6: message('GuideItem', true),
  },
  GuideItem: {
    117866661: message('GuideSectionRenderer'),
  },
  GuideSectionRenderer: {
    1: message('RendererItem', true),
  },
  RendererItem: {
    318370163: message('GuideEntryRenderer'),
    117501096: message('GuideEntryRenderer'),
  },
  GuideEntryRenderer: {
    1: stringField('browseId'),
  },

  Player: {
    7: bytesField('adPlacements'),
    2: message('PlayabilityStatus'),
    9: message('PlaybackTracking'),
    10: message('Captions'),
    68: bytesField('adSlots'),
  },
  AdPlacement: {
    84813246: message('AdPlacementRenderer'),
  },
  AdPlacementRenderer: {
    4: stringField('params'),
  },
  PlayabilityStatus: {
    21: message('PictureInPictureSupportedRenderer'),
    11: message('BackgroundSupportedRenderer'),
  },
  PictureInPictureSupportedRenderer: {
    151635310: message('PictureInPictureAbility'),
  },
  BackgroundSupportedRenderer: {
    64657230: message('BackgroundAbility'),
  },
  PictureInPictureAbility: {
    1: boolField('active'),
    4: intField('f4'),
    6: intField('f6'),
    8: intField('f8'),
  },
  BackgroundAbility: {
    1: boolField('active'),
  },
  PlaybackTracking: {
    1: message('Tracking'),
    2: message('Tracking'),
    3: message('Tracking'),
    4: message('Tracking'),
    5: message('Tracking'),
    13: message('Tracking'),
    15: message('Tracking'),
    18: message('Tracking'),
  },
  Tracking: {
    1: stringField('baseUrl'),
  },
  Captions: {
    51621377: message('PlayerCaptionsTrackListRenderer'),
  },
  PlayerCaptionsTrackListRenderer: {
    1: message('CaptionTrack', true),
    2: message('AudioTrack', true),
    3: message('TranslationLanguage', true),
    4: intField('defaultAudioTrackIndex'),
    6: intField('defaultCaptionTrackIndex'),
  },
  CaptionTrack: {
    1: stringField('baseUrl'),
    2: message('Label'),
    3: stringField('vssId'),
    4: stringField('languageCode'),
    5: stringField('kind'),
    6: boolField('rtl'),
    7: boolField('isTranslatable'),
  },
  AudioTrack: {
    2: intField('captionTrackIndices', true),
    3: intField('defaultCaptionTrackIndex'),
    4: intField('forcedCaptionTrackIndex'),
    5: intField('visibility'),
    6: boolField('hasDefaultTrack'),
    7: boolField('hasForcedTrack'),
    8: stringField('audioTrackId'),
    11: intField('captionsInitialState'),
  },
  TranslationLanguage: {
    1: stringField('languageCode'),
    2: message('Label'),
  },
  AdSlot: {
    424701016: message('AdSlotRender'),
  },
  AdSlotRender: {},

  Setting: {
    6: message('SettingItem', true),
    7: message('SettingItem', true),
  },
  SettingItem: {
    88478200: message('BackgroundPlayBackSettingRenderer'),
    66930374: message('SettingCategoryCollectionRenderer'),
  },
  BackgroundPlayBackSettingRenderer: {
    1: message('Label'),
    2: boolField('backgroundPlayback'),
    3: boolField('download'),
    5: bytesField('trackingParams'),
    9: boolField('downloadQualitySelection'),
    10: boolField('smartDownload'),
    14: message('Icon'),
  },
  SettingCategoryCollectionRenderer: {
    2: message('Label'),
    3: message('SubSetting', true),
    4: intField('categoryId'),
    5: message('Icon'),
  },
  Icon: {
    1: intField('iconType'),
  },
  SubSetting: {
    61331416: message('SettingBooleanRenderer'),
  },
  SettingBooleanRenderer: {
    2: message('Label'),
    3: message('Label'),
    5: message('ServiceEndpoint'),
    6: message('ServiceEndpoint'),
    15: intField('itemId'),
  },
  ServiceEndpoint: {
    81212182: message('SetClientSettingEndpoint'),
  },
  SetClientSettingEndpoint: {
    1: message('SettingData'),
  },
  SettingData: {
    1: message('ClientSettingEnum'),
    3: boolField('boolValue'),
  },
  ClientSettingEnum: {
    1: intField('item'),
  },

  Watch: {
    1: message('WatchContent', true),
  },
  WatchContent: {
    2: message('Player'),
    3: message('Next'),
  },

  Config: {
    1: message('ConfigResponseContext'),
  },
  ConfigResponseContext: {
    16: message('GlobalConfigGroup'),
  },
  GlobalConfigGroup: {
    6: message('ColdConfigGroup'),
    7: message('HotConfigGroup'),
    4: stringField('hotHashData'),
    5: stringField('coldHashData'),
  },
  ColdConfigGroup: {},
  HotConfigGroup: {
    138536474: message('MediaHotConfig'),
  },
  MediaHotConfig: {
    146311580: message('OnesieHotConfig'),
  },
  OnesieHotConfig: {
    1: bytesField('clientKey'),
    2: bytesField('encryptKey'),
    3: intField('keyExpiresInSeconds'),
    30: boolField('useHotConfigToCreateOnesieRequest'),
  },
}

const SINGULAR_MESSAGE_FIELDS = Object.create(null)
for (const [schemaName, schema] of Object.entries(SCHEMAS)) {
  const entries = []
  const indexes = Object.create(null)
  for (const [rawNumber, descriptor] of Object.entries(schema)) {
    if (descriptor.kind !== 'message' || descriptor.repeated) continue
    indexes[rawNumber] = entries.length + 1
    entries.push([Number(rawNumber), descriptor])
  }
  SINGULAR_MESSAGE_FIELDS[schemaName] = { entries, indexes }
}

function concatBytes(parts) {
  let length = 0
  for (const part of parts) length += part.length
  if (length > MAX_OUTPUT_BYTES) throw new Error('YouTube transformed output exceeds its bound')
  serializationWorkBytes += length
  if (serializationWorkBytes > MAX_SERIALIZATION_WORK_BYTES) {
    throw new Error('YouTube serialization work exceeds its bound')
  }
  const output = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
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

function encodeVarint(input) {
  let value = BigInt(input)
  if (value < 0n) throw new Error('cannot encode a negative protobuf varint')
  const output = []
  while (value >= 0x80n) {
    output.push(Number(value & 0x7fn) | 0x80)
    value >>= 7n
  }
  output.push(Number(value))
  return new Uint8Array(output)
}

function encodeTag(number, wireType) {
  return encodeVarint((BigInt(number) << 3n) | BigInt(wireType))
}

function encodeLengthField(number, value) {
  return concatBytes([encodeTag(number, 2), encodeVarint(value.length), value])
}

function encodeVarintField(number, value) {
  return concatBytes([encodeTag(number, 0), encodeVarint(value)])
}

function appendCodePoint(output, codePoint) {
  if (codePoint <= 0xffff) {
    output.push(String.fromCharCode(codePoint))
    return
  }
  const value = codePoint - 0x10000
  output.push(String.fromCharCode(0xd800 | (value >> 10)))
  output.push(String.fromCharCode(0xdc00 | (value & 0x3ff)))
}

function decodeUTF8(bytes) {
  if (bytes.length > MAX_STRING_BYTES) throw new Error('protobuf string exceeds its bound')
  const output = []
  let index = 0
  while (index < bytes.length) {
    const first = bytes[index]
    let codePoint
    let count
    if (first < 0x80) {
      codePoint = first
      count = 1
    } else if ((first & 0xe0) === 0xc0) {
      codePoint = first & 0x1f
      count = 2
      if (codePoint < 2) throw new Error('invalid UTF-8 sequence')
    } else if ((first & 0xf0) === 0xe0) {
      codePoint = first & 0x0f
      count = 3
    } else if ((first & 0xf8) === 0xf0) {
      codePoint = first & 0x07
      count = 4
      if (codePoint > 4) throw new Error('invalid UTF-8 sequence')
    } else {
      throw new Error('invalid UTF-8 sequence')
    }
    if (index + count > bytes.length) throw new Error('truncated UTF-8 sequence')
    for (let offset = 1; offset < count; offset += 1) {
      const next = bytes[index + offset]
      if ((next & 0xc0) !== 0x80) throw new Error('invalid UTF-8 continuation byte')
      codePoint = (codePoint << 6) | (next & 0x3f)
    }
    if (
      (count === 2 && codePoint < 0x80) ||
      (count === 3 && codePoint < 0x800) ||
      (count === 4 && codePoint < 0x10000) ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
      codePoint > 0x10ffff
    ) {
      throw new Error('non-canonical UTF-8 sequence')
    }
    appendCodePoint(output, codePoint)
    index += count
  }
  return output.join('')
}

function encodeUTF8(input) {
  const output = []
  for (let index = 0; index < input.length; index += 1) {
    let codePoint = input.charCodeAt(index)
    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      if (index + 1 >= input.length) throw new Error('unpaired UTF-16 surrogate')
      const low = input.charCodeAt(index + 1)
      if (low < 0xdc00 || low > 0xdfff) throw new Error('unpaired UTF-16 surrogate')
      codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (low - 0xdc00)
      index += 1
    } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
      throw new Error('unpaired UTF-16 surrogate')
    }
    if (codePoint < 0x80) {
      output.push(codePoint)
    } else if (codePoint < 0x800) {
      output.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint < 0x10000) {
      output.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f))
    } else {
      output.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    }
  }
  if (output.length > MAX_STRING_BYTES) throw new Error('encoded protobuf string exceeds its bound')
  return new Uint8Array(output)
}

function skipWireValue(bytes, offset, wireType, fieldNumber, depth, budget) {
  if (depth > MAX_MESSAGE_DEPTH) throw new Error('protobuf group nesting exceeds its bound')
  if (wireType === 0) return offset + decodeVarint(bytes, offset).length
  if (wireType === 1) return offset + 8
  if (wireType === 2) {
    const length = decodeVarint(bytes, offset)
    const bodyStart = offset + length.length
    if (length.value > BigInt(bytes.length - bodyStart)) throw new Error('protobuf field exceeds the message body')
    return bodyStart + Number(length.value)
  }
  if (wireType === 3) {
    let cursor = offset
    while (cursor < bytes.length) {
      budget.fields += 1
      if (budget.fields > MAX_PARSED_FIELDS) throw new Error('protobuf field count exceeds its bound')
      const key = decodeVarint(bytes, cursor)
      cursor += key.length
      const nestedNumberValue = key.value >> 3n
      if (nestedNumberValue === 0n || nestedNumberValue > 536870911n) {
        throw new Error('invalid protobuf group field number')
      }
      const nestedNumber = Number(nestedNumberValue)
      const nestedType = Number(key.value & 7n)
      if (nestedType === 4) {
        if (nestedNumber !== fieldNumber) throw new Error('protobuf group end does not match its start')
        return cursor
      }
      cursor = skipWireValue(bytes, cursor, nestedType, nestedNumber, depth + 1, budget)
      if (cursor > bytes.length) throw new Error('protobuf group exceeds the message body')
    }
    throw new Error('unterminated protobuf group')
  }
  if (wireType === 4) throw new Error('unexpected protobuf end-group tag')
  if (wireType === 5) return offset + 4
  throw new Error(`unsupported protobuf wire type ${wireType}`)
}

function parseWireFields(bytes, budget) {
  const fields = []
  let offset = 0
  while (offset < bytes.length) {
    budget.fields += 1
    if (budget.fields > MAX_PARSED_FIELDS) throw new Error('protobuf field count exceeds its bound')
    const start = offset
    const key = decodeVarint(bytes, offset)
    offset += key.length
    const numberValue = key.value >> 3n
    if (numberValue === 0n || numberValue > 536870911n) throw new Error('invalid protobuf field number')
    const number = Number(numberValue)
    const wireType = Number(key.value & 7n)
    const encodedValueStart = offset
    let payloadStart = offset
    let payloadEnd = offset
    let varintValue = null
    if (wireType === 0) {
      const value = decodeVarint(bytes, offset)
      varintValue = value.value
      payloadEnd = offset + value.length
      offset = payloadEnd
    } else if (wireType === 2) {
      const length = decodeVarint(bytes, offset)
      payloadStart = offset + length.length
      if (length.value > BigInt(bytes.length - payloadStart)) {
        throw new Error('protobuf length-delimited field exceeds the message body')
      }
      payloadEnd = payloadStart + Number(length.value)
      offset = payloadEnd
    } else {
      offset = skipWireValue(bytes, offset, wireType, number, 0, budget)
      payloadEnd = offset
    }
    if (offset > bytes.length) throw new Error('unexpected end of protobuf field')
    fields.push({
      number,
      wireType,
      raw: bytes.subarray(start, offset),
      encodedValue: bytes.subarray(encodedValueStart, offset),
      payload: bytes.subarray(payloadStart, payloadEnd),
      varintValue,
      descriptor: null,
      child: null,
      originalChild: null,
      stringValue: null,
      removed: false,
      generated: false,
      mergeGroup: null,
      shadowed: false,
    })
  }
  return fields
}

function expectedWireType(descriptor) {
  if (descriptor.kind === 'message' || descriptor.kind === 'string' || descriptor.kind === 'bytes') return 2
  return 0
}

function parseMessage(bytes, schemaName, budget, depth) {
  if (depth > MAX_MESSAGE_DEPTH) throw new Error('protobuf message nesting exceeds its bound')
  const schema = SCHEMAS[schemaName]
  if (!schema) throw new Error(`missing protobuf schema ${schemaName}`)
  const parsed = {
    schemaName,
    original: bytes,
    fields: parseWireFields(bytes, budget),
  }
  for (const field of parsed.fields) {
    const descriptor = schema[field.number]
    if (!descriptor) continue
    field.descriptor = descriptor
    const expected = expectedWireType(descriptor)
    if (field.wireType !== expected) {
      if (!(descriptor.kind === 'repeatedInt32' && field.wireType === 2)) {
        throw new Error(`protobuf field ${schemaName}.${field.number} has the wrong wire type`)
      }
    }
    if (descriptor.kind === 'message') {
      field.child = parseMessage(field.payload, descriptor.name, budget, depth + 1)
      field.originalChild = field.child
    } else if (descriptor.kind === 'string') {
      field.stringValue = decodeUTF8(field.payload)
    }
  }
  linkMergedSingularMessages(parsed)
  return parsed
}

function mergeMessageValues(children, schemaName) {
  const merged = {
    schemaName,
    original: null,
    mergeBaseline: true,
    fields: [],
  }
  for (const child of children) {
    mergedFieldReferences += child.fields.length
    if (mergedFieldReferences > MAX_MERGED_FIELD_REFERENCES) {
      throw new Error('protobuf singular-message merge work exceeds its bound')
    }
    for (const field of child.fields) merged.fields.push(field)
  }
  linkMergedSingularMessages(merged)
  return merged
}

function linkMergedSingularMessages(messageValue) {
  const info = SINGULAR_MESSAGE_FIELDS[messageValue.schemaName]
  if (!info || !info.entries.length) return
  const grouped = new Array(info.entries.length)
  for (const field of messageValue.fields) {
    if (field.generated || !(field.originalChild || field.child)) continue
    const encodedIndex = info.indexes[field.number]
    if (!encodedIndex) continue
    const index = encodedIndex - 1
    if (field.descriptor !== info.entries[index][1]) continue
    if (!grouped[index]) grouped[index] = []
    grouped[index].push(field)
  }
  for (let index = 0; index < info.entries.length; index += 1) {
    const occurrences = grouped[index]
    if (!occurrences) continue
    const descriptor = info.entries[index][1]
    if (occurrences.length < 2) continue
    const merged = mergeMessageValues(
      occurrences.map((field) => field.originalChild || field.child),
      descriptor.name,
    )
    const group = { child: merged, fields: occurrences, serialized: null }
    for (const field of occurrences) {
      field.mergeGroup = group
      field.shadowed = true
    }
    // protobuf-ts creates the object property at the first occurrence and
    // merges later occurrences into that same value without moving the key.
    // Keep the merged view at that first position so LIFO property traversal
    // has the same sibling ordering as the generated object.
    const canonical = occurrences[0]
    canonical.shadowed = false
    canonical.child = merged
  }
}

function newMessage(schemaName) {
  if (!SCHEMAS[schemaName]) throw new Error(`missing protobuf schema ${schemaName}`)
  return { schemaName, original: null, fields: [] }
}

function fieldsByNumber(messageValue, number) {
  return messageValue.fields.filter((field) => !field.removed && !field.shadowed && field.number === number)
}

function lastField(messageValue, number) {
  for (let index = messageValue.fields.length - 1; index >= 0; index -= 1) {
    const field = messageValue.fields[index]
    if (!field.removed && !field.shadowed && field.number === number) return field
  }
  return null
}

function lastMessage(messageValue, number) {
  const field = lastField(messageValue, number)
  return field && field.child ? field.child : null
}

function lastString(messageValue, number) {
  const field = lastField(messageValue, number)
  return field && typeof field.stringValue === 'string' ? field.stringValue : ''
}

function lastInt(messageValue, number) {
  const field = lastField(messageValue, number)
  if (!field || field.wireType !== 0 || field.varintValue === null) return 0
  if (field.varintValue > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('protobuf integer exceeds JavaScript safe range')
  return Number(field.varintValue)
}

function lastBool(messageValue, number) {
  const field = lastField(messageValue, number)
  return Boolean(field && field.wireType === 0 && field.varintValue !== 0n)
}

function lastBytes(messageValue, number) {
  const field = lastField(messageValue, number)
  return field && field.wireType === 2 ? field.payload : null
}

function removeFields(messageValue, number) {
  let changed = false
  for (const field of messageValue.fields) {
    if (!field.removed && field.number === number) {
      field.removed = true
      changed = true
    }
  }
  return changed
}

function descriptorFor(messageValue, number, kind) {
  const descriptor = SCHEMAS[messageValue.schemaName][number]
  if (!descriptor || (kind && descriptor.kind !== kind)) {
    throw new Error(`invalid generated field ${messageValue.schemaName}.${number}`)
  }
  return descriptor
}

function appendMessage(messageValue, number, child) {
  const descriptor = descriptorFor(messageValue, number, 'message')
  if (descriptor.name !== child.schemaName) throw new Error('generated protobuf child has the wrong schema')
  messageValue.fields.push({
    number,
    wireType: 2,
    descriptor,
    child,
    originalChild: null,
    stringValue: null,
    varintValue: null,
    raw: null,
    encodedValue: null,
    payload: null,
    removed: false,
    generated: true,
    mergeGroup: null,
    shadowed: false,
  })
  return child
}

function replaceMessage(messageValue, number, child) {
  removeFields(messageValue, number)
  return appendMessage(messageValue, number, child)
}

function appendString(messageValue, number, value) {
  const descriptor = descriptorFor(messageValue, number, 'string')
  messageValue.fields.push({
    number,
    wireType: 2,
    descriptor,
    child: null,
    originalChild: null,
    stringValue: value,
    varintValue: null,
    raw: null,
    encodedValue: null,
    payload: null,
    removed: false,
    generated: true,
    mergeGroup: null,
    shadowed: false,
  })
}

function setString(messageValue, number, value) {
  removeFields(messageValue, number)
  appendString(messageValue, number, value)
}

function appendInt(messageValue, number, value) {
  const descriptor = SCHEMAS[messageValue.schemaName][number]
  if (!descriptor || (descriptor.kind !== 'int32' && descriptor.kind !== 'repeatedInt32' && descriptor.kind !== 'bool')) {
    throw new Error(`invalid generated varint field ${messageValue.schemaName}.${number}`)
  }
  if (!Number.isInteger(value) || value < 0 || value > 2147483647) throw new Error('generated int32 is out of range')
  messageValue.fields.push({
    number,
    wireType: 0,
    descriptor,
    child: null,
    originalChild: null,
    stringValue: null,
    varintValue: BigInt(value),
    raw: null,
    encodedValue: null,
    payload: null,
    removed: false,
    generated: true,
    mergeGroup: null,
    shadowed: false,
  })
}

function setInt(messageValue, number, value) {
  removeFields(messageValue, number)
  appendInt(messageValue, number, value)
}

function setBool(messageValue, number, value) {
  if (typeof value !== 'boolean') throw new Error('generated bool must be a boolean')
  removeFields(messageValue, number)
  if (value) appendInt(messageValue, number, 1)
}

function repeatedInts(messageValue, number) {
  const values = []
  for (const field of fieldsByNumber(messageValue, number)) {
    if (field.wireType === 0) {
      if (field.varintValue > 2147483647n) throw new Error('repeated int32 is out of range')
      values.push(Number(field.varintValue))
      continue
    }
    if (field.wireType === 2) {
      let offset = 0
      while (offset < field.payload.length) {
        const decoded = decodeVarint(field.payload, offset)
        if (decoded.value > 2147483647n) throw new Error('packed int32 is out of range')
        values.push(Number(decoded.value))
        offset += decoded.length
      }
    }
  }
  return values
}

function serializeMessage(messageValue, forceBody) {
  const parts = []
  let changed = Boolean(forceBody) || (messageValue.original === null && !messageValue.mergeBaseline)
  for (const field of messageValue.fields) {
    if (field.removed) {
      changed = true
      continue
    }
    if (!field.generated && field.mergeGroup) {
      if (!field.mergeGroup.serialized) {
        field.mergeGroup.serialized = serializeMessage(field.mergeGroup.child, false)
      }
      const merged = field.mergeGroup.serialized
      if (!merged.changed) {
        parts.push(field.raw)
      } else {
        changed = true
        if (!field.shadowed) parts.push(encodeLengthField(field.number, merged.body))
      }
      continue
    }
    if (!field.generated && field.child) {
      const nested = serializeMessage(field.child, false)
      if (!nested.changed) {
        parts.push(field.raw)
      } else {
        parts.push(encodeLengthField(field.number, nested.body))
        changed = true
      }
      continue
    }
    if (!field.generated) {
      parts.push(field.raw)
      continue
    }
    changed = true
    if (field.child) {
      parts.push(encodeLengthField(field.number, serializeMessage(field.child, true).body))
    } else if (typeof field.stringValue === 'string') {
      parts.push(encodeLengthField(field.number, encodeUTF8(field.stringValue)))
    } else if (field.varintValue !== null) {
      parts.push(encodeVarintField(field.number, field.varintValue))
    } else {
      throw new Error('generated protobuf field has no value')
    }
  }
  if (!changed) {
    return { body: messageValue.mergeBaseline ? null : messageValue.original, changed: false }
  }
  return { body: concatBytes(parts), changed: true }
}

function walkMessages(root, visitor) {
  const stack = [root]
  while (stack.length) {
    const current = stack.pop()
    if (visitor(current)) return current
    // The pinned wrapper pushes Object.keys() values in declaration order and
    // visits them through a LIFO stack. Pushing wire fields forward preserves
    // that last-candidate-first behavior for decoded message properties and
    // repeated arrays.
    for (let index = 0; index < current.fields.length; index += 1) {
      const field = current.fields[index]
      if (!field.removed && !field.shadowed && field.child) stack.push(field.child)
    }
  }
  return null
}

function findFirstMessage(root, schemaName) {
  return walkMessages(root, (current) => current.schemaName === schemaName)
}

function defaultAdState() {
  return {
    version: AD_STATE_VERSION,
    whiteNo: [],
    blackNo: [],
    whiteEml: [],
    blackEml: ['inline_injection_entrypoint_layout.eml'],
    dirty: false,
    scannedBytes: 0,
    cacheSets: Object.create(null),
  }
}

function validateCacheArray(value, kind) {
  if (!Array.isArray(value) || value.length > MAX_CACHE_ENTRIES) throw new Error('invalid YouTube ad cache')
  const output = []
  const seen = value.length > 16 ? new Set() : null
  for (const item of value) {
    if (kind === 'number') {
      if (!Number.isInteger(item) || item <= 0 || item > 536870911) throw new Error('invalid cached protobuf field number')
    } else if (typeof item !== 'string' || item.length > MAX_CACHE_STRING_BYTES) {
      throw new Error('invalid cached YouTube EML value')
    }
    if (seen) {
      if (seen.has(item)) continue
      seen.add(item)
      output.push(item)
    } else if (!output.includes(item)) {
      output.push(item)
    }
  }
  return output
}

function loadAdState(context) {
  if (!context.storage || typeof context.storage.get !== 'function' || typeof context.storage.set !== 'function') {
    throw new Error('YouTube ad classification requires persistent storage permission')
  }
  const raw = context.storage.get(AD_STATE_KEY)
  if (raw === null || raw === undefined || raw === '') return defaultAdState()
  if (typeof raw !== 'string' || raw.length > MAX_STORAGE_BYTES) throw new Error('invalid YouTube ad cache encoding')
  const parsed = JSON.parse(raw)
  if (!parsed || parsed.version !== AD_STATE_VERSION) return defaultAdState()
  return {
    version: AD_STATE_VERSION,
    whiteNo: validateCacheArray(parsed.whiteNo, 'number'),
    blackNo: validateCacheArray(parsed.blackNo, 'number'),
    whiteEml: validateCacheArray(parsed.whiteEml, 'string'),
    blackEml: validateCacheArray(parsed.blackEml, 'string'),
    dirty: false,
    scannedBytes: 0,
    cacheSets: Object.create(null),
  }
}

function cacheHas(state, key, value) {
  const list = state[key]
  if (list.length <= 16) return list.includes(value)
  let values = state.cacheSets[key]
  if (!values) {
    values = new Set(list)
    state.cacheSets[key] = values
  }
  return values.has(value)
}

function addCacheValue(state, key, value) {
  const list = state[key]
  if (cacheHas(state, key, value)) return
  if (typeof value === 'string' && value.length > MAX_CACHE_STRING_BYTES) {
    throw new Error('YouTube EML cache value exceeds its bound')
  }
  if (list.length >= MAX_CACHE_ENTRIES) throw new Error('YouTube ad cache entry limit exceeded')
  list.push(value)
  if (state.cacheSets[key]) state.cacheSets[key].add(value)
  state.dirty = true
}

function saveAdState(context, state) {
  if (!state.dirty) return
  const raw = JSON.stringify({
    version: AD_STATE_VERSION,
    whiteNo: state.whiteNo,
    blackNo: state.blackNo,
    whiteEml: state.whiteEml,
    blackEml: state.blackEml,
  })
  if (raw.length > MAX_STORAGE_BYTES) throw new Error('YouTube ad cache exceeds its storage bound')
  if (!context.storage.set(AD_STATE_KEY, raw)) throw new Error('failed to persist YouTube ad cache')
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function bytesToBase64(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > MAX_KEY_BYTES) throw new Error('YouTube key exceeds its bound')
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]
    const second = index + 1 < bytes.length ? bytes[index + 1] : 0
    const third = index + 2 < bytes.length ? bytes[index + 2] : 0
    const combined = (first << 16) | (second << 8) | third
    output += BASE64_ALPHABET[(combined >> 18) & 63]
    output += BASE64_ALPHABET[(combined >> 12) & 63]
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(combined >> 6) & 63] : '='
    output += index + 2 < bytes.length ? BASE64_ALPHABET[combined & 63] : '='
  }
  return output
}

function validBase64(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_KEY_BYTES * 2 &&
    value.length % 4 === 0 &&
    BASE64_PATTERN.test(value)
}

function validatePlatformConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid YouTube key config')
  if (!validBase64(value.clientKey) || !validBase64(value.encryptKey)) throw new Error('invalid YouTube key material')
  return { clientKey: value.clientKey, encryptKey: value.encryptKey }
}

function loadKeyConfig(context) {
  if (!context.storage || typeof context.storage.get !== 'function' || typeof context.storage.set !== 'function') {
    throw new Error('YouTube key learning requires persistent storage permission')
  }
  const raw = context.storage.get(CONFIG_KEY)
  if (raw === null || raw === undefined || raw === '') return {}
  if (typeof raw !== 'string' || raw.length > MAX_STORAGE_BYTES) throw new Error('invalid YouTube key config encoding')
  const parsed = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid YouTube key config')
  const config = {}
  for (const key of Object.keys(parsed)) {
    if (key !== 'youtube' && key !== 'youtubeMusic') throw new Error('invalid YouTube key config platform')
    config[key] = validatePlatformConfig(parsed[key])
  }
  return config
}

function saveKeyConfig(context, config) {
  const raw = JSON.stringify(config)
  if (raw.length > MAX_STORAGE_BYTES) throw new Error('YouTube key config exceeds its storage bound')
  if (!context.storage.set(CONFIG_KEY, raw)) throw new Error('failed to persist YouTube key config')
}

function requestHeader(context, target) {
  for (const [name, value] of Object.entries(context.request.headers || {})) {
    if (name.toLowerCase() !== target) continue
    return Array.isArray(value) ? (value[0] || '') : String(value)
  }
  return ''
}

function keyPlatform(context) {
  return requestHeader(context, 'user-agent').includes('music') ? 'youtubeMusic' : 'youtube'
}

function learnKeyConfig(context, root, stats) {
  const responseContext = lastMessage(root, 1)
  const globalConfig = responseContext ? lastMessage(responseContext, 16) : null
  const hotConfig = globalConfig ? lastMessage(globalConfig, 7) : null
  const mediaConfig = hotConfig ? lastMessage(hotConfig, 138536474) : null
  const onesieConfig = mediaConfig ? lastMessage(mediaConfig, 146311580) : null
  if (!onesieConfig) return
  const clientKey = lastBytes(onesieConfig, 1)
  const encryptKey = lastBytes(onesieConfig, 2)
  if (!clientKey || !clientKey.length || !encryptKey || !encryptKey.length) {
    console.warn('YouTube hot config does not contain complete Onesie key material')
    return
  }
  const next = {
    clientKey: bytesToBase64(clientKey),
    encryptKey: bytesToBase64(encryptKey),
  }
  const config = loadKeyConfig(context)
  const platform = keyPlatform(context)
  const current = config[platform]
  if (current && current.clientKey === next.clientKey && current.encryptKey === next.encryptKey) return
  config[platform] = next
  saveKeyConfig(context, config)
  stats.keyUpdates += 1
}

function encodedValueContainsPageAd(field, state) {
  const bytes = field.encodedValue
  if (!bytes || bytes.length < 1000) return false
  state.scannedBytes += bytes.length
  if (state.scannedBytes > MAX_AD_SCAN_BYTES) throw new Error('YouTube ad scan exceeds its byte bound')
  let index = 0
  while (index <= bytes.length - PAGEAD_MARKER.length) {
    if (
      bytes[index] === PAGEAD_MARKER[0] &&
      bytes[index + 1] === PAGEAD_MARKER[1] &&
      bytes[index + 2] === PAGEAD_MARKER[2] &&
      bytes[index + 3] === PAGEAD_MARKER[3] &&
      bytes[index + 4] === PAGEAD_MARKER[4] &&
      bytes[index + 5] === PAGEAD_MARKER[5]
    ) {
      return true
    }
    const next = bytes[index + PAGEAD_MARKER.length]
    index += next === undefined ? PAGEAD_MARKER.length + 1 : PAGEAD_SKIP[next]
  }
  return false
}

function firstUnknownField(messageValue) {
  return messageValue.fields.find((field) => !field.removed && !field.descriptor) || null
}

function videoRendererContent(richItem) {
  return findFirstMessage(richItem, 'VideoRendererContent')
}

function richItemIsAd(richItem, state) {
  const unknown = firstUnknownField(richItem)
  if (unknown) {
    if (cacheHas(state, 'whiteNo', unknown.number)) return false
    if (cacheHas(state, 'blackNo', unknown.number)) return true
    const isAd = encodedValueContainsPageAd(unknown, state)
    addCacheValue(state, isAd ? 'blackNo' : 'whiteNo', unknown.number)
    return isAd
  }

  const renderer = videoRendererContent(richItem)
  if (!renderer) return false
  const renderInfo = lastMessage(renderer, 2)
  const layoutRender = renderInfo ? lastMessage(renderInfo, 183314536) : null
  const eml = layoutRender ? lastString(layoutRender, 1).split('|')[0] : ''
  if (cacheHas(state, 'whiteEml', eml)) return false
  if (cacheHas(state, 'blackEml', eml) || SHORTS_EML_PATTERN.test(eml)) return true

  const videoInfo = lastMessage(renderer, 1)
  const videoContext = videoInfo ? lastMessage(videoInfo, 168777401) : null
  const videoContent = videoContext ? lastMessage(videoContext, 5) : null
  if (!videoContent) return false
  let isAd = false
  for (const field of videoContent.fields) {
    if (!field.removed && !field.descriptor && encodedValueContainsPageAd(field, state)) {
      isAd = true
      break
    }
  }
  addCacheValue(state, isAd ? 'blackEml' : 'whiteEml', eml)
  return isAd
}

function cleanRichItems(root, state, stats) {
  walkMessages(root, (current) => {
    if (current.schemaName !== 'ItemSectionRenderer' && current.schemaName !== 'ReelShelfRenderer') return false
    for (let index = current.fields.length - 1; index >= 0; index -= 1) {
      const field = current.fields[index]
      if (!field.removed && field.number === 1 && field.child && richItemIsAd(field.child, state)) {
        field.removed = true
        stats.feedItems += 1
      }
    }
    return false
  })
}

function makeLabel(text) {
  const label = newMessage('Label')
  const run = newMessage('Run')
  appendString(run, 1, text)
  appendMessage(label, 1, run)
  return label
}

function makePictureInPictureRenderer() {
  const renderer = newMessage('PictureInPictureSupportedRenderer')
  const ability = newMessage('PictureInPictureAbility')
  setBool(ability, 1, true)
  setInt(ability, 8, 1)
  appendMessage(renderer, 151635310, ability)
  return renderer
}

function makeBackgroundRenderer() {
  const renderer = newMessage('BackgroundSupportedRenderer')
  const ability = newMessage('BackgroundAbility')
  setBool(ability, 1, true)
  appendMessage(renderer, 64657230, ability)
  return renderer
}

function validLanguage(value, key) {
  if (typeof value !== 'string') throw new Error(`${key} must be a string`)
  const trimmed = value.trim()
  if (trimmed === 'off') return trimmed
  if (trimmed.length > 32 || !LANGUAGE_PATTERN.test(trimmed)) {
    throw new Error(`${key} is not a bounded language code or off`)
  }
  return trimmed
}

function normalizeSettings(raw) {
  const settings = raw || {}
  const booleanSetting = (key, fallback) => {
    const value = settings[key] === undefined ? fallback : settings[key]
    if (typeof value !== 'boolean') throw new Error(`${key} must be a boolean`)
    return value
  }
  return {
    blockUpload: booleanSetting('blockUpload', true),
    blockImmersive: booleanSetting('blockImmersive', true),
    blockShorts: booleanSetting('blockShorts', false),
    captionLang: validLanguage(settings.captionLang === undefined ? 'off' : settings.captionLang, 'captionLang'),
    debug: booleanSetting('debug', false),
  }
}

const TRANSLATION_LANGUAGES = [
  ['de', 'Deutsch'],
  ['ru', 'Русский'],
  ['fr', 'Français'],
  ['fil', 'Filipino'],
  ['ko', '한국어'],
  ['ja', '日本語'],
  ['en', 'English'],
  ['vi', 'Tiếng Việt'],
  ['zh-Hant', '中文（繁體）'],
  ['zh-Hans', '中文（简体）'],
  ['und', '@VirgilClyne'],
]

function makeCaptionTrack(baseURL, language) {
  const track = newMessage('CaptionTrack')
  setString(track, 1, `${baseURL}&tlang=${language}`)
  replaceMessage(track, 2, makeLabel(`@Enhance (${language})`))
  setString(track, 3, `.${language}`)
  setString(track, 4, language)
  return track
}

function makeTranslationLanguage(code, label) {
  const language = newMessage('TranslationLanguage')
  setString(language, 1, code)
  replaceMessage(language, 2, makeLabel(label))
  return language
}

function rewriteCaptions(player, language, stats) {
  if (language === 'off') return
  const list = findFirstMessage(player, 'PlayerCaptionsTrackListRenderer')
  if (!list) return
  const tracks = fieldsByNumber(list, 1).filter((field) => field.child)
  if (!tracks.length) return

  let priority = -1
  let targetIndex = 0
  for (let index = 0; index < tracks.length; index += 1) {
    const track = tracks[index].child
    const code = lastString(track, 4)
    // The upstream object literal gives English priority 1 even when it is
    // also the requested language. Preserve that observable behavior.
    const currentPriority = code === language ? (language === 'en' ? 1 : 2) : (code === 'en' ? 1 : 0)
    if (currentPriority && currentPriority > priority) {
      priority = currentPriority
      targetIndex = index
    }
    setBool(track, 7, true)
  }

  if (priority !== 2) {
    const baseURL = lastString(tracks[targetIndex].child, 1)
    if (!baseURL) throw new Error('cannot create a translated caption without a base URL')
    appendMessage(list, 1, makeCaptionTrack(baseURL, language))
    targetIndex = fieldsByNumber(list, 1).filter((field) => field.child).length - 1
  }

  for (const audioField of fieldsByNumber(list, 2)) {
    if (!audioField.child) continue
    const audio = audioField.child
    if (!repeatedInts(audio, 2).includes(targetIndex)) appendInt(audio, 2, targetIndex)
    setInt(audio, 3, targetIndex)
    setInt(audio, 11, 3)
  }

  removeFields(list, 3)
  for (const [code, label] of TRANSLATION_LANGUAGES) {
    appendMessage(list, 3, makeTranslationLanguage(code, label))
  }
  stats.captionLists += 1
}

function rewritePlayer(player, settings, stats) {
  for (const field of player.fields) {
    if (!field.removed && field.number === 7) {
      field.removed = true
      stats.adPlacements += 1
    } else if (!field.removed && field.number === 68) {
      field.removed = true
      stats.adSlots += 1
    }
  }
  for (const trackingField of fieldsByNumber(player, 9)) {
    if (!trackingField.child) continue
    for (const field of trackingField.child.fields) {
      if (!field.removed && field.number === 18) {
        field.removed = true
        stats.trackingFields += 1
      }
    }
  }

  let playability = lastMessage(player, 2)
  if (playability) {
    replaceMessage(playability, 21, makePictureInPictureRenderer())
    replaceMessage(playability, 11, makeBackgroundRenderer())
    stats.playerAbilities += 1
  }
  rewriteCaptions(player, settings.captionLang, stats)
}

function rewriteShorts(shorts, stats) {
  for (let index = shorts.fields.length - 1; index >= 0; index -= 1) {
    const field = shorts.fields[index]
    if (field.removed || field.number !== 2 || !field.child) continue
    const command = lastMessage(field.child, 1)
    const endpoint = command ? lastMessage(command, 139608561) : null
    const adClientParams = endpoint ? lastMessage(endpoint, 16) : null
    if (adClientParams && lastBool(adClientParams, 1)) {
      field.removed = true
      stats.shortsEntries += 1
    }
  }
}

function rewriteGuide(guide, settings, stats) {
  const blocked = ['SPunlimited']
  if (settings.blockUpload) blocked.push('FEuploads')
  if (settings.blockImmersive) blocked.push('FEmusic_immersive')
  if (settings.blockShorts) blocked.push('FEshorts')
  walkMessages(guide, (current) => {
    if (current.schemaName !== 'GuideSectionRenderer') return false
    for (let index = current.fields.length - 1; index >= 0; index -= 1) {
      const field = current.fields[index]
      if (field.removed || field.number !== 1 || !field.child) continue
      const icon = lastMessage(field.child, 318370163)
      const label = lastMessage(field.child, 117501096)
      const browseID = icon ? lastString(icon, 1) : (label ? lastString(label, 1) : '')
      if (blocked.includes(browseID)) {
        field.removed = true
        stats.guideItems += 1
      }
    }
    return false
  })
}

function makeSettingData(enabled) {
  const data = newMessage('SettingData')
  const settingEnum = newMessage('ClientSettingEnum')
  setInt(settingEnum, 1, 151)
  appendMessage(data, 1, settingEnum)
  setBool(data, 3, enabled)
  return data
}

function makeServiceEndpoint(enabled) {
  const service = newMessage('ServiceEndpoint')
  const endpoint = newMessage('SetClientSettingEndpoint')
  appendMessage(endpoint, 1, makeSettingData(enabled))
  appendMessage(service, 81212182, endpoint)
  return service
}

function makePIPSetting() {
  const subSetting = newMessage('SubSetting')
  const renderer = newMessage('SettingBooleanRenderer')
  appendMessage(renderer, 5, makeServiceEndpoint(true))
  appendMessage(renderer, 6, makeServiceEndpoint(false))
  appendMessage(subSetting, 61331416, renderer)
  return subSetting
}

function makeBackgroundSettingItem() {
  const item = newMessage('SettingItem')
  const renderer = newMessage('BackgroundPlayBackSettingRenderer')
  setBool(renderer, 2, true)
  setBool(renderer, 3, true)
  setBool(renderer, 9, true)
  setBool(renderer, 10, true)
  const icon = newMessage('Icon')
  setInt(icon, 1, 1093)
  appendMessage(renderer, 14, icon)
  appendMessage(item, 88478200, renderer)
  return item
}

function rewriteSetting(setting, stats) {
  for (const itemField of fieldsByNumber(setting, 6)) {
    if (!itemField.child) continue
    const category = lastMessage(itemField.child, 66930374)
    if (category && lastInt(category, 4) === 10135) {
      appendMessage(category, 3, makePIPSetting())
      stats.settingItems += 1
    }
  }
  appendMessage(setting, 6, makeBackgroundSettingItem())
  stats.settingItems += 1
}

function endpointForURL(rawURL) {
  const path = rawURL.split('?', 1)[0]
  if (path.endsWith('/youtubei/v1/browse')) return { name: 'browse', schema: 'Browse' }
  if (path.endsWith('/youtubei/v1/next')) return { name: 'next', schema: 'Next' }
  if (path.endsWith('/youtubei/v1/player')) return { name: 'player', schema: 'Player' }
  if (path.endsWith('/youtubei/v1/search')) return { name: 'search', schema: 'Search' }
  if (path.endsWith('/youtubei/v1/reel/reel_watch_sequence')) return { name: 'reel_watch_sequence', schema: 'Shorts' }
  if (path.endsWith('/youtubei/v1/guide')) return { name: 'guide', schema: 'Guide' }
  if (path.endsWith('/youtubei/v1/account/get_setting')) return { name: 'get_setting', schema: 'Setting' }
  if (path.endsWith('/youtubei/v1/get_watch')) return { name: 'get_watch', schema: 'Watch' }
  if (path.endsWith('/youtubei/v1/config')) return { name: 'config', schema: 'Config' }
  if (path.endsWith('/youtubei/v1/log_event')) return { name: 'log_event', schema: 'Config' }
  throw new Error('unexpected YouTube response endpoint')
}

function newStats() {
  return {
    adPlacements: 0,
    adSlots: 0,
    trackingFields: 0,
    feedItems: 0,
    shortsEntries: 0,
    guideItems: 0,
    settingItems: 0,
    playerAbilities: 0,
    captionLists: 0,
    keyUpdates: 0,
  }
}

function transform(context) {
  const body = context.response.body
  if (!(body instanceof Uint8Array)) throw new Error('YouTube response is not a binary body')
  const endpoint = endpointForURL(context.request.url)
  const settings = normalizeSettings(context.settings)
  const budget = { fields: 0 }
  mergedFieldReferences = 0
  const root = parseMessage(body, endpoint.schema, budget, 0)
  const stats = newStats()
  let adState = null

  if (endpoint.name === 'browse' || endpoint.name === 'next' || endpoint.name === 'search') {
    adState = loadAdState(context)
    cleanRichItems(root, adState, stats)
  } else if (endpoint.name === 'player') {
    rewritePlayer(root, settings, stats)
  } else if (endpoint.name === 'reel_watch_sequence') {
    rewriteShorts(root, stats)
  } else if (endpoint.name === 'guide') {
    rewriteGuide(root, settings, stats)
  } else if (endpoint.name === 'get_setting') {
    rewriteSetting(root, stats)
  } else if (endpoint.name === 'get_watch') {
    adState = loadAdState(context)
    for (const contentField of fieldsByNumber(root, 1)) {
      if (!contentField.child) continue
      const player = lastMessage(contentField.child, 2)
      const next = lastMessage(contentField.child, 3)
      if (player) rewritePlayer(player, settings, stats)
      if (next) cleanRichItems(next, adState, stats)
    }
  } else if (endpoint.name === 'config' || endpoint.name === 'log_event') {
    learnKeyConfig(context, root, stats)
  }

  if (adState) saveAdState(context, adState)
  if ((endpoint.name === 'config' || endpoint.name === 'log_event') && settings.debug && stats.keyUpdates) {
    console.info(`YouTube ${endpoint.name} transform: ${JSON.stringify(stats)}`)
  }
  serializationWorkBytes = 0
  const serialized = serializeMessage(root)
  if (!serialized.changed) return null
  if (settings.debug) console.info(`YouTube ${endpoint.name} transform: ${JSON.stringify(stats)}`)
  return { response: { body: serialized.body } }
}
