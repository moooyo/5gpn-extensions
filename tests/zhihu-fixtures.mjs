import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const extensionRoot = path.join(root, 'zhihu-cleaner')
const manifest = parse(await readFile(path.join(extensionRoot, 'extension.yaml'), 'utf8'))

// The seventeen HTTPDNS/QUIC configuration keys the README says
// `clean-transport-config` removes. The list was carried here unused for a
// while, which meant the README's count was documentation and nothing else.
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

assert.equal(manifest.metadata.id, 'io.5gpn.zhihu-cleaner')
assert.equal(manifest.metadata.version, '2.0.2')
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
assert.equal(manifest.actions.length, 18)
assert.equal(new Set(manifest.actions.map((action) => action.id)).size, 18)
assert.equal(manifest.actions.filter((action) => action.phase === 'request').length, 5)
assert.equal(manifest.actions.filter((action) => action.phase === 'response').length, 13)
for (const action of manifest.actions) {
  assert(action.match.hosts.every((host) => manifest.traffic.captureHosts.includes(host)))
  assert.deepEqual(action.match.schemes, ['https'])
  assert.equal(action.match.pathRegex.startsWith('^'), true)
  if (action.phase === 'request') {
    // The three synthetic replies used to share a URL-matching script whose
    // only job was to return {}. They are declared now.
    assert.equal(action.script.mock.body, '{}')
    assert.equal(action.script.mock.headers['Content-Type'], 'application/json')
    assert.equal(action.script.source, undefined)
    assert.equal(action.script.bodyMode, 'none')
  } else {
    // Every response action carries an expression, not code. The behavior of
    // those expressions is verified against gojq -- the engine that runs them
    // -- in the sidecar's jq suite; what is checked here is that nothing
    // reintroduces a script.
    assert.equal(typeof action.script.jq, 'string')
    assert.equal(action.script.source, undefined)
    assert.equal(action.script.inline, undefined)
    assert.equal(action.script.entry, undefined)
    assert.equal(action.script.bodyMode, 'text')
  }
}

const pathCases = new Map([
  ['mock-api-json', {
    matches: [
      '/commercial_api',
      '/commercial_api/banner',
      '/root/window?source=ios',
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
      '/root/windows',
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
      '/ai_ingress/ai_chat/guidance?source=ios',
    ],
    misses: [
      '/ai_ingress/knowledge/square/categories/other?categoryId=1',
    ],
  }],
  ['mock-next-render', {
    matches: ['/next-render?id=1&type=answer', '/next-render?type=answer&next=2&id=1'],
    misses: ['/next-render?type=question&id=1', '/next-render?id=1'],
  }],
  ['mock-zhida-feeds', {
    matches: ['/ai_ingress/knowledge/square/categories/feeds?categoryId=1', '/ai_ingress/knowledge/square/categories/feeds?categoryId=1}', '/ai_ingress/knowledge/square/categories/feeds?categoryId=1%7d&source=ios'],
    misses: ['/ai_ingress/knowledge/square/categories/feeds?categoryId=2'],
  }],
  ['clean-transport-config', {
    matches: ['/api/cloud/zhihu/config/all', '/api/cloud/zhihu/config/all?v=1'],
    misses: ['/api/cloud/zhihu/config', '/api/cloud/zhihu/config/all/extra'],
  }],
  ['clean-answer-responses', {
    matches: ['/answers/v4/12345', '/answers/v4/12345?include=x'],
    misses: ['/answers/v4', '/answers/12345', '/answers/v4/12345/comments'],
  }],
  ['clean-root-tab', {
    matches: ['/root/tab', '/root/tab/v2', '/root/tab/v2?source=ios'],
    misses: ['/root/tabs', '/root/tab/v2/extra'],
  }],
  ['clean-topstory-recommend', {
    matches: ['/topstory/recommend', '/topstory/recommend?session_token=1'],
    misses: ['/topstory/recommends', '/topstory/hot'],
  }],
  ['clean-question-feeds', {
    matches: ['/questions/42/feeds', '/questions/42/feeds?limit=5'],
    misses: ['/questions/id/feeds', '/questions/42/feed'],
  }],
  ['clean-root-comment', {
    matches: ['/comment_v5/answers/42/root_comment', '/comment_v5/pins/42/root_comment?order=1'],
    misses: ['/comment_v5/articles/42/root_comment', '/comment_v5/answers/42/child_comment'],
  }],
  ['clean-article-pin', {
    matches: ['/articles/v4/42', '/pins/v4/42?include=x'],
    misses: ['/answers/v4/42', '/articles/v4'],
  }],
  ['clean-comment-list-headers', {
    matches: ['/comment_v5/answers/42/list-headers', '/comment_v5/answers/42/list-headers?x=1'],
    misses: ['/comment_v5/pins/42/list-headers', '/comment_v5/answers/42/list-header'],
  }],
  ['clean-podcast-hub', {
    matches: ['/podcasts/hub/v2', '/podcasts/hub/v2?source=ios'],
    misses: ['/podcasts/hub', '/podcasts/hub/latest'],
  }],
  ['clean-search-recommend-query', {
    matches: ['/search/recommend_query/v2', '/search/recommend_query/v2?x=1'],
    misses: ['/search/recommend_query', '/search/preset_words'],
  }],
  ['clean-search-result', {
    matches: ['/search_v3', '/search_v3?q=x'],
    misses: ['/search', '/search_v3/extra'],
  }],
  ['clean-search-tabs', {
    matches: ['/search/tabs', '/search/tabs?q=x'],
    misses: ['/search/tab', '/search/tabs/extra'],
  }],
  ['clean-people-self', {
    matches: ['/people/self', '/people/self?include=x'],
    misses: ['/people/other', '/people/self/extra'],
  }],
])

for (const action of manifest.actions) {
  const expression = new RegExp(action.match.pathRegex)
  const cases = pathCases.get(action.id)
  assert(cases, `${action.id}: path fixture is missing`)
  for (const value of cases.matches) assert(expression.test(value), `${action.id}: expected ${value} to match`)
  for (const value of cases.misses) assert(!expression.test(value), `${action.id}: expected ${value} not to match`)
}

// The two paths that discriminate on query values are their own actions now.
// The deleted script tested them in JavaScript; the pattern has to carry the
// same conditions, and RE2 has no lookahead, so both parameter orders are
// enumerated. Getting this wrong would widen what is mocked rather than fail.
const nextRender = new RegExp(manifest.actions.find(action => action.id === 'mock-next-render').match.pathRegex)
for (const value of [
  '/next-render?id=1&type=answer',
  '/next-render?id=1&type=answer&next=2',
  '/next-render?type=answer&next=2&id=1',
]) assert(nextRender.test(value), `next-render should mock ${value}`)
for (const value of [
  '/next-render?type=question&id=1',
  '/next-render?id=1',
  '/next-render?type=answer',
  '/next-render?id=x&type=answer',
]) assert(!nextRender.test(value), `next-render should not mock ${value}`)

const zhidaFeeds = new RegExp(manifest.actions.find(action => action.id === 'mock-zhida-feeds').match.pathRegex)
assert(zhidaFeeds.test('/ai_ingress/knowledge/square/categories/feeds?source=ios&categoryId=1'))
assert(zhidaFeeds.test('/ai_ingress/knowledge/square/categories/feeds?categoryId=1}'))
assert(!zhidaFeeds.test('/ai_ingress/knowledge/square/categories/feeds?categoryId=2'))
assert(!zhidaFeeds.test('/ai_ingress/knowledge/square/categories/feeds?categoryId=12'))

// gojq executes the expression, not Node, so what can be checked here is that
// the drop list in the manifest is exactly the reviewed set: every key present,
// no eighteenth key added, and the three object-valued fields still removed.
const transportConfig = manifest.actions.find(action => action.id === 'clean-transport-config').script.jq
const dropList = transportConfig.match(/def drop_keys:\s*\{(.*?)\};/s)
assert(dropList, 'clean-transport-config must define drop_keys as an object literal')
const droppedKeys = [...dropList[1].matchAll(/"([^"]+)"\s*:\s*true/g)].map(match => match[1]).sort()
assert.deepEqual(droppedKeys, blockedConfigKeys.slice().sort(), 'the drop list must be the reviewed HTTPDNS/QUIC keys')
assert.equal(droppedKeys.length, 17)
for (const field of ['delayHttpdns', 'dnsParser', 'HTTPDNS']) {
  assert(transportConfig.includes(field), `clean-transport-config must still remove ${field}`)
}

console.log('Zhihu fixtures passed')
