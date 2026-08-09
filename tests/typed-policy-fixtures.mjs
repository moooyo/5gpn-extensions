import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYAML } from 'yaml'
import { compileManifestPolicy, compileRoutingRule, OVERLAY_LIMITS } from '../scripts/typed-policy.mjs'
import { validateRoutingRules } from '../scripts/generate-marketplace.mjs'

// Every declared rule must pass the repository-local typed-policy lint.
//
// This is a fast feedback layer, not a published projection or runtime
// authority. The installer-pinned mihomo full-review corpus below CI is the
// gate that compiles the complete manifest with the implementation operators
// actually receive.

let failures = 0
const check = (name, fn) => {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    failures += 1
    console.error(`not ok - ${name}\n    ${error.message}`)
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

// Parsed with the same library validate.mjs uses, so this gate and the schema
// validator can never disagree about what a manifest says.
const loadManifest = (dir) => parseYAML(readFileSync(join(dir, 'extension.yaml'), 'utf8'))

const extensionDirs = readdirSync('.', { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .filter((name) => {
    try {
      return statSync(join(name, 'extension.yaml')).isFile()
    } catch {
      return false
    }
  })
  .sort()

// --- unit coverage of the mapping -------------------------------------------

check('a suffix narrowed by keywords compiles, rather than being dropped', () => {
  const rule = compileRoutingRule(
    { action: 'direct', domainSuffix: 'capcutapi.com', allDomainKeywords: ['tnc'] },
    'io.5gpn.test',
  )
  assert(rule.kind === 'domain-suffix', `kind = ${rule.kind}`)
  assert(rule.value === 'capcutapi.com', `value = ${rule.value}`)
  assert(rule.keywordsAll?.length === 1, 'the keyword constraint was lost')
  assert(rule.action === 'direct', `action = ${rule.action}`)
})

check('an any-of keyword set stays any-of', () => {
  const rule = compileRoutingRule(
    { action: 'reject', domainSuffix: 'chat.bilibili.com', domainKeywords: ['p2p', 'stun', 'tracker'] },
    'io.5gpn.test',
  )
  assert(rule.keywordsAny?.length === 3, 'the any-of set was lost')
  assert(rule.keywordsAll === undefined, 'an any-of set became all-of, which widens the rule')
})

check('an all-of keyword set stays all-of', () => {
  // Conflating the two would widen the rule, and for a direct action a wider
  // rule means more traffic escaping interception.
  const rule = compileRoutingRule({ action: 'reject', allDomainKeywords: ['alisg', 'tnc'] }, 'io.5gpn.test')
  assert(rule.kind === 'any', `kind = ${rule.kind}`)
  assert(rule.keywordsAll?.length === 2, 'the all-of set was lost')
  assert(rule.keywordsAny === undefined, 'an all-of set became any-of')
})

check('a lone keyword reads as a keyword selector', () => {
  const rule = compileRoutingRule({ action: 'reject', domainKeywords: ['tnc'] }, 'io.5gpn.test')
  assert(rule.kind === 'domain-keyword' && rule.value === 'tnc', `got ${rule.kind}/${rule.value}`)
})

check('network and port constraints survive', () => {
  const rule = compileRoutingRule(
    { action: 'reject', domainSuffix: 'b.test', network: 'udp', destinationPort: 443 },
    'io.5gpn.test',
  )
  assert(rule.network === 'udp', `network = ${rule.network}`)
  assert(rule.ports?.[0]?.from === 443, 'the port constraint was lost')
})

check('two primary selectors are refused rather than narrowed', () => {
  let threw = false
  try {
    compileRoutingRule({ action: 'reject', domain: 'a.test', domainSuffix: 'b.test' }, 'io.5gpn.test')
  } catch {
    threw = true
  }
  assert(threw, 'a rule with two primary selectors compiled')
})

check('a rule with no constraint at all is refused', () => {
  let threw = false
  try {
    compileRoutingRule({ action: 'reject' }, 'io.5gpn.test')
  } catch {
    threw = true
  }
  assert(threw, 'an unconstrained rule compiled; it would match every connection')
})

check('the keyword limit is the core limit', () => {
  let threw = false
  try {
    compileRoutingRule(
      {
        action: 'reject',
        domainSuffix: 'a.test',
        domainKeywords: Array.from({ length: OVERLAY_LIMITS.maxRuleKeywords + 1 }, (_, i) => `k${i}`),
      },
      'io.5gpn.test',
    )
  } catch {
    threw = true
  }
  assert(threw, 'a rule exceeding the core keyword limit compiled')
})

check('an apex plus its wildcard collapses to one suffix rule', () => {
  const rules = compileCaptureRulesFor(['example.test', '*.example.test'])
  const kinds = new Set(rules.map((r) => r.kind))
  assert(kinds.size === 1 && kinds.has('domain-suffix'), `kinds = ${[...kinds].join(',')}`)
  // Two ports, one selector.
  assert(rules.length === 2, `got ${rules.length} rules, want 2`)
})

check('a bare host stays an exact match', () => {
  const rules = compileCaptureRulesFor(['gs-loc.apple.com'])
  assert(rules.every((r) => r.kind === 'domain'), 'a bare host was widened')
  assert(rules.length === 2, `got ${rules.length} rules, want 2 (ports 80 and 443)`)
})

function compileCaptureRulesFor(hosts) {
  const projection = compileManifestPolicy({
    metadata: { id: 'io.5gpn.test' },
    traffic: { captureHosts: hosts, routingRules: [] },
  })
  return projection.rules.filter((r) => r.action === 'capture')
}

// A canonical CIDR keeps the reviewed text identical to the normalized rule
// the runtime displays and enforces.
check('a non-canonical CIDR is refused', () => {
  const cases = {
    'host bits set': '203.0.113.5/24',
    'leading zero octet': '010.0.0.0/8',
    // The data plane is IPv4-only at both resolver boundaries, and canonical
    // IPv6 text is RFC 5952 rather than something a validator should guess at.
    'IPv6': '2001:db8::/32',
    'IPv6 uppercase': '2001:DB8::/32',
  }
  for (const [name, cidr] of Object.entries(cases)) {
    let refused = false
    try {
      validateRoutingRules([{ action: 'reject', ipCIDR: cidr }], 'fixture')
    } catch {
      refused = true
    }
    assert(refused, `${name} (${cidr}) was accepted`)
  }
  // The canonical spelling still works, or this test would prove nothing.
  validateRoutingRules([{ action: 'reject', ipCIDR: '203.0.113.0/24' }], 'fixture')
})

// --- every shipped manifest -------------------------------------------------

check('every shipped extension compiles to the typed overlay', () => {
  assert(extensionDirs.length > 0, 'no extension directories were found')
  const report = []
  for (const dir of extensionDirs) {
    const manifest = loadManifest(dir)
    const projection = compileManifestPolicy(manifest)
    report.push(`    ${projection.owner}: ${projection.policyRules} policy + ${projection.captureRules} capture = ${projection.rules.length} rules`)
  }
  console.log(report.join('\n'))
})

if (failures > 0) {
  console.error(`\n${failures} typed-policy check(s) failed`)
  process.exit(1)
}
console.log('\ntyped-policy: all checks passed')
