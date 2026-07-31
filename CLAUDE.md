# CLAUDE.md

Follow [`AGENTS.md`](AGENTS.md) for repository rules.

## Debugging an extension that looks inert

If an extension is enabled and its rules are present, but nothing is actually
blocked, check whether the target app resolved around the interception with
HTTPDNS before concluding the rules are wrong.

5gpn steers at the DNS layer: a capture host only reaches the sidecar because
`5gpn-dns` answered with the gateway address. An app carrying an HTTPDNS SDK
asks its vendor's resolver over HTTPS instead, gets the real address, and
connects directly — capture and every routing rule are skipped, and the gateway
logs nothing at all. Silence in the mihomo log is the symptom, and it reads
exactly like "the app made no request".

Confirm from the gateway:

- `GET /api/resolve-test?domain=<host>` reports the verdict and, for a captured
  name, the owning extension.
- A captured connection appears in the mihomo log as
  `--> <host> match RuntimeOverlayClient(5gpn) using <outbound>`.

If the vendor's HTTPDNS endpoint shows traffic but the target host never does,
the app is bypassing.

Note the cost before blocking one: blocking an HTTPDNS endpoint does not fail
fast. The app spends its own timeout on the rejected call before falling back
to the system resolver, which lands ahead of any request the page needs. A
measured JD case cost 0.9–2.3 s of dead time per cold start.

Blocking is also cheaper one layer up. An operator `block` rule in
`policy.json` answers NXDOMAIN in a single round trip, whereas a capture host
costs DNS plus a TCP connect plus a TLS ClientHello before the reject lands.
The capture overlay is evaluated ahead of the operator rule list, so declaring
a capture host that the operator already blocks makes the same block slower,
not stronger.
