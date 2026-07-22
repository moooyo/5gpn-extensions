// GPL-3.0-only deterministic build for the native 5gpn Protobuf transformer.

import crypto from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const directory = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(directory, '..', 'protobuf.js')

const result = await build({
  absWorkingDir: directory,
  entryPoints: ['native-protobuf.ts'],
  outfile: output,
  bundle: true,
  charset: 'utf8',
  format: 'iife',
  legalComments: 'eof',
  metafile: true,
  minify: false,
  platform: 'browser',
  sourcemap: false,
  target: ['es2020'],
  treeShaking: true,
  banner: {
    js: '// SPDX-License-Identifier: GPL-3.0-only\n// Deterministic native build from bilibili-cleaner/source.',
  },
})

const outputMetadata = Object.values(result.metafile.outputs)[0]
const inputs = Object.entries(outputMetadata.inputs)
  .map(([input, metadata]) => ({ path: input.replaceAll('\\', '/'), bytesInOutput: metadata.bytesInOutput }))
  .sort((left, right) => left.path.localeCompare(right.path))
await writeFile(path.join(directory, 'bundle-inputs.json'), `${JSON.stringify(inputs, null, 2)}\n`, 'utf8')

const bytes = await readFile(output)
console.log(`${path.basename(output)} ${bytes.length} bytes sha256=${crypto.createHash('sha256').update(bytes).digest('hex')}`)
