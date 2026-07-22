// GPL-3.0-only deterministic post-processing for protobuf-ts output.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'generated')

function processDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      processDirectory(target)
    } else if (entry.isFile() && target.endsWith('.ts')) {
      const source = fs.readFileSync(target, 'utf8')
      const output = source.replace(
        /^(export\s+const\s+\w+\s*=\s*)(new.*;)$/gm,
        '$1/* @__PURE__ */ $2',
      )
      fs.writeFileSync(target, output, 'utf8')
    }
  }
}

processDirectory(root)
