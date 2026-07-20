// GPL-3.0-only port of responses declared by kokoryh/Sparkle's Bilibili plugin.

const MOCK_FRAMES = Object.freeze({
  '/bilibili.app.interface.v1.Teenagers/ModeStatus':
    'AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA',
  '/bilibili.app.interface.v1.Search/DefaultWords':
    'AAAAACkaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7IgAoAToAQgBKAA==',
  '/bilibili.app.view.v1.View/TFInfo': 'AAAAAAIIAQ==',
})

function decodeBase64(value) {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const output = []
  let buffer = 0
  let bits = 0

  for (const character of value) {
    if (character === '=') {
      break
    }
    const index = alphabet.indexOf(character)
    if (index < 0) {
      throw new Error('Invalid pinned base64 payload')
    }
    buffer = (buffer << 6) | index
    bits += 6
    if (bits >= 8) {
      bits -= 8
      output.push((buffer >> bits) & 0xff)
    }
  }

  return new Uint8Array(output)
}

function transform(context) {
  const match = /^https?:\/\/[^/:?#]+(?::[0-9]+)?(\/[^?#]*)?(?:\?[^#]*)?$/i.exec(
    context.request.url,
  )
  const path = match && (match[1] || '/')
  const encoded = MOCK_FRAMES[path]
  if (!encoded) {
    return null
  }

  return {
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/grpc',
        'Grpc-Status': '0',
      },
      body: decodeBase64(encoded),
    },
  }
}
