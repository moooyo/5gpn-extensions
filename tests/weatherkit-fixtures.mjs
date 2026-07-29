import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')

// This extension runs a published upstream bundle rather than a local script,
// so there is nothing here to execute: the runtime behavior is covered by the
// sidecar's proxy-compat tests. What this repository still owns is the manifest
// it publishes, and that is what these fixtures pin.
const manifest = parse(await readFile(path.join(root, 'weatherkit', 'extension.yaml'), 'utf8'))

assert.equal(manifest.metadata.id, 'io.5gpn.weatherkit')
assert.equal(manifest.metadata.version, '5.0.0')
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

const BUNDLE = 'https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js'
const ENDPOINT = 'https://{{settings.Endpoint}}'
assert.equal(manifest.actions.length, 4)

// Gateway script mode: the two response scripts the release module declares.
const scripted = manifest.actions.filter((action) => action.script.entry === 'proxy-compat')
assert.equal(scripted.length, 2)
for (const action of scripted) {
  assert.equal(action.phase, 'response')
  assert.deepEqual(action.enabledWhen, { key: 'Mode', equals: 'Script' })
  assert.equal(action.script.source, BUNDLE, 'both actions must run the same pinned release')
  assert.deepEqual(action.match.hosts, ['weatherkit.apple.com'])
  assert.equal(action.script.inline, undefined)
  assert(action.script.timeoutMs >= 50 && action.script.timeoutMs <= 30000)
  assert.deepEqual(action.match.statusCodes, [200])
}

// Cloud endpoint mode: the two URL rewrites the upstream Rewrite module
// declares, including its endpoint argument. The target resolves the operator's
// Endpoint setting the same way Loon interpolates {endpoint} into a rewrite
// line, so all three upstream endpoints are reachable without a manifest edit.
const cloud = manifest.actions.filter((action) => action.script.rewrite !== undefined)
assert.equal(cloud.length, 2)
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
// touched: both modes select the same two paths with the same methods.
const selectors = (list) => list.map((action) => `${action.match.pathRegex}|${(action.match.methods ?? []).join(',')}`).sort()
assert.deepEqual(selectors(scripted), selectors(cloud))

const availability = manifest.actions.find((action) => action.id === 'weather-availability')
assert.equal(availability.script.bodyMode, 'text')
assert.equal(availability.match.pathRegex, '^/api/v1/availability/')
const weather = manifest.actions.find((action) => action.id === 'weather-data')
assert.equal(weather.script.bodyMode, 'binary')
assert.equal(weather.match.pathRegex, '^/api/v2/weather/')
assert.deepEqual(weather.match.methods, ['GET'])
const availabilityCloud = manifest.actions.find((action) => action.id === 'weather-availability-cloud')
assert.equal(availabilityCloud.script.rewrite.to, `${ENDPOINT}/api/v1/availability/$1`)
const weatherCloud = manifest.actions.find((action) => action.id === 'weather-data-cloud')
assert.equal(weatherCloud.script.rewrite.to, `${ENDPOINT}/api/v2/weather/$1`)

// One select drives both action sets, so "both modes at once" is not a state an
// operator can reach. The default keeps every byte on this gateway.
const mode = manifest.settings.find((setting) => setting.key === 'Mode')
assert.equal(mode.type, 'select')
assert.equal(mode.required, true, 'a gate must always have a decidable value')
assert.deepEqual(mode.options, ['Script', 'Cloud'])
assert.equal(mode.default, 'Script', 'a third-party endpoint must never be the default')

// Every option is a third party a captured Apple request can be handed to, so
// the set is pinned here and each one is named in the README.
const endpoint = manifest.settings.find((setting) => setting.key === 'Endpoint')
assert.equal(endpoint.type, 'select')
assert.equal(endpoint.required, true)
assert.deepEqual(endpoint.options, ['weatherkit.pages.dev', 'dev.weatherkit.pages.dev', 'weather.nanocat.cloud'])
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

// Every provider default must be the non-replacing value, so a freshly enabled
// extension makes no third-party request until an operator opts in.
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
  assert.equal(setting.default, undefined, `${key} must not ship a token`)
}

// The README is the record of what runs and where it goes. Byte-level pinning
// is gone with the verifier, so what it still has to name is every URL this
// extension loads or sends captured traffic to.
const readme = await readFile(path.join(root, 'weatherkit', 'README.md'), 'utf8')
assert(readme.includes(BUNDLE), 'README must record the bundle URL')
assert(/exact coordinates/i.test(readme), 'README must state what an enabled provider receives')

// Cloud mode transcribes a second upstream artifact. Nothing pins the live
// service behind those hostnames, which is the point the README has to make.
const REWRITE_MODULE = 'https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/modules/iRingo.WeatherKit.Rewrite.plugin'
assert(readme.includes(REWRITE_MODULE), 'README must record the cloud rewrite module it transcribes')
for (const option of endpoint.options) {
  assert(readme.includes(option), `README must record the cloud endpoint ${option}`)
}
assert(readme.includes('/api/v1/availability/') && readme.includes('/api/v2/weather/'), 'README must record both rewritten paths')
assert(/authorization/i.test(readme), 'README must state which request headers an enabled cloud mode discloses')
assert(/deployment is not pinned|not pinned by|pinned by nothing/i.test(readme), 'README must state that the live endpoint is unpinned')

console.log('WeatherKit fixtures passed')
