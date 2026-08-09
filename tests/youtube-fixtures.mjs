import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const manifest = parse(await readFile(path.join(root, 'youtube-cleaner', 'extension.yaml'), 'utf8'))

const COMMIT = '65075cdb388fc5e3094afd7e7314c67b243f3525'
const RAW_ROOT = `https://raw.githubusercontent.com/Maasea/sgmodule/${COMMIT}`
const REQUEST_BUNDLE = `${RAW_ROOT}/Script/Youtube/youtube.request.js`
const RESPONSE_BUNDLE = `${RAW_ROOT}/Script/Youtube/youtube.response.js`

assert.equal(manifest.metadata.id, 'io.5gpn.youtube-cleaner')
assert.equal(manifest.metadata.version, '5.1.0')
assert.deepEqual(manifest.permissions, {
  persistentStorage: true,
  network: true,
})
assert.deepEqual(manifest.traffic, {
  captureHosts: ['*.googlevideo.com', 'youtubei.googleapis.com'],
})
assert.equal(manifest.requirements, undefined, 'the reviewed behavior requires no operator egress binding')

assert.deepEqual(
  manifest.settings.map(({ key, type, required, default: defaultValue }) => ({ key, type, required, default: defaultValue })),
  [
    { key: 'blockUpload', type: 'boolean', required: true, default: true },
    { key: 'blockImmersive', type: 'boolean', required: true, default: true },
    { key: 'blockShorts', type: 'boolean', required: true, default: false },
    { key: 'captionLang', type: 'text', required: true, default: 'off' },
  ],
)

assert.deepEqual(manifest.actions, [
  {
    id: 'prepare-onesie-initplayback',
    phase: 'request',
    match: {
      hosts: ['*.googlevideo.com'],
      schemes: ['http', 'https'],
      pathRegex: '^/initplayback.+&ack.*$',
    },
    script: {
      source: REQUEST_BUNDLE,
      entry: 'proxy-compat',
      bodyMode: 'binary',
      timeoutMs: 1000,
      maxBodyBytes: 4194304,
    },
  },
  {
    id: 'prepare-youtube-log-event',
    phase: 'request',
    match: {
      hosts: ['youtubei.googleapis.com'],
      schemes: ['https'],
      pathRegex: '^/youtubei/v1/log_event(\\?.*)?$',
    },
    script: {
      source: REQUEST_BUNDLE,
      entry: 'proxy-compat',
      bodyMode: 'binary',
      timeoutMs: 1000,
      maxBodyBytes: 4194304,
    },
  },
  {
    id: 'clean-youtube-response',
    phase: 'response',
    match: {
      hosts: ['youtubei.googleapis.com'],
      schemes: ['https'],
      pathRegex: '^/youtubei/v1/(browse|next|player|search|reel/reel_watch_sequence|guide|account/get_setting|get_watch|log_event|config)(\\?.*)?$',
    },
    script: {
      source: RESPONSE_BUNDLE,
      entry: 'proxy-compat',
      bodyMode: 'binary',
      timeoutMs: 10000,
      maxBodyBytes: 16777216,
    },
  },
])

const [onesie, logEvent, response] = manifest.actions
const onesieMatcher = new RegExp(onesie.match.pathRegex)
for (const pathValue of [
  '/initplayback?id=abc&ack=1',
  '/initplayback?foo=bar&ack=',
]) {
  assert(onesieMatcher.test(pathValue), `Onesie matcher misses ${pathValue}`)
}
for (const pathValue of [
  '/initplayback?ack=1',
  '/initplayback?id=abc',
  '/other?id=abc&ack=1',
]) {
  assert(!onesieMatcher.test(pathValue), `Onesie matcher unexpectedly selects ${pathValue}`)
}

const logEventMatcher = new RegExp(logEvent.match.pathRegex)
for (const pathValue of ['/youtubei/v1/log_event', '/youtubei/v1/log_event?key=value']) {
  assert(logEventMatcher.test(pathValue), `log_event matcher misses ${pathValue}`)
}
for (const pathValue of ['/youtubei/v1/log_event/', '/youtubei/v1/log_event_extra', '/youtubei/v1/config']) {
  assert(!logEventMatcher.test(pathValue), `log_event matcher unexpectedly selects ${pathValue}`)
}

const responseMatcher = new RegExp(response.match.pathRegex)
for (const endpoint of [
  'browse',
  'next',
  'player',
  'search',
  'reel/reel_watch_sequence',
  'guide',
  'account/get_setting',
  'get_watch',
  'log_event',
  'config',
]) {
  for (const suffix of ['', '?key=value']) {
    const pathValue = `/youtubei/v1/${endpoint}${suffix}`
    assert(responseMatcher.test(pathValue), `response matcher misses ${pathValue}`)
  }
}
for (const pathValue of [
  '/youtubei/v1/browse/',
  '/youtubei/v1/reel_watch_sequence',
  '/youtubei/v1/account/get_settings',
  '/youtubei/v1/log_event/extra',
]) {
  assert(!responseMatcher.test(pathValue), `response matcher unexpectedly selects ${pathValue}`)
}

const readme = await readFile(path.join(root, 'youtube-cleaner', 'README.md'), 'utf8')
for (const source of [
  `${RAW_ROOT}/YouTube.Enhance.sgmodule`,
  REQUEST_BUNDLE,
  RESPONSE_BUNDLE,
  `${RAW_ROOT}/LICENSE`,
]) {
  assert(readme.includes(source), `README must record immutable source ${source}`)
}
assert(readme.includes('2026-08-05'), 'README must record the upstream fetch and recheck date')
assert(readme.includes('| --- | --- |'), 'the pinned-upstream Markdown table must have a valid separator row')
assert.match(readme, /single global boolean `permissions\.network: true`/)
assert.match(readme, /any public destination permitted by the gateway/i)
assert.match(readme, /rewrite a captured request across origins/i)
assert(!readme.includes('permissions.network.origins'), 'README must not describe a removed per-origin permission')
assert.doesNotMatch(readme, /same-origin/i, 'README must not describe the global network grant as same-origin')
assert.match(readme, /derives their size and SHA-256 for the catalog/i)
assert.match(readme, /build\s+output,\s+not hand-maintained upstream provenance pins/i)
assert.match(readme, /Git commit pin covers the two bundles, not the\s+Worker deployment/i)
assert.match(readme, /`log_event` action deliberately narrows upstream's prefix matcher/i)
assert.match(readme, /`\/youtubei\/v1\/log_event_extra`/)
assert.doesNotMatch(readme, /pinned digests|pinned by digest|sizes, and digests|recorded digest/i)

console.log('YouTube fixtures passed')
