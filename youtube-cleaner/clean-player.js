// Apache-2.0 port of the pinned Maasea/sgmodule YouTube behavior.
// Manually reimplemented for transform(context); no upstream runtime adapter
// or proxy-client global is included. See README.md for source and changes.

function concatBytes(parts) {
  let length = 0
  for (const part of parts) length += part.length
  const output = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

function bytesEqual(left, right) {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
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
  let value = input
  if (value < 0n) throw new Error('cannot encode a negative protobuf varint')
  const output = []
  while (value >= 0x80n) {
    output.push(Number(value & 0x7fn) | 0x80)
    value >>= 7n
  }
  output.push(Number(value))
  return new Uint8Array(output)
}

function encodeLengthField(number, value) {
  return concatBytes([
    encodeVarint((BigInt(number) << 3n) | 2n),
    encodeVarint(BigInt(value.length)),
    value,
  ])
}

function parseFields(bytes) {
  const fields = []
  let offset = 0
  while (offset < bytes.length) {
    const start = offset
    const key = decodeVarint(bytes, offset)
    offset += key.length
    const numberValue = key.value >> 3n
    if (numberValue === 0n || numberValue > 536870911n) {
      throw new Error('invalid protobuf field number')
    }
    const number = Number(numberValue)
    const wireType = Number(key.value & 7n)
    let valueStart = offset
    let valueEnd = offset
    if (wireType === 0) {
      const value = decodeVarint(bytes, offset)
      valueEnd = offset + value.length
    } else if (wireType === 1) {
      valueEnd = offset + 8
    } else if (wireType === 2) {
      const length = decodeVarint(bytes, offset)
      offset += length.length
      if (length.value > BigInt(bytes.length - offset)) {
        throw new Error('protobuf length-delimited field exceeds the response body')
      }
      valueStart = offset
      valueEnd = offset + Number(length.value)
    } else if (wireType === 5) {
      valueEnd = offset + 4
    } else {
      throw new Error(`unsupported protobuf wire type ${wireType}`)
    }
    if (valueEnd > bytes.length) throw new Error('unexpected end of protobuf field')
    offset = valueEnd
    fields.push({
      number,
      wireType,
      value: bytes.slice(valueStart, valueEnd),
      raw: bytes.slice(start, offset),
    })
  }
  return fields
}

function rewriteMessage(bytes, handlers) {
  const parts = []
  let changed = false
  for (const field of parseFields(bytes)) {
    const handler = handlers[field.number]
    if (!handler) {
      parts.push(field.raw)
      continue
    }
    if (field.wireType !== 2) {
      throw new Error(`expected length-delimited protobuf field ${field.number}`)
    }
    const replacement = handler(field.value)
    if (replacement === null) {
      changed = true
      continue
    }
    if (!(replacement instanceof Uint8Array)) {
      throw new Error(`invalid replacement for protobuf field ${field.number}`)
    }
    if (bytesEqual(replacement, field.value)) {
      parts.push(field.raw)
      continue
    }
    changed = true
    parts.push(encodeLengthField(field.number, replacement))
  }
  return {
    body: changed ? concatBytes(parts) : bytes,
    changed,
  }
}

function rewritePlaybackTracking(bytes, stats) {
  return rewriteMessage(bytes, {
    18: () => {
      stats.trackingFields += 1
      return null
    },
  }).body
}

function rewritePlayer(bytes, stats) {
  return rewriteMessage(bytes, {
    7: () => {
      stats.adPlacements += 1
      return null
    },
    9: (value) => rewritePlaybackTracking(value, stats),
    68: () => {
      stats.adSlots += 1
      return null
    },
  }).body
}

function rewriteWatchContent(bytes, stats) {
  return rewriteMessage(bytes, {
    2: (value) => rewritePlayer(value, stats),
  }).body
}

function rewriteWatch(bytes, stats) {
  return rewriteMessage(bytes, {
    1: (value) => rewriteWatchContent(value, stats),
  }).body
}

function transform(context) {
  const body = context.response.body
  if (!(body instanceof Uint8Array) || body.length === 0) {
    throw new Error('YouTube player response is not a non-empty binary body')
  }

  const requestPath = context.request.url.split('?', 1)[0]
  const stats = { adPlacements: 0, adSlots: 0, trackingFields: 0 }
  let patched
  if (requestPath.endsWith('/youtubei/v1/player')) {
    patched = rewritePlayer(body, stats)
  } else if (requestPath.endsWith('/youtubei/v1/get_watch')) {
    patched = rewriteWatch(body, stats)
  } else {
    throw new Error('unexpected YouTube player endpoint')
  }

  const removed = stats.adPlacements + stats.adSlots + stats.trackingFields
  if (removed === 0) return null
  console.info(
    `removed YouTube player fields: placements=${stats.adPlacements} slots=${stats.adSlots} tracking=${stats.trackingFields}`,
  )
  return { response: { body: patched } }
}
