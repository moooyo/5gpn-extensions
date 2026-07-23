import * as flatbuffers from 'flatbuffers'
import WeatherKit2 from './class/WeatherKit2.mjs'
import AirQuality from './class/AirQuality.mjs'

const AIR_QUALITY_ALGORITHMS = new Set([
  'None',
  'UBA',
  'EU_EAQI',
  'WAQI_InstantCast_US',
  'WAQI_InstantCast_CN',
  'WAQI_InstantCast_CN_25_DRAFT',
])

function headerValue(headers, expected) {
  if (!headers || typeof headers !== 'object') return ''
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() !== expected) continue
    const value = Array.isArray(headers[name]) ? headers[name][0] : headers[name]
    return typeof value === 'string' ? value : ''
  }
  return ''
}

function decodeQueryComponent(value) {
  return decodeURIComponent(String(value).replace(/\+/g, ' '))
}

function requestTarget(url) {
  const match = /^(https?):\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i.exec(String(url))
  if (!match || match[2].includes('@')) throw new Error('WeatherKit AQ request URL is invalid')
  const host = match[2].replace(/:\d+$/, '').toLowerCase()
  if (host !== 'weatherkit.apple.com' || !match[3].startsWith('/api/v2/weather/')) return null
  return { query: match[4] || '' }
}

function requestedAirQuality(url) {
  const target = requestTarget(url)
  if (!target) return false
  for (const part of target.query.split('&')) {
    const equals = part.indexOf('=')
    const key = equals < 0 ? part : part.slice(0, equals)
    if (decodeQueryComponent(key) !== 'dataSets') continue
    const value = decodeQueryComponent(equals < 0 ? '' : part.slice(equals + 1))
    return value.split(',').includes('airQuality')
  }
  return false
}

function booleanSetting(settings, key, fallback) {
  const value = settings?.[key]
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw new Error(`WeatherKit ${key} setting is invalid`)
  return value
}

function algorithmSetting(settings) {
  const value = settings?.airQualityAlgorithm ?? 'None'
  if (typeof value !== 'string' || !AIR_QUALITY_ALGORITHMS.has(value)) {
    throw new Error('WeatherKit airQualityAlgorithm setting is invalid')
  }
  return value
}

function validateFlatBufferRoot(bytes) {
  if (bytes.byteLength < 8) throw new Error('WeatherKit AQ FlatBuffer is truncated')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const root = view.getUint32(0, true)
  if (root < 4 || root + 4 > bytes.byteLength) throw new Error('WeatherKit AQ root offset is invalid')
  const vtable = root - view.getInt32(root, true)
  if (vtable < 0 || vtable + 4 > bytes.byteLength) throw new Error('WeatherKit AQ root vtable is invalid')
  const vtableLength = view.getUint16(vtable, true)
  const objectLength = view.getUint16(vtable + 2, true)
  if (
    vtableLength < 4 ||
    vtableLength % 2 !== 0 ||
    objectLength < 4 ||
    vtable + vtableLength > bytes.byteLength ||
    root + objectLength > bytes.byteLength
  ) {
    throw new Error('WeatherKit AQ root table is invalid')
  }
}

function fixQWeatherCO(airQuality) {
  const providerName = airQuality?.metadata?.providerName
  if (providerName !== 'QWeather' && providerName !== '\u548c\u98ce\u5929\u6c14') return airQuality
  let changed = false
  const pollutants = airQuality?.pollutants?.map((pollutant) => {
    if (pollutant?.pollutantType !== 'CO' || typeof pollutant.amount !== 'number' || !Number.isFinite(pollutant.amount)) {
      return pollutant
    }
    changed = true
    return {
      ...pollutant,
      amount: pollutant.amount * 1000,
      units: 'MICROGRAMS_PER_CUBIC_METER',
    }
  })
  if (!changed) return airQuality
  return {
    ...airQuality,
    metadata: {
      ...airQuality.metadata,
      providerName: `${providerName} (CO normalized by 5gpn)`,
    },
    pollutants,
  }
}

function encodedProjection(airQuality) {
  const metadata = airQuality?.metadata
    ? {
        attributionUrl: airQuality.metadata.attributionUrl,
        expireTime: airQuality.metadata.expireTime,
        language: airQuality.metadata.language,
        latitude: airQuality.metadata.latitude,
        longitude: airQuality.metadata.longitude,
        providerLogo: airQuality.metadata.providerLogo,
        providerName: airQuality.metadata.providerName,
        readTime: airQuality.metadata.readTime,
        reportedTime: airQuality.metadata.reportedTime,
        temporarilyUnavailable: airQuality.metadata.temporarilyUnavailable,
        sourceType: airQuality.metadata.sourceType,
      }
    : null
  return {
    metadata,
    categoryIndex: airQuality?.categoryIndex,
    index: airQuality?.index,
    isSignificant: airQuality?.isSignificant,
    pollutants: airQuality?.pollutants?.map((pollutant) => ({
      amount: pollutant?.amount,
      pollutantType: pollutant?.pollutantType,
      units: pollutant?.units,
    })) ?? [],
    previousDayComparison: airQuality?.previousDayComparison,
    primaryPollutant: airQuality?.primaryPollutant,
    scale: airQuality?.scale,
  }
}

function transformWeatherKitAirQuality(context) {
  if (!context || context.phase !== 'response' || !context.request || !context.response) {
    throw new Error('WeatherKit AQ context is invalid')
  }
  const contentType = headerValue(context.response.headers, 'content-type').split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/vnd.apple.flatbuffer') return null
  if (!requestedAirQuality(context.request.url)) return null

  const original = context.response.body
  if (!(original instanceof Uint8Array)) throw new Error('WeatherKit AQ body is not binary')
  validateFlatBufferRoot(original)
  const source = new flatbuffers.ByteBuffer(original)
  const decoded = WeatherKit2.decode(source, ['airQuality'])
  let airQuality = decoded.airQuality
  if (!airQuality) return null

  const before = JSON.stringify(encodedProjection(airQuality))
  airQuality = fixQWeatherCO(airQuality)
  airQuality = AirQuality.NormalizeScaleIdentifier(airQuality)

  const algorithm = algorithmSetting(context.settings)
  const scaleName = AirQuality.GetNameFromScale(airQuality.scale)
  if (
    algorithm !== 'None' &&
    scaleName === AirQuality.Config.Scales.HJ6332012.weatherKitScale.name &&
    Array.isArray(airQuality.pollutants) &&
    airQuality.pollutants.length > 0
  ) {
    const calculated = AirQuality.Pollutants2AQI(airQuality, null, {
      algorithm,
      forcePrimaryPollutant: booleanSetting(context.settings, 'forceCNPrimaryPollutant', true),
      allowOverRange: booleanSetting(context.settings, 'allowAirQualityOverRange', true),
    })
    if (calculated?.metadata?.temporarilyUnavailable !== true) {
      airQuality = {
        ...airQuality,
        ...calculated,
        metadata: airQuality.metadata,
        previousDayComparison: airQuality.previousDayComparison,
      }
    }
  }

  if (JSON.stringify(encodedProjection(airQuality)) === before) return null

  const builder = new flatbuffers.Builder()
  const root = WeatherKit2.encodeRootOverlay(builder, source, new Set(['airQuality']), { airQuality })
  builder.finish(root)
  return { response: { body: builder.asUint8Array() } }
}

function transform(context) {
  const failClosed = context?.settings?.failClosed !== false
  try {
    return transformWeatherKitAirQuality(context)
  } catch (error) {
    if (failClosed) throw error
    console.warn(`WeatherKit AQ transform skipped: ${String(error)}`)
    return null
  }
}

globalThis.transform = transform
