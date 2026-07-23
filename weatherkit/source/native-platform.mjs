export class TextEncoder {
  encode(input = '') {
    const bytes = []
    const text = String(input)
    for (let index = 0; index < text.length; index += 1) {
      let code = text.charCodeAt(index)
      if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
        const low = text.charCodeAt(index + 1)
        if (low >= 0xdc00 && low <= 0xdfff) {
          code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00)
          index += 1
        }
      }
      if (code <= 0x7f) bytes.push(code)
      else if (code <= 0x7ff) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code <= 0xffff) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return new Uint8Array(bytes)
  }
}

export class TextDecoder {
  constructor(_label, options = {}) {
    this.fatal = options.fatal === true
  }

  decode(input = new Uint8Array()) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
    let result = ''
    for (let index = 0; index < bytes.length; ) {
      const first = bytes[index]
      let code
      let length
      if (first <= 0x7f) {
        code = first
        length = 1
      } else if (first >= 0xc2 && first <= 0xdf) {
        code = first & 0x1f
        length = 2
      } else if (first >= 0xe0 && first <= 0xef) {
        code = first & 0x0f
        length = 3
      } else if (first >= 0xf0 && first <= 0xf4) {
        code = first & 0x07
        length = 4
      } else {
        if (this.fatal) throw new TypeError('Invalid UTF-8')
        result += '\ufffd'
        index += 1
        continue
      }
      if (index + length > bytes.length) {
        if (this.fatal) throw new TypeError('Invalid UTF-8')
        result += '\ufffd'
        break
      }
      let valid = true
      for (let offset = 1; offset < length; offset += 1) {
        const next = bytes[index + offset]
        if ((next & 0xc0) !== 0x80) {
          valid = false
          break
        }
        code = (code << 6) | (next & 0x3f)
      }
      const minimum = length === 2 ? 0x80 : length === 3 ? 0x800 : length === 4 ? 0x10000 : 0
      if (!valid || code < minimum || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        if (this.fatal) throw new TypeError('Invalid UTF-8')
        result += '\ufffd'
        index += 1
        continue
      }
      if (code <= 0xffff) result += String.fromCharCode(code)
      else {
        code -= 0x10000
        result += String.fromCharCode(0xd800 | (code >> 10), 0xdc00 | (code & 0x3ff))
      }
      index += length
    }
    return result
  }
}
