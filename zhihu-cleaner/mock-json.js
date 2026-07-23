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

function shouldMock(location) {
  if (!location) {
    return false
  }

  if (location.hostname === 'api.zhihu.com') {
    return (
      /^\/commercial_api\//.test(location.path) ||
      /^\/next-render\?id=\d+&type=answer/.test(location.path) ||
      /^\/search\/preset_words\?/.test(location.path) ||
      /^\/search\/related_queries\/question\/\d+$/.test(location.path) ||
      location.path === '/content-distribution-core/bubble/common/show' ||
      /^\/people\/homepage_entry_v\d$/.test(location.path) ||
      /^\/kvip\/right\/my_card\?/.test(location.path) ||
      /^\/unlimited\/go\/my_card\/v\d\?/.test(location.path)
    )
  }

  if (location.hostname === 'www.zhihu.com') {
    return /^\/api\/v\d\/members\/homepage_card$/.test(location.path)
  }

  if (location.hostname === 'zhida.zhihu.com') {
    return (
      location.path === '/ai_ingress/knowledge/square/categories/feeds?categoryId=1%7D' ||
      location.path === '/ai_ingress/ai_chat/guidance'
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
