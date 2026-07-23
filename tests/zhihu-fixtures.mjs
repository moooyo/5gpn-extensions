import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const extensionRoot = path.join(root, 'zhihu-cleaner')
const manifest = parse(await readFile(path.join(extensionRoot, 'extension.yaml'), 'utf8'))

const blockedConfigKeys = [
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
]

async function loadTransform(filename) {
  const source = await readFile(path.join(extensionRoot, filename), 'utf8')
  const messages = []
  const sandbox = {
    JSON,
    Object,
    RegExp,
    Set,
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
  assert.equal(typeof sandbox.transform, 'function')
  return { transform: sandbox.transform, messages }
}

function clean(transform, url, document) {
  const result = transform({
    request: { url },
    response: { body: JSON.stringify(document) },
  })
  return result === null ? null : JSON.parse(result.response.body)
}

assert.equal(manifest.metadata.id, 'io.5gpn.zhihu-cleaner')
assert.equal(manifest.metadata.version, '1.1.0')
assert.deepEqual(manifest.permissions, { persistentStorage: false })
assert.equal(manifest.settings, undefined)
assert.equal(manifest.requirements, undefined)
assert.deepEqual(manifest.traffic.routingRules, manifest.traffic.captureHosts.map((domain) => ({
  action: 'reject',
  domain,
  network: 'udp',
  destinationPort: 443,
})))
assert.equal(manifest.traffic.upstreamMappings, undefined)
assert.deepEqual(manifest.traffic.captureHosts, [
  'api.zhihu.com',
  'm-cloud.zhihu.com',
  'page-info.zhihu.com',
  'www.zhihu.com',
  'zhida.zhihu.com',
])
assert.equal(manifest.actions.length, 6)
assert.equal(new Set(manifest.actions.map((action) => action.id)).size, 6)
assert.equal(manifest.actions.filter((action) => action.phase === 'request').length, 3)
assert.equal(manifest.actions.filter((action) => action.phase === 'response').length, 3)
for (const action of manifest.actions) {
  assert(action.match.hosts.every((host) => manifest.traffic.captureHosts.includes(host)))
  assert.deepEqual(action.match.schemes, ['https'])
  assert.equal(action.match.pathRegex.startsWith('^'), true)
  assert.equal(action.script.source, action.phase === 'request' ? './mock-json.js' : './clean-json.js')
  assert.equal(action.script.bodyMode, action.phase === 'request' ? 'none' : 'text')
}

const pathCases = new Map([
  ['mock-api-json', {
    matches: [
      '/commercial_api',
      '/commercial_api/banner',
      '/next-render?id=1&type=answer',
      '/next-render?id=1&type=answer&next=2',
      '/next-render?type=answer&next=2&id=1',
      '/next-render?type=question&id=1',
      '/next-render?type=answer',
      '/search/preset_words?source=ios',
      '/search/preset_words',
      '/search/related_queries/question/42',
      '/search/related_queries/question/42?source=ios',
      '/content-distribution-core/bubble/common/show',
      '/content-distribution-core/bubble/common/show?source=ios',
      '/people/homepage_entry_v12?source=ios',
      '/kvip/right/my_card?source=ios',
      '/kvip/right/my_card',
      '/unlimited/go/my_card/v12?source=ios',
    ],
    misses: [
      '/other-render?type=answer&id=1',
      '/search/related_queries/question/id',
      '/people/homepage_entry_version',
      '/unlimited/go/my_card/latest',
    ],
  }],
  ['mock-www-json', {
    matches: ['/api/v4/members/homepage_card', '/api/v12/members/homepage_card?source=ios'],
    misses: ['/api/version/members/homepage_card'],
  }],
  ['mock-zhida-json', {
    matches: [
      '/ai_ingress/knowledge/square/categories/feeds?categoryId=1%7D',
      '/ai_ingress/knowledge/square/categories/feeds?source=ios&categoryId=1',
      '/ai_ingress/knowledge/square/categories/feeds?categoryId=1%7d&source=ios',
      '/ai_ingress/knowledge/square/categories/feeds?categoryId=2',
      '/ai_ingress/ai_chat/guidance?source=ios',
    ],
    misses: [
      '/ai_ingress/knowledge/square/categories/other?categoryId=1',
    ],
  }],
  ['clean-m-cloud-config', {
    matches: ['/api/cloud/zhihu/config/all', '/api/cloud/zhihu/config/all?version=1'],
    misses: ['/api/cloud/zhihu/config/partial'],
  }],
  ['clean-answer-responses', {
    matches: ['/answers/v4/42', '/answers/v12/42?include=all'],
    misses: ['/answers/version/42', '/answers/v4/id'],
  }],
  ['clean-api-responses', {
    matches: [
      '/root/tab',
      '/root/tab/v4',
      '/root/tab/v12?source=ios',
      '/topstory/recommend',
      '/questions/42/feeds?include=all',
      '/questions/42/feeds',
      '/comment_v12/answers/42/root_comment',
      '/comment_v5/pins/42/root_comment?order=normal',
      '/articles/v12/42',
      '/pins/v4/42?include=all',
      '/comment_v12/answers/42/list-headers?source=ios',
      '/podcasts/hub/v12',
      '/search/recommend_query/v12?source=ios',
      '/search_v12?source=ios',
      '/search/tabs',
      '/people/self?source=ios',
    ],
    misses: [
      '/root/window',
      '/questions/id/feeds',
      '/articles/version/42',
      '/podcasts/hub/latest',
    ],
  }],
])

for (const action of manifest.actions) {
  const expression = new RegExp(action.match.pathRegex)
  const cases = pathCases.get(action.id)
  assert(cases, `${action.id}: path fixture is missing`)
  for (const value of cases.matches) assert(expression.test(value), `${action.id}: expected ${value} to match`)
  for (const value of cases.misses) assert(!expression.test(value), `${action.id}: expected ${value} not to match`)
}

const { transform: mockTransform } = await loadTransform('mock-json.js')
const mockURLs = [
  'https://api.zhihu.com/commercial_api/banner',
  'https://api.zhihu.com/next-render?type=answer&source=ios&id=1',
  'https://api.zhihu.com/search/preset_words?source=ios',
  'https://api.zhihu.com/search/related_queries/question/42?source=ios',
  'https://api.zhihu.com/content-distribution-core/bubble/common/show?source=ios',
  'https://api.zhihu.com/people/homepage_entry_v12',
  'https://api.zhihu.com/kvip/right/my_card',
  'https://api.zhihu.com/unlimited/go/my_card/v12?source=ios',
  'https://www.zhihu.com/api/v12/members/homepage_card?source=ios',
  'https://zhida.zhihu.com/ai_ingress/knowledge/square/categories/feeds?source=ios&categoryId=1',
  'https://zhida.zhihu.com/ai_ingress/ai_chat/guidance?source=ios',
]
for (const url of mockURLs) {
  const result = mockTransform({ request: { url } })
  assert.equal(result.response.status, 200, url)
  assert.equal(result.response.headers['Content-Type'], 'application/json', url)
  assert.equal(result.response.body, '{}', url)
}
assert.equal(mockTransform({ request: { url: 'https://www.zhihu.com/commercial_api/banner' } }), null)
assert.equal(mockTransform({ request: { url: 'https://api.zhihu.com/next-render?type=question&id=1' } }), null)
assert.equal(mockTransform({ request: { url: 'https://api.zhihu.com/next-render?type=answer' } }), null)
assert.equal(mockTransform({ request: { url: 'https://zhida.zhihu.com/ai_ingress/knowledge/square/categories/feeds?categoryId=2' } }), null)
assert.equal(mockTransform({ request: { url: 'not a URL' } }), null)

const { transform: cleanTransform, messages } = await loadTransform('clean-json.js')

{
  const result = clean(cleanTransform, 'https://m-cloud.zhihu.com/api/cloud/zhihu/config/all', {
    marker: 'keep',
    data: {
      configs: [
        ...blockedConfigKeys.map((configKey) => ({ configKey, configValue: { blocked: true } })),
        {
          configKey: 'unrelated',
          configValue: { delayHttpdns: true, dnsParser: 'blocked', HTTPDNS: {}, keep: 'value' },
          sibling: 'keep',
        },
        { configKey: 'array-value', configValue: [{ HTTPDNS: 'keep' }] },
        'non-object',
      ],
    },
  })
  assert.equal(result.marker, 'keep')
  assert.deepEqual(result.data.configs, [
    { configKey: 'unrelated', configValue: { keep: 'value' }, sibling: 'keep' },
    { configKey: 'array-value', configValue: [{ HTTPDNS: 'keep' }] },
    'non-object',
  ])
}

{
  const result = clean(cleanTransform, 'https://api.zhihu.com/root/tab', {
    marker: 'keep',
    tab_list: [
      { tab_type: 'activity', id: 0 },
      { tab_type: 'follow', id: 1 },
      { tab_type: 'recommend', id: 2 },
      { tab_type: 'hot', id: 3 },
      { tab_type: 'vip', id: 4 },
      { tab_type: 'ring_tab', id: 5 },
    ],
  })
  assert.equal(result.marker, 'keep')
  assert.deepEqual(result.tab_list.map((item) => item.id), [1, 2, 3, 5])
}

{
  const result = clean(cleanTransform, 'https://api.zhihu.com/topstory/recommend?source=ios', {
    marker: 'keep',
    data: [
      { type: 'ComponentCard', id: 1, children: [{ id: 'ring' }, { id: 'answer' }] },
      { type: 'ComponentCard', id: 2, children: 'keep' },
      { type: 'AdCard', id: 3 },
    ],
  })
  assert.equal(result.marker, 'keep')
  assert.deepEqual(result.data, [
    { type: 'ComponentCard', id: 1, children: [{ id: 'answer' }] },
    { type: 'ComponentCard', id: 2, children: 'keep' },
  ])
}

{
  const result = clean(cleanTransform, 'https://api.zhihu.com/topstory/recommend?limit=20', {
    data: [
      { type: 'feed', id: 1, target: { type: 'answer' }, action_card: { text: 'keep' } },
      { type: 'future_feed', id: 4, ad_info: {}, commercial_info: false, promotion_info: '' },
      { type: 'feed', id: 2, ad_info: { id: 'blocked' } },
      { type: 'promotion', id: 3 },
    ],
    styles: { keep: true },
  })
  assert.deepEqual(result, {
    data: [
      { type: 'feed', id: 1, target: { type: 'answer' }, action_card: { text: 'keep' } },
      { type: 'future_feed', id: 4, ad_info: {}, commercial_info: false, promotion_info: '' },
    ],
    styles: { keep: true },
  })
  assert.equal(clean(cleanTransform, 'https://api.zhihu.com/topstory/recommend?limit=20', result), null)
}

{
  const result = clean(cleanTransform, 'https://api.zhihu.com/answers/v4/42?include=all', {
    third_business: { blocked: true },
    float_search_word: 'blocked',
    ring_info: { blocked: true },
    interaction_bar_plugins: [{ blocked: true }],
    structured_content: {
      marker: 'keep',
      segments: [{ type: 'text', value: 'keep' }, { type: 'card', value: 'blocked' }],
    },
    nested: { third_business: 'keep' },
  })
  assert.equal('third_business' in result, false)
  assert.equal('float_search_word' in result, false)
  assert.equal('ring_info' in result, false)
  assert.equal('interaction_bar_plugins' in result, false)
  assert.deepEqual(result.structured_content, {
    marker: 'keep',
    segments: [{ type: 'text', value: 'keep' }],
  })
  assert.deepEqual(result.nested, { third_business: 'keep' })
}

{
  const result = clean(cleanTransform, 'https://page-info.zhihu.com/answers/v4/42', {
    third_business: true,
    float_search_word: true,
    ring_info: 'keep',
    interaction_bar_plugins: 'keep',
    structured_content: { segments: [{ type: 'card' }, { type: 'text' }] },
  })
  assert.deepEqual(result, {
    ring_info: 'keep',
    interaction_bar_plugins: 'keep',
    structured_content: { segments: [{ type: 'text' }] },
  })
}

for (const url of [
  'https://api.zhihu.com/answers/v12/42',
  'https://page-info.zhihu.com/answers/v12/42?include=all',
]) {
  const result = clean(cleanTransform, url, {
    third_business: 'blocked',
    float_search_word: 'blocked',
    ring_info: 'keep',
    interaction_bar_plugins: 'keep',
    structured_content: { segments: [{ type: 'card' }, { type: 'text' }] },
  })
  assert.deepEqual(result, url.includes('api.zhihu.com')
    ? { structured_content: { segments: [{ type: 'text' }] } }
    : {
        ring_info: 'keep',
        interaction_bar_plugins: 'keep',
        structured_content: { segments: [{ type: 'text' }] },
      }, url)
}

for (const url of [
  'https://api.zhihu.com/articles/v12/42',
  'https://api.zhihu.com/pins/v4/42?include=all',
]) {
  const result = clean(cleanTransform, url, {
    third_business: 'blocked',
    ring_info: 'blocked',
    interaction_bar_plugins: 'blocked',
    marker: 'keep',
    nested: {
      third_business: 'keep',
      ring_info: 'keep',
      interaction_bar_plugins: 'keep',
    },
  })
  assert.deepEqual(result, {
    marker: 'keep',
    nested: {
      third_business: 'keep',
      ring_info: 'keep',
      interaction_bar_plugins: 'keep',
    },
  }, url)
}

const deleteCases = [
  ['https://api.zhihu.com/questions/42/feeds', 'ad_info'],
  ['https://api.zhihu.com/comment_v12/answers/42/root_comment', 'atmosphere_voting_config'],
  ['https://api.zhihu.com/comment_v12/answers/42/list-headers?source=ios', 'continuous_consumption_module'],
  ['https://api.zhihu.com/podcasts/hub/v12?source=ios', 'banners'],
  ['https://api.zhihu.com/search_v12', 'pendant'],
]
for (const [url, key] of deleteCases) {
  const result = clean(cleanTransform, url, { [key]: 'blocked', marker: 'keep', nested: { [key]: 'keep' } })
  assert.equal(Object.prototype.hasOwnProperty.call(result, key), false, url)
  assert.equal(result.marker, 'keep', url)
  assert.equal(result.nested[key], 'keep', url)
}

{
  const result = clean(cleanTransform, 'https://api.zhihu.com/search/recommend_query/v12', {
    recommend_queries: {
      marker: 'keep',
      queries: [{ type: 'normal', value: 'keep' }, { type: 'promotion', value: 'blocked' }],
    },
  })
  assert.deepEqual(result.recommend_queries, {
    marker: 'keep',
    queries: [{ type: 'normal', value: 'keep' }],
  })
}

{
  const allowed = ['general', 'km_general', 'ai_zhida', 'recent', 'people', 'zvideo', 'ring', 'topic', 'podcast', 'column', 'pin', 'favlist', 'scholar', 'publication']
  const result = clean(cleanTransform, 'https://api.zhihu.com/search/tabs', {
    data: [...allowed.map((t) => ({ t })), { t: 'promotion' }],
  })
  assert.deepEqual(result.data.map((item) => item.t), allowed)
}

{
  const result = clean(cleanTransform, 'https://api.zhihu.com/people/self?source=ios', {
    vip_info: {
      entrance_new: { right_button: 'blocked', title: 'keep' },
      entrance_v2: 'blocked',
      marker: 'keep',
    },
  })
  assert.deepEqual(result, {
    vip_info: {
      entrance_new: { title: 'keep' },
      marker: 'keep',
    },
  })
}

{
  const marker = 'x'.repeat(131072)
  const result = clean(cleanTransform, 'https://api.zhihu.com/questions/42/feeds?include=all', {
    ad_info: 'blocked',
    marker,
  })
  assert.equal(result.marker, marker)
}

assert.equal(clean(cleanTransform, 'https://api.zhihu.com/questions/42/feeds?include=all', { marker: 'keep' }), null)
assert.equal(clean(cleanTransform, 'https://www.zhihu.com/questions/42/feeds?include=all', { ad_info: 'keep' }), null)
assert.equal(cleanTransform({
  request: { url: 'https://api.zhihu.com/questions/42/feeds?include=all' },
  response: { body: '{invalid' },
}), null)
assert.equal(cleanTransform({
  request: { url: 'https://api.zhihu.com/questions/42/feeds?include=all' },
  response: { body: 'null' },
}), null)
assert.equal(cleanTransform({
  request: { url: 'https://api.zhihu.com/questions/42/feeds?include=all' },
  response: { body: '[]' },
}), null)
assert.equal(messages.some((message) => message[0] === 'error' && String(message[1]).includes('decode failed')), true)
assert.equal(messages.some((message) => message[0] === 'error' && String(message[1]).includes('root is not an object')), true)

console.log('Zhihu fixtures passed')
