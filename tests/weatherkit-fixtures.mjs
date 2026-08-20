import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')

// This extension runs reviewed upstream bundles rather than local scripts. The
// monolith corpus exercises proxy-compat itself; these fixtures pin the exact
// manifest wiring and the provenance record owned by this repository.
const manifest = parse(await readFile(path.join(root, 'weatherkit', 'extension.yaml'), 'utf8'))

assert.equal(manifest.metadata.id, 'io.5gpn.weatherkit')
assert.equal(manifest.metadata.version, '11.0.0')
assert.deepEqual(manifest.traffic.captureHosts, ['weatherkit.apple.com'])
assert.deepEqual(manifest.traffic.routingRules, [
  { action: 'reject', domain: 'weather-analytics-events.apple.com' },
  { action: 'reject', domainSuffix: 'tthr.apple.com' },
  { action: 'reject', domain: 'tether.edge.apple' },
])
assert.equal(manifest.permissions.persistentStorage, true)
assert.equal(manifest.permissions.network, true)
assert.equal(manifest.requirements, undefined, 'no operator egress binding is required')

const RELEASE = 'https://github.com/NSRingo/WeatherKit/releases/download/v3.3.1'
const RESPONSE_BUNDLE = `${RELEASE}/response.bundle.js`
const REQUEST_BUNDLE = `${RELEASE}/request.bundle.js`
const ENDPOINT = 'https://{{settings.Endpoint}}'
const AIR_QUALITY_SCALE_PATH = '^/api/v1/airQualityScale/'
const ALERTS_PAGE_PATH = '^/api/v1/weatherAlerts\\?[^#]*&ids=[^&#]*-[0-9]{9}(?:&|$)'
const ALERTS_PAGE_REWRITE = '^https?://weatherkit\\.apple\\.com/api/v1/weatherAlerts\\?([^#]*&ids=[^&#]*-[0-9]{9}(?:&[^#]*)?)$'
const ALERTS_API_PATH = '^/api/v1/weatherAlerts\\?[^#]*&ids=-?[0-9]+(?:\\.[0-9]+)?,-?[0-9]+(?:\\.[0-9]+)?(?:&|$)'
const ALERTS_API_REWRITE = '^https?://weatherkit\\.apple\\.com/api/v1/weatherAlerts\\?([^#]*&ids=-?[0-9]+(?:\\.[0-9]+)?,-?[0-9]+(?:\\.[0-9]+)?(?:&[^#]*)?)$'

assert.equal(manifest.actions.length, 9)

// Gateway mode transcribes all five script lines from the Loon release asset:
// two response actions and three request actions.
const scripted = manifest.actions.filter((action) => action.script.entry === 'proxy-compat')
assert.equal(scripted.length, 5)
for (const action of scripted) {
  assert.deepEqual(action.enabledWhen, { key: 'Mode', equals: 'Script' })
  assert.deepEqual(action.match.hosts, ['weatherkit.apple.com'])
  assert.equal(action.script.inline, undefined)
  assert(action.script.timeoutMs >= 50 && action.script.timeoutMs <= 30000)
}
const scriptedResponses = scripted.filter((action) => action.phase === 'response')
assert.equal(scriptedResponses.length, 2)
for (const action of scriptedResponses) {
  assert.equal(action.script.source, RESPONSE_BUNDLE)
  assert.deepEqual(action.match.statusCodes, [200])
}
const scriptedRequests = scripted.filter((action) => action.phase === 'request')
assert.equal(scriptedRequests.length, 3)
for (const action of scriptedRequests) {
  assert.equal(action.script.source, REQUEST_BUNDLE)
  assert.equal(action.match.statusCodes, undefined, 'a request action has no status to match')
  assert.equal(action.script.bodyMode, 'none')
}

// Cloud mode carries exactly the four rewrite rules across three pathnames in
// the commit-pinned repository module. Upstream publishes no cloud rewrite for
// airQualityScale.
const cloud = manifest.actions.filter((action) => action.script.rewrite !== undefined)
assert.equal(cloud.length, 4)
for (const action of cloud) {
  assert.equal(action.phase, 'request')
  assert.deepEqual(action.enabledWhen, { key: 'Mode', equals: 'Cloud' })
  assert.equal(action.script.entry, undefined, 'a rewrite runs no code')
  assert.equal(action.script.source, undefined)
  assert.equal(action.script.bodyMode, 'none')
  assert.equal(action.script.rewrite.status, undefined, 'the request is rewritten in place')
  assert.deepEqual(action.match.hosts, ['weatherkit.apple.com'])
  assert.equal(action.match.statusCodes, undefined)
  assert(action.script.rewrite.to.startsWith(`${ENDPOINT}/`), `${action.id} must target the reviewed endpoint`)
  assert(action.script.rewrite.to.endsWith('$1'), `${action.id} must carry the remaining URL through`)
  assert(action.script.rewrite.pattern.startsWith('^https?://weatherkit\\.apple\\.com/'), `${action.id} must rewrite only the captured host`)
}

// The four rule selectors present in both upstream modules must stay identical.
// Script mode alone additionally handles airQualityScale.
const selectors = (list) => list.map((action) => `${action.match.pathRegex}|${(action.match.methods ?? []).join(',')}`).sort()
const scriptedCloudTwins = scripted.filter((action) => action.id !== 'air-quality-scale')
assert.deepEqual(selectors(scriptedCloudTwins), selectors(cloud))

const availability = manifest.actions.find((action) => action.id === 'weather-availability')
assert.equal(availability.script.bodyMode, 'text')
assert.equal(availability.match.pathRegex, '^/api/v1/availability/')

const airQualityScale = manifest.actions.find((action) => action.id === 'air-quality-scale')
assert.equal(airQualityScale.phase, 'request')
assert.equal(airQualityScale.match.pathRegex, AIR_QUALITY_SCALE_PATH)
assert.equal(airQualityScale.match.methods, undefined, 'upstream constrains the scale action only by URL')
assert.equal(cloud.some((action) => action.match.pathRegex === AIR_QUALITY_SCALE_PATH), false)

const alertsPage = manifest.actions.find((action) => action.id === 'weather-alerts-page')
assert.equal(alertsPage.match.pathRegex, ALERTS_PAGE_PATH)
const alertsApi = manifest.actions.find((action) => action.id === 'weather-alerts')
assert.equal(alertsApi.match.pathRegex, ALERTS_API_PATH)

const weather = manifest.actions.find((action) => action.id === 'weather-data')
assert.equal(weather.script.bodyMode, 'binary')
assert.equal(weather.match.pathRegex, '^/api/v2/weather/')
assert.deepEqual(weather.match.methods, ['GET'])

const availabilityCloud = manifest.actions.find((action) => action.id === 'weather-availability-cloud')
assert.equal(availabilityCloud.script.rewrite.to, `${ENDPOINT}/api/v1/availability/$1`)
const weatherCloud = manifest.actions.find((action) => action.id === 'weather-data-cloud')
assert.equal(weatherCloud.script.rewrite.to, `${ENDPOINT}/api/v2/weather/$1`)
const alertsPageCloud = manifest.actions.find((action) => action.id === 'weather-alerts-page-cloud')
assert.equal(alertsPageCloud.match.pathRegex, ALERTS_PAGE_PATH)
assert.equal(alertsPageCloud.script.rewrite.pattern, ALERTS_PAGE_REWRITE)
assert.equal(alertsPageCloud.script.rewrite.to, `${ENDPOINT}/api/v1/weatherAlerts?$1`)
const alertsApiCloud = manifest.actions.find((action) => action.id === 'weather-alerts-cloud')
assert.equal(alertsApiCloud.match.pathRegex, ALERTS_API_PATH)
assert.equal(alertsApiCloud.script.rewrite.pattern, ALERTS_API_REWRITE)
assert.equal(alertsApiCloud.script.rewrite.to, `${ENDPOINT}/api/v1/weatherAlerts?$1`)

// Both alert identifier forms keep upstream's leading-&ids= constraint. The
// page form ends in a nine-digit location code; the API form is a coordinate
// pair with a digit before any decimal point.
const pageMatcher = new RegExp(alertsPage.match.pathRegex)
const pageRewrite = new RegExp(alertsPageCloud.script.rewrite.pattern)
for (const [query, selected] of [
  ["?lang=zh-CN&ids=jian'an-101180407&timezone=Asia%2FShanghai", true],
  ['?lang=en-US&ids=hong-kong-123456789', true],
  ['?lang=zh-CN&ids=jian-an-10118040', false],
  ['?ids=jian-an-101180407', false],
  ['?lang=zh-CN&ids=39.9042,116.4074', false],
]) {
  const pathValue = `/api/v1/weatherAlerts${query}`
  assert.equal(pageMatcher.test(pathValue), selected, `${pathValue} page selector mismatch`)
  const url = `https://weatherkit.apple.com${pathValue}`
  assert.equal(pageRewrite.test(url), selected, `${pathValue} page rewrite mismatch`)
  if (selected) {
    assert.equal(url.replace(pageRewrite, alertsPageCloud.script.rewrite.to), `${ENDPOINT}/api/v1/weatherAlerts${query}`)
  }
}

const apiMatcher = new RegExp(alertsApi.match.pathRegex)
const apiRewrite = new RegExp(alertsApiCloud.script.rewrite.pattern)
for (const [query, selected] of [
  ['?lang=zh-CN&ids=39.9042,116.4074&timezone=Asia%2FShanghai', true],
  ['?lang=en-US&ids=-33.86,151.2', true],
  ['?lang=en-US&ids=0,0', true],
  ['?country=CN&ids=6E9A1B2C-0000-4444-8888-AAAABBBBCCCC', false],
  ['?ids=39.9042,116.4074', false],
  ['?lang=zh-CN&ids=.5,.5', false],
]) {
  const pathValue = `/api/v1/weatherAlerts${query}`
  assert.equal(apiMatcher.test(pathValue), selected, `${pathValue} API selector mismatch`)
  const url = `https://weatherkit.apple.com${pathValue}`
  assert.equal(apiRewrite.test(url), selected, `${pathValue} API rewrite mismatch`)
  if (selected) {
    assert.equal(url.replace(apiRewrite, alertsApiCloud.script.rewrite.to), `${ENDPOINT}/api/v1/weatherAlerts${query}`)
  }
}

const mode = manifest.settings.find((setting) => setting.key === 'Mode')
assert.equal(mode.type, 'select')
assert.equal(mode.required, true)
assert.deepEqual(mode.options, ['Script', 'Cloud'])
assert.equal(mode.default, 'Script', 'a third-party endpoint must never be the default')

const endpoint = manifest.settings.find((setting) => setting.key === 'Endpoint')
assert.equal(endpoint.type, 'select')
assert.equal(endpoint.required, true)
assert.deepEqual(endpoint.options, ['weatherkit.pages.dev', 'dev.weatherkit.pages.dev'])
assert.equal(endpoint.default, 'weatherkit.pages.dev')
assert.match(endpoint.description, /authorization/i)

assert.deepEqual(manifest.settings.map((setting) => setting.key), [
  'Mode',
  'Endpoint',
  'Storage',
  'DataSets',
  'Weather.Provider',
  'WeatherAlerts.Provider',
  'NextHour.Provider',
  'AirQuality.Current.Pollutants.Provider',
  'AirQuality.Calculate.Algorithm',
  'API.ColorfulClouds.Token',
  'API.QWeather.Host',
  'API.QWeather.Token',
  'API.WAQI.Token',
  'LogLevel',
])

const storage = manifest.settings.find((setting) => setting.key === 'Storage')
assert.deepEqual(storage.options, ['$argument'])
assert.equal(storage.default, '$argument')

const dataSets = manifest.settings.find((setting) => setting.key === 'DataSets')
assert.equal(dataSets.type, 'text')
assert.equal(dataSets.required, true)
assert.equal(dataSets.default, 'airQuality,currentWeather,forecastDaily,forecastHourly,forecastNextHour,weatherAlerts')
// v3.3.1 turned this argument from an ignored input into the decode scope and
// the injection switch. The shape stays upstream's free-text comma list; what
// must not survive is the previous revision's "this does nothing" wording.
assert.doesNotMatch(dataSets.description, /no effect|not read|ineffective/i)
assert.match(dataSets.description, /passes through unmodified/i)

const weatherProvider = manifest.settings.find((setting) => setting.key === 'Weather.Provider')
assert.equal(weatherProvider.default, 'WeatherKit')
assert.deepEqual(weatherProvider.options, ['WeatherKit', 'ColorfulClouds', 'QWeather'])
const weatherAlertsProvider = manifest.settings.find((setting) => setting.key === 'WeatherAlerts.Provider')
assert.equal(weatherAlertsProvider.default, 'WeatherKit')
assert.deepEqual(weatherAlertsProvider.options, ['WeatherKit', 'QWeatherWeb', 'QWeather', 'ColorfulClouds'])
const nextHourProvider = manifest.settings.find((setting) => setting.key === 'NextHour.Provider')
assert.equal(nextHourProvider.default, 'WeatherKit')
assert.deepEqual(nextHourProvider.options, ['WeatherKit', 'ColorfulClouds', 'QWeather'])

const pollutantsProvider = manifest.settings.find((setting) => setting.key === 'AirQuality.Current.Pollutants.Provider')
assert.equal(pollutantsProvider.type, 'select')
assert.equal(pollutantsProvider.required, true)
assert.equal(pollutantsProvider.default, 'ColorfulClouds')
assert.deepEqual(pollutantsProvider.options, ['ColorfulClouds', 'QWeather'])
assert.match(pollutantsProvider.description, /exact coordinates/i)

const algorithm = manifest.settings.find((setting) => setting.key === 'AirQuality.Calculate.Algorithm')
assert.equal(algorithm.default, 'None')
assert.deepEqual(algorithm.options, [
  'None',
  'UBA',
  'EU_EAQI',
  'WAQI_InstantCast_US',
  'WAQI_InstantCast_CN',
  'WAQI_InstantCast_CN_25_DRAFT',
  'CA_AQHI',
  'HK_AQHI',
  'AQHI_Multi_CN',
  'AQHI_Multi_CN_HK',
  'CN_DEATH_AQHI',
  'CN_DEATH_HK_AQHI',
])

for (const key of ['API.ColorfulClouds.Token', 'API.QWeather.Host', 'API.QWeather.Token', 'API.WAQI.Token']) {
  const setting = manifest.settings.find((entry) => entry.key === key)
  assert.equal(setting.type, 'text')
  assert.equal(setting.required, false, `${key} must not block enable`)
}
for (const key of ['API.ColorfulClouds.Token', 'API.QWeather.Token', 'API.WAQI.Token']) {
  assert.equal(manifest.settings.find((entry) => entry.key === key).default, undefined, `${key} must not ship a token`)
}
for (const key of ['API.ColorfulClouds.Token', 'API.QWeather.Token']) {
  assert.match(manifest.settings.find((entry) => entry.key === key).description, /built-in/i)
}
assert.equal(manifest.settings.find((entry) => entry.key === 'API.QWeather.Host').default, 'devapi.qweather.com')

const readme = await readFile(path.join(root, 'weatherkit', 'README.md'), 'utf8')
assert(readme.includes(RESPONSE_BUNDLE), 'README must record the response bundle URL')
assert(readme.includes(REQUEST_BUNDLE), 'README must record the request bundle URL')
assert(/exact coordinates/i.test(readme), 'README must state what an enabled provider receives')
assert(/authorization/i.test(readme), 'README must state which headers cloud mode discloses')
assert(/immutable: false/.test(readme), 'README must disclose mutable release assets')
assert(/DataSets/.test(readme) && /^### Processed datasets$/m.test(readme), 'README must explain which datasets the bundle decodes and enhances')
assert(/carried no air-quality dataset at all/i.test(readme), 'README must record the air-quality dataset the switch can add')
assert(/CA_AQHI/.test(readme) && /unit/i.test(readme), 'README must record the reviewed CA_AQHI limitation')
assert(/page-token[\s\S]*always[\s\S]*QWeather/i.test(readme), 'README must record provider-independent QWeather page handling')
assert(/WeatherAlerts\.Provider=WeatherKit[\s\S]*200 \[\]/i.test(readme), 'README must record the stable WeatherKit coordinate response')
assert(/built-in ColorfulClouds and QWeather service tokens/i.test(readme), 'README must record the stable provider-token defaults')
assert(/Blank and unset are equivalent; both use the built-in token/.test(readme), 'README must record the reverted empty-token behavior')
assert(/silently resume using the built-in one/i.test(readme), 'README must warn operators who relied on blank-as-suppression')
assert(/official Loon argument block[\s\S]*empty-string\s+defaults/i.test(readme), 'README must record the deliberate token-default deviation')

const SOURCE_COMMIT = 'cc5eacbae074ddc232b8ceadc9e031ab82e97598'
const REWRITE_MODULE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/modules/iRingo.WeatherKit.Rewrite.lpx`
const RELEASE_ARGUMENTS = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/arguments-builder.release.config.ts`
const AIR_QUALITY_SCALE_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/src/class/AirQualityScale.mjs`
const QWEATHER_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/src/class/QWeather.mjs`
const CHANGELOG_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/CHANGELOG.md`
const LOCKFILE_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/package-lock.json`
const SET_ENV_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/src/function/setENV.mjs`
// The datasets narrative rests on these three: the switch and decode scope, the
// name map they resolve through, and the slot semantics that decide what an
// omitted dataset does. None may drop out of the provenance table.
const RESPONSE_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/src/process/Response.mjs`
const DATABASE_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/src/function/database.mjs`
const ROOT_PROCESSOR_SOURCE = `https://raw.githubusercontent.com/NSRingo/WeatherKit/${SOURCE_COMMIT}/packages/flatbuffer-root/src/FlatBufferRootProcessor.mjs`
const STORAGE_MERGE_SOURCE = 'https://raw.githubusercontent.com/NSNanoCat/util/720261e4e7c0e4c27d32d10238880e991b1e74ec/getStorage.mjs'
for (const source of [
  REWRITE_MODULE,
  RELEASE_ARGUMENTS,
  AIR_QUALITY_SCALE_SOURCE,
  QWEATHER_SOURCE,
  CHANGELOG_SOURCE,
  LOCKFILE_SOURCE,
  SET_ENV_SOURCE,
  RESPONSE_SOURCE,
  DATABASE_SOURCE,
  ROOT_PROCESSOR_SOURCE,
  STORAGE_MERGE_SOURCE,
]) {
  assert(readme.includes(source), `README must record ${source}`)
}
for (const option of endpoint.options) {
  assert(readme.includes(option), `README must record the cloud endpoint ${option}`)
}
for (const route of ['/api/v1/availability/', '/api/v1/airQualityScale/', '/api/v1/weatherAlerts', '/api/v2/weather/']) {
  assert(readme.includes(route), `README must record ${route}`)
}

console.log('WeatherKit fixtures passed')
