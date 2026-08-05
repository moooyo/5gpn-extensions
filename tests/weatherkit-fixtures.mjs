import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')

// This extension runs published upstream bundles rather than local scripts, so
// there is nothing here to execute: the runtime behavior is covered by the
// sidecar's proxy-compat tests. What this repository still owns is the manifest
// it publishes, and that is what these fixtures pin.
const manifest = parse(await readFile(path.join(root, 'weatherkit', 'extension.yaml'), 'utf8'))

assert.equal(manifest.metadata.id, 'io.5gpn.weatherkit')
assert.equal(manifest.metadata.version, '8.0.0')
assert.deepEqual(manifest.traffic.captureHosts, ['weatherkit.apple.com'])
// Three of these are upstream's exact-name rejects, which revisions before
// 3.2.0 simply omitted. The fourth approximates upstream's ASN-plus-QUIC rule;
// the README records why the ASN form is declined rather than adopted.
assert.deepEqual(manifest.traffic.routingRules, [
  { action: 'reject', domain: 'weather-analytics-events.apple.com' },
  { action: 'reject', domainSuffix: 'tthr.apple.com' },
  { action: 'reject', domain: 'tether.edge.apple' },
  { action: 'reject', domain: 'weatherkit.apple.com', network: 'udp', destinationPort: 443 },
])

// The broader grants are the whole point of this revision, so they are asserted
// explicitly rather than left to the generic validator.
assert.equal(manifest.permissions.persistentStorage, true)
assert.equal(manifest.permissions.network, true)
assert.equal(manifest.requirements, undefined, 'no operator egress binding is required')

const RELEASE = 'https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0'
const RESPONSE_BUNDLE = `${RELEASE}/response.bundle.js`
const REQUEST_BUNDLE = `${RELEASE}/request.bundle.js`
const ENDPOINT = 'https://{{settings.Endpoint}}'
// Upstream's own matcher for the alerts path, transcribed. The `&ids=` prefix is
// deliberate and is upstream's: Apple's native alerts carry UUIDs, and the
// coordinate form only exists because the response bundle wrote it into an alert
// collection's detailsUrl. v3.2.0 dropped the bare `.5` coordinate form, so a
// digit before the decimal point is now required on both halves.
const ALERTS_PATH = '^/api/v1/weatherAlerts\\?[^#]*&ids=-?[0-9]+(?:\\.[0-9]+)?,-?[0-9]+(?:\\.[0-9]+)?(?:&|$)'
const ALERTS_REWRITE = '^https?://weatherkit\\.apple\\.com/api/v1/weatherAlerts\\?([^#]*&ids=-?[0-9]+(?:\\.[0-9]+)?,-?[0-9]+(?:\\.[0-9]+)?(?:&[^#]*)?)$'
assert.equal(manifest.actions.length, 6)

// Gateway script mode: the three scripts the release module declares.
const scripted = manifest.actions.filter((action) => action.script.entry === 'proxy-compat')
assert.equal(scripted.length, 3)
for (const action of scripted) {
  assert.deepEqual(action.enabledWhen, { key: 'Mode', equals: 'Script' })
  assert.deepEqual(action.match.hosts, ['weatherkit.apple.com'])
  assert.equal(action.script.inline, undefined)
  assert(action.script.timeoutMs >= 50 && action.script.timeoutMs <= 30000)
}
// Two response scripts and one request script. The request one is not a request
// editor: for its path it answers the exchange itself, so it carries no status
// matcher and its phase is asserted rather than assumed.
const scriptedResponses = scripted.filter((action) => action.phase === 'response')
assert.equal(scriptedResponses.length, 2)
for (const action of scriptedResponses) {
  assert.equal(action.script.source, RESPONSE_BUNDLE, 'both response actions must run the same pinned release')
  assert.deepEqual(action.match.statusCodes, [200])
}
const scriptedRequests = scripted.filter((action) => action.phase === 'request')
assert.equal(scriptedRequests.length, 1)
assert.equal(scriptedRequests[0].script.source, REQUEST_BUNDLE)
assert.equal(scriptedRequests[0].match.statusCodes, undefined, 'a request action has no status to match')

// Cloud endpoint mode: the three URL rewrites the upstream Rewrite module
// declares, including its endpoint argument. The target resolves the operator's
// Endpoint setting the same way Loon interpolates {endpoint} into a rewrite
// line.
const cloud = manifest.actions.filter((action) => action.script.rewrite !== undefined)
assert.equal(cloud.length, 3)
for (const action of cloud) {
  assert.equal(action.phase, 'request')
  assert.deepEqual(action.enabledWhen, { key: 'Mode', equals: 'Cloud' })
  assert.equal(action.script.entry, undefined, 'a rewrite runs no code')
  assert.equal(action.script.source, undefined)
  assert.equal(action.script.bodyMode, 'none')
  assert.equal(action.script.rewrite.status, undefined, 'the request is rewritten in place, not answered with a redirect')
  assert.deepEqual(action.match.hosts, ['weatherkit.apple.com'])
  assert.equal(action.match.statusCodes, undefined, 'a request action has no status to match')
  assert(action.script.rewrite.to.startsWith(`${ENDPOINT}/`), `${action.id} must target the reviewed endpoint`)
  assert(action.script.rewrite.to.endsWith('$1'), `${action.id} must carry the rest of the URL through`)
  assert(action.script.rewrite.pattern.startsWith('^https?://weatherkit\\.apple\\.com/'), `${action.id} must rewrite only the captured host`)
}

// A gate switches how an exchange is handled, never which exchanges are
// touched: both modes select the same three paths with the same methods.
const selectors = (list) => list.map((action) => `${action.match.pathRegex}|${(action.match.methods ?? []).join(',')}`).sort()
assert.deepEqual(selectors(scripted), selectors(cloud))

const availability = manifest.actions.find((action) => action.id === 'weather-availability')
assert.equal(availability.script.bodyMode, 'text')
assert.equal(availability.match.pathRegex, '^/api/v1/availability/')
const weather = manifest.actions.find((action) => action.id === 'weather-data')
assert.equal(weather.script.bodyMode, 'binary')
assert.equal(weather.match.pathRegex, '^/api/v2/weather/')
assert.deepEqual(weather.match.methods, ['GET'])
// Upstream declares no requires-body for the alerts script, so no request body
// is delivered to it. It answers from the query string alone.
const alerts = manifest.actions.find((action) => action.id === 'weather-alerts')
assert.equal(alerts.phase, 'request')
assert.equal(alerts.script.bodyMode, 'none')
assert.equal(alerts.match.pathRegex, ALERTS_PATH)
assert.equal(alerts.match.methods, undefined, 'upstream constrains this path by query, not method')
const availabilityCloud = manifest.actions.find((action) => action.id === 'weather-availability-cloud')
assert.equal(availabilityCloud.script.rewrite.to, `${ENDPOINT}/api/v1/availability/$1`)
const weatherCloud = manifest.actions.find((action) => action.id === 'weather-data-cloud')
assert.equal(weatherCloud.script.rewrite.to, `${ENDPOINT}/api/v2/weather/$1`)
const alertsCloud = manifest.actions.find((action) => action.id === 'weather-alerts-cloud')
assert.equal(alertsCloud.script.rewrite.to, `${ENDPOINT}/api/v1/weatherAlerts?$1`)
assert.equal(alertsCloud.match.pathRegex, ALERTS_PATH)
assert.equal(alertsCloud.script.rewrite.pattern, ALERTS_REWRITE)

// The `&ids=` constraint is the only thing keeping this action off Apple's own
// alerts, so it is exercised rather than eyeballed. A UUID id is Apple's native
// form and must pass through untouched; the coordinate form only exists because
// the response bundle wrote it. The cloud twin's rewrite must fire on exactly
// what the matcher selects, or the action would match and then do nothing.
const alertsMatcher = new RegExp(alerts.match.pathRegex)
const alertsRewrite = new RegExp(alertsCloud.script.rewrite.pattern)
for (const [query, selected] of [
  ['?lang=zh-CN&ids=39.9042,116.4074&timezone=Asia%2FShanghai', true],
  ['?lang=en-US&ids=-33.86,151.2', true],
  ['?lang=en-US&ids=0,0', true],
  ['?country=CN&ids=6E9A1B2C-0000-4444-8888-AAAABBBBCCCC', false],
  ['?ids=39.9042,116.4074', false],
  // v3.2.0 narrowed the coordinate form: a decimal point now needs a digit in
  // front of it. Upstream's own matcher no longer selects this, so neither does
  // the transcription.
  ['?lang=zh-CN&ids=.5,.5', false],
]) {
  const path = `/api/v1/weatherAlerts${query}`
  assert.equal(alertsMatcher.test(path), selected, `${path} must ${selected ? '' : 'not '}be selected`)
  const url = `https://weatherkit.apple.com${path}`
  assert.equal(alertsRewrite.test(url), selected, `${path} must ${selected ? '' : 'not '}be rewritten in cloud mode`)
  if (!selected) continue
  assert.equal(
    url.replace(alertsRewrite, alertsCloud.script.rewrite.to),
    `${ENDPOINT}/api/v1/weatherAlerts${query}`,
    'the whole query, coordinates included, must reach the endpoint unchanged',
  )
}

// One select drives both action sets, so "both modes at once" is not a state an
// operator can reach. The default keeps every byte on this gateway.
const mode = manifest.settings.find((setting) => setting.key === 'Mode')
assert.equal(mode.type, 'select')
assert.equal(mode.required, true, 'a gate must always have a decidable value')
assert.deepEqual(mode.options, ['Script', 'Cloud'])
assert.equal(mode.default, 'Script', 'a third-party endpoint must never be the default')

// Every option is a third party a captured Apple request can be handed to, so
// the set is pinned here and each one is named in the README. Upstream's third
// endpoint is deliberately absent: it stopped resolving, and an option that can
// only fail is worse than no option.
const endpoint = manifest.settings.find((setting) => setting.key === 'Endpoint')
assert.equal(endpoint.type, 'select')
assert.equal(endpoint.required, true)
assert.deepEqual(endpoint.options, ['weatherkit.pages.dev', 'dev.weatherkit.pages.dev'])
assert.equal(endpoint.default, 'weatherkit.pages.dev', 'upstream calls this one directly reachable')
assert.match(endpoint.description, /authorization/i)

// Setting keys are upstream's own argument names, because they reach the bundle
// as $argument and its parser expands the dots. A renamed key here would stop
// applying silently instead of failing.
//
// Mode and Endpoint come first: Mode belongs to this manifest and selects which
// of upstream's two published modules runs, and Endpoint is upstream's own
// argument from the rewrite module. Storage is next
// and is not a preference either: the bundle switches on it to decide where to
// read settings from, and its default branch discards $argument. Every setting
// below it did nothing until it was added.
assert.deepEqual(manifest.settings.map((setting) => setting.key), [
  'Mode',
  'Endpoint',
  'Storage',
  'Weather.Provider',
  'NextHour.Provider',
  'AirQuality.Calculate.Algorithm',
  'API.ColorfulClouds.Token',
  'API.QWeather.Host',
  'API.QWeather.Token',
  'API.WAQI.Token',
  'LogLevel',
])

// Every exposed provider default must be the non-replacing value. The pinned
// bundle still has ungated alert and air-quality lookups, which the README
// records separately.
const providerDefaults = manifest.settings.filter((setting) => setting.key.endsWith('.Provider'))
assert.equal(providerDefaults.length, 2)
for (const setting of providerDefaults) {
  assert.equal(setting.default, 'WeatherKit', `${setting.key} must default to leaving Apple's data alone`)
  assert(setting.options.includes('ColorfulClouds') && setting.options.includes('QWeather'))
}
const algorithm = manifest.settings.find((setting) => setting.key === 'AirQuality.Calculate.Algorithm')
assert.equal(algorithm.default, 'None')
assert.deepEqual(algorithm.options, [
  'None',
  'UBA',
  'EU_EAQI',
  'WAQI_InstantCast_US',
  'WAQI_InstantCast_CN',
  'WAQI_InstantCast_CN_25_DRAFT',
])
for (const key of ['API.ColorfulClouds.Token', 'API.QWeather.Host', 'API.QWeather.Token', 'API.WAQI.Token']) {
  const setting = manifest.settings.find((entry) => entry.key === key)
  assert.equal(setting.type, 'text')
  assert.equal(setting.required, false, `${key} must not block enable`)
}
for (const key of ['API.ColorfulClouds.Token', 'API.QWeather.Token', 'API.WAQI.Token']) {
  assert.equal(manifest.settings.find((entry) => entry.key === key).default, undefined, `${key} must not ship a token`)
}
// Not a token, and not optional in practice. $argument is merged over the
// bundle's own database defaults, so leaving this blank overwrites upstream's
// devapi.qweather.com with "" and every QWeather URL is built against a hostless
// https://. Both alert paths now fetch from that host.
assert.equal(manifest.settings.find((entry) => entry.key === 'API.QWeather.Host').default, 'devapi.qweather.com')

// The README is the record of what runs and where it goes. Byte-level pinning
// is gone with the verifier, so what it still has to name is every URL this
// extension loads or sends captured traffic to.
const readme = await readFile(path.join(root, 'weatherkit', 'README.md'), 'utf8')
assert(readme.includes(RESPONSE_BUNDLE), 'README must record the response bundle URL')
assert(readme.includes(REQUEST_BUNDLE), 'README must record the request bundle URL')
assert(/exact coordinates/i.test(readme), 'README must state what an enabled provider receives')

// Cloud mode transcribes a second upstream artifact. Nothing pins the live
// service behind those hostnames, which is the point the README has to make.
const REWRITE_MODULE = 'https://raw.githubusercontent.com/NSRingo/WeatherKit/c66350d91457f9a1b8a6c5e6aba46370fa6da254/modules/iRingo.WeatherKit.Rewrite.lpx'
assert(readme.includes(REWRITE_MODULE), 'README must record the cloud rewrite module it transcribes')
for (const option of endpoint.options) {
  assert(readme.includes(option), `README must record the cloud endpoint ${option}`)
}
assert(
  readme.includes('/api/v1/availability/') && readme.includes('/api/v2/weather/') && readme.includes('/api/v1/weatherAlerts'),
  'README must record all three rewritten paths',
)
assert(/authorization/i.test(readme), 'README must state which request headers an enabled cloud mode discloses')
assert(/deployment is not pinned|not pinned by|pinned by nothing/i.test(readme), 'README must state that the live endpoint is unpinned')

console.log('WeatherKit fixtures passed')
