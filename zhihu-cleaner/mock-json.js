const REQUEST_URL_PATTERN = /^https?:\/\/([^/:?#]+)(?::[0-9]+)?(\/[^#]*)?$/i

function requestLocation(value) {
  const match = REQUEST_URL_PATTERN.exec(value || '')
  if (!match) {
    return null
  }
  return {
    hostname: match[1].toLowerCase(),
    path: match[2] || '/',
  }
}

function splitPath(value) {
  const queryStart = value.indexOf('?')
  return {
    pathname: queryStart < 0 ? value : value.slice(0, queryStart),
    query: queryStart < 0 ? '' : value.slice(queryStart + 1),
  }
}

function decodeQueryComponent(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch (_) {
    return value
  }
}

function queryValue(query, expected) {
  for (const part of query.split('&')) {
    if (part === '') continue
    const equals = part.indexOf('=')
    const key = decodeQueryComponent(equals < 0 ? part : part.slice(0, equals))
    if (key !== expected) continue
    return decodeQueryComponent(equals < 0 ? '' : part.slice(equals + 1))
  }
  return null
}

function shouldMock(location) {
  if (!location) {
    return false
  }

  const route = splitPath(location.path)

  if (location.hostname === 'api.zhihu.com') {
    return (
      /^\/commercial_api(?:\/|$)/.test(route.pathname) ||
      route.pathname === '/root/window' ||
      (route.pathname === '/next-render' && /^\d+$/.test(queryValue(route.query, 'id') || '') && queryValue(route.query, 'type') === 'answer') ||
      route.pathname === '/search/preset_words' ||
      /^\/search\/related_queries\/question\/\d+$/.test(route.pathname) ||
      route.pathname === '/content-distribution-core/bubble/common/show' ||
      /^\/people\/homepage_entry_v\d+$/.test(route.pathname) ||
      route.pathname === '/kvip/right/my_card' ||
      /^\/unlimited\/go\/my_card\/v\d+$/.test(route.pathname)
    )
  }

  if (location.hostname === 'www.zhihu.com') {
    return /^\/api\/v\d+\/members\/homepage_card$/.test(route.pathname)
  }

  if (location.hostname === 'zhida.zhihu.com') {
    return (
      (route.pathname === '/ai_ingress/knowledge/square/categories/feeds' && ['1', '1}'].includes(queryValue(route.query, 'categoryId'))) ||
      route.pathname === '/ai_ingress/ai_chat/guidance'
    )
  }

  return false
}

function transform(context) {
  const request = context.request || {}
  if (!shouldMock(requestLocation(request.url))) {
    return null
  }

  return {
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    },
  }
}
