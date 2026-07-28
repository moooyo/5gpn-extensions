# Bilibili Cleaner

License: [`GPL-3.0-only`](../LICENSES/GPL-3.0-only.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of the
GPL-licensed `kokoryh/Sparkle` Bilibili Loon plugin. It is not compiled into
either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml
```

The extension captures six exact Bilibili hosts, projects the pinned five
reject rules through the reviewed routing-rule contract, and requires an
operator-selected mihomo egress group for the upstream `bsbsb.top,PROXY`
requirement. It exposes the five settings declared by the pinned Loon plugin,
requests no persistent storage, and asks for three exact network origins for
the SponsorBlock and request-optimization helpers.

## What changed, and why

Earlier revisions hand-ported this module: a generated protobuf runtime, a
vendored dependency set, a deterministic esbuild pipeline, and roughly a hundred
pinned build artifacts, all so that a GPL bundle could be redistributed with its
corresponding preferred source. Every upstream revision meant re-deriving that
tree.

The runtime now hosts the contract these scripts are written against, and it
runs jq, so this extension carries the upstream module rather than a
reimplementation of it. Five actions load the pinned scripts; eleven carry the
pinned rewrite expressions verbatim; five keep local synthetic responses,
because a `mock-response-body` directive has no script and no input document to
transform.

Nothing GPL is redistributed any more. The scripts are fetched by the gateway
from immutable raw URLs and pinned by digest, so this repository references them
instead of shipping their bytes, and the corresponding-source obligation that
required the build tree no longer applies. `bilibili-cleaner/source/` is gone.

## Pinned upstream artifacts

Reviewed at commit
[`12e89d6d93d72d39eb283ef81d2b58eb204cdb58`](https://github.com/kokoryh/Sparkle/tree/12e89d6d93d72d39eb283ef81d2b58eb204cdb58).
The published module points its `script-path` and `jq-path` values at the
mutable `master` branch; every entry below is re-pinned to that immutable
commit, and `npm run verify:upstreams` re-downloads and enforces each digest.

| Artifact | Immutable raw URL | Size | SHA-256 |
| --- | --- | ---: | --- |
| Sparkle GPL license | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/LICENSE` | 35,148 bytes | `8b1ba204bb69a0ade2bfcf65ef294a920f6bb361b317dba43c7ef29d96332b9b` |
| Loon plugin (rule and directive source) | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/release/loon/plugin/bilibili.lpx` | 6,966 bytes | `07f9c95c3e1fd511b50c0fab790a023415945ca322fb66927266c60f666ea1c6` |
| Protobuf request transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.protobuf.request.js` | 62,893 bytes | `3902dc936736125d18d3c3da1d5564832d5fe80bb4d2df041f51cf16d80c3da1` |
| Protobuf response transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.protobuf.response.js` | 94,862 bytes | `e5989151c9e0a51a835a651543e903af287604a11d70368e043f3528939092ea` |
| Live JSON transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.json.js` | 19,068 bytes | `5d3e6ecdbdc301f55e68e08185a9d00a70e13d2c48858ff9c6f7e3ca303bcfa7` |
| Activity webpage transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/webpage.bilibili.js` | 5,033 bytes | `13e98f5443a5ca85ddb7e8088f0a44d16bde11ee4c8668f26d83f80515fcc0d6` |
| Tab replacement program | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/jq/bilibili.tab.jq` | 2,091 bytes | `820ef567586a069375f2853db70973a212f391ff0d9008d00fc3b06166bfde26` |
| My-page replacement program | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/jq/bilibili.mine.jq` | 7,636 bytes | `10ca10375b19193fd280deedb7f6219cdce804ea3813ab5fa4f692d02a3238e5` |

The two `jq-path` programs are inlined into `extension.yaml` rather than fetched
at runtime, because a jq action carries its expression in the manifest. Their
bytes are recorded above so a review can diff the inlined copy against upstream.

## Chronos client artifacts

The response transformer directs supported Bilibili clients to Chronos
archives. The upstream script uses a mutable branch, so every client-visible
URL is changed only at the revision component and pinned to the current
`kokoryh/chronos` commit
`69a8996b1f1311b606021e3f194b0390280ab618`, committed on `2026-07-04`.
These files were verified on `2026-07-22`.

| Client-fetched artifact | Size | SHA-256 |
| --- | ---: | --- |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/e5a968f1a5055bbe5c12e67b100a6dcb.zip` | 983,408 bytes | `c82d74ac16e2d1ecb82f8f3d3cab2fc9fe5cc49d243964a9bd4a3877a642056e` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/ecca73e42e160074e0caf4b3ddb54a52.zip` | 1,055,273 bytes | `0ba74f51cf494ac7d470ad168d8631e6ab6eddc3578ef7898efb0a9ca2687e80` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/f993a054969a4f6ae6b20a65f1292e47.zip` | 965,523 bytes | `e22e06e114cbeb5bc749887d8eee4018832f0e7b4508979e9606a5a432cd3c02` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/feaca416bbc1174b8e935cf87ff8f0b5.zip` | 1,054,471 bytes | `e96786591f4d8345577a379926377c5f21aac2d61df4cbe2a6fd7d1497ee4962` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/932002070dc1b51241198a074d2279fc.zip` | 879,597 bytes | `cf7fced28a0b55f38595566bb7d067297cc51814a5c21daf8fff90c9b9dbe6c0` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/8c3feda2e92bf60e8a7aeade1a231586.zip` | 879,023 bytes | `7d021dd18f8980db22dc0ac0d70df8b493e9225f4b79f24468f5949586380eee` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/LICENSE` | 35,149 bytes | `3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986` |

The archives are fetched by the Bilibili client, not by
`context.network.request`. This repository does not copy or redistribute them
because the Chronos repository does not include their complete corresponding
preferred source.

## License and attribution

The upstream module is GPL-3.0-only. This repository does not redistribute it:
`extension.yaml` records immutable URLs and digests, and the gateway fetches the
bytes itself. The manifest, this documentation, `mock-json.js`, and
`mock-grpc.js` are original works distributed under GPL-3.0-only so the
aggregate stays consistent with the module they accompany, and they retain
kokoryh/Sparkle attribution.

The two inlined jq programs are copied verbatim from the pinned commit and are
GPL-3.0-only upstream text; their provenance is the table above.

Earlier revisions vendored a generated protobuf runtime, a Google BSD-3-Clause
varint implementation, and an MIT fflate archive to satisfy the
corresponding-source obligation for a redistributed bundle. None of that is
present any more.

## Port mapping

Twenty-one actions, in three kinds:

| Kind | Count | What it carries |
| --- | ---: | --- |
| `entry: proxy-compat` | 5 | The pinned `dist/` scripts: the protobuf request transformer on both request paths, the protobuf response transformer, the live JSON transformer, and the activity webpage transformer. |
| `script.jq` | 11 | The pinned `[Rewrite]` expressions, including the two `jq-path` programs inlined. |
| local script | 5 | `mock-json.js` and `mock-grpc.js`, for the `mock-response-body` and `reject-dict` directives. A synthetic response has no input document, so there is nothing for jq to transform and no upstream script to load. |

The five settings are unchanged and already match the upstream `[Argument]`
names, so they reach the scripts as the decoded object Loon supplies.

The upstream `bilibili.skin` entry loads `bili-suit-diy.js` from a second
repository, `kokoryh/Script`. That repository is not pinned here. The skin
response is instead handled by the `clean-app-skin` jq action, which applies the
Loon plugin's own `response-body-json-del data.common_equip` directive.

## Network permission, egress, and data disclosure

The request transformer requires exactly:

```text
https://app.bilibili.com
https://bsbsb.top
https://grpc.biliapi.net
```

The first and third origins replay selected captured RPCs. The replay can
contain the complete captured request body and reviewed headers. It preserves
the protocol-required exact `TE: trailers` header and removes every other
hop-by-hop header. The `bsbsb.top` request sends the derived BV identifier,
content ID, and fixed `category=sponsor` query. Enabling requires one operator
confirmation naming every origin and warning that all data visible to the
script can be sent there.

The upstream LPX routes only `bsbsb.top` to `PROXY`, while the native manifest
cannot name a proxy group or attach one only to a single network origin. The
required operator binding therefore applies to this extension's complete
capture and network-origin selector set. The operator must review that broader
scope and select an appropriate existing group; a missing or removed binding
fails closed. The script cannot inspect, name, select, or change that group.

Every call returns through authenticated mihomo SOCKS5. The extension has no
ambient `fetch`, cookie jar, redirect following, DNS, socket, filesystem,
process, timer, or module-loader access. It declares no persistent storage.

## Deliberate architecture boundary and remaining differences

- Loon exposes a device-model environment value. Native scripts do not. The
  frequent-uploader iPad exception uses the `bili-hd` user-agent prefix.
- Loon performs its two SponsorBlock requests concurrently with a three-second
  timeout. The port issues them concurrently as well, through the runtime's
  asynchronous `network.requestAsync`. Older gateways expose only the
  synchronous `network.request`; the port detects this and falls back to
  issuing the pair in sequence, which costs both latencies but returns the same
  response. The per-request timeout stays the runtime's fixed five seconds
  rather than upstream's three, alongside its one-MiB, call-count, and
  concurrency limits. Failure preserves the original request.
- The `grpc.biliapi.net` to `app.bilibili.com` replay fallback stays sequential
  on both paths. It is a fallback chain rather than a set of mirrors, so the
  second host is only asked once the first has failed.
- Sponsor segment data from `bsbsb.top` is mutable. Network, status, parse, or
  schema failure preserves normal Bilibili behavior.
- Client Chronos URLs are revision-pinned, but their GPL archives are not
  redistributed because their repository lacks corresponding preferred source.
- The webpage port injects the same browser-side behavior without reproducing
  `DOMParser` whole-document serialization. It preserves the upstream
  `hostname.includes("bilibili")` test.
- Native request and response bodies remain bounded. Reviewed JSON, Protobuf,
  and remote-data decode failures return no patch. VM timeouts, invalid result
  objects, and runtime-contract violations still fail the matched flow closed.

## Updating from upstream

1. Select one new `kokoryh/Sparkle` commit intentionally and keep the Loon LPX
   as the orchestration authority.
2. Fetch the LPX, JQ programs, audited dist files, schemas, preferred-source
   closure, package metadata, and license from commit-pinned raw URLs.
3. Resolve every client-visible Chronos file to one immutable commit without
   redistributing an archive that lacks corresponding preferred source.
4. Check current published embedded component versions and retain their exact
   npm archives, preferred source, licenses, and source manifests.
5. Diff settings, matchers, rules, mocks, JSON/JQ behavior, Protobuf handlers,
   webpage behavior, outbound requests, and URLs independently.
6. Regenerate `source/generated/`, rebuild `protobuf.js`, review the dependency
   lock and bundle projection, and update fixtures, provenance, SPDX mappings,
   notices, and `metadata.version` together.
7. Keep actions inside capture hosts, declare every origin exactly, and require
   fresh review for network, egress, routing, and execution-order changes.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
Sparkle, Chronos, or embedded-component revision. Upstream selection remains a
manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.bilibili-cleaner`; bump `metadata.version` for every immutable manifest or runtime-script change. |
| Current manifest | `version=3.0.0`; `persistentStorage=true`; `settings=5`; `captureHosts=6`; `actions=21`; `routingRules=5`; `networkOrigins=3`; `upstreamMappings=0`; `egressRequired=true`. |
| State class | Stateful. `persistentStorage` is false. |
| Settings | Preserve the five current keys and types when possible. A normal update retains only values that remain valid under the candidate definitions. |
| Reviewed capability baseline | Six capture hosts, five routing rules, eleven actions, three network origins, five settings, and a required egress binding. |
| Operator state | A normal same-ID update retains valid settings, egress binding, `capture_dns`, and execution position. Review all of them before enable. |
| Source boundary | A changed GPL bundle must ship with complete corresponding preferred source and deterministic build inputs in the same revision. |
| External artifacts | Chronos URLs may change only to reviewed immutable revisions; archives without corresponding preferred source remain referenced rather than redistributed. |
| License review gate | Before any candidate or rollback publication, independently reconcile the aggregate SPDX expression and standalone-install notices with every Apache, MIT, BSD, and GPL bundle input; do not carry the existing expression forward by assumption. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No extension data conversion is required. |

### Repeatable migration

1. Complete the playbook record separately for the LPX orchestration, JQ and
   dist behavior, all schemas and preferred source, Chronos artifacts, embedded
   npm components, settings, mocks, routes, origins, and outbound disclosure.
2. Update every immutable pin and inventory together. Regenerate schemas,
   rebuild `protobuf.js`, and compare the generated files,
   `bundle-inputs.json`, dependency lock, vendored archives, and preferred
   source byte-for-byte. `npm run verify:sources` must refetch every pinned
   source and npm archive, compare it with the local copy, and reject inventory
   drift before the build is accepted.
3. Before publishing either a forward candidate or rollback, reconcile the
   bundle's aggregate SPDX expression and retained component notices with the
   actual inputs, even when the input set appears unchanged. A reproducible
   build does not by itself prove that Apache, MIT, BSD, and GPL boundaries are
   synchronized.
4. Preserve setting keys and types when behavior allows. If an option or
   validation rule changes, list the affected value and required operator
   action in the migration record.
5. Compare every capture host, routing rule, action, network origin, egress
   requirement, and execution-order effect. Any origin or disclosure change
   requires a fresh permission review.
6. Run the common gates and the complete source rebuild below. Apply the exact
   candidate digest while disabled, confirm the five settings and egress
   binding, then exercise every request, response, mock, webpage, and network
   failure branch before enable.

### Rollback

The publisher prepares a same-ID revert-forward candidate containing the complete baseline
manifest, runtime behavior, corresponding preferred source, lockfile, vendored
archives, license mapping, and notices under a new version. Rebuild it from
source with that version incremented above the failing candidate and run every
Bilibili and core gate before publication. Disable the
failing candidate, apply the exact rollback digest, confirm all retained
settings and the egress binding, and test remote replay and SponsorBlock failure
paths before enable. Emergency reinstall from an old immutable manifest is
data-safe because the extension is stateless, but it loses settings, egress,
`capture_dns`, execution position, and installed source identity.

## Verification

```powershell
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

`verify:upstreams` re-downloads every artifact in the pinned table and enforces
its size and digest, so a changed upstream fails the gate rather than being
adopted silently. That includes the two jq programs, which is what keeps the
inlined copies honest.

What this repository can no longer assert is what the scripts do. The previous
revision shipped protobuf fixtures over local code; that code is gone, and
running upstream's own bundle against fabricated frames would test upstream
rather than this manifest. The jq expressions are executed against gojq -- the
engine that runs them -- in the sidecar's jq suite; Node has no jq, so they
cannot be executed here.

Before relying on the airborne helper, exercise it on a device while reviewing
sidecar logs: it reaches `bsbsb.top` and replays to `grpc.biliapi.net`, and
neither is covered by any fixture.
