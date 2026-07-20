// Ported from the GPL-3.0-only mist-whisper/JQLang Reddit filter.
// See README.md for immutable upstream details and modification notes.

var REMOVED = {}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function cleanValue(value, stats) {
  if (Array.isArray(value)) {
    var cleanedItems = []
    for (var index = 0; index < value.length; index += 1) {
      var cleanedItem = cleanValue(value[index], stats)
      if (cleanedItem !== REMOVED) cleanedItems.push(cleanedItem)
    }
    return cleanedItems
  }

  if (!isObject(value)) return value

  var keys = Object.keys(value)
  for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    var key = keys[keyIndex]
    var cleanedChild = cleanValue(value[key], stats)
    if (cleanedChild === REMOVED) {
      delete value[key]
    } else {
      value[key] = cleanedChild
    }
  }

  if (value.isNsfw === true) {
    value.isNsfw = false
    stats.nsfwFields += 1
  }
  if (value.isNsfwMediaBlocked === true) {
    value.isNsfwMediaBlocked = false
    stats.nsfwFields += 1
  }
  if (value.isNsfwContentShown === false) {
    value.isNsfwContentShown = true
    stats.nsfwFields += 1
  }
  if (Array.isArray(value.commentsPageAds)) {
    if (value.commentsPageAds.length > 0) stats.commentAds += value.commentsPageAds.length
    value.commentsPageAds = []
  }

  var node = value.node
  if (isObject(node) && Array.isArray(node.cells)) {
    for (var cellIndex = 0; cellIndex < node.cells.length; cellIndex += 1) {
      var cell = node.cells[cellIndex]
      if (isObject(cell) && (cell.__typename === 'AdMetadataCell' || cell.isAdPost === true)) {
        stats.promotedObjects += 1
        return REMOVED
      }
    }
  }
  if (isObject(node) && isObject(node.adPayload)) {
    stats.promotedObjects += 1
    return REMOVED
  }
  if (value.__typename === 'AdPost') {
    stats.promotedObjects += 1
    return REMOVED
  }

  return value
}

function transform(context) {
  var body = context.response.body
  if (typeof body !== 'string' || body.length === 0) {
    throw new Error('Reddit GraphQL response body is not text')
  }

  var document = JSON.parse(body)
  var stats = { promotedObjects: 0, commentAds: 0, nsfwFields: 0 }
  var cleaned = cleanValue(document, stats)
  if (cleaned === REMOVED) cleaned = null

  if (stats.promotedObjects === 0 && stats.commentAds === 0 && stats.nsfwFields === 0) {
    return null
  }

  console.info(
    'cleaned Reddit response: promoted=' + stats.promotedObjects +
      ' commentAds=' + stats.commentAds +
      ' nsfwFields=' + stats.nsfwFields
  )
  return { response: { body: JSON.stringify(cleaned) } }
}
