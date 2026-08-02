// Extracts every action's jq expression to JSON for the sidecar's compile gate.
//
// The sidecar owns gojq and is the only place a publication gate can actually
// compile one of these -- but its module has a fixed dependency list that does
// not include yaml, so it cannot read these manifests. This bridges the two
// without adding a dependency to either.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseDocument } from 'yaml'

const root = path.resolve(import.meta.dirname, '..')
const output = process.argv[2]
if (!output) {
  console.error('usage: extract-jq.mjs <output.json>')
  process.exit(1)
}

const programs = []
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
  const manifestPath = path.join(root, entry.name, 'extension.yaml')
  let text
  try {
    text = await readFile(manifestPath, 'utf8')
  } catch {
    continue
  }
  const manifest = parseDocument(text, { strict: true }).toJS()
  for (const action of manifest?.actions ?? []) {
    const program = action?.script?.jq
    if (typeof program === 'string' && program.trim() !== '') {
      programs.push({ extension: manifest.metadata.id, action: action.id, program })
    }
  }
}
if (programs.length === 0) {
  console.error('no jq programs found; the compile gate would pass vacuously')
  process.exit(1)
}
await writeFile(output, JSON.stringify(programs, null, 1))
console.log(`extracted ${programs.length} jq programs to ${output}`)
