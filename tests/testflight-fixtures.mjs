import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

// testflight-region-unlock used to ship a local transform(context) body
// rewriter, and this file carried a sandbox loader to drive it. That code is
// gone -- the extension declares a replaceBody -- so the fixtures went with it
// rather than being kept as a toolkit with no caller. What remains is what this
// repository still owns: the manifest shape and the pins.

const root = path.resolve(import.meta.dirname, '..')

async function readManifest(relativePath) {
  return parse(await readFile(path.join(root, relativePath), 'utf8'))
}

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

const testflightReadme = await readFile(path.join(root, 'testflight-region-unlock/README.md'), 'utf8')
assert.match(testflightReadme, /License: \[`CC-BY-NC-SA-4\.0`\]/)
assert.match(testflightReadme, /ab6c3182fb2b09bcc34456f496282ec0b8e9217b/)
assert.match(testflightReadme, /c8112507802d0690d8b94d4110945e9c782df40e/)
// Keep the focused verification command visible in the extension README.
assert(testflightReadme.includes('node tests/testflight-fixtures.mjs'))

console.log('TestFlight fixtures passed')
