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
runs jq, so this extension projects the upstream module rather than maintaining
a reimplementation of it. Five actions load the pinned scripts; eleven carry
the pinned rewrite expressions; eight keep local synthetic responses, because
a `mock-response-body` directive has no script and no input document to
transform.

The four GPL JavaScript bundles are no longer redistributed. Five actions fetch
them from immutable raw URLs, with the request bundle shared by two actions. Two
adapted upstream GPL jq programs remain redistributed inside `extension.yaml`,
because a jq action carries its expression in the manifest. The port preserves
their upstream operations while adding local type guards for missing or
non-object response data. Those adapted programs are their own preferred source
form and do not require the former generated-bundle build tree.
`bilibili-cleaner/source/` is gone.

## Pinned upstream artifacts

Reviewed at commit
[`110029696d66a3f3aef8f6546de9d494513c2901`](https://github.com/kokoryh/Sparkle/tree/110029696d66a3f3aef8f6546de9d494513c2901)
on `2026-08-16`.
The published module points its `script-path` and `jq-path` values at the
mutable `master` branch; every entry below is re-pinned to that immutable
commit, so the bytes a gateway fetches are the reviewed revision's.

Revision 4.2.0 refreshes the Sparkle pin from
`a26c3412a760fb8d7d4d1bcc124d126e19d630e5`, four commits back. Sparkle publishes
no tag or release for this revision. The five settings, five reject rules, six
capture hosts, mocks, JSON/JQ rewrites, outbound hosts, and permission boundary
are unchanged. The LPX adds one response route for
`bilibili.app.viewunite.v1.View/AIRelateAsync`; this port adds exactly that route
instead of copying the LPX's broader optional `view(unite)?` grouping, because
the reviewed router registers no `view.v1.View/AIRelateAsync` handler.

The response bundle now decodes `AIRelateAsync`, removes its `cm` advertising
field, and applies the existing related-card filter to its related-recommend
modules. The request bundle's bytes changed only through the build timestamp and
minifier identifier allocation; its behavior is unchanged. The live JSON
bundle, both upstream jq files, and Sparkle's GPL license are byte-identical to
the previous pin. One intervening commit changes only the unrelated Hanime
webpage bundle.

The Bilibili webpage bundle now treats every `H5Slider` as removable, even when
its links stay on Bilibili, and hides the slider plus any hideable ancestors in
the traversal path. That broadens the previous external-link-only test and may
hide legitimate activity-page content. It is retained as reviewed upstream
behavior, but remains a device-validation and rollback risk.

| Artifact | Immutable raw URL |
| --- | --- |
| Sparkle GPL license | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/LICENSE` |
| Loon plugin (rule and directive source) | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/release/loon/plugin/bilibili.lpx` |
| Protobuf request transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/dist/bilibili.protobuf.request.js` |
| Protobuf response transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/dist/bilibili.protobuf.response.js` |
| Live JSON transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/dist/bilibili.json.js` |
| Activity webpage transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/dist/webpage.bilibili.js` |
| Tab replacement program | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/jq/bilibili.tab.jq` |
| My-page replacement program | `https://raw.githubusercontent.com/kokoryh/Sparkle/110029696d66a3f3aef8f6546de9d494513c2901/jq/bilibili.mine.jq` |

The two `jq-path` programs are adapted and inlined into `extension.yaml` rather
than fetched at runtime, because a jq action carries its expression in the
manifest. Each URL above names the immutable upstream source used for review.
The local forms add outer object checks and narrower nested-value type guards so
unexpected response shapes pass through instead of causing a jq failure; they
are intentionally not byte-for-byte copies. Nothing re-fetches or compares them
automatically.

## Chronos client artifacts

The response transformer directs supported Bilibili clients to Chronos archives.
It builds every one of those URLs as
`https://raw.githubusercontent.com/kokoryh/chronos/refs/heads/master/<name>.zip`,
and that mutable branch is what the client fetches. Earlier revisions rebuilt
the bundle from source and could rewrite its revision component; this revision
loads upstream's bundle verbatim, so nothing here pins it, and a client gets
whatever `kokoryh/chronos` serves on `master` at request time.

The six archives and their license were re-reviewed on `2026-08-16`
at commit `69a8996b1f1311b606021e3f194b0390280ab618`, committed on
`2026-07-04`. These immutable URLs record the reviewed bytes; they do not alter
the bundle's runtime behavior, which still sends clients to mutable `master`.
That commit remains the Chronos default-branch HEAD, so this Sparkle update sees
no Chronos archive, name, license, or branch-content change.

| Reviewed artifact | Immutable raw URL |
| --- | --- |
| GPL license | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/LICENSE` |
| `e5a968f1a5055bbe5c12e67b100a6dcb.zip` | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/e5a968f1a5055bbe5c12e67b100a6dcb.zip` |
| `ecca73e42e160074e0caf4b3ddb54a52.zip` | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/ecca73e42e160074e0caf4b3ddb54a52.zip` |
| `f993a054969a4f6ae6b20a65f1292e47.zip` | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/f993a054969a4f6ae6b20a65f1292e47.zip` |
| `feaca416bbc1174b8e935cf87ff8f0b5.zip` | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/feaca416bbc1174b8e935cf87ff8f0b5.zip` |
| `932002070dc1b51241198a074d2279fc.zip` | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/932002070dc1b51241198a074d2279fc.zip` |
| `8c3feda2e92bf60e8a7aeade1a231586.zip` | `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/8c3feda2e92bf60e8a7aeade1a231586.zip` |

The archives are fetched by the Bilibili client, not by
`context.network.request`. This repository does not copy or redistribute them
because the Chronos repository does not include their complete corresponding
preferred source.

## License and attribution

The four upstream JavaScript bundles are GPL-3.0-only. This repository does not
copy or redistribute their bytes: `extension.yaml` records immutable URLs, and
the gateway fetches them itself. The manifest and this documentation are
original works distributed under GPL-3.0-only so the aggregate stays consistent
with the module they accompany, and they retain kokoryh/Sparkle attribution.

This repository does redistribute adapted source text from the two jq programs
inlined into `extension.yaml`. The local type guards are modifications to the
upstream programs; the resulting source remains GPL-3.0-only, and its
commit-pinned upstream provenance is recorded in the table above.

Earlier revisions vendored a generated protobuf runtime, a Google BSD-3-Clause
varint implementation, and an MIT fflate archive to satisfy the
corresponding-source obligation for a redistributed bundle. None of that is
present any more.

## Port mapping

Twenty-four actions, in three kinds:

| Kind | Count | What it carries |
| --- | ---: | --- |
| `entry: proxy-compat` | 5 | The pinned `dist/` scripts: the protobuf request transformer on both request paths, the protobuf response transformer, the live JSON transformer, and the activity webpage transformer. |
| `script.jq` | 11 | The pinned `[Rewrite]` expressions, including the two adapted `jq-path` programs inlined with local type guards. |
| `script.mock` | 8 | The `mock-response-body` and `reject-dict` directives, one action per distinct body exactly as upstream declares them. The three gRPC mocks carry upstream's base64 frames and its `grpc-status: 0` header, and add the `application/grpc` content type upstream leaves to the client. |

This directory ships no JavaScript. Earlier revisions carried `mock-json.js`
and `mock-grpc.js` to match a URL and return a fixed body, which the manifest
can now declare; splitting them raised the action count because a declared mock
has one body, the way upstream writes one `[Map Local]` line per body.

The five settings are unchanged and already match the upstream `[Argument]`
names, so where a bundle reads them they arrive as the decoded object Loon
supplies. They do not all reach every action, and that mirrors upstream rather
than being a porting gap: the argument middleware is mounted per route, not
globally. `bilibili.protobuf.request.js` takes it globally;
`bilibili.protobuf.response.js` takes it on the routes that need it;
`bilibili.json.js` mounts it on one route this extension does not match; and
`webpage.bilibili.js` never invokes it at all. So `logLevel` governs the two
protobuf actions and has no effect on `clean-live-json` or `clean-webpage` —
upstream's own `bilibili.live` and `bilibili.webpage` entries likewise pass no
`argument=`. Two of the five are not script arguments upstream at all: they gate
a whole entry, and are bound to their actions with `enabledWhen`. See the gate
boundary below.

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
- The `AIRelateAsync` response handler removes the response-level `cm` field and
  filters related cards. Its matcher is deliberately limited to
  `bilibili.app.viewunite.v1.View/AIRelateAsync`; the upstream LPX's grouped
  expression would also admit an unsupported `view.v1` spelling.
- The webpage bundle parses the whole document with `DOMParser` and reserializes
  it, gates itself on `hostname.includes("bilibili")`, and now hides every
  `H5Slider` plus hideable ancestors. These are upstream behaviors, so the
  runtime has to supply `DOMParser`, and operators must treat legitimate-slider
  removal as a reviewed rollback risk.
- Request and response bodies stay bounded by the `maxBodyBytes` and
  `timeoutMs` each action declares. The published module declares no size cap
  at all, and allows the two request entries ten seconds where this manifest
  allows twelve. Exceeding a declared bound fails the matched flow closed
  rather than returning a partial patch.

## Updating from upstream

1. Select one new `kokoryh/Sparkle` commit intentionally and keep the Loon LPX
   as the orchestration authority.
2. Fetch and review the LPX, four `dist/` JavaScript files, two jq programs, and
   license from raw URLs at that exact commit. Do not add the JavaScript bytes
   to this repository.
3. Re-review the Chronos archives the bundle selects, record the `master` commit
   they were reviewed at, and do not redistribute an archive that lacks
   corresponding preferred source.
4. Diff settings, matchers, rules, mocks, JSON/JQ behavior, Protobuf handlers,
   webpage behavior, outbound requests, and URLs independently.
5. Re-pin all five script actions to the four exact JavaScript raw URLs, re-inline
   the two `jq-path` programs, and update the fixtures, provenance, notices, and
   `metadata.version` together. The JavaScript bundles stay remote, so adoption
   changes immutable URLs rather than rebuilding or vendoring their bytes.
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
| Current manifest | `version=4.2.0`; `persistentStorage=true`; `settings=5`; `captureHosts=6`; `actions=24`; `routingRules=5`; `network=true`; `upstreamMappings=0`; `egressRequired=false`. |
| Enablement | A fresh install starts disabled. An installed Marketplace replacement preserves the prior enabled authorization and does not require a disable-first step. |
| State class | Stateful. `persistentStorage` is true and the pinned scripts keep their own values in the extension-scoped store. |
| Settings | Preserve the five current keys and types when possible. A normal update retains only values that remain valid under the candidate definitions. |
| Reviewed capability baseline | Six capture hosts, five routing rules, twenty-four actions, the network permission, five settings, and no required egress binding. |
| Reviewed upstream baseline | Sparkle `110029696d66a3f3aef8f6546de9d494513c2901` and Chronos `69a8996b1f1311b606021e3f194b0390280ab618`, reviewed on `2026-08-16`. |
| Response route delta | Add only `bilibili.app.viewunite.v1.View/AIRelateAsync`; do not match `bilibili.app.view.v1.View/AIRelateAsync`. |
| Operator state | A normal same-ID update retains valid settings, egress binding, `capture_dns`, and execution position. Review all of them before enable. |
| Source boundary | Keep the four JavaScript bundles remote at exact commit-pinned raw URLs. Redistribute only the two adapted jq programs in their preferred source form, and keep their local type guards and upstream provenance synchronized. |
| External artifacts | The bundle builds Chronos URLs on `kokoryh/chronos` `master` and this manifest cannot pin them; re-review what that branch serves whenever the Sparkle pin moves. Archives without corresponding preferred source remain referenced rather than redistributed. |
| License review gate | Before any candidate or rollback publication, reconcile the GPL mapping, license text, notices, and README provenance with the two redistributed jq programs and four referenced JavaScript bundles. |
| Rollback | Prefer a verified publisher-managed revert-forward Marketplace entry with a higher version. No extension data conversion is required. |

### Repeatable migration

1. Complete the playbook record separately for the LPX orchestration, four
   JavaScript bundles, two jq programs, Chronos artifacts, settings, mocks,
   routes, reachable hosts, and outbound disclosure.
2. Update the five action-to-script mappings and every immutable raw URL
   together. Reject any JavaScript or jq provenance URL that names a mutable
   ref before the candidate is accepted.
3. Before publishing either a forward candidate or rollback, reconcile the GPL
   mapping, license text, notices, and README provenance with the actual remote
   bundles and redistributed jq programs, even when the input set appears
   unchanged.
4. Preserve setting keys and types when behavior allows. If an option or
   validation rule changes, list the affected value and required operator
   action in the migration record.
5. Compare every capture host, routing rule, action, reachable host, egress
   requirement, and execution-order effect. Any reachable-host or disclosure change
   requires a fresh permission review.
6. Run the common gates, including the fixture that checks each action against
   its exact raw URL and execution bounds. Apply the reviewed Marketplace
   candidate without a disable-first step, confirm prior authorization,
   persistent storage, the five settings, and egress binding, then
   exercise every request, response, mock, webpage, and network failure branch
   before enable.

### Rollback

The publisher prepares a same-ID revert-forward candidate under a new version,
restoring the baseline manifest's exact commit-pinned JavaScript URLs and
inlined jq programs together with their license mapping, notices, and
provenance. Run every Bilibili and core gate before publication. Review and
apply the rollback Marketplace candidate, confirm prior authorization and retained persistent
storage, settings, and egress binding, and test remote replay and SponsorBlock
failure paths before enable. Prefer this update path because the extension is
stateful: removing it and reinstalling an old immutable manifest can lose its
extension-scoped storage as well as settings, egress, `capture_dns`, execution
position, and installed source identity.

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
rather than this manifest. Node has no jq, so the expressions cannot be
executed in this focused fixture. The installer-pinned mihomo full-review corpus
compiles the exact manifest expressions with the monolith's gojq integration;
retain separate behavioral fixtures for representative documents.

Before relying on the airborne helper, exercise it on a device while reviewing
plugin logs: it reaches `bsbsb.top` and replays to `grpc.biliapi.net`, and
neither is covered by any fixture.
