// This is the publisher-side copy of the gateway's IPv4 address-scope
// boundary. Keep it in lockstep with 5gpn/netguard.IsPubliclyRoutable: a
// reviewed host mapping must not acquire more reach when the gateway imports
// it.
//
// Audited against the IANA IPv4 Special-Purpose Address Registry on
// 2026-08-09. The whole 192.0.0.0/24 protocol-assignment block remains
// intentionally unavailable, including its globally reachable exceptions,
// because those are not ordinary extension or resolver destinations.
export function validHostMappingAddress(value) {
  const octets = parseCanonicalIPv4(value)
  if (octets === null) return false

  const [a, b, c] = octets
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 0 && c === 0) return false
  if (a === 192 && b === 0 && c === 2) return false
  if (a === 192 && b === 88 && c === 99) return false
  if (a === 192 && b === 168) return false
  if (a === 198 && (b === 18 || b === 19)) return false
  if (a === 198 && b === 51 && c === 100) return false
  if (a === 203 && b === 0 && c === 113) return false
  if (a >= 224) return false
  return true
}

function parseCanonicalIPv4(value) {
  if (typeof value !== 'string') return null
  const octets = value.split('.')
  if (octets.length !== 4) return null

  const parsed = []
  for (const octet of octets) {
    // netip.ParseAddr rejects ambiguous legacy octal spellings.
    if (!/^(0|[1-9]\d*)$/.test(octet)) return null
    const number = Number(octet)
    if (number > 255) return null
    parsed.push(number)
  }
  return parsed
}

// parseHostMappingServerDialAddresses mirrors the gateway's resolver-form
// parser. Empty comma fields are ignored before the four-server limit is
// applied. Every retained spec is then reduced to the address it really dials:
// a URL form must carry an @-pinned address, while an address form may include
// a port. The returned array therefore has exactly one entry per counted and
// validated server spec.
export function parseHostMappingServerDialAddresses(rest) {
  if (typeof rest !== 'string') return null
  const specs = rest.split(',').map((spec) => spec.trim()).filter(Boolean)
  if (specs.length === 0 || specs.length > 4) return null

  const addresses = []
  for (const spec of specs) {
    let dial = spec
    const at = spec.lastIndexOf('@')
    if (at > 0) {
      dial = spec.slice(at + 1)
    } else if (spec.includes('://')) {
      // Resolving an unpinned URL here would make this resolver depend on
      // itself and would move the scope check away from the actual dial.
      return null
    }
    if (dial === '') return null
    dial = splitHostPort(dial)
    if (!validHostMappingAddress(dial)) return null
    addresses.push(dial)
  }
  return addresses
}

function splitHostPort(value) {
  const bracketed = /^\[([^\]]+)\]:[^:]*$/.exec(value)
  if (bracketed !== null) return bracketed[1]

  const colon = value.indexOf(':')
  if (colon !== -1 && colon === value.lastIndexOf(':')) return value.slice(0, colon)
  return value
}
