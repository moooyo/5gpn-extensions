// SPDX-License-Identifier: Apache-2.0
// Modified native port of NSRingo/WeatherKit's request dataset filtering.

var CONFIGURABLE_DATA_SETS = [
  'airQuality',
  'currentWeather',
  'forecastDaily',
  'forecastHourly',
  'forecastNextHour',
]

function disabledDataSets(settings) {
  if (settings !== undefined && (settings === null || typeof settings !== 'object' || Array.isArray(settings))) {
    throw new Error('WeatherKit settings are invalid')
  }

  var disabled = Object.create(null)
  var values = settings || {}
  for (var index = 0; index < CONFIGURABLE_DATA_SETS.length; index += 1) {
    var dataSet = CONFIGURABLE_DATA_SETS[index]
    var value = values[dataSet]
    if (value !== undefined && typeof value !== 'boolean') {
      throw new Error('WeatherKit ' + dataSet + ' setting is not boolean')
    }
    if (value === false) disabled[dataSet] = true
  }
  return disabled
}

function decodeQueryComponent(value, strict) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch (error) {
    if (strict) throw new Error('WeatherKit dataSets query is malformed')
    return null
  }
}

function filterDataSetsURL(url, disabled) {
  var queryStart = url.indexOf('?')
  if (queryStart < 0) return url

  var fragmentStart = url.indexOf('#', queryStart + 1)
  var queryEnd = fragmentStart < 0 ? url.length : fragmentStart
  var parts = url.slice(queryStart + 1, queryEnd).split('&')
  var firstDataSetsIndex = -1
  var firstRawKey = ''
  var retained = null
  var duplicateCount = 0

  for (var index = 0; index < parts.length; index += 1) {
    var part = parts[index]
    var equals = part.indexOf('=')
    var rawKey = equals < 0 ? part : part.slice(0, equals)
    if (decodeQueryComponent(rawKey, false) !== 'dataSets') continue
    if (firstDataSetsIndex >= 0) {
      duplicateCount += 1
      continue
    }

    firstDataSetsIndex = index
    firstRawKey = rawKey
    var rawValue = equals < 0 ? '' : part.slice(equals + 1)
    var requested = decodeQueryComponent(rawValue, true).split(',')
    retained = requested.filter(function (dataSet) {
      return disabled[dataSet] !== true
    })
    if (retained.length === requested.length) retained = null
  }

  if (firstDataSetsIndex < 0 || (retained === null && duplicateCount === 0)) return url

  var replacementValue
  if (retained === null) {
    var firstPart = parts[firstDataSetsIndex]
    var firstEquals = firstPart.indexOf('=')
    replacementValue = firstEquals < 0 ? '' : firstPart.slice(firstEquals + 1)
  } else {
    replacementValue = encodeURIComponent(retained.join(','))
  }

  var rewritten = []
  for (var partIndex = 0; partIndex < parts.length; partIndex += 1) {
    var candidate = parts[partIndex]
    var candidateEquals = candidate.indexOf('=')
    var candidateKey = candidateEquals < 0 ? candidate : candidate.slice(0, candidateEquals)
    if (decodeQueryComponent(candidateKey, false) === 'dataSets') {
      if (partIndex === firstDataSetsIndex) rewritten.push(firstRawKey + '=' + replacementValue)
    } else {
      rewritten.push(candidate)
    }
  }
  return url.slice(0, queryStart + 1) + rewritten.join('&') + url.slice(queryEnd)
}

function transformRequest(context) {
  if (!context || typeof context !== 'object' || !context.request || typeof context.request !== 'object') {
    throw new Error('WeatherKit request context is missing')
  }
  if (typeof context.request.url !== 'string' || context.request.url === '') {
    throw new Error('WeatherKit request URL is missing')
  }
  if (context.request.method !== undefined) {
    if (typeof context.request.method !== 'string') throw new Error('WeatherKit request method is invalid')
    var method = context.request.method.toUpperCase()
    if (method === 'CONNECT' || method === 'TRACE') return null
  }

  var disabled = disabledDataSets(context.settings)
  var requestPatch = {}
  var changed = false
  var headers = context.request.headers

  if (headers !== undefined) {
    if (headers === null || typeof headers !== 'object' || Array.isArray(headers)) {
      throw new Error('WeatherKit request headers are invalid')
    }
    var filteredHeaders = {}
    var headerNames = Object.keys(headers)
    var removedHeader = false
    for (var index = 0; index < headerNames.length; index += 1) {
      var name = headerNames[index]
      if (name.toLowerCase() === 'if-none-match') {
        removedHeader = true
      } else {
        filteredHeaders[name] = headers[name]
      }
    }
    if (removedHeader) {
      requestPatch.headers = filteredHeaders
      changed = true
    }
  }

  var filteredURL = filterDataSetsURL(context.request.url, disabled)
  if (filteredURL !== context.request.url) {
    requestPatch.url = filteredURL
    changed = true
  }

  return changed ? { request: requestPatch } : null
}

function transform(context) {
  var failClosed = true
  try {
    if (context && context.settings && context.settings.failClosed === false) failClosed = false
    return transformRequest(context)
  } catch (error) {
    if (failClosed) throw error
    console.warn('WeatherKit request transform skipped: ' + String(error))
    return null
  }
}
