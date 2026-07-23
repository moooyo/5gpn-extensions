import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')

async function loadTransform(relativePath) {
  const filename = path.join(root, relativePath)
  const source = await readFile(filename, 'utf8')
  const messages = []
  const sandbox = {
    ArrayBuffer,
    BigInt,
    DataView,
    Int8Array,
    Int16Array,
    Int32Array,
    Math,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    console: {
      debug: (...args) => messages.push(['debug', ...args]),
      error: (...args) => messages.push(['error', ...args]),
      info: (...args) => messages.push(['info', ...args]),
      log: (...args) => messages.push(['log', ...args]),
      warn: (...args) => messages.push(['warn', ...args]),
    },
  }
  vm.createContext(sandbox)
  new vm.Script(source, { filename }).runInContext(sandbox)
  assert.equal(typeof sandbox.transform, 'function', `${relativePath} has no transform(context)`)
  return { source, transform: sandbox.transform, messages }
}

const manifest = parse(await readFile(path.join(root, 'weatherkit', 'extension.yaml'), 'utf8'))
assert.equal(manifest.metadata.id, 'io.5gpn.weatherkit')
assert.equal(manifest.metadata.version, '2.0.0')
assert.deepEqual(manifest.permissions, { persistentStorage: false })
assert.deepEqual(manifest.traffic.captureHosts, ['weatherkit.apple.com'])
assert.deepEqual(manifest.traffic.routingRules, [{
  action: 'reject',
  domain: 'weatherkit.apple.com',
  network: 'udp',
  destinationPort: 443,
}])
assert.deepEqual(manifest.settings.map((setting) => setting.key), [
  'airQuality',
  'currentWeather',
  'forecastDaily',
  'forecastHourly',
  'forecastNextHour',
  'airQualityAlgorithm',
  'forceCNPrimaryPollutant',
  'allowAirQualityOverRange',
  'failClosed',
])
const algorithmSetting = manifest.settings.find((setting) => setting.key === 'airQualityAlgorithm')
assert.equal(algorithmSetting.type, 'select')
assert.equal(algorithmSetting.default, 'None')
assert.deepEqual(algorithmSetting.options, [
  'None',
  'UBA',
  'EU_EAQI',
  'WAQI_InstantCast_US',
  'WAQI_InstantCast_CN',
  'WAQI_InstantCast_CN_25_DRAFT',
])
assert(manifest.settings.filter((setting) => setting.key !== 'airQualityAlgorithm').every(
  (setting) => setting.type === 'boolean' && setting.required === true && setting.default === true,
))
assert.equal(manifest.actions.length, 3)

const requestAction = manifest.actions.find((action) => action.phase === 'request')
assert(requestAction)
assert.equal(requestAction.script.source, './request.js')
assert.equal(requestAction.script.bodyMode, 'none')
assert.equal(requestAction.script.timeoutMs, 500)
assert.equal(requestAction.script.maxBodyBytes, 1024)
assert.deepEqual(requestAction.match.hosts, ['weatherkit.apple.com'])
assert.deepEqual(requestAction.match.methods, ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'])
assert(new RegExp(requestAction.match.pathRegex).test('/api/v2/weather/en-US/22.5431/114.0579?dataSets=currentWeather'))
assert(!new RegExp(requestAction.match.pathRegex).test('/api/v1/availability/en-US/22.5431/114.0579'))

const availabilityAction = manifest.actions.find((action) => action.id === 'merge-weather-availability')
assert(availabilityAction)
assert.equal(availabilityAction.script.source, './availability.js')
assert.equal(availabilityAction.script.bodyMode, 'text')
assert.equal(availabilityAction.script.timeoutMs, 500)
assert.equal(availabilityAction.script.maxBodyBytes, 65536)
assert.deepEqual(availabilityAction.match.statusCodes, [200])
assert(new RegExp(availabilityAction.match.pathRegex).test('/api/v1/availability/en-US/22.5431/114.0579'))
assert(!new RegExp(availabilityAction.match.pathRegex).test('/api/v2/weather/en-US/22.5431/114.0579'))

const airQualityAction = manifest.actions.find((action) => action.id === 'transform-weather-air-quality')
assert(airQualityAction)
assert.equal(airQualityAction.phase, 'response')
assert.deepEqual(airQualityAction.match.hosts, ['weatherkit.apple.com'])
assert.deepEqual(airQualityAction.match.methods, ['GET'])
assert.deepEqual(airQualityAction.match.statusCodes, [200])
assert.equal(airQualityAction.script.source, './weather.js')
assert.equal(airQualityAction.script.bodyMode, 'binary')
assert.equal(airQualityAction.script.timeoutMs, 3000)
assert.equal(airQualityAction.script.maxBodyBytes, 16777216)
assert(new RegExp(airQualityAction.match.pathRegex).test('/api/v2/weather/en-US/22.5431/114.0579?dataSets=airQuality'))

const requestScript = await loadTransform('weatherkit/request.js')
const availabilityScript = await loadTransform('weatherkit/availability.js')
const airQualityScript = await loadTransform('weatherkit/weather.js')
for (const script of [requestScript.source, availabilityScript.source, airQualityScript.source]) {
  assert(!/\bnew\s+URL\b|\bfetch\s*\(|\brequire\s*\(|\bset(?:Timeout|Interval)\s*\(/.test(script))
  assert(!/\$(?:request|response|done|task|httpClient|prefs|argument)\b/.test(script))
}
assert(Buffer.byteLength(airQualityScript.source) < 1048576)
assert(!/\basync\b|\bawait\b|\bPromise\b|\bprocess\./.test(airQualityScript.source))

const baseSettings = {
  airQuality: true,
  currentWeather: true,
  forecastDaily: true,
  forecastHourly: true,
  forecastNextHour: true,
  failClosed: true,
}
const requestURL = 'https://weatherkit.apple.com/api/v2/weather/en-US/22.5431/114.0579?country=US&dataSets=airQuality,news,forecastPrecipitation,forecastNextHour,currentWeather&timezone=UTC'
const originalHeaders = {
  'If-None-Match': 'first-etag',
  'if-none-match': 'second-etag',
  Accept: 'application/vnd.apple.flatbuffer',
}
const requestResult = requestScript.transform({
  settings: { ...baseSettings, forecastNextHour: false },
  request: { url: requestURL, headers: originalHeaders },
})
assert.deepEqual({ ...requestResult.request.headers }, { Accept: 'application/vnd.apple.flatbuffer' })
assert.deepEqual(
  new URL(requestResult.request.url).searchParams.get('dataSets').split(','),
  ['airQuality', 'news', 'forecastPrecipitation', 'currentWeather'],
)
assert.equal(new URL(requestResult.request.url).searchParams.get('country'), 'US')
assert.equal(new URL(requestResult.request.url).searchParams.get('timezone'), 'UTC')
assert.deepEqual(originalHeaders, {
  'If-None-Match': 'first-etag',
  'if-none-match': 'second-etag',
  Accept: 'application/vnd.apple.flatbuffer',
})

for (const disabledDataSet of ['airQuality', 'currentWeather', 'forecastDaily', 'forecastHourly', 'forecastNextHour']) {
  const settings = { ...baseSettings, [disabledDataSet]: false }
  const result = requestScript.transform({
    settings,
    request: {
      url: `https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=${disabledDataSet},futureAppleDataSet`,
      headers: {},
    },
  })
  assert.deepEqual(
    new URL(result.request.url).searchParams.get('dataSets').split(','),
    ['futureAppleDataSet'],
    `${disabledDataSet} was not removed`,
  )
}

const duplicateDataSets = requestScript.transform({
  settings: { ...baseSettings, forecastNextHour: false },
  request: {
    method: 'GET',
    url: 'https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=currentWeather%2Cnews&keep=yes&dataSets=forecastNextHour',
    headers: {},
  },
})
const duplicateURL = new URL(duplicateDataSets.request.url)
assert.deepEqual(duplicateURL.searchParams.getAll('dataSets'), ['currentWeather,news'])
assert.equal(duplicateURL.searchParams.get('keep'), 'yes')

const emptyDataSets = requestScript.transform({
  settings: { ...baseSettings, currentWeather: false },
  request: {
    method: 'GET',
    url: 'https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=currentWeather',
    headers: {},
  },
})
assert.equal(new URL(emptyDataSets.request.url).searchParams.get('dataSets'), '')

for (const method of ['CONNECT', 'TRACE']) {
  assert.equal(requestScript.transform({
    settings: baseSettings,
    request: { method, url: requestURL, headers: { 'If-None-Match': 'etag' } },
  }), null, `${method} must not be transformed`)
}

const secondRequest = requestScript.transform({
  settings: { ...baseSettings, forecastNextHour: false },
  request: {
    url: requestResult.request.url,
    headers: requestResult.request.headers,
  },
})
assert.equal(secondRequest, null, 'request transform must be idempotent')

assert.equal(requestScript.transform({
  settings: { ...baseSettings, airQuality: false, currentWeather: false, forecastDaily: false, forecastHourly: false, forecastNextHour: false },
  request: {
    url: 'https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=news,forecastSnowfall,weatherMaps',
    headers: { Accept: 'application/json' },
  },
}), null, 'unknown datasets must pass through without a rewrite')

const headerOnly = requestScript.transform({
  settings: baseSettings,
  request: {
    url: 'https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=currentWeather,news',
    headers: { 'IF-NONE-MATCH': 'etag', Keep: 'yes' },
  },
})
assert.equal(headerOnly.request.url, undefined)
assert.deepEqual({ ...headerOnly.request.headers }, { Keep: 'yes' })
assert.equal(requestScript.transform({
  settings: baseSettings,
  request: {
    url: 'https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=currentWeather,news',
    headers: { Keep: 'yes' },
  },
}), null)

assert.throws(() => requestScript.transform({
  settings: baseSettings,
  request: { headers: {} },
}), /request URL is missing/)
assert.throws(() => requestScript.transform({
  settings: { ...baseSettings, currentWeather: 'false' },
  request: { url: requestURL, headers: {} },
}), /setting is not boolean/)
assert.throws(() => requestScript.transform({
  settings: { ...baseSettings, currentWeather: false },
  request: {
    url: 'https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=currentWeather,%E0%A4%A',
    headers: {},
  },
}), /dataSets query is malformed/)
requestScript.messages.length = 0
assert.equal(requestScript.transform({
  settings: { ...baseSettings, failClosed: false },
  request: { headers: {} },
}), null)
assert.match(requestScript.messages.at(-1)[1], /request transform skipped/)

const pluginCapabilities = [
  'airQuality',
  'currentWeather',
  'forecastDaily',
  'forecastHourly',
  'forecastPeriodic',
  'historicalComparisons',
  'weatherChanges',
  'forecastNextHour',
  'weatherAlerts',
  'weatherAlertNotifications',
  'news',
]
const appleCapabilities = ['currentWeather', 'forecastSnowfall', 'weatherMaps']
const jsonResponse = (body, headerName = 'Content-Type', mediaType = 'application/json; charset=utf-8') => ({
  body,
  headers: { [headerName]: mediaType },
})
const availabilityResult = availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse(JSON.stringify(appleCapabilities)),
})
const expectedCapabilities = [...new Set([...appleCapabilities, ...pluginCapabilities])]
assert.deepEqual(JSON.parse(availabilityResult.response.body), expectedCapabilities)
assert.equal(availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse(availabilityResult.response.body),
}), null, 'availability transform must be idempotent')

assert.equal(availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse(JSON.stringify(expectedCapabilities), 'content-type', 'text/json'),
}), null, 'complete Apple capability arrays must be no-ops')

const duplicateAvailability = availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse(JSON.stringify(['weatherMaps', 'weatherMaps', ...pluginCapabilities])),
})
assert.deepEqual(JSON.parse(duplicateAvailability.response.body), ['weatherMaps', ...pluginCapabilities])

assert.equal(availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse('{not-json', 'Content-Type', 'text/plain'),
}), null, 'non-JSON content types must pass through')
assert.equal(availabilityScript.transform({
  settings: baseSettings,
  response: { body: '{not-json', headers: {} },
}), null, 'missing content types must pass through')

assert.throws(() => availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse('{not-json'),
}), /JSON/)
assert.throws(() => availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse(JSON.stringify({ currentWeather: true })),
}), /body is not an array/)
assert.throws(() => availabilityScript.transform({
  settings: baseSettings,
  response: jsonResponse(JSON.stringify(['currentWeather', 42])),
}), /capability is invalid/)
availabilityScript.messages.length = 0
assert.equal(availabilityScript.transform({
  settings: { ...baseSettings, failClosed: false },
  response: jsonResponse('{not-json'),
}), null)
assert.match(availabilityScript.messages.at(-1)[1], /availability transform skipped/)

const airQualityFixture = new Uint8Array(Buffer.from(
  'KAAAACQAEgAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAEACQAAAAUAAAAIAAAAFQAAAAAAAYACAAEAAYAAAAMAAAACAAMAAgABAAIAAAAMnkGAAQAAAARAAAAZnV0dXJlLXNsb3QtdmFsdWUAAAAUABgAFAATABAAAAAMAAsACgAEABQAAACAAAAAAAAKBAwAAABNAAACUAAAAAIAAAAgAAAABAAAAPL///8AAAABAADwQgAKCgAOAA0ACAAHAAoAAAAAAAABAADIQgAIGgAgAAAAHAAAABgAFAAAABAADAAIAAAABwAaAAAAAAAAAQQAAAADAAAAJAAAAAAAAEAAAIA/AQAAAA0AAABISjYzMzIwMTIuOTk5AAAADQAAAEFwcGxlIFdlYXRoZXIAAAA=',
  'base64',
))
const qweatherFixture = new Uint8Array(Buffer.from(
  'DAAAAAAABgAIAAQABgAAABgAAAAUABgAFAATABAAAAAMAAsACgAEABQAAABwAAAAAAALAwwAAAAKAAABQAAAAAEAAAAQAAAAAAAKAA4ADQAIAAcACgAAAAAAAAEAAIA/AAsaACAAAAAcAAAAGAAUAAAAEAAMAAgAAAAHABoAAAAAAAABBAAAAAMAAAAgAAAAAAAAQAAAgD8BAAAACwAAAEVVLkVBUUkuMTIzAAgAAABRV2VhdGhlcgAAAAA=',
  'base64',
))

function binaryView(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

function tableField(bytes, table, slot) {
  const view = binaryView(bytes)
  const vtable = table - view.getInt32(table, true)
  const vtableLength = view.getUint16(vtable, true)
  const entry = 4 + slot * 2
  if (entry >= vtableLength) return 0
  const offset = view.getUint16(vtable + entry, true)
  return offset === 0 ? 0 : table + offset
}

function indirect(bytes, field) {
  return field === 0 ? 0 : field + binaryView(bytes).getUint32(field, true)
}

function rootSlot(bytes, slot) {
  const root = binaryView(bytes).getUint32(0, true)
  return indirect(bytes, tableField(bytes, root, slot))
}

function stringField(bytes, table, slot) {
  const start = indirect(bytes, tableField(bytes, table, slot))
  if (start === 0) return null
  const length = binaryView(bytes).getUint32(start, true)
  return Buffer.from(bytes.subarray(start + 4, start + 4 + length)).toString('utf8')
}

function pollutantTables(bytes, airQualityTable) {
  const vectorField = tableField(bytes, airQualityTable, 4)
  if (vectorField === 0) return []
  const vector = vectorField + binaryView(bytes).getUint32(vectorField, true)
  const length = binaryView(bytes).getUint32(vector, true)
  const tables = []
  for (let index = 0; index < length; index += 1) {
    const element = vector + 4 + index * 4
    tables.push(element + binaryView(bytes).getUint32(element, true))
  }
  return tables
}

function airQualitySnapshot(bytes) {
  const view = binaryView(bytes)
  const table = rootSlot(bytes, 0)
  const metadata = indirect(bytes, tableField(bytes, table, 0))
  return {
    categoryIndex: view.getInt8(tableField(bytes, table, 1)),
    index: view.getInt16(tableField(bytes, table, 2), true),
    previousDayComparison: view.getInt8(tableField(bytes, table, 5)),
    primaryPollutant: view.getInt8(tableField(bytes, table, 6)),
    providerName: stringField(bytes, metadata, 6),
    scale: stringField(bytes, table, 7),
    pollutants: pollutantTables(bytes, table).map((pollutant) => ({
      type: view.getInt8(tableField(bytes, pollutant, 0)),
      amount: view.getFloat32(tableField(bytes, pollutant, 1), true),
      units: view.getInt8(tableField(bytes, pollutant, 2)),
    })),
  }
}

function unknownLeafSnapshot(bytes, table) {
  return {
    text: stringField(bytes, table, 0),
    value: binaryView(bytes).getInt32(tableField(bytes, table, 1), true),
  }
}

function airQualityContext(body, settings = {}, contentType = 'application/vnd.apple.flatbuffer', dataSets = 'airQuality,currentWeather') {
  return {
    phase: 'response',
    request: {
      method: 'GET',
      url: `https://weatherkit.apple.com/api/v2/weather/en-US/1/2?dataSets=${dataSets}`,
      headers: {},
    },
    response: {
      status: 200,
      headers: { 'Content-Type': contentType },
      body,
    },
    settings: {
      airQualityAlgorithm: 'None',
      forceCNPrimaryPollutant: true,
      allowAirQualityOverRange: true,
      failClosed: true,
      ...settings,
    },
  }
}

const originalAirQualityFixture = [...airQualityFixture]
const normalizedResult = airQualityScript.transform(airQualityContext(airQualityFixture))
assert(normalizedResult.response.body instanceof Uint8Array)
const normalized = airQualitySnapshot(normalizedResult.response.body)
assert.equal(normalized.scale, 'HJ6332012')
assert.equal(normalized.index, 77)
assert.equal(normalized.previousDayComparison, 4)
assert.equal(normalized.providerName, 'Apple Weather')
assert.deepEqual([...airQualityFixture], originalAirQualityFixture, 'input FlatBuffer was mutated')
assert.equal(airQualityScript.transform(airQualityContext(normalizedResult.response.body)), null, 'canonical AQ must be a no-op')

const calculatedResult = airQualityScript.transform(airQualityContext(airQualityFixture, {
  airQualityAlgorithm: 'WAQI_InstantCast_CN',
}))
const calculated = airQualitySnapshot(calculatedResult.response.body)
assert.equal(calculated.scale, 'HJ6332012')
assert.equal(calculated.index, 131)
assert.equal(calculated.categoryIndex, 3)
assert.equal(calculated.primaryPollutant, 8)
assert.equal(calculated.previousDayComparison, 4)
assert.equal(calculated.providerName, 'Apple Weather')
assert.equal(airQualityScript.transform(airQualityContext(calculatedResult.response.body, {
  airQualityAlgorithm: 'WAQI_InstantCast_CN',
})), null, 'calculated AQ must be idempotent')
assert.deepEqual(unknownLeafSnapshot(calculatedResult.response.body, rootSlot(calculatedResult.response.body, 12)), {
  text: 'future-slot-value',
  value: 424242,
})
const unknownContainer = rootSlot(calculatedResult.response.body, 15)
assert.deepEqual(unknownLeafSnapshot(calculatedResult.response.body, indirect(calculatedResult.response.body, tableField(calculatedResult.response.body, unknownContainer, 0))), {
  text: 'future-slot-value',
  value: 424242,
})

const fixedQWeather = airQualitySnapshot(airQualityScript.transform(airQualityContext(qweatherFixture)).response.body)
assert.equal(fixedQWeather.scale, 'EU.EAQI')
assert.equal(fixedQWeather.providerName, 'QWeather (CO normalized by 5gpn)')
assert.equal(fixedQWeather.pollutants[0].type, 11)
assert.equal(fixedQWeather.pollutants[0].amount, 1000)
assert.equal(fixedQWeather.pollutants[0].units, 1)
const fixedQWeatherResult = airQualityScript.transform(airQualityContext(qweatherFixture))
assert.equal(airQualityScript.transform(airQualityContext(fixedQWeatherResult.response.body)), null, 'QWeather CO repair must be idempotent')

assert.equal(airQualityScript.transform(airQualityContext(airQualityFixture, {}, 'application/json')), null)
assert.equal(airQualityScript.transform(airQualityContext(airQualityFixture, {}, 'application/vnd.apple.flatbuffer', 'currentWeather')), null)
assert.throws(() => airQualityScript.transform(airQualityContext(new Uint8Array([1, 2, 3]))))
assert.throws(() => airQualityScript.transform(airQualityContext(airQualityFixture, { airQualityAlgorithm: 'Unknown' })), /airQualityAlgorithm/)
airQualityScript.messages.length = 0
assert.equal(airQualityScript.transform(airQualityContext(new Uint8Array([1, 2, 3]), { failClosed: false })), null)
assert.match(airQualityScript.messages.at(-1)[1], /AQ transform skipped/)

console.log('WeatherKit fixtures passed')
