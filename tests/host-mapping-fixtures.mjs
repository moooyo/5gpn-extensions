import assert from 'node:assert/strict'
import {
  parseHostMappingServerDialAddresses,
  validHostMappingAddress,
} from '../scripts/host-mapping.mjs'

const refused = new Map([
  ['this-network', '0.1.2.3'],
  ['private-10', '10.1.2.3'],
  ['shared', '100.64.0.1'],
  ['loopback', '127.0.0.1'],
  ['link-local', '169.254.169.254'],
  ['private-172', '172.16.0.1'],
  ['protocol-assignment', '192.0.0.9'],
  ['documentation-one', '192.0.2.1'],
  ['6to4-relay', '192.88.99.1'],
  ['private-192', '192.168.1.1'],
  ['benchmark', '198.18.0.1'],
  ['documentation-two', '198.51.100.1'],
  ['documentation-three', '203.0.113.1'],
  ['multicast', '233.252.0.1'],
  ['reserved', '240.0.0.1'],
  ['limited-broadcast', '255.255.255.255'],
])

for (const [name, address] of refused) {
  assert.equal(validHostMappingAddress(address), false, `${name} address was accepted`)
  assert.equal(
    parseHostMappingServerDialAddresses(address),
    null,
    `${name} resolver address was accepted`,
  )
  assert.equal(
    parseHostMappingServerDialAddresses(`https://resolver.example/dns-query@${address}:443`),
    null,
    `${name} pinned resolver address was accepted`,
  )
}

for (const address of ['1.1.1.1', '8.8.8.8', '9.9.9.9', '192.0.1.1', '198.20.0.1']) {
  assert.equal(validHostMappingAddress(address), true, `${address} was not accepted as ordinary public IPv4`)
}

assert.deepEqual(
  parseHostMappingServerDialAddresses('8.8.8.8, , 1.1.1.1:53,,https://resolver.example/dns-query@9.9.9.9:443'),
  ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
  'empty fields and parsed dial addresses must describe the same three counted specs',
)
assert.deepEqual(
  parseHostMappingServerDialAddresses('1.1.1.1,8.8.8.8,9.9.9.9,198.20.0.1'),
  ['1.1.1.1', '8.8.8.8', '9.9.9.9', '198.20.0.1'],
  'four public resolver specs must be accepted',
)
assert.equal(
  parseHostMappingServerDialAddresses('1.1.1.1,8.8.8.8,9.9.9.9,198.20.0.1,192.0.1.1'),
  null,
  'five retained resolver specs must be refused',
)
assert.equal(parseHostMappingServerDialAddresses(',,,'), null, 'an empty resolver list was accepted')
assert.equal(
  parseHostMappingServerDialAddresses('https://resolver.example/dns-query'),
  null,
  'an unpinned resolver URL was accepted',
)
assert.equal(
  parseHostMappingServerDialAddresses('8.8.8.8,https://resolver.example/dns-query@192.0.2.1'),
  null,
  'one unsafe spec must reject the complete resolver target',
)
assert.equal(validHostMappingAddress('008.008.008.008'), false, 'legacy octal IPv4 spelling was accepted')

console.log('Host mapping fixtures passed')
