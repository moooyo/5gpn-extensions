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
  const catalog = JSON.parse(await generateMarketplace({ revision }))
  assert.equal(catalog.metadata.id, 'io.5gpn.official')
  assert.equal(catalog.entries.length, 6)
  assert.equal(validate(catalog), true, ajv.errorsText(validate.errors))
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
    assert.equal(JSON.parse(generated).entries.length, 6)
    await execFileAsync(process.execPath, [script, '--revision', revision, '--check', output], { cwd: repositoryRoot })
    await writeFile(output, generated.replace(/"sha256": "[0-9a-f]{64}"/, `"sha256": "${'0'.repeat(64)}"`))
    try {
      await execFileAsync(process.execPath, [script, '--revision', revision, '--check', output], { cwd: repositoryRoot })
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

{
  const root = await fixtureRepository()
  try {
    await assert.rejects(generateMarketplace({ root, revision: 'main' }), /revision must be a lowercase 40-character Git commit/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

console.log('Marketplace fixtures passed')
