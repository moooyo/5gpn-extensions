import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const sourceRoot = path.dirname(fileURLToPath(import.meta.url))
const extensionRoot = path.resolve(sourceRoot, '..')
const outputPath = path.join(extensionRoot, 'weather.js')
const checkOnly = process.argv.includes('--check')

const artifacts = [
  {
    name: 'proto.bundle.js',
    path: 'proto.bundle.js',
    url: 'https://raw.githubusercontent.com/NSRingo/WeatherKit/ecebd32432161571a39f2579ad3ab758f62e80de/src/output/proto.bundle.js',
    bytes: 79169,
    sha256: 'cfaac94a89d3b7b17e71e89ba3791e6149fa7e9beadf3b1bbe0b2a0b8b2f9818',
  },
  {
    name: 'AirQuality.mjs',
    path: 'class/AirQuality.mjs',
    url: 'https://raw.githubusercontent.com/NSRingo/WeatherKit/969c7c4e9725c81063384013a0e9e40355425361/src/class/AirQuality.mjs',
    bytes: 107716,
    sha256: 'd612c7154290982900fbf525dea81f4888c3f823ded723c115255095a394e46a',
  },
  {
    name: 'SimplePrecisionMath.mjs',
    path: 'class/SimplePrecisionMath.mjs',
    url: 'https://raw.githubusercontent.com/NSRingo/WeatherKit/969c7c4e9725c81063384013a0e9e40355425361/src/class/SimplePrecisionMath.mjs',
    bytes: 2687,
    sha256: '5a95761beaa6423f0925ad67d2dba9e5eb08ee03564f739b323686d22478284e',
  },
  {
    name: 'WeatherKit2.mjs',
    path: 'class/WeatherKit2.mjs',
    url: 'https://raw.githubusercontent.com/NSRingo/WeatherKit/969c7c4e9725c81063384013a0e9e40355425361/src/class/WeatherKit2.mjs',
    bytes: 81047,
    sha256: '5e38900a0c854cafcc2471e93379e9a527508fcc417ded864a4e068d53a209e9',
  },
  {
    name: 'flatBufferRootOverlay.mjs',
    path: 'function/flatBufferRootOverlay.mjs',
    url: 'https://raw.githubusercontent.com/NSRingo/WeatherKit/969c7c4e9725c81063384013a0e9e40355425361/src/function/flatBufferRootOverlay.mjs',
    bytes: 5804,
    sha256: 'bd4b99d5b39e9ed36da773c27aaff00d438346bc848cc986f4bc5eff4b68f8ac',
  },
]

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

function replaceOnce(source, expected, replacement, label) {
  const first = source.indexOf(expected)
  if (first < 0 || source.indexOf(expected, first + expected.length) >= 0) {
    throw new Error(`${label} import boundary changed`)
  }
  return source.slice(0, first) + replacement + source.slice(first + expected.length)
}

async function fetchArtifact(artifact) {
  const response = await fetch(artifact.url, { redirect: 'error' })
  if (!response.ok) throw new Error(`${artifact.name} returned HTTP ${response.status}`)
  const body = Buffer.from(await response.arrayBuffer())
  if (body.length !== artifact.bytes || digest(body) !== artifact.sha256) {
    throw new Error(`${artifact.name} failed its immutable size or SHA-256 check`)
  }
  return body
}

async function main() {
  const normalizedRspackNotice = (await readFile(path.join(sourceRoot, 'licenses', 'rspack-MIT.txt'), 'utf8')).replace(/\r\n/g, '\n')
  const rspackNoticeBytes = Buffer.from(normalizedRspackNotice)
  if (rspackNoticeBytes.length !== 1098 || digest(rspackNoticeBytes) !== '028c1a9c1fba0083da4728762412b7a41e100a0fad6ff94c895aa3ede94f2c63') {
    throw new Error('Rspack MIT notice failed its immutable size or SHA-256 check')
  }
  const rspackNotice = normalizedRspackNotice.trimEnd()
  const normalizedEsbuildNotice = (await readFile(path.join(sourceRoot, 'licenses', 'esbuild-MIT.txt'), 'utf8')).replace(/\r\n/g, '\n')
  const esbuildNoticeBytes = Buffer.from(normalizedEsbuildNotice)
  if (esbuildNoticeBytes.length !== 1069 || digest(esbuildNoticeBytes) !== 'b40ec5baec7bb34fa5b1c09521fa3cd52d5fad7adafed74932a2010d3612a681') {
    throw new Error('esbuild MIT notice failed its immutable size or SHA-256 check')
  }
  const esbuildNotice = normalizedEsbuildNotice.trimEnd()
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'weatherkit-native-build-'))
  const temporarySource = path.join(temporaryRoot, 'src')
  try {
    await mkdir(path.join(temporarySource, 'class'), { recursive: true })
    await mkdir(path.join(temporarySource, 'function'), { recursive: true })

    for (const artifact of artifacts) {
      let body = await fetchArtifact(artifact)
      if (artifact.name === 'AirQuality.mjs') {
        const source = body.toString('utf8')
        body = Buffer.from(replaceOnce(source, 'import { Console } from "@nsnanocat/util";', 'import { Console } from "../native-runtime.mjs";', artifact.name))
      } else if (artifact.name === 'WeatherKit2.mjs') {
        let source = body.toString('utf8')
        source = replaceOnce(source, 'import { Console } from "@nsnanocat/util";', 'import { Console } from "../native-runtime.mjs";', artifact.name)
        source = replaceOnce(source, 'import * as WK2 from "@nsringo/weatherkit";', 'import * as WK2 from "../proto.bundle.js";', artifact.name)
        body = Buffer.from(source)
      }
      const destination = path.join(temporarySource, ...artifact.path.split('/'))
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, body)
    }

    for (const filename of ['native-aq-entry.mjs', 'native-platform.mjs', 'native-runtime.mjs']) {
      await writeFile(path.join(temporarySource, filename), await readFile(path.join(sourceRoot, filename)))
    }

    const result = await build({
      absWorkingDir: temporaryRoot,
      bundle: true,
      charset: 'ascii',
      entryPoints: [path.join(temporarySource, 'native-aq-entry.mjs')],
      format: 'iife',
      inject: [path.join(temporarySource, 'native-platform.mjs')],
      legalComments: 'none',
      mainFields: ['module', 'main'],
      metafile: true,
      minify: true,
      nodePaths: [path.join(sourceRoot, 'node_modules')],
      platform: 'neutral',
      target: ['es2020'],
      write: false,
      banner: {
        js: `/*!
 * SPDX-License-Identifier: Apache-2.0 AND MIT
 * Modified 5gpn native port of NSRingo/WeatherKit.
 * Upstream AirQuality author metadata: Virgil Clyne & Wordless Echo.
 * Upstream source comments also state: Code by Claude.
 * Includes Apache-2.0 NSRingo schema object code and FlatBuffers 24.12.23 runtime code.
 * Includes this Rspack 1.7.7 bootstrap notice:
 *
${rspackNotice.split('\n').map(line => line === '' ? ' *' : ` * ${line}`).join('\n')}
 *
 * Includes this esbuild 0.25.8 emitted-helper notice:
 *
${esbuildNotice.split('\n').map(line => line === '' ? ' *' : ` * ${line}`).join('\n')}
 */`,
      },
      footer: {
        js: ';globalThis.transform=((implementation)=>function transform(context){return implementation(context)})(globalThis.transform);',
      },
    })

    const output = Buffer.from(result.outputFiles[0].contents)
    if (output.length > 1048576) throw new Error(`weather.js exceeds 1 MiB: ${output.length} bytes`)
    const text = output.toString('utf8')
    const forbidden = [
      [/\$(?:request|response|done|task|httpClient|prefs|argument)\b/, 'proxy-client compatibility global'],
      [/\brequire\s*\(/, 'module loader'],
      [/\bfetch\s*\(/, 'ambient fetch'],
      [/\bprocess\./, 'process access'],
      [/\bset(?:Timeout|Interval)\s*\(/, 'timer API'],
      [/\basync\b|\bawait\b|\bPromise\b/, 'asynchronous runtime'],
    ]
    for (const [pattern, label] of forbidden) {
      if (pattern.test(text)) throw new Error(`weather.js contains forbidden ${label}`)
    }
    if (!/function\s+transform\s*\(\s*context\s*\)/.test(text)) {
      throw new Error('weather.js has no named transform(context) entrypoint')
    }

    if (checkOnly) {
      const existing = await readFile(outputPath)
      if (!existing.equals(output)) throw new Error('weather.js is not reproducible; run npm run build in weatherkit/source')
    } else {
      await writeFile(outputPath, output)
    }
    console.log(`${checkOnly ? 'Verified' : 'Built'} weather.js: ${output.length} bytes, SHA-256 ${digest(output)}`)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

await main()
