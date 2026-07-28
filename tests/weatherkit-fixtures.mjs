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
assert.equal(manifest.metadata.version, '3.1.0')
assert.deepEqual(manifest.traffic.captureHosts, ['weatherkit.apple.com'])
assert.deepEqual(manifest.traffic.routingRules, [{
  action: 'reject',
  domain: 'weatherkit.apple.com',
  network: 'udp',
  destinationPort: 443,
}])

// The broader grants are the whole point of this revision, so they are asserted
// explicitly rather than left to the generic validator.
assert.equal(manifest.permissions.persistentStorage, true)
assert.deepEqual(manifest.permissions.network, { any: true })
assert.equal(manifest.requirements, undefined, 'no operator egress binding is required')

const BUNDLE = 'https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js'
assert.equal(manifest.actions.length, 2)
for (const action of manifest.actions) {
  assert.equal(action.phase, 'response')
  assert.equal(action.script.entry, 'proxy-compat')
  assert.equal(action.script.source, BUNDLE, 'both actions must run the same pinned release')
  assert.deepEqual(action.match.hosts, ['weatherkit.apple.com'])
  assert.equal(action.script.inline, undefined)
  assert(action.script.timeoutMs >= 50 && action.script.timeoutMs <= 30000)
  assert.deepEqual(action.match.statusCodes, [200])
}

const availability = manifest.actions.find((action) => action.id === 'weather-availability')
assert.equal(availability.script.bodyMode, 'text')
assert.equal(availability.match.pathRegex, '^/api/v1/availability/')
const weather = manifest.actions.find((action) => action.id === 'weather-data')
assert.equal(weather.script.bodyMode, 'binary')
assert.equal(weather.match.pathRegex, '^/api/v2/weather/')
assert.deepEqual(weather.match.methods, ['GET'])

// Setting keys are upstream's own argument names, because they reach the bundle
// as $argument and its parser expands the dots. A renamed key here would stop
// applying silently instead of failing.
//
// Storage is first and is not a preference: the bundle switches on it to decide
// where to read settings from, and its default branch discards $argument. Every
// setting below it did nothing until it was added.
assert.deepEqual(manifest.settings.map((setting) => setting.key), [
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

// The README is the only record of which bytes are allowed to run, and
// `npm run verify:upstreams` enforces it against the live asset.
const readme = await readFile(path.join(root, 'weatherkit', 'README.md'), 'utf8')
assert(readme.includes(BUNDLE), 'README must record the pinned bundle URL')
assert(readme.includes('4d368808a17c42eef18135f04d1bc9f01cbf7878d227006521ef0a6598941ff2'), 'README must record the bundle digest')
assert(readme.includes('251,617 bytes'), 'README must record the bundle size')
assert(/exact coordinates/i.test(readme), 'README must state what an enabled provider receives')

console.log('WeatherKit fixtures passed')
