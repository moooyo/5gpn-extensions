// SPDX-License-Identifier: Apache-2.0
// Modified native port of NSRingo/WeatherKit's v2 availability merge.

var WEATHERKIT_V2_CAPABILITIES = [
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

function contentType(headers) {
  if (headers === undefined) return null
  if (headers === null || typeof headers !== 'object' || Array.isArray(headers)) {
    throw new Error('WeatherKit availability headers are invalid')
  }
  var names = Object.keys(headers)
  for (var index = 0; index < names.length; index += 1) {
    var name = names[index]
    if (name.toLowerCase() !== 'content-type') continue
    var value = headers[name]
    if (Array.isArray(value)) value = value[0]
    if (typeof value !== 'string') throw new Error('WeatherKit availability content type is invalid')
    return value.split(';', 1)[0].trim().toLowerCase()
  }
  return null
}

function mergeAvailability(body) {
  if (typeof body !== 'string') throw new Error('WeatherKit availability body is not text')

  var appleCapabilities = JSON.parse(body)
  if (!Array.isArray(appleCapabilities)) {
    throw new Error('WeatherKit availability body is not an array')
  }

  var seen = Object.create(null)
  var merged = []
  var changed = false
  for (var index = 0; index < appleCapabilities.length; index += 1) {
    var capability = appleCapabilities[index]
    if (typeof capability !== 'string' || capability === '') {
      throw new Error('WeatherKit availability capability is invalid')
    }
    if (seen[capability] === true) {
      changed = true
    } else {
      seen[capability] = true
      merged.push(capability)
    }
  }

  for (var pluginIndex = 0; pluginIndex < WEATHERKIT_V2_CAPABILITIES.length; pluginIndex += 1) {
    var pluginCapability = WEATHERKIT_V2_CAPABILITIES[pluginIndex]
    if (seen[pluginCapability] !== true) {
      seen[pluginCapability] = true
      merged.push(pluginCapability)
      changed = true
    }
  }

  return changed ? JSON.stringify(merged) : null
}

function transformAvailability(context) {
  if (!context || typeof context !== 'object' || !context.response || typeof context.response !== 'object') {
    throw new Error('WeatherKit availability response context is missing')
  }
  var mediaType = contentType(context.response.headers)
  if (mediaType !== 'application/json' && mediaType !== 'text/json') return null
  var mergedBody = mergeAvailability(context.response.body)
  return mergedBody === null ? null : { response: { body: mergedBody } }
}

function transform(context) {
  var failClosed = true
  try {
    if (context && context.settings && context.settings.failClosed === false) failClosed = false
    return transformAvailability(context)
  } catch (error) {
    if (failClosed) throw error
    console.warn('WeatherKit availability transform skipped: ' + String(error))
    return null
  }
}
