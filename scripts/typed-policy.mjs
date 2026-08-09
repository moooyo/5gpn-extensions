// Fast, non-authoritative local lint for the manifest's declared traffic
// policy. It refuses rules the monolith's typed model cannot carry.
//
// The gateway used to turn these declarations into mihomo rule strings, so an
// unrepresentable rule was only discovered — silently — when a generation was
// compiled on a live gateway. A shadow comparison against real operator state
// found 21 of 323 reviewed rules being dropped that way, each one a deny or
// direct decision that had simply stopped being enforced with nothing reporting
// it.
//
// This module catches that class of mistake before the slower integration
// gate. The installer-pinned mihomo full-review corpus remains authoritative.
//
// It deliberately mirrors the Go compiler. Two implementations of the same
// mapping are a drift risk, so this result is never published on the wire.

const SELECTOR_DOMAIN = 'domain'
const SELECTOR_DOMAIN_SUFFIX = 'domain-suffix'
const SELECTOR_DOMAIN_KEYWORD = 'domain-keyword'
const SELECTOR_DOMAIN_WILDCARD = 'domain-wildcard'
const SELECTOR_IP_CIDR = 'ip-cidr'
const SELECTOR_ANY = 'any'

// The core's fixed limits. Exceeding one is a terminal error at commit, so it
// must be caught here rather than by a gateway rejecting a generation.
export const OVERLAY_LIMITS = {
  maxRuleKeywords: 16,
  maxClientRules: 4096,
  maxCapabilityDestinations: 4096,
}

/**
 * Compiles one declared routing rule.
 *
 * Returns the typed entry, or throws with the reason it cannot be represented.
 * A reviewed rule is a conjunction: at most one primary selector narrowed by
 * optional keyword, network and port constraints. Anything else would have to
 * be narrowed to fit, and narrowing changes what the operator approved.
 */
export function compileRoutingRule(rule, owner) {
  const out = {
    kind: null,
    value: '',
    action: rule.action === 'direct' ? 'direct' : 'reject',
    owner,
  }

  const primaries = []
  if (rule.domain !== undefined) primaries.push([SELECTOR_DOMAIN, rule.domain])
  if (rule.domainSuffix !== undefined) primaries.push([SELECTOR_DOMAIN_SUFFIX, rule.domainSuffix])
  if (rule.ipCIDR !== undefined) primaries.push([SELECTOR_IP_CIDR, rule.ipCIDR])
  if (primaries.length > 1) {
    throw new Error(
      `declares ${primaries.length} primary selectors (${primaries.map(([k]) => k).join(', ')}); ` +
        'the typed overlay carries one, and narrowing would change what was reviewed',
    )
  }

  const anyKeywords = [...(rule.domainKeywords ?? [])]
  const allKeywords = [...(rule.allDomainKeywords ?? [])]
  if (anyKeywords.length + allKeywords.length > OVERLAY_LIMITS.maxRuleKeywords) {
    throw new Error(
      `carries ${anyKeywords.length + allKeywords.length} keyword constraints, ` +
        `the core limit is ${OVERLAY_LIMITS.maxRuleKeywords}`,
    )
  }

  if (primaries.length === 1) {
    const [kind, value] = primaries[0]
    out.kind = kind
    out.value = value
    if (anyKeywords.length > 0) out.keywordsAny = anyKeywords
    if (allKeywords.length > 0) out.keywordsAll = allKeywords
  } else if (anyKeywords.length === 0 && allKeywords.length === 0) {
    throw new Error('has neither a primary selector nor a keyword, so it would match every connection')
  } else if (anyKeywords.length === 1 && allKeywords.length === 0) {
    // A lone any-of keyword reads more precisely as a keyword selector. Both
    // match identically; this form is what appears in readback and diagnostics.
    out.kind = SELECTOR_DOMAIN_KEYWORD
    out.value = anyKeywords[0]
  } else {
    out.kind = SELECTOR_ANY
    out.value = ''
    if (anyKeywords.length > 0) out.keywordsAny = anyKeywords
    if (allKeywords.length > 0) out.keywordsAll = allKeywords
  }

  if (rule.network !== undefined) out.network = rule.network
  if (rule.destinationPort !== undefined) {
    out.ports = [{ from: rule.destinationPort, to: rule.destinationPort }]
  }
  return out
}

/**
 * Compiles the capture hosts into typed capture rules.
 *
 * Mirrors the gateway's selector derivation, including the collapse of an apex
 * plus its wildcard into a single suffix — a host set that declares both means
 * "this domain and everything under it", and emitting two overlapping rules
 * would say the same thing twice with different match costs.
 */
export function compileCaptureRules(captureHosts, owner, processor = 'intercept') {
  // Sorted and de-duplicated because the gateway's normalizeHostList does the
  // same before deriving selectors. The order does not change what is matched —
  // every capture rule steers at the same processor — but it does change the
  // projection's byte encoding, so the two compilers have to agree on it or the
  // published digest can never be reproduced.
  const ordered = [...new Set(captureHosts)].sort()
  const hosts = new Set(ordered)
  const handled = new Set()
  const rules = []

  for (const host of ordered) {
    if (handled.has(host)) continue
    let kind = SELECTOR_DOMAIN
    let value = host
    let base = host
    if (host.startsWith('*.')) {
      base = host.slice(2)
      kind = SELECTOR_DOMAIN_WILDCARD
    }
    const wildcard = `*.${base}`
    if (hosts.has(base) && hosts.has(wildcard)) {
      kind = SELECTOR_DOMAIN_SUFFIX
      value = base
      handled.add(base)
      handled.add(wildcard)
    }
    if (kind !== SELECTOR_DOMAIN_SUFFIX) handled.add(host)

    for (const port of [80, 443]) {
      rules.push({
        kind,
        value,
        ports: [{ from: port, to: port }],
        action: 'capture',
        processor,
        owner,
      })
    }
  }
  return rules
}

/**
 * Compiles a whole manifest into its typed overlay projection.
 *
 * The client stage puts the extension's own deny/direct rules before its
 * capture rules. That order is the contract: reversing it would let a capture
 * rule shadow a deny the operator explicitly reviewed and approved.
 */
export function compileManifestPolicy(manifest) {
  const owner = manifest.metadata.id
  const traffic = manifest.traffic ?? {}
  const declared = traffic.routingRules ?? []

  const policy = []
  declared.forEach((rule, index) => {
    try {
      policy.push(compileRoutingRule(rule, owner))
    } catch (error) {
      throw new Error(`${owner}: routingRules[${index}] ${error.message}`)
    }
  })

  const capture = compileCaptureRules(traffic.captureHosts ?? [], owner)
  const rules = [...policy, ...capture]
  if (rules.length > OVERLAY_LIMITS.maxClientRules) {
    throw new Error(
      `${owner}: compiles to ${rules.length} client rules, the core limit is ${OVERLAY_LIMITS.maxClientRules}`,
    )
  }

  return {
    owner,
    policyRules: policy.length,
    captureRules: capture.length,
    rules,
  }
}
