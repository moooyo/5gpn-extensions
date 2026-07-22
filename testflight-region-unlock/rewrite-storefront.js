var STOREFRONT_IDS = {
  US: '143441-19,29',
  GB: '143444-19,29',
  CA: '143455-19,29',
  AU: '143460-19,29',
  JP: '143462-19,29',
  HK: '143463-19,29',
  SG: '143464-19,29',
  CN: '143465-19,29',
  KR: '143466-19,29',
  TW: '143470-19,29',
}

function transform(context) {
  var region = context.settings.storefront
  if (!Object.prototype.hasOwnProperty.call(STOREFRONT_IDS, region)) {
    throw new Error('unsupported TestFlight storefront setting')
  }
  var storefrontID = STOREFRONT_IDS[region]

  var body = context.request.body
  if (typeof body !== 'string') {
    throw new Error('TestFlight install request body is not text')
  }

  var upstreamPattern = /"storefrontId" : "\d{6}-\d{2},\d{2}",/
  if (upstreamPattern.test(body)) {
    var upstreamRewritten = body.replace(upstreamPattern, '"storefrontId":"' + storefrontID + '",')
    console.info('rewrote TestFlight storefront to ' + region + ' with upstream syntax')
    return { request: { body: upstreamRewritten } }
  }

  var nativePattern = /(\"storefrontId\"\s*:\s*\")\d{6}-\d{2},\d{2}(\")/
  if (!nativePattern.test(body)) {
    console.warn('TestFlight install request has no recognized storefrontId')
    return null
  }
  var rewritten = body.replace(nativePattern, function (_, prefix, suffix) {
    return prefix + storefrontID + suffix
  })
  if (rewritten === body) {
    console.info('TestFlight storefront is already set to ' + region)
    return null
  }

  console.info('rewrote TestFlight storefront to ' + region)
  return { request: { body: rewritten } }
}
