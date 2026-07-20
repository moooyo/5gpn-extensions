// MIT-licensed native port of the pinned SVE1R Spotify transformer.
// See README.md and THIRD_PARTY_NOTICES.md for provenance and changes.

function concatBytes(parts) {
  var length = 0
  for (var index = 0; index < parts.length; index += 1) length += parts[index].length
  var output = new Uint8Array(length)
  var offset = 0
  for (var partIndex = 0; partIndex < parts.length; partIndex += 1) {
    output.set(parts[partIndex], offset)
    offset += parts[partIndex].length
  }
  return output
}

function decodeVarint(bytes, offset) {
  var value = 0n
  for (var index = 0; index < 10; index += 1) {
    if (offset + index >= bytes.length) throw new Error('unexpected end of protobuf varint')
    var byte = bytes[offset + index]
    if (index === 9 && byte > 1) throw new Error('protobuf varint overflows uint64')
    value |= BigInt(byte & 0x7f) << BigInt(index * 7)
    if (byte < 0x80) return { value: value, length: index + 1 }
  }
  throw new Error('protobuf varint is too long')
}

function encodeVarint(input) {
  var value = BigInt.asUintN(64, input)
  var output = []
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
  var fields = []
  var offset = 0
  while (offset < bytes.length) {
    var start = offset
    var key = decodeVarint(bytes, offset)
    offset += key.length
    var number = Number(key.value >> 3n)
    var wireType = Number(key.value & 7n)
    if (number === 0) throw new Error('protobuf field number is zero')
    var valueStart = offset
    var valueEnd = offset
    if (wireType === 0) {
      var scalar = decodeVarint(bytes, offset)
      valueEnd = offset + scalar.length
    } else if (wireType === 1) {
      valueEnd = offset + 8
    } else if (wireType === 2) {
      var length = decodeVarint(bytes, offset)
      offset += length.length
      if (length.value > BigInt(bytes.length - offset)) throw new Error('protobuf field is too large')
      valueStart = offset
      valueEnd = offset + Number(length.value)
    } else if (wireType === 5) {
      valueEnd = offset + 4
    } else {
      throw new Error('unsupported protobuf wire type ' + wireType)
    }
    if (valueEnd > bytes.length) throw new Error('unexpected end of protobuf field')
    offset = valueEnd
    fields.push({
      number: number,
      wireType: wireType,
      value: bytes.slice(valueStart, valueEnd),
      raw: bytes.slice(start, offset),
    })
  }
  return fields
}

function encodeFields(fields) {
  var parts = []
  for (var index = 0; index < fields.length; index += 1) parts.push(fields[index].raw)
  return concatBytes(parts)
}

function findLengthField(fields, number) {
  for (var index = 0; index < fields.length; index += 1) {
    if (fields[index].number === number && fields[index].wireType === 2) return fields[index]
  }
  return null
}

function requireLengthField(fields, number, name) {
  var field = findLengthField(fields, number)
  if (!field) throw new Error('missing protobuf field ' + name)
  return field
}

function replaceLengthField(field, payload) {
  field.value = payload
  field.raw = encodeLengthField(field.number, payload)
}

function decodeASCII(bytes) {
  var output = ''
  for (var index = 0; index < bytes.length; index += 1) {
    if (bytes[index] > 0x7f) return null
    output += String.fromCharCode(bytes[index])
  }
  return output
}

function encodeASCII(value) {
  var output = new Uint8Array(value.length)
  for (var index = 0; index < value.length; index += 1) {
    var code = value.charCodeAt(index)
    if (code > 0x7f) throw new Error('non-ASCII protobuf value')
    output[index] = code
  }
  return output
}

function makeStringField(number, value) {
  return encodeLengthField(number, encodeASCII(value))
}

function readStringField(fields, number) {
  var field = findLengthField(fields, number)
  return field ? decodeASCII(field.value) : null
}

var ACCOUNT_ATTRIBUTES = [
  { key: 'ads', kind: 'boolean', value: false },
  { key: 'com.spotify.madprops.use.ucs.product.state', kind: 'boolean', value: true },
  { key: 'nft-disabled', kind: 'string', value: '1' },
  { key: 'offline', kind: 'boolean', value: true },
  { key: 'player-license', kind: 'string', value: 'premium' },
  { key: 'streaming-rules', kind: 'string', value: '' },
  { key: 'type', kind: 'string', value: 'premium' },
  { key: 'name', kind: 'string', value: 'Spotify Premium' },
  { key: 'financial-product', kind: 'string', value: 'pr:premium,tc:0' },
]

function makeAttributeEntry(attribute) {
  var valueBytes
  if (attribute.kind === 'boolean') {
    valueBytes = encodeVarintField(2, attribute.value ? 1n : 0n)
  } else {
    valueBytes = makeStringField(4, attribute.value)
  }
  var entry = concatBytes([
    makeStringField(1, attribute.key),
    encodeLengthField(2, valueBytes),
  ])
  return encodeLengthField(1, entry)
}

function isReplacedAttribute(key) {
  for (var index = 0; index < ACCOUNT_ATTRIBUTES.length; index += 1) {
    if (ACCOUNT_ATTRIBUTES[index].key === key) return true
  }
  return false
}

function patchAttributes(attributeFields, stats) {
  var kept = []
  for (var index = 0; index < attributeFields.length; index += 1) {
    var field = attributeFields[index]
    if (field.number !== 1 || field.wireType !== 2) {
      kept.push(field.raw)
      continue
    }
    var entryFields = parseFields(field.value)
    var key = readStringField(entryFields, 1)
    if (!isReplacedAttribute(key)) kept.push(field.raw)
  }
  for (var attributeIndex = 0; attributeIndex < ACCOUNT_ATTRIBUTES.length; attributeIndex += 1) {
    kept.push(makeAttributeEntry(ACCOUNT_ATTRIBUTES[attributeIndex]))
  }
  stats.attributes = ACCOUNT_ATTRIBUTES.length
  return concatBytes(kept)
}

function patchCustomization(bytes, stats) {
  var rootFields = parseFields(bytes)
  var successField = requireLengthField(rootFields, 1, 'success')
  var successFields = parseFields(successField.value)

  var attributesField = requireLengthField(successFields, 3, 'account attributes success')
  var attributeFields = parseFields(attributesField.value)
  replaceLengthField(attributesField, patchAttributes(attributeFields, stats))

  replaceLengthField(successField, encodeFields(successFields))
  return encodeFields(rootFields)
}

function patchBootstrap(bytes, stats) {
  var rootFields = parseFields(bytes)
  var ucsField = requireLengthField(rootFields, 2, 'bootstrap UCS response')
  var ucsFields = parseFields(ucsField.value)
  var successField = requireLengthField(ucsFields, 1, 'bootstrap success')
  var successFields = parseFields(successField.value)
  var customizationField = requireLengthField(successFields, 1, 'bootstrap customization')

  replaceLengthField(customizationField, patchCustomization(customizationField.value, stats))
  replaceLengthField(successField, encodeFields(successFields))
  replaceLengthField(ucsField, encodeFields(ucsFields))
  return encodeFields(rootFields)
}

function transform(context) {
  var body = context.response.body
  if (!(body instanceof Uint8Array) || body.length === 0) {
    throw new Error('Spotify response body is not a non-empty binary payload')
  }

  var stats = { attributes: 0 }
  var isCustomization = context.request.url.indexOf('/user-customization-service') >= 0
  var patched = isCustomization
    ? patchCustomization(body, stats)
    : patchBootstrap(body, stats)
  console.info('patched Spotify attributes=' + stats.attributes)
  return { response: { body: patched } }
}
