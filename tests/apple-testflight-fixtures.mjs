import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

// Both extensions used to ship a local transform(context): apple-wloc carried a
// WLOC frame and protobuf wire parser, testflight carried a body rewriter. This
// file carried a sandbox loader and a protobuf fixture builder to drive them.
// That code is gone -- apple-wloc loads the upstream bundle and testflight
// declares a replaceBody -- so the fixtures went with it rather than being kept
// as a toolkit with no caller. What remains is what this repository still owns:
// the manifest shape and the pins.

const root = path.resolve(import.meta.dirname, '..')

async function readManifest(relativePath) {
  return parse(await readFile(path.join(root, relativePath), 'utf8'))
}

const appleManifest = await readManifest('apple-wloc/extension.yaml')
assert.equal(appleManifest.metadata.id, 'io.5gpn.apple-wloc')
assert.equal(appleManifest.metadata.version, '4.0.0')
// The picker page saves a coordinate into extension-scoped storage, which is
// why this revision declares storage where the previous one declared none.
assert.deepEqual(appleManifest.permissions, { persistentStorage: true })
assert.equal(appleManifest.requirements, undefined)
// Upstream widened its response matcher and [MITM] hostname list from the two
// gs-loc names to the five WLOC endpoints it has observed, two of which are
// AutoNavi rather than Apple. The order is upstream's own.
assert.deepEqual(appleManifest.traffic, {
  captureHosts: [
    'gs-loc.apple.com',
    'gs-loc-cn.apple.com',
    'gsp-ssl.ls.apple.com',
    'bluedot.is.autonavi.com',
    'bluedot.is.autonavi.com.gds.alibabadns.com',
  ],
})
// Four deliberate deviations from upstream's [Argument] block. The coordinate
// and log-level deviations keep the existing behavior honest; the random
// radius adds the validation boundary that upstream's free-form input lacks.
//
// The coordinates ship no default. Upstream reads its own shipped coordinate as
// "unconfigured": with empty storage and longitude/latitude exactly
// 113.94114/22.544577 it nulls the pair and returns the response unmodified. So
// carrying those defaults left two required settings looking complete while the
// extension patched nothing at all.
//
// They are typed `number` rather than `text`. A same-ID update retains a stored
// value only when the key and the type both match, so the type change is what
// drops the sentinel an existing 2.0.x install carries -- without it this
// release would have fixed only fresh installs. `number` also carries the
// min/max the console and the daemon enforce.
//
// The log level is keyed `LogLevel`. Upstream's block declares `logLevel`; the
// response transformer reads both and lets the capital one win, but the
// settings-save script reads only `$argument.LogLevel`, so upstream's own key
// leaves that second script on its built-in level. `LogLevel` is the single
// spelling both scripts honour.
assert.deepEqual(appleManifest.settings.map(({ key, type, default: value }) => ({ key, type, value })), [
  { key: 'longitude', type: 'number', value: undefined },
  { key: 'latitude', type: 'number', value: undefined },
  { key: 'accuracy', type: 'number', value: 25 },
  { key: 'LogLevel', type: 'select', value: 'info' },
  { key: 'randomRadius', type: 'number', value: 0 },
])
assert.deepEqual(appleManifest.settings.map(({ key, min, max }) => ({ key, min, max })), [
  { key: 'longitude', min: -180, max: 180 },
  { key: 'latitude', min: -90, max: 90 },
  { key: 'accuracy', min: 1, max: 100000 },
  { key: 'LogLevel', min: undefined, max: undefined },
  { key: 'randomRadius', min: 0, max: 5000 },
])
const randomRadius = appleManifest.settings[4]
assert.deepEqual(
  {
    key: randomRadius?.key,
    type: randomRadius?.type,
    required: randomRadius?.required,
    default: randomRadius?.default,
    min: randomRadius?.min,
    max: randomRadius?.max,
  },
  {
    key: 'randomRadius',
    type: 'number',
    required: true,
    default: 0,
    min: 0,
    max: 5000,
  },
)
// The console renders a map point picker with city search over a flat
// longitude/latitude/accuracy trio. That is the only way an operator gets a map
// for a proxy-compat bundle: a `location` setting arrives nested under one key
// and these scripts read the three flat keys. Renaming one silently takes the
// picker away, so the exact names and their order are pinned here.
assert.deepEqual(
  appleManifest.settings.slice(0, 3).map(({ key }) => key),
  ['longitude', 'latitude', 'accuracy'],
  'the console map picker binds these exact three leading keys',
)
assert(
  appleManifest.settings
    .filter(({ key }) => key === 'longitude' || key === 'latitude')
    .every((setting) => setting.required === true && setting.default === undefined),
  'the coordinates must be required and undefaulted, or the extension reports ready while passing traffic through',
)

assert.equal(appleManifest.actions.length, 2)
const [wlocAction, settingsAction] = appleManifest.actions
assert.equal(wlocAction.id, 'rewrite-wloc-response')
assert.equal(wlocAction.phase, 'response')
assert.deepEqual(wlocAction.script, {
  source: 'https://raw.githubusercontent.com/Yu9191/wloc/ea204aedfd36b3d407c3506ac25db506a6c1b419/dist/wloc.js',
  entry: 'proxy-compat',
  bodyMode: 'binary',
  timeoutMs: 30000,
  maxBodyBytes: 8388608,
})
assert.equal(settingsAction.id, 'save-wloc-settings')
assert.equal(settingsAction.phase, 'request')
assert.deepEqual(settingsAction.script, {
  source: 'https://raw.githubusercontent.com/Yu9191/wloc/ea204aedfd36b3d407c3506ac25db506a6c1b419/dist/wloc-settings.js',
  entry: 'proxy-compat',
  bodyMode: 'none',
  timeoutMs: 10000,
  maxBodyBytes: 1024,
})
// The two matchers deliberately differ. Upstream widened only the response
// script's hostname list; its `WLOC Settings` request line still names the two
// gs-loc hosts, so the save action stays there rather than inheriting the
// capture list. Collapsing them either way would exceed the reviewed module.
assert.deepEqual(wlocAction.match.hosts, appleManifest.traffic.captureHosts)
assert.deepEqual(settingsAction.match.hosts, ['gs-loc.apple.com', 'gs-loc-cn.apple.com'])
for (const action of appleManifest.actions) {
  assert.deepEqual(action.match.schemes, ['https'])
  assert(
    action.match.hosts.every((host) => appleManifest.traffic.captureHosts.includes(host)),
    'an action may only match hosts the extension declares as captured',
  )
}
assert(new RegExp(wlocAction.match.pathRegex).test('/clls/wloc'))
assert(new RegExp(wlocAction.match.pathRegex).test('/clls/wloc?source=test'))
assert(!new RegExp(wlocAction.match.pathRegex).test('/clls/wloc/extra'))
assert(new RegExp(settingsAction.match.pathRegex).test('/wloc-settings/save?longitude=1&randomRadius=5000'))
assert(!new RegExp(settingsAction.match.pathRegex).test('/wloc-settings/load'))
// The response action previously pinned statusCodes: [200]. Upstream matches
// every response on the path, and narrowing it here would silently skip a
// non-200 body the scripts still handle.
assert.equal(wlocAction.match.statusCodes, undefined)

// TestFlight rewrites the storefront declaratively now. The region-to-id table
// lives in the action's valueMap, which resolves the operator's choice; the
// substitution itself is executed by the monolith, because this repository has
// no way to run it. What is checked here is that the shipped action still
// carries every reviewed region and reads the setting rather than a constant.
const testflightManifest = await readManifest('testflight-region-unlock/extension.yaml')
const testflightAction = testflightManifest.actions[0]
const replace = testflightAction.script.replaceBody
assert.equal(testflightAction.script.source, undefined)
assert.equal(testflightAction.script.entry, undefined)
assert.equal(testflightAction.script.jq, undefined)
// Byte-surgical, matching upstream's request-body-replace-regex. The jq form
// this replaced parsed and re-serialised the body, which normalised key order.
assert(replace.to.includes('{{settings.storefront}}'), 'the replacement must read the operator choice')
new RegExp(replace.pattern)
const storefronts = {
  US: '143441-19,29',
  GB: '143444-19,29',
  CA: '143455-19,29',
  AU: '143460-19,29',
  JP: '143462-19,29',
  HK: '143463-19,29',
  SG: '143464-19,29',
  CN: '143465-19,29',
  KR: '143466-19,29',
  TW: '143470-19,29',
}
assert.deepEqual(
  testflightManifest.settings[0].options.slice().sort(),
  Object.keys(storefronts).slice().sort(),
  'every offered region must have a storefront id in the value map',
)
assert.deepEqual(replace.valueMap.storefront, storefronts)

const appleReadme = await readFile(path.join(root, 'apple-wloc/README.md'), 'utf8')
const testflightReadme = await readFile(path.join(root, 'testflight-region-unlock/README.md'), 'utf8')
const licenseSummary = await readFile(path.join(root, 'LICENSE'), 'utf8')
const thirdPartyNotices = await readFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8')
const applePin = 'ea204aedfd36b3d407c3506ac25db506a6c1b419'
const appleLicenseUrl = `https://github.com/Yu9191/wloc/blob/${applePin}/LICENSE`
assert.match(appleReadme, /License: \[`MIT`\]/)
assert.match(appleReadme, new RegExp(applePin))
// The local files remain MIT while the remote scripts keep both upstream
// license statements. Neither boundary may be blurred into the other.
for (const document of [appleReadme, licenseSummary, thirdPartyNotices]) {
  assert.match(document, /AGPL-3\.0/)
  assert.match(document, /non-commercial use/i)
  assert.match(document, /commercial[- ]product/i)
  assert.match(document, /application[- ]store/i)
}
assert(appleReadme.includes(appleLicenseUrl))
assert(thirdPartyNotices.includes(appleLicenseUrl))
assert.match(appleReadme, /local manifest and documentation/i)
assert.match(appleReadme, /merges the new coordinate fields/i)
assert.match(appleReadme, /previous persisted radius is retained/i)
assert.match(appleReadme, /take precedence over\s+the manifest arguments/i)
assert.match(appleReadme, /enforces no upper bound/i)
assert.match(appleReadme, /AutoNavi endpoints/i)
assert.match(appleReadme, /coordinate-less save therefore reports success/i)
assert.match(appleReadme, /randomRadius/)
assert.match(appleReadme, /failClosed/)
assert.match(testflightReadme, /License: \[`CC-BY-NC-SA-4\.0`\]/)
assert.match(testflightReadme, /ab6c3182fb2b09bcc34456f496282ec0b8e9217b/)
assert.match(testflightReadme, /c8112507802d0690d8b94d4110945e9c782df40e/)
// Keep the focused verification command visible in both extension READMEs.
for (const readme of [appleReadme, testflightReadme]) {
  assert(readme.includes('node tests/apple-testflight-fixtures.mjs'))
}

console.log('Apple WLOC and TestFlight fixtures passed')
