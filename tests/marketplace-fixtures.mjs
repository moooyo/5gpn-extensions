import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { generateMarketplace } from '../scripts/generate-marketplace.mjs'

const revision = 'a'.repeat(40)
const execFileAsync = promisify(execFile)
const repositoryRoot = path.resolve(import.meta.dirname, '..')

{
  const schema = JSON.parse(await readFile(path.resolve(import.meta.dirname, '..', 'marketplace', 'schema.json'), 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  const catalog = JSON.parse(await generateMarketplace({ revision }))

  // The index is one document describing one contract. It used to be several,
  // with the frozen one omitting every entry that needed a newer field; the
  // assertions that policed that split are gone with it. What replaces them is
  // the direct statement of what the document carries, which is what a reader
  // depends on either way.
  for (const entry of catalog.entries) {
    assert.equal(Object.hasOwn(entry, 'policy'), true, `${entry.id}: missing the typed policy projection`)
    assert.equal(
      Object.hasOwn(entry.capabilities, 'network'),
      true,
      `${entry.id}: missing the network capability`,
    )
  }

  assert.equal(catalog.metadata.id, 'io.5gpn.official')
  assert.equal(catalog.entries.length, 6)
  for (const entry of catalog.entries) {
    assert.equal(entry.policy.clientRules, entry.policy.policyRules + entry.policy.captureRules)
    assert.equal(entry.policy.policyRules, entry.capabilities.routingRuleCount,
      `${entry.id}: a reviewed routing rule did not survive into the typed projection`)
  }
  const bilibili = catalog.entries.find(entry => entry.id === 'io.5gpn.bilibili-cleaner')
  assert.equal(bilibili.capabilities.actionCount, 24)
  // Eleven of bilibili's actions are jq expressions and five load pinned
  // upstream scripts, so the only local resources left are the two mocks.
  // Every action is declarative or loads a pinned upstream script, so the
  // entry contributes no local resource at all.
  assert.deepEqual(bilibili.resources.map(resource => resource.path).filter(p => !p.includes('/')), [])
  const weatherkit = catalog.entries.find(entry => entry.id === 'io.5gpn.weatherkit')
  assert.deepEqual(weatherkit.capabilities, {
    captureHostCount: 1,
    actionCount: 4,
    settingCount: 11,
    network: true,
    persistentStorage: true,
    upstreamMappingCount: 0,
    routingRuleCount: 4,
    egressGroupRequired: false,
  })
  // The core derives this list from every action that names a script source and
  // refuses an install whose entry does not match, so the remote bundle is listed
  // with the digest the gateway will compute for itself. The two cloud rewrites
  // name no source, so nothing about that mode is pinned by a digest.
  assert.deepEqual(weatherkit.resources, [{
    path: 'NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js',
    url: 'https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js',
    sha256: '4d368808a17c42eef18135f04d1bc9f01cbf7878d227006521ef0a6598941ff2',
    size: 251617,
  }])
  const zhihu = catalog.entries.find(entry => entry.id === 'io.5gpn.zhihu-cleaner')
  assert.equal(zhihu.version, '2.0.2')
  assert.deepEqual(
    [zhihu.capabilities.captureHostCount, zhihu.capabilities.actionCount, zhihu.capabilities.routingRuleCount],
    [5, 18, 5],
  )
  // The published projection is what the gateway checks its own Go compile
  // against, so a drift in either compiler has to be visible here.
  assert.deepEqual(zhihu.policy, {
    clientRules: 15,
    policyRules: 5,
    captureRules: 10,
    digest: 'e7d7baaa94c139160a879aad2cbbec2aabfdbc476972ba914cff84dc038030eb',
  })
  // All sixteen of zhihu's actions are declarative, so it names no script for
  // the gateway to fetch or pin.
  assert.deepEqual(zhihu.resources.map(resource => resource.path), [])
  assert.equal(validate(catalog), true, ajv.errorsText(validate.errors))
  const boundary = structuredClone(catalog)
  boundary.entries[0].capabilities.captureHostCount = 512
  assert.equal(validate(boundary), true, ajv.errorsText(validate.errors))
  boundary.entries[0].capabilities.captureHostCount = 513
  assert.equal(validate(boundary), false, 'schema accepted more than 512 capture hosts')
  const invalid = structuredClone(catalog)
  invalid.entries[0].manifest.sha256 = 'invalid'
  assert.equal(validate(invalid), false, 'schema accepted an invalid manifest digest')
}

{
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), '5gpn-marketplace-cli-'))
  const output = path.join(temporaryRoot, 'missing', 'parents', 'index.json')
  const script = path.join(repositoryRoot, 'scripts', 'generate-marketplace.mjs')
  try {
    await execFileAsync(process.execPath, [script, '--revision', revision, '--output', output], { cwd: repositoryRoot })
    const generated = await readFile(output, 'utf8')
    assert.equal(JSON.parse(generated).entries.length, 6, 'the index must describe every shipped extension')
    await execFileAsync(process.execPath, [script, '--revision', revision, '--check', output], { cwd: repositoryRoot })

    // --profile is gone with the split it selected. An unknown option is
    // refused rather than ignored, so a publish step still carrying the old
    // flag fails loudly instead of silently generating something else.
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v1', '--output', output], { cwd: repositoryRoot })
      assert.fail('the CLI accepted the removed --profile option')
    } catch (error) {
      assert.match(error.stderr, /unknown option --profile/)
    }

    const betaOutput = path.join(temporaryRoot, 'beta.json')
    await execFileAsync(process.execPath, [script, '--revision', revision, '--output', betaOutput], { cwd: repositoryRoot })
    const beta = await readFile(betaOutput, 'utf8')
    assert.match(beta, /"sha256": "[0-9a-f]{64}"/, 'the index must carry digests for this to test anything')
    await writeFile(betaOutput, beta.replace(/"sha256": "[0-9a-f]{64}"/, `"sha256": "${'0'.repeat(64)}"`))
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--check', betaOutput], { cwd: repositoryRoot })
      assert.fail('--check accepted a modified marketplace digest')
    } catch (error) {
      assert.match(error.stderr, /not the deterministic marketplace output/)
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

function metadata(entries = [{ directory: 'fixture-extension', licenseSpdx: 'MIT', tags: ['testing', 'fixture'] }]) {
  return {
    metadata: {
      id: 'io.5gpn.official',
      name: '5gpn Official Extensions',
      description: 'First-party reviewed native extensions for 5gpn.',
      homepage: 'https://github.com/moooyo/5gpn-extensions',
      repository: 'https://github.com/moooyo/5gpn-extensions',
    },
    entries,
  }
}

function manifest(source = './transform.js') {
  return `apiVersion: 5gpn.io/v1
kind: Extension
metadata:
  id: io.5gpn.fixture
  name: Fixture Extension
  version: 1.2.3
  description: Exercises deterministic marketplace generation.
permissions:
  persistentStorage: false
  network: true
requirements:
  egressGroup:
    required: true
traffic:
  captureHosts:
    - api.example.com
  upstreamMappings:
    - host: api.example.com
      target: origin.example.com
settings:
  - key: enabled
    type: boolean
    label: Enabled
    description: Enables the fixture.
    required: true
    default: true
actions:
  - id: transform-response
    phase: response
    match:
      hosts:
        - api.example.com
      schemes:
        - https
      pathRegex: '^/'
    script:
      source: ${source}
      bodyMode: text
      timeoutMs: 1000
      maxBodyBytes: 1024
`
}

function manifestWithCaptureHostCount(count) {
  assert(Number.isInteger(count) && count > 0)
  const hosts = ['api.example.com', ...Array.from({ length: count - 1 }, (_, index) => `h${index}.example.com`)]
  return manifest().replace(
    '  captureHosts:\n    - api.example.com',
    `  captureHosts:\n${hosts.map((host) => `    - ${host}`).join('\n')}`,
  )
}

async function fixtureRepository({ metadataDocument = metadata(), manifestBody = manifest() } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), '5gpn-marketplace-'))
  await mkdir(path.join(root, 'marketplace'), { recursive: true })
  await mkdir(path.join(root, 'LICENSES'), { recursive: true })
  await mkdir(path.join(root, 'fixture-extension'), { recursive: true })
  await writeFile(path.join(root, 'marketplace', 'metadata.json'), `${JSON.stringify(metadataDocument, null, 2)}\n`)
  await writeFile(path.join(root, 'LICENSES', 'MIT.txt'), 'fixture license\n')
  await writeFile(path.join(root, 'fixture-extension', 'extension.yaml'), manifestBody)
  await writeFile(path.join(root, 'fixture-extension', 'README.md'), '# Fixture\n')
  await writeFile(path.join(root, 'fixture-extension', 'transform.js'), 'function transform(context) { return context }\n')
  return root
}

async function expectFailure(options, pattern) {
  const root = await fixtureRepository(options)
  try {
    await assert.rejects(generateMarketplace({ root, revision }), pattern)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

{
  const manifestBody = manifest()
  const root = await fixtureRepository({ manifestBody })
  try {
    const first = await generateMarketplace({ root, revision })
    const second = await generateMarketplace({ root, revision })
    assert.equal(first, second)
    const catalog = JSON.parse(first)
    assert.equal(catalog.apiVersion, '5gpn.io/marketplace/v1')
    assert.equal(catalog.kind, 'ExtensionMarketplace')
    assert.equal(catalog.metadata.source.revision, revision)
    assert.deepEqual(catalog.entries[0].tags, ['fixture', 'testing'])
    assert.equal(catalog.entries[0].manifest.size, Buffer.byteLength(manifestBody))
    assert.equal(catalog.entries[0].manifest.sha256, createHash('sha256').update(manifestBody).digest('hex'))
    const script = await readFile(path.join(root, 'fixture-extension', 'transform.js'))
    assert.equal(catalog.entries[0].resources[0].size, script.length)
    assert.equal(catalog.entries[0].resources[0].sha256, createHash('sha256').update(script).digest('hex'))
    assert.deepEqual(catalog.entries[0].capabilities, {
      captureHostCount: 1,
      actionCount: 1,
      settingCount: 1,
      network: true,
      persistentStorage: false,
      upstreamMappingCount: 1,
      routingRuleCount: 0,
      egressGroupRequired: true,
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

await expectFailure({ metadataDocument: metadata([]) }, /counts differ/)
await expectFailure({ metadataDocument: metadata([
  { directory: 'fixture-extension', licenseSpdx: 'MIT', tags: ['fixture'] },
  { directory: 'fixture-extension', licenseSpdx: 'MIT', tags: ['testing'] },
]) }, /duplicate directory/)
await expectFailure({ manifestBody: manifest('./../escape.js') }, /escapes its extension directory/)
await expectFailure({ metadataDocument: metadata([{ directory: 'missing-extension', licenseSpdx: 'MIT', tags: ['fixture'] }]) }, /missing marketplace metadata/)
await expectFailure({ metadataDocument: { ...metadata(), metadata: { ...metadata().metadata, id: 'io.example.other' } } }, /id must be io\.5gpn\.official/)
await expectFailure({ manifestBody: manifestWithCaptureHostCount(513) }, /captureHosts must contain 1 to 512 entries/)

{
  const root = await fixtureRepository({ manifestBody: manifestWithCaptureHostCount(512) })
  try {
    const catalog = JSON.parse(await generateMarketplace({ root, revision }))
    assert.equal(catalog.entries[0].capabilities.captureHostCount, 512)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

{
  const root = await fixtureRepository()
  try {
    await assert.rejects(generateMarketplace({ root, revision: 'main' }), /revision must be a lowercase 40-character Git commit/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

console.log('Marketplace fixtures passed')
