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
  var storefrontID = STOREFRONT_IDS[region]
  if (!storefrontID) {
    throw new Error('unsupported TestFlight storefront setting')
  }

  var body = context.request.body
  if (typeof body !== 'string') {
    throw new Error('TestFlight install request body is not text')
  }

  var pattern = /(\"storefrontId\"\s*:\s*\")\d{6}-\d{2},\d{2}(\")/
  var rewritten = body.replace(pattern, function (_, prefix, suffix) {
    return prefix + storefrontID + suffix
  })
  if (rewritten === body) {
    console.warn('TestFlight install request has no recognized storefrontId')
    return null
  }

  console.info('rewrote TestFlight storefront to ' + region)
  return { request: { body: rewritten } }
}
