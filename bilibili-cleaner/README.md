# Bilibili Cleaner

License: [`GPL-3.0-only`](../LICENSES/GPL-3.0-only.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of the
GPL-licensed `kokoryh/Sparkle` Bilibili Loon plugin. It is not compiled into
either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml
```

The extension captures six exact Bilibili hosts and projects the pinned five
reject rules through the reviewed routing-rule contract. It requires no egress
binding: every host it actually reaches is a mainland service, so the ordinary
mihomo path is the correct one and the operator may still bind a group
deliberately. It exposes the five settings declared by the pinned Loon plugin,
declares persistent storage because the pinned scripts keep their own values in
it, and takes the network permission for the SponsorBlock and
request-optimization helpers.

## What changed, and why

Earlier revisions hand-ported this module: a generated protobuf runtime, a
vendored dependency set, a deterministic esbuild pipeline, and roughly a hundred
pinned build artifacts, all so that a GPL bundle could be redistributed with its
corresponding preferred source. Every upstream revision meant re-deriving that
tree.

The runtime now hosts the contract these scripts are written against, and it
runs jq, so this extension carries the upstream module rather than a
reimplementation of it. Five actions load the pinned scripts; eleven carry the
pinned rewrite expressions verbatim; eight keep local synthetic responses,
because a `mock-response-body` directive has no script and no input document to
transform.

Nothing GPL is redistributed any more. The scripts are fetched by the gateway
from immutable raw URLs, so this repository references them instead of shipping
their bytes, and the corresponding-source obligation that required the build
tree no longer applies. `bilibili-cleaner/source/` is gone.

## Pinned upstream artifacts

Reviewed at commit
[`12e89d6d93d72d39eb283ef81d2b58eb204cdb58`](https://github.com/kokoryh/Sparkle/tree/12e89d6d93d72d39eb283ef81d2b58eb204cdb58).
The published module points its `script-path` and `jq-path` values at the
mutable `master` branch; every entry below is re-pinned to that immutable
commit, so the bytes a gateway fetches are the reviewed revision's.

| Artifact | Immutable raw URL |
||
| Sparkle GPL license | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/LICENSE` |
| Loon plugin (rule and directive source) | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/release/loon/plugin/bilibili.lpx` |
| Protobuf request transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.protobuf.request.js` |
| Protobuf response transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.protobuf.response.js` |
| Live JSON transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.json.js` |
| Activity webpage transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/webpage.bilibili.js` |
| Tab replacement program | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/jq/bilibili.tab.jq` |
| My-page replacement program | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/jq/bilibili.mine.jq` |

The two `jq-path` programs are inlined into `extension.yaml` rather than fetched
at runtime, because a jq action carries its expression in the manifest. Each URL
above names the immutable commit its inlined copy was taken from, so re-fetching
that URL is what checks the two against each other. Nothing does so
automatically.

## Chronos client artifacts

The response transformer directs supported Bilibili clients to Chronos archives.
It builds every one of those URLs as
`https://raw.githubusercontent.com/kokoryh/chronos/refs/heads/master/<name>.zip`,
and that mutable branch is what the client fetches. Earlier revisions rebuilt
the bundle from source and could rewrite its revision component; this revision
loads upstream's bundle verbatim, so nothing here pins it, and a client gets
whatever `kokoryh/chronos` serves on `master` at request time.

The six archives the bundle can select are below. They were reviewed at commit
`69a8996b1f1311b606021e3f194b0390280ab618`, committed on `2026-07-04` and
verified on `2026-07-22`. That commit records what these names resolved to at
review time — it is not what a client will fetch later. To read the reviewed
bytes, substitute it for `refs/heads/master` in the URL above; `LICENSE` at the
same commit covers them.

| Archive the bundle can select |
| --- |
| `e5a968f1a5055bbe5c12e67b100a6dcb.zip` |
| `ecca73e42e160074e0caf4b3ddb54a52.zip` |
| `f993a054969a4f6ae6b20a65f1292e47.zip` |
| `feaca416bbc1174b8e935cf87ff8f0b5.zip` |
| `932002070dc1b51241198a074d2279fc.zip` |
| `8c3feda2e92bf60e8a7aeade1a231586.zip` |

The archives are fetched by the Bilibili client, not by
`context.network.request`. This repository does not copy or redistribute them
because the Chronos repository does not include their complete corresponding
preferred source.

## License and attribution

The upstream module is GPL-3.0-only. This repository does not redistribute it:
`extension.yaml` records immutable URLs, and the gateway fetches the bytes
itself. The manifest and this documentation are original works
distributed under GPL-3.0-only so the aggregate stays consistent with the
module they accompany, and they retain kokoryh/Sparkle attribution.

The two inlined jq programs are copied verbatim from the pinned commit and are
GPL-3.0-only upstream text; their provenance is the table above.

Earlier revisions vendored a generated protobuf runtime, a Google BSD-3-Clause
varint implementation, and an MIT fflate archive to satisfy the
corresponding-source obligation for a redistributed bundle. None of that is
present any more.

## Port mapping

Twenty-four actions, in three kinds:

| Kind | Count | What it carries |
| --- | ---: | --- |
| `entry: proxy-compat` | 5 | The pinned `dist/` scripts: the protobuf request transformer on both request paths, the protobuf response transformer, the live JSON transformer, and the activity webpage transformer. |
| `script.jq` | 11 | The pinned `[Rewrite]` expressions, including the two `jq-path` programs inlined. |
| `script.mock` | 8 | The `mock-response-body` and `reject-dict` directives, one action per distinct body exactly as upstream declares them. The three gRPC mocks carry upstream's base64 frames and its `grpc-status: 0` header, and add the `application/grpc` content type upstream leaves to the client. |

This directory ships no JavaScript. Earlier revisions carried `mock-json.js`
and `mock-grpc.js` to match a URL and return a fixed body, which the manifest
can now declare; splitting them raised the action count because a declared mock
has one body, the way upstream writes one `[Map Local]` line per body.

The five settings are unchanged and already match the upstream `[Argument]`
names, so they reach the scripts as the decoded object Loon supplies. Two of
them are not script arguments upstream at all: they gate a whole entry, and are
bound to their actions with `enabledWhen`. See the gate boundary below.

`clean-app-skin` carries the Loon plugin's own
`response-body-json-del data.common_equip` directive. The reviewed LPX declares
no skin script. Surge's `bilibili.sgmodule` does -- a `bilibili.skin` entry
loading `bili-suit-diy.js` from a second repository, `kokoryh/Script`, under
`engine=webview` -- and that repository is deliberately not pinned here. The
LPX is the orchestration authority for this port, so the directive is what is
carried.

## Network permission, egress, and data disclosure

The request transformer requires exactly:

```text
https://app.bilibili.com
https://bsbsb.top
https://grpc.biliapi.net
```

Two of those hosts replay selected captured RPCs. The replay can
contain the complete captured request body and reviewed headers. It preserves
the protocol-required exact `TE: trailers` header and removes every other
hop-by-hop header. The `bsbsb.top` request sends the derived BV identifier,
content ID, and fixed `category=sponsor` query. Enabling requires one operator
confirmation stating that the extension may reach any host and that all data
visible to the script can be sent there. The permission names none of these
hosts; this README is where they are named.

Both disclosures can be switched off. The airborne entry is gated on
`sponsorBlock` and the replay entry on `optimizeRequest`, and a gated-off action
is not loaded at all, so neither the `bsbsb.top` lookup nor the replay happens
while its setting is off. See the gate boundary below. The enable-time confirmation still
describes the unbounded grant, because it states the maximum the operator is
consenting to rather than what the current settings permit.

The upstream LPX routes only `bsbsb.top` to `PROXY`, while the native manifest
cannot name a proxy group or attach one to a single host. A required binding
therefore could not be scoped to the one host that motivated it: it applied to
this extension's complete capture selector set, and an install that left it
unbound failed closed, disabling comment filtering, the uploader list, and
danmaku along with the SponsorBlock lookup that was the only reason for it.
Every host these helpers reach is a mainland service for which the ordinary
mihomo path is the appropriate one, so revision 3.2.0 stops requiring the
binding. An operator who wants these flows to leave through a
specific group may still bind one, subject to that same broader scope; the
script cannot inspect, name, select, or change it.

Every call returns through authenticated mihomo SOCKS5. The extension has no
ambient `fetch`, cookie jar, redirect following, DNS, socket, filesystem,
process, timer, or module-loader access. It declares persistent storage, which
is the extension-scoped store the pinned scripts read and write.

## Deliberate architecture boundary and remaining differences

- **Two entries are gated on a setting, not on an argument.** Upstream switches
  the airborne entry and the comment/view entry on and off from outside the
  script rather than passing those keys to it, so no bundle reads them:
  `optimizeRequest` appears in none of the four pinned bundles, and only the
  response bundle reads `sponsorBlock`, to decide whether to point the client at
  Chronos. Both actions therefore declare `enabledWhen`, and the gateway does
  not load a gated-off action at all. Revision 3.0.1 and earlier had no such
  mechanism: both entries ran unconditionally, so `optimizeRequest` did nothing
  and turning the airborne helper off still queried `bsbsb.top` and still
  injected its danmaku. This needs a gateway that speaks control-API schema 2.
- The response bundle picks its Chronos client from the request `user-agent`
  prefix — `bili-hd`, `bili-inter`, otherwise universal — and separately reads
  `$environment["device-model"]`, falling back to `$loon`. Which branch runs
  depends on what the gateway populates, not on this manifest.
- The airborne entry issues its replay and its `bsbsb.top` segment lookup
  concurrently, carrying upstream's own three-second timeout on the lookup. The
  `grpc.biliapi.net` to `app.bilibili.com` replay is a fallback chain rather
  than a set of mirrors, so the second host is only asked once the first has
  failed.
- Sponsor segment data from `bsbsb.top` is mutable. Network, status, parse, or
  schema failure preserves normal Bilibili behavior.
- Client Chronos URLs are built on a mutable branch by upstream's own bundle,
  and their GPL archives are not redistributed because their repository lacks
  corresponding preferred source.
- The webpage bundle parses the whole document with `DOMParser` and reserializes
  it, and gates itself on `hostname.includes("bilibili")`. Both are upstream
  behavior, so the runtime has to supply `DOMParser` for that action to work.
- Request and response bodies stay bounded by the `maxBodyBytes` and
  `timeoutMs` each action declares. The published module declares no size cap
  at all, and allows the two request entries ten seconds where this manifest
  allows twelve. Exceeding a declared bound fails the matched flow closed
  rather than returning a partial patch.

## Updating from upstream

1. Select one new `kokoryh/Sparkle` commit intentionally and keep the Loon LPX
   as the orchestration authority.
2. Fetch the LPX, JQ programs, audited dist files, schemas, preferred-source
   closure, package metadata, and license from commit-pinned raw URLs.
3. Re-review the Chronos archives the bundle selects, record the `master` commit
   they were reviewed at, and do not redistribute an archive that lacks
   corresponding preferred source.
4. Diff settings, matchers, rules, mocks, JSON/JQ behavior, Protobuf handlers,
   webpage behavior, outbound requests, and URLs independently.
5. Re-pin every script and jq program to the new commit, re-inline the two
   `jq-path` programs, and update the fixtures, provenance, notices, and
   `metadata.version` together. Nothing is vendored, so adoption is a URL
   rather than a rebuild.
6. Keep actions inside capture hosts, name every reachable host in this README, and require
   fresh review for network, egress, routing, and execution-order changes.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
Sparkle, Chronos, or embedded-component revision. Upstream selection remains a
manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.bilibili-cleaner`; bump `metadata.version` for every immutable manifest or runtime-script change. |
| Current manifest | `version=4.0.0`; `persistentStorage=true`; `settings=5`; `captureHosts=6`; `actions=24`; `routingRules=5`; `network=true`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateful. `persistentStorage` is true and the pinned scripts keep their own values in the extension-scoped store. |
| Settings | Preserve the five current keys and types when possible. A normal update retains only values that remain valid under the candidate definitions. |
| Reviewed capability baseline | Six capture hosts, five routing rules, twenty-four actions, the network permission, five settings, and no required egress binding. |
| Operator state | A normal same-ID update retains valid settings, egress binding, `capture_dns`, and execution position. Review all of them before enable. |
| Source boundary | A changed GPL bundle must ship with complete corresponding preferred source and deterministic build inputs in the same revision. |
| External artifacts | The bundle builds Chronos URLs on `kokoryh/chronos` `master` and this manifest cannot pin them; re-review what that branch serves whenever the Sparkle pin moves. Archives without corresponding preferred source remain referenced rather than redistributed. |
| License review gate | Before any candidate or rollback publication, independently reconcile the aggregate SPDX expression and standalone-install notices with every Apache, MIT, BSD, and GPL bundle input; do not carry the existing expression forward by assumption. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No extension data conversion is required. |

### Repeatable migration

1. Complete the playbook record separately for the LPX orchestration, JQ and
   dist behavior, all schemas and preferred source, Chronos artifacts, embedded
   npm components, settings, mocks, routes, reachable hosts, and outbound disclosure.
2. Update every immutable pin and inventory together, and reject a pin that
   names a mutable ref before the candidate is accepted.
3. Before publishing either a forward candidate or rollback, reconcile the
   bundle's aggregate SPDX expression and retained component notices with the
   actual inputs, even when the input set appears unchanged. A reproducible
   build does not by itself prove that Apache, MIT, BSD, and GPL boundaries are
   synchronized.
4. Preserve setting keys and types when behavior allows. If an option or
   validation rule changes, list the affected value and required operator
   action in the migration record.
5. Compare every capture host, routing rule, action, reachable host, egress
   requirement, and execution-order effect. Any reachable-host or disclosure change
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
```

Nothing re-downloads the pinned artifacts to compare them any more. Each URL
names an immutable commit, which is what binds the bytes a gateway fetches; the
two `.jq` programs are carried inline in `extension.yaml`, so what runs for them
is what this repository ships and reviews.

What this repository can no longer assert is what the scripts do. The previous
revision shipped protobuf fixtures over local code; that code is gone, and
running upstream's own bundle against fabricated frames would test upstream
rather than this manifest. The jq expressions are executed against gojq -- the
engine that runs them -- in the sidecar's jq suite; Node has no jq, so they
cannot be executed here.

Before relying on the airborne helper, exercise it on a device while reviewing
sidecar logs: it reaches `bsbsb.top` and replays to `grpc.biliapi.net`, and
neither is covered by any fixture.
