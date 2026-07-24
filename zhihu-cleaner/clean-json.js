const REQUEST_URL_PATTERN = /^https?:\/\/([^/:?#]+)(?::[0-9]+)?(\/[^#]*)?$/i
const BLOCKED_CONFIG_KEYS = new Set([
  'coreNetworkConf_useTars',
  'httpdns_detector_use_concurrent',
  'httpdns_new_config_tars',
  'httpdns_use_memory_cache',
  'km_coreNetworkConf_useTars',
  'km_httpdns_new_config_tars',
  'networkExprimentList',
  'preFetchHttpDns',
  'quicMixAB',
  'quic_check_health_enable',
  'quic_dns_detect_enable',
  'quic_downgrade_enable',
  'quic_priority_strategy',
  'sugarQuicConfig',
  'tars_ab_list',
  'tquic_configuration',
  'zaSetExtraRequestHeader',
])
const ROOT_TAB_TYPES = new Set(['follow', 'hot', 'recommend'])
const SEARCH_TAB_TYPES = new Set([
  'ai_zhida',
  'column',
  'favlist',
  'general',
  'km_general',
  'people',
  'pin',
  'podcast',
  'publication',
  'recent',
  'ring',
  'scholar',
  'topic',
  'zvideo',
])
const BLOCKED_TOPSTORY_TYPES = new Set([
  'ad',
  'adcard',
  'advertisement',
  'commercial',
  'commercialcard',
  'market_card',
  'marketcard',
  'promotion',
  'promotioncard',
])

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasPromotionMarker(value) {
  if (value === true) return true
  if (typeof value === 'string') return value !== ''
  if (typeof value === 'number') return value !== 0
  if (Array.isArray(value)) return value.length > 0
  return isObject(value) && Object.keys(value).length > 0
}

function requestLocation(value) {
  const match = REQUEST_URL_PATTERN.exec(value || '')
  if (!match) {
    return null
  }
  return {
    hostname: match[1].toLowerCase(),
    path: match[2] || '/',
  }
}

function deleteKeys(container, keys) {
  if (!isObject(container)) {
    return false
  }

  let changed = false
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(container, key)) {
      delete container[key]
      changed = true
    }
  }
  return changed
}

function filterProperty(container, key, predicate) {
  if (!isObject(container) || !Array.isArray(container[key])) {
    return false
  }

  const original = container[key]
  const filtered = original.filter(predicate)
  if (filtered.length === original.length) {
    return false
  }
  container[key] = filtered
  return true
}

function cleanTransportConfig(document) {
  if (!isObject(document.data) || !Array.isArray(document.data.configs)) {
    return false
  }

  let changed = false
  const configs = []
  for (const config of document.data.configs) {
    if (isObject(config) && BLOCKED_CONFIG_KEYS.has(config.configKey)) {
      changed = true
      continue
    }
    if (isObject(config) && isObject(config.configValue)) {
      changed = deleteKeys(config.configValue, ['delayHttpdns', 'dnsParser', 'HTTPDNS']) || changed
    }
    configs.push(config)
  }
  if (changed) {
    document.data.configs = configs
  }
  return changed
}

function cleanAnswer(document, includeGeneralFields) {
  let changed = deleteKeys(document, ['third_business', 'float_search_word'])
  if (isObject(document.structured_content)) {
    changed = filterProperty(
      document.structured_content,
      'segments',
      (segment) => !isObject(segment) || segment.type !== 'card',
    ) || changed
  }
  if (includeGeneralFields) {
    changed = deleteKeys(document, ['third_business', 'ring_info', 'interaction_bar_plugins']) || changed
  }
  return changed
}

function cleanTopstory(document) {
  if (!Array.isArray(document.data)) {
    return false
  }
  let changed = filterProperty(document, 'data', (item) => {
    if (!isObject(item)) return true
    const itemType = typeof item.type === 'string' ? item.type.toLowerCase() : ''
    const cardType = typeof item.card_type === 'string' ? item.card_type.toLowerCase() : ''
    const targetType = isObject(item.target) && typeof item.target.type === 'string'
      ? item.target.type.toLowerCase()
      : ''
    return !(
      hasPromotionMarker(item.ad_info) ||
      hasPromotionMarker(item.commercial_info) ||
      hasPromotionMarker(item.promotion_info) ||
      item.is_ad === true ||
      item.is_commercial === true ||
      BLOCKED_TOPSTORY_TYPES.has(itemType) ||
      BLOCKED_TOPSTORY_TYPES.has(cardType) ||
      BLOCKED_TOPSTORY_TYPES.has(targetType)
    )
  })
  for (const item of document.data) {
    if (!isObject(item)) {
      continue
    }
    changed = filterProperty(
      item,
      'children',
      (child) => !isObject(child) || child.id !== 'ring',
    ) || changed
  }
  return changed
}

function cleanPeople(document) {
  if (!isObject(document.vip_info)) {
    return false
  }
  let changed = false
  if (isObject(document.vip_info.entrance_new)) {
    changed = deleteKeys(document.vip_info.entrance_new, ['right_button']) || changed
  }
  changed = deleteKeys(document.vip_info, ['entrance_v2']) || changed
  return changed
}

function cleanApi(path, document) {
  let changed = false

  if (/^\/root\/tab(?:\/v\d+)?(?:\?.*)?$/.test(path)) {
    changed = filterProperty(
      document,
      'tab_list',
      (item) => isObject(item) && ROOT_TAB_TYPES.has(item.tab_type),
    )
    if (Array.isArray(document.ring_list) && document.ring_list.length > 0) {
      document.ring_list = []
      changed = true
    }
    if (
      isObject(document.tab_ext) &&
      Object.prototype.hasOwnProperty.call(document.tab_ext, 'is_show_ring') &&
      document.tab_ext.is_show_ring !== false
    ) {
      document.tab_ext.is_show_ring = false
      changed = true
    }
    return changed
  }

  if (/^\/topstory\/recommend(?:\?.*)?$/.test(path)) {
    return cleanTopstory(document)
  }

  if (/^\/questions\/\d+\/feeds(?:\?.*)?$/.test(path)) {
    return deleteKeys(document, ['ad_info'])
  }

  if (/^\/comment_v\d+\/(answers|pins)\/\d+\/root_comment(?:\?.*)?$/.test(path)) {
    return deleteKeys(document, ['atmosphere_voting_config'])
  }

  if (/^\/answers\/v\d+\/\d+(?:\?.*)?$/.test(path)) {
    return cleanAnswer(document, true)
  }

  if (/^\/(articles|pins)\/v\d+\/\d+(?:\?.*)?$/.test(path)) {
    return deleteKeys(document, ['third_business', 'ring_info', 'interaction_bar_plugins'])
  }

  if (/^\/comment_v\d+\/answers\/\d+\/list-headers(?:\?.*)?$/.test(path)) {
    return deleteKeys(document, ['continuous_consumption_module'])
  }

  if (/^\/podcasts\/hub\/v\d+(?:\?.*)?$/.test(path)) {
    return deleteKeys(document, ['banners'])
  }

  if (/^\/search\/recommend_query\/v\d+(?:\?.*)?$/.test(path)) {
    if (isObject(document.recommend_queries)) {
      changed = filterProperty(
        document.recommend_queries,
        'queries',
        (item) => isObject(item) && item.type === 'normal',
      )
    }
    return changed
  }

  if (/^\/search_v\d+(?:\?.*)?$/.test(path)) {
    return deleteKeys(document, ['pendant'])
  }

  if (/^\/search\/tabs(?:\?.*)?$/.test(path)) {
    return filterProperty(
      document,
      'data',
      (item) => isObject(item) && SEARCH_TAB_TYPES.has(item.t),
    )
  }

  if (/^\/people\/self(?:\?.*)?$/.test(path)) {
    return cleanPeople(document)
  }

  return false
}

function transform(context) {
  let document
  try {
    document = JSON.parse(context.response.body)
  } catch (error) {
    console.error(`Zhihu JSON decode failed: ${error}`)
    return null
  }
  if (!isObject(document)) {
    console.error('Zhihu JSON root is not an object')
    return null
  }

  const request = context.request || {}
  const location = requestLocation(request.url)
  if (!location) {
    console.error('Zhihu request URL is invalid')
    return null
  }

  let changed = false
  if (
    location.hostname === 'm-cloud.zhihu.com' &&
    /^\/api\/cloud\/zhihu\/config\/all(?:\?.*)?$/.test(location.path)
  ) {
    changed = cleanTransportConfig(document)
  } else if (location.hostname === 'api.zhihu.com') {
    changed = cleanApi(location.path, document)
  } else if (
    location.hostname === 'page-info.zhihu.com' &&
    /^\/answers\/v\d+\/\d+(?:\?.*)?$/.test(location.path)
  ) {
    changed = cleanAnswer(document, false)
  }

  if (!changed) {
    return null
  }
  return {
    response: {
      body: JSON.stringify(document),
    },
  }
}
