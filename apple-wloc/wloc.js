// Derived from the MIT-licensed FFF686868/proxypin-wloc-spoofer v5.4.2 source.
// See THIRD_PARTY_NOTICES.md for attribution and license details.

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
    value |= BigInt(byte & 0x7f) << BigInt(7 * index)
    if (byte < 0x80) return { value, length: index + 1 }
  }
  throw new Error('protobuf varint is too long')
}

function encodeVarint(input) {
  let value = BigInt.asUintN(64, input)
  const output = []
  while (value >= 0x80n) {
    output.push(Number(value & 0x7fn) | 0x80)
    value >>= 7n
  }
  output.push(Number(value))
  return new Uint8Array(output)
}

function encodeVarintField(number, value) {
  return concatBytes([encodeVarint(BigInt(number) << 3n), encodeVarint(value)])
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
    if (numberValue === 0n || numberValue > 536870911n) throw new Error('protobuf field number is invalid')
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
      value: bytes.subarray(valueStart, valueEnd),
      raw: bytes.subarray(start, offset),
    })
  }
  return fields
}

function isMAC(bytes) {
  let separators = 0
  let digits = 0
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index]
    if (byte === 58) {
      if (digits < 1 || digits > 2) return false
      separators += 1
      digits = 0
      continue
    }
    const decimal = byte >= 48 && byte <= 57
    const lower = byte >= 97 && byte <= 102
    const upper = byte >= 65 && byte <= 70
    if (!decimal && !lower && !upper) return false
    digits += 1
    if (digits > 2) return false
  }
  return separators === 5 && digits >= 1 && digits <= 2
}

function normalizeTarget(target) {
  const longitude = Number(target.longitude)
  const latitude = Number(target.latitude)
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('target longitude is invalid')
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('target latitude is invalid')
  }

  let accuracy = Number(target.accuracy)
  if (!Number.isFinite(accuracy) || accuracy <= 0) accuracy = 25
  accuracy = Math.max(1, Math.min(10000, Math.round(accuracy)))
  return { longitude, latitude, accuracy }
}

function patchLocation(bytes, target, stats) {
  const fields = parseFields(bytes)
  const hasLatitude = fields.some((field) => field.number === 1 && field.wireType === 0)
  const hasLongitude = fields.some((field) => field.number === 2 && field.wireType === 0)
  if (!hasLatitude || !hasLongitude) return bytes
  const latitude = BigInt.asUintN(64, BigInt(Math.round(target.latitude * 1e8)))
  const longitude = BigInt.asUintN(64, BigInt(Math.round(target.longitude * 1e8)))
  const parts = fields.map((field) => {
    if (field.number === 1 && field.wireType === 0) return encodeVarintField(1, latitude)
    if (field.number === 2 && field.wireType === 0) return encodeVarintField(2, longitude)
    if (field.number === 3 && field.wireType === 0) return encodeVarintField(3, BigInt(target.accuracy))
    return field.raw
  })
  stats.locations += 1
  return concatBytes(parts)
}

function patchWiFi(bytes, target, stats) {
  const fields = parseFields(bytes)
  let looksLikeWiFi = false
  for (const field of fields) {
    if (field.number === 1 && field.wireType === 2) looksLikeWiFi = isMAC(field.value)
  }
  if (!looksLikeWiFi) return bytes
  let changed = false
  const parts = fields.map((field) => {
    if (field.number !== 2 || field.wireType !== 2) return field.raw
    try {
      const patched = patchLocation(field.value, target, stats)
      if (!bytesEqual(patched, field.value)) changed = true
      return encodeLengthField(field.number, patched)
    } catch (_) {
      stats.skipped += 1
      return field.raw
    }
  })
  if (changed) stats.wifi += 1
  return concatBytes(parts)
}

function patchCell(bytes, target, stats) {
  const fields = parseFields(bytes)
  let changed = false
  const parts = fields.map((field) => {
    if (field.number !== 5 || field.wireType !== 2) return field.raw
    try {
      const patched = patchLocation(field.value, target, stats)
      if (!bytesEqual(patched, field.value)) changed = true
      return encodeLengthField(field.number, patched)
    } catch (_) {
      stats.skipped += 1
      return field.raw
    }
  })
  if (changed) stats.cell += 1
  return concatBytes(parts)
}

function patchRoot(bytes, target, stats) {
  const fields = parseFields(bytes)
  const parts = fields.map((field) => {
    if (field.number === 2 && field.wireType === 2) {
      return encodeLengthField(field.number, patchWiFi(field.value, target, stats))
    }
    if ((field.number === 22 || field.number === 24) && field.wireType === 2) {
      return encodeLengthField(field.number, patchCell(field.value, target, stats))
    }
    return field.raw
  })
  return concatBytes(parts)
}

function patchFramed(bytes, target, stats) {
  if (bytes.length < 10) throw new Error('body is too short for framed WLOC')
  const length = bytes[8] * 256 + bytes[9]
  if (length <= 0 || 10 + length > bytes.length) throw new Error('invalid framed WLOC length')
  const payload = bytes.subarray(10, 10 + length)
  const patched = patchRoot(payload, target, stats)
  if (stats.locations === 0 || bytesEqual(payload, patched)) throw new Error('framed payload has no patchable location')
  if (patched.length > 65535) throw new Error('patched framed payload is too large')
  return concatBytes([
    bytes.subarray(0, 8),
    new Uint8Array([patched.length >> 8, patched.length & 0xff]),
    patched,
    bytes.subarray(10 + length),
  ])
}

function patchWLOC(bytes, target) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) throw new Error('empty WLOC response')
  const stats = { wifi: 0, cell: 0, locations: 0, skipped: 0 }
  return { body: patchFramed(bytes, target, stats), stats }
}

function transform(context) {
  const location = context.settings.location
  const failClosed = context.settings.failClosed !== false
  if (!location || location.longitude == null || location.latitude == null) {
    throw new Error('target location is not configured')
  }
  const target = normalizeTarget(location)
  try {
    const patched = patchWLOC(context.response.body, target)
    console.info(`patched locations=${patched.stats.locations} wifi=${patched.stats.wifi} cell=${patched.stats.cell} skipped=${patched.stats.skipped}`)
    return { response: { body: patched.body } }
  } catch (error) {
    if (failClosed) throw error
    console.warn(`skipped WLOC response: ${error}`)
    return null
  }
}
