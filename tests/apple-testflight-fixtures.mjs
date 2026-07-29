import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

const appleManifest = await readManifest('apple-wloc/extension.yaml')
assert.equal(appleManifest.metadata.id, 'io.5gpn.apple-wloc')
assert.equal(appleManifest.metadata.version, '2.0.0')
// The picker page saves a coordinate into extension-scoped storage, which is
// why this revision declares storage where the previous one declared none.
assert.deepEqual(appleManifest.permissions, { persistentStorage: true })
assert.equal(appleManifest.requirements, undefined)
assert.deepEqual(appleManifest.traffic, {
  captureHosts: ['gs-loc.apple.com', 'gs-loc-cn.apple.com'],
})
// The four settings are upstream's [Argument] block verbatim, including its
// types and defaults, so they reach the scripts as the object Loon supplies.
assert.deepEqual(appleManifest.settings.map(({ key, type, default: value }) => ({ key, type, value })), [
  { key: 'longitude', type: 'text', value: '113.94114' },
  { key: 'latitude', type: 'text', value: '22.544577' },
  { key: 'accuracy', type: 'text', value: '25' },
  { key: 'logLevel', type: 'select', value: 'info' },
])

assert.equal(appleManifest.actions.length, 2)
const [wlocAction, settingsAction] = appleManifest.actions
assert.equal(wlocAction.phase, 'response')
assert.equal(settingsAction.phase, 'request')
for (const action of appleManifest.actions) {
  assert.deepEqual(action.match.hosts, appleManifest.traffic.captureHosts)
  assert.deepEqual(action.match.schemes, ['https'])
  assert.equal(action.script.entry, 'proxy-compat')
  assert(action.script.source.startsWith('https://raw.githubusercontent.com/Yu9191/wloc/eec07a8dc8de6dbaee8eac1fb376e4d03020154a/dist/'), `${action.id} must load the reviewed immutable commit`)
}
assert(new RegExp(wlocAction.match.pathRegex).test('/clls/wloc'))
assert(new RegExp(wlocAction.match.pathRegex).test('/clls/wloc?source=test'))
assert(!new RegExp(wlocAction.match.pathRegex).test('/clls/wloc/extra'))
assert(new RegExp(settingsAction.match.pathRegex).test('/wloc-settings/save?longitude=1'))
assert(!new RegExp(settingsAction.match.pathRegex).test('/wloc-settings/load'))
// The response action previously pinned statusCodes: [200]. Upstream matches
// every response on the path, and narrowing it here would silently skip a
// non-200 body the scripts still handle.
assert.equal(wlocAction.match.statusCodes, undefined)

// TestFlight rewrites the storefront declaratively now. The region-to-id table
// lives in the action's valueMap, which resolves the operator's choice; the
// substitution itself is executed by the sidecar, because this repository has
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
assert.match(appleReadme, /License: \[`MIT`\]/)
assert.match(appleReadme, /eec07a8dc8de6dbaee8eac1fb376e4d03020154a/)
// The upstream repository has no LICENSE file. The README has to say so, and
// the three accepted costs have to remain visible rather than being quietly
// dropped in a later edit.
assert.match(appleReadme, /upstream publishes no license file/i)
assert.match(appleReadme, /failClosed/)
assert.match(testflightReadme, /License: \[`CC-BY-NC-SA-4\.0`\]/)
assert.match(testflightReadme, /ab6c3182fb2b09bcc34456f496282ec0b8e9217b/)
assert.match(testflightReadme, /c8112507802d0690d8b94d4110945e9c782df40e/)
// Manifest digests are no longer transcribed by hand: the marketplace generator
// computes them at publish time, which is the copy a gateway actually checks.
for (const readme of [appleReadme, testflightReadme]) {
  assert(readme.includes('node tests/apple-testflight-fixtures.mjs'))
}

console.log('Apple WLOC and TestFlight fixtures passed')
