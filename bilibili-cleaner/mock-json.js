// GPL-3.0-only port of kokoryh/Sparkle's Bilibili request mocks.

const NOT_FOUND_BODY = '{"code":-404,"message":"-404","ttl":1,"data":null}'
const DELIVERY_BODY = '{"code":0,"data":{"closeType":"close_win","container":[],"showTime":""},"message":"success"}'
const SPLASH_BODY = '{"code":0,"message":"OK","ttl":1,"data":{"max_time":0,"min_interval":31536000,"pull_interval":31536000,"keep_ids":[],"show":[],"list":[{}],"splash_request_id":""}}'

function requestLocation(value) {
  const match = /^https?:\/\/([^/:?#]+)(?::[0-9]+)?(\/[^?#]*)?(?:\?[^#]*)?/i.exec(value || '')
  if (!match) {
    return null
  }
  return {
    hostname: match[1].toLowerCase(),
    pathname: match[2] || '/',
  }
}

function responseBody(location) {
  if (!location) {
    return '{}'
  }

  if (
    (location.hostname === 'api.bilibili.com' || location.hostname === 'app.bilibili.com') &&
    /^\/x\/(resource\/(top\/activity|patch\/tab(\/v2)?)|v2\/search\/square|vip\/ads\/materials)$/.test(location.pathname)
  ) {
    return NOT_FOUND_BODY
  }

  if (
    location.hostname === 'app.bilibili.com' &&
    location.pathname === '/x/v2/splash/list'
  ) {
    return SPLASH_BODY
  }

  if (
    location.hostname === 'api.bilibili.com' &&
    location.pathname === '/pgc/activity/deliver/material/receive'
  ) {
    return DELIVERY_BODY
  }

  return '{}'
}

function transform(context) {
  const request = context.request || {}
  return {
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: responseBody(requestLocation(request.url)),
    },
  }
}
