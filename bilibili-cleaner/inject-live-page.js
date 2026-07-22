// GPL-3.0-only native port of kokoryh/Sparkle's Bilibili live-page transform.

const CLIENT_SCRIPT = `(()=>{
  const hidden = new Set()
  const containerNames = [
    'EvaLayoutContainerPrerender',
    'EvaLayoutContainer',
    'EvaLinkButton',
    'H5Slider',
  ]

  function isContainer(name) {
    return containerNames.includes(name)
  }

  function hasExternalLink(node) {
    const jumpAddress = node.props?.jumpAddress
    const sliderLinks = node.props?.list?.map((item) => item.link) || []
    return [jumpAddress, ...sliderLinks].some(
      (link) => link && !new URL(link).hostname.includes('bilibili'),
    )
  }

  function walkNodes(nodes, ancestors = []) {
    for (const node of nodes) {
      const container = isContainer(node.name)
      if (container) ancestors.push(node.uuid)
      if (hasExternalLink(node)) ancestors.forEach((uuid) => hidden.add(uuid))
      for (const slot of node.slots || []) {
        if (slot.children?.length) walkNodes(slot.children, ancestors)
      }
      if (container) ancestors.pop()
    }
  }

  const layerTree = window.__BILIACT_EVAPAGEDATA__?.layerTree
  if (!layerTree) return
  walkNodes(layerTree)
  if (!hidden.size) return
  const style = document.createElement('style')
  style.textContent = Array.from(hidden)
    .map((uuid) => '#' + uuid + '{display:none!important}')
    .join('')
  document.head.appendChild(style)
})();`

const RAW_TEXT_NAMES = new Set(['script', 'style', 'title', 'textarea'])
const TAG_NAME_PATTERN = /^\/?([A-Za-z][A-Za-z0-9:-]*)/

function headerValue(headers, name) {
  if (!headers || typeof headers !== 'object') {
    return null
  }
  const expected = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === expected) {
      return String(headers[key])
    }
  }
  return null
}

function findTagEnd(body, start) {
  let quote = ''
  for (let index = start; index < body.length; index += 1) {
    const character = body[index]
    if (quote) {
      if (character === quote) quote = ''
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '>') {
      return index
    }
  }
  return -1
}

function findDocumentBoundaries(body) {
  const lower = body.toLowerCase()
  const boundaries = { headOpenEnd: -1, headCloseStart: -1, htmlOpenEnd: -1 }
  let offset = 0

  while (offset < body.length) {
    const start = body.indexOf('<', offset)
    if (start < 0) break
    if (body.startsWith('<!--', start)) {
      const end = body.indexOf('-->', start + 4)
      offset = end < 0 ? body.length : end + 3
      continue
    }
    const end = findTagEnd(body, start + 1)
    if (end < 0) break
    const token = body.slice(start + 1, end).trim()
    const closing = token.startsWith('/')
    const nameMatch = TAG_NAME_PATTERN.exec(token)
    if (!nameMatch) {
      offset = end + 1
      continue
    }
    const name = nameMatch[1].toLowerCase()
    if (name === 'head') {
      if (closing) {
        boundaries.headCloseStart = start
        return boundaries
      }
      if (boundaries.headOpenEnd < 0) boundaries.headOpenEnd = end + 1
    } else if (name === 'html' && !closing && boundaries.htmlOpenEnd < 0) {
      boundaries.htmlOpenEnd = end + 1
    }
    if (!closing && RAW_TEXT_NAMES.has(name)) {
      const close = lower.indexOf(`</${name}`, end + 1)
      if (close < 0) break
      const closeEnd = findTagEnd(body, close + name.length + 2)
      offset = closeEnd < 0 ? body.length : closeEnd + 1
    } else {
      offset = end + 1
    }
  }
  return boundaries
}

function injectIntoHead(body, script) {
  const scriptElement = `<script>${script}\n</script>`
  const boundaries = findDocumentBoundaries(body)
  if (boundaries.headCloseStart >= 0) {
    return body.slice(0, boundaries.headCloseStart) + scriptElement + body.slice(boundaries.headCloseStart)
  }

  if (boundaries.headOpenEnd >= 0) {
    return body.slice(0, boundaries.headOpenEnd) + scriptElement + body.slice(boundaries.headOpenEnd)
  }

  if (boundaries.htmlOpenEnd >= 0) {
    return body.slice(0, boundaries.htmlOpenEnd) + `<head>${scriptElement}</head>` + body.slice(boundaries.htmlOpenEnd)
  }

  return `<head>${scriptElement}</head>` + body
}

function transform(context) {
  const response = context.response || {}
  const contentType = headerValue(response.headers, 'content-type')
  if (!contentType || !contentType.includes('text/html') || typeof response.body !== 'string') {
    return null
  }

  return {
    response: {
      body: injectIntoHead(response.body, CLIENT_SCRIPT),
    },
  }
}
