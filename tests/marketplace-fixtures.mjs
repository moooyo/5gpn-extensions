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
  const schema = JSON.parse(await readFile(path.resolve(import.meta.dirname, '..', 'marketplace', 'schema-v1.json'), 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  const stableBody = await generateMarketplace({ revision, profile: 'v1' })
  const betaBody = await generateMarketplace({ revision, profile: 'v1beta' })
  const stable = JSON.parse(stableBody)
  const catalog = JSON.parse(betaBody)

  // The stable core parses the index with DisallowUnknownFields, so `policy`
  // reaching the v1 document costs every gateway that has not learned the field
  // its whole extension catalogue. Assert its absence directly rather than
  // trusting the profile plumbing to keep being right.
  for (const entry of stable.entries) {
    assert.equal(
      Object.hasOwn(entry, 'policy'),
      false,
      `${entry.id}: the v1 profile published a policy projection the stable core would refuse`,
    )
  }
  for (const entry of catalog.entries) {
    assert.equal(
      Object.hasOwn(entry, 'policy'),
      true,
      `${entry.id}: the v1beta profile dropped the policy projection`,
    )
  }

  // The two profiles are one document differing by the fields v1 has not
  // learned, plus the entries v1 cannot describe at all. Stripping the first
  // and removing the second has to reproduce v1 exactly — otherwise the split
  // has quietly become a second way of describing the catalogue, and the v1
  // readers would be the last to find out.
  const stableIDs = new Set(stable.entries.map((entry) => entry.id))
  const strippedBeta = structuredClone(catalog)
  strippedBeta.entries = strippedBeta.entries.filter((entry) => stableIDs.has(entry.id))
  for (const entry of strippedBeta.entries) {
    delete entry.policy
    delete entry.capabilities.networkAny
  }
  assert.deepEqual(
    strippedBeta,
    stable,
    'the profiles differ by more than the beta-only projections and omitted entries',
  )

  // Every extension now uses a field the frozen v1 contract does not cover, so
  // v1 is empty. That is the honest answer for a v1-era core rather than a
  // failure: it can run none of them. The assertion is that the omission set is
  // exactly the catalogue, so an entry disappearing for any other reason still
  // shows up as a difference.
  const omitted = catalog.entries.filter((entry) => !stableIDs.has(entry.id)).map((entry) => entry.id)
  assert.deepEqual(
    omitted,
    catalog.entries.map((entry) => entry.id),
    'unexpected entries are missing from the v1 profile',
  )

  // v1 is frozen at what the stable core accepts, and it parses the index with
  // DisallowUnknownFields: an unknown field costs that core its whole catalogue.
  for (const entry of stable.entries) {
    assert.equal(
      Object.hasOwn(entry.capabilities, 'networkAny'),
      false,
      `${entry.id}: the v1 profile published a capability field the stable core would refuse`,
    )
  }

  assert.equal(catalog.metadata.id, 'io.5gpn.official')
  assert.equal(catalog.entries.length, 8)
  const adPlatform = catalog.entries.find(entry => entry.id === 'io.5gpn.ad-platform-blocker')
  assert.deepEqual(
    [adPlatform.capabilities.captureHostCount, adPlatform.capabilities.actionCount, adPlatform.capabilities.routingRuleCount],
    [277, 3, 201],
  )
  // The published projection is what the gateway checks its own Go compile
  // against, so a drift in either compiler has to be visible here.
  assert.deepEqual(adPlatform.policy, {
    clientRules: 553,
    policyRules: 201,
    captureRules: 352,
    digest: 'a65ccac63b95fd5b8395770118ca3941dffbc17105c4ac7ec56deb996bb0a936',
  })
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
    actionCount: 2,
    settingCount: 9,
    networkOrigins: [],
    networkAny: true,
    persistentStorage: true,
    upstreamMappingCount: 0,
    routingRuleCount: 4,
    egressGroupRequired: false,
  })
  // The core derives this list from every action that names a script source and
  // refuses an install whose entry does not match, so the remote bundle is listed
  // with the digest the gateway will compute for itself.
  assert.deepEqual(weatherkit.resources, [{
    path: 'NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js',
    url: 'https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js',
    sha256: '4d368808a17c42eef18135f04d1bc9f01cbf7878d227006521ef0a6598941ff2',
    size: 251617,
  }])
  const zhihu = catalog.entries.find(entry => entry.id === 'io.5gpn.zhihu-cleaner')
  assert.equal(zhihu.version, '2.0.0')
  assert.deepEqual(
    [zhihu.capabilities.captureHostCount, zhihu.capabilities.actionCount, zhihu.capabilities.routingRuleCount],
    [5, 18, 5],
  )
  // All sixteen of zhihu's actions are declarative, so it names no script for
  // the gateway to fetch or pin.
  assert.deepEqual(zhihu.resources.map(resource => resource.path), [])
  assert.equal(validate(catalog), true, ajv.errorsText(validate.errors))
  assert.equal(validate(stable), true, ajv.errorsText(validate.errors))
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
    await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v1', '--output', output], { cwd: repositoryRoot })
    const generated = await readFile(output, 'utf8')
    assert.equal(JSON.parse(generated).entries.length, 0, "the v1 profile omits entries needing a newer contract")
    await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v1', '--check', output], { cwd: repositoryRoot })

    // --check is profile-aware: the same path checked against the other profile
    // has to fail, or a mislabelled publish step would verify itself green.
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v1beta', '--check', output], { cwd: repositoryRoot })
      assert.fail('--check accepted a v1 document as v1beta output')
    } catch (error) {
      assert.match(error.stderr, /not the deterministic v1beta marketplace output/)
    }

    // The profile is required rather than defaulted, because the default would
    // decide what gets served to every deployed gateway.
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--output', output], { cwd: repositoryRoot })
      assert.fail('the CLI generated an index without being told which profile')
    } catch (error) {
      assert.match(error.stderr, /--profile is required/)
    }
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v2', '--output', output], { cwd: repositoryRoot })
      assert.fail('the CLI accepted an unknown profile')
    } catch (error) {
      assert.match(error.stderr, /profile must be one of v1, v1beta/)
    }

    // The tamper check runs against v1beta: v1 is empty now, so it carries no
    // digest to modify, and a test that mutates nothing would pass for the
    // wrong reason.
    const betaOutput = path.join(temporaryRoot, 'beta.json')
    await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v1beta', '--output', betaOutput], { cwd: repositoryRoot })
    const beta = await readFile(betaOutput, 'utf8')
    assert.match(beta, /"sha256": "[0-9a-f]{64}"/, 'the v1beta index must carry digests for this to test anything')
    await writeFile(betaOutput, beta.replace(/"sha256": "[0-9a-f]{64}"/, `"sha256": "${'0'.repeat(64)}"`))
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--profile', 'v1beta', '--check', betaOutput], { cwd: repositoryRoot })
      assert.fail('--check accepted a modified marketplace digest')
    } catch (error) {
      assert.match(error.stderr, /not the deterministic v1beta marketplace output/)
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
  network:
    origins:
      - https://api.example.com
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
    // Determinism is the property `--check` rests on, and it has to hold for
    // the profile that publishes the digest as much as for the one that does not.
    assert.equal(
      await generateMarketplace({ root, revision, profile: 'v1beta' }),
      await generateMarketplace({ root, revision, profile: 'v1beta' }),
    )
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
      networkOrigins: ['https://api.example.com'],
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
