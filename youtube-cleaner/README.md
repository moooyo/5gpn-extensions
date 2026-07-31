# YouTube Application Cleaner

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This directory runs the reviewed YouTube module from `Maasea/sgmodule` commit
`65075cdb388fc5e3094afd7e7314c67b243f3525` directly: the manifest points at
that commit's own transformer bundles rather than at a local reimplementation
of them. Nothing here is compiled into either 5gpn daemon, and nothing is
installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml
```

For a private fork, use the Console's local-add/upload flow or an
operator-controlled public HTTPS mirror. Never embed repository credentials in
an extension URL.

## What changed, and why

Earlier revisions hand-ported this module into native `transform(context)`
scripts: a bounded protobuf envelope parser, a standalone wire parser, and a
reviewed schema graph, together about 61,000 bytes of local code that had to be
re-derived from the bundles on every upstream release.

The runtime now supports the upstream contract directly, so the extension loads
the same two bundles upstream publishes and tracking a release means changing a
pinned URL and its recorded digest. The behavior is upstream's, not an
approximation of it.

The trade is explicit and is the operator's to accept. The native port bounded
what it would parse — 16 MiB responses, 64 levels of message nesting, 250,000
decoded fields, a 16-level and 4,096-field request envelope — and refused
anything past those limits. The bundle has no such internal ceilings; what
remains are the action-level limits the manifest declares, which cap the body
handed to the bundle and the wall-clock it may spend, but not what it does
inside. Upstream's own module declares `max-size=-1`, meaning no cap at all;
this manifest keeps the caps.

## Implemented behavior

The extension captures only `*.googlevideo.com` and
`youtubei.googleapis.com`, and declares the exact
network permission the reviewed cross-origin request rewrite to
`https://init-stream.maasea.workers.dev` needs.

Three actions mirror the three `[Script]` entries in the pinned module:

| Action | Upstream entry | Body | Bound |
| --- | --- | --- | ---: |
| `prepare-onesie-initplayback` | `youtube.request.init` | binary | 4 MiB / 1 s |
| `prepare-youtube-log-event` | `youtube.request.log_event` | binary | 4 MiB / 1 s |
| `clean-youtube-response` | `youtube.response` | binary | 16 MiB / 10 s |

All three use `entry: proxy-compat`. The runtime presents itself as Loon and
supplies `$argument`, `$request`, `$response`, `$done`, `$persistentStore`,
`$httpClient`, `$notification`, `$utils`, `$environment`, and `$script`. The
bundles probe for a client and take their Loon branch.

Settings reach the bundle as a decoded object, which is what Loon hands a
script. Nothing is serialized into a string, so the declared types cross intact
and there is no per-publisher encoding to get wrong.

Upstream passes only `captionLang` to the initplayback entry and nothing at all
to `log_event`; this runtime passes the full settings object to every action.
That is the one place the wiring is deliberately broader than the published
module, and it is not free. `log_event` never reads the parameters at all, but
the initplayback entry forwards every parameter it holds to the external Worker,
so the three block toggles leave this gateway with the operator's configured
values where the published module always sends the bundle's own literals. The
section below states exactly what that query contains.

## Onesie Worker and network permission

The pinned request bundle sends a matched encrypted playback request to:

```text
https://init-stream.maasea.workers.dev/
```

The bundle does this itself. On a cache hit it calls `$done({url})` with
`https://init-stream.maasea.workers.dev/?ck=<clientKey>&target=<original URL>`
followed by every key of its parameter object, so the gateway follows a
rewritten request URL rather than the script making an outbound call. That query
discloses the cached `clientKey`, the complete original `initplayback` URL, and
all four parameters the bundle holds: `captionLang`, `blockUpload`,
`blockImmersive`, and `blockShorts`. Because this manifest passes the settings to
this action, those three booleans carry the operator's configured values, where
upstream — which passes only `captionLang` here — always sends the bundle's own
`true`, `true`, `false`. An operator who keeps the defaults therefore sends the
query upstream sends, and one who changes a toggle discloses that choice.
The original URL can contain playback tokens and other request
metadata. The `encryptKey` remains in extension-scoped storage and is used
locally only to decide whether the request key matches.

A cross-host request patch also preserves the original HTTP method, decoded
binary request body, and end-to-end request headers. The sidecar removes
hop-by-hop/framing headers, but it does not generally remove cookies,
authorization fields, client identifiers, or other application headers before
forwarding to the Worker. Operators must therefore treat every part of the
matched initplayback request as disclosed to that service, not only the query
parameters listed above.

The Worker implementation, deployment revision, build inputs, and license are
not present in the pinned `Maasea/sgmodule` tree. This repository does not copy
or claim to reproduce that service. Its behavior can change independently of
the immutable JavaScript pin, and its availability and privacy properties are
an external trust decision. No fixture here covers any of it: the URL
construction described above was read out of the pinned bundle rather than
asserted by a test, and nothing in this repository proves the live Worker
decrypts and cleans real YouTube Onesie streams.

The manifest declares the Worker as an exact `permissions.network.origins`
entry. The native runtime requires that reviewed origin before allowing this
cross-origin request patch, and the single enable confirmation warns that all
data visible to the scripts could be sent there. This permission also exposes
the `context.network.request` and `context.network.requestAsync` capabilities
for the Worker origin to every script in this extension, although the bundles
never call them. That broader same-origin capability is part of the operator's trust
decision and must not be interpreted as proof that the Worker is safe.

No operator egress group is required by the reviewed module behavior. An
operator may still select an egress binding. The manifest declares no upstream
host mapping or typed mihomo routing rule.

## Settings

| Setting | Type | Default | Effect |
| --- | --- | --- | --- |
| `blockUpload` | boolean | `true` | Removes `FEuploads` from the guide. |
| `blockImmersive` | boolean | `true` | Removes `FEmusic_immersive` from the guide. |
| `blockShorts` | boolean | `false` | Removes `FEshorts` from the guide; feed classification remains independent. |
| `captionLang` | text | `off` | Uses a Google Translate language code such as `en` or `zh-Hans`, or disables caption rewriting. |

Every setting is disclosed to the external Worker on a matched
Onesie request, because the request bundle appends its whole parameter object to
that URL. See [Onesie Worker and network
permission](#onesie-worker-and-network-permission).

Caption handling — the track-selection order, its observable English priority,
and the advertised translation language list — is the bundle's own behavior and
is not re-specified here.

### Why there is no `debug` setting

Upstream's argument block declares `debug`, and this extension declared it too
through `5.0.x` for parity. It was removed in `5.1.0` because at this pin it
provably does nothing, and a console toggle that cannot move anything is worse
than an absent one: the operator cannot tell it apart from a broken one.

Two independent reasons, either sufficient on its own:

1. The Loon branch resolves arguments with
   `decodeParams(e){ for(let t of Object.keys(e)){ let n=$argument?.[t]; n!==void 0&&(e[t]=n) } }`.
   It iterates the keys of the bundle's *own defaults literal*, which is
   `{captionLang:"off", blockUpload:!0, blockImmersive:!0, blockShorts:!1}` in
   both bundles. A key absent from that literal is never fetched from
   `$argument`, so `debug` never reaches the parameter object.
2. The bundles do read a `debug` property, but off the third argument to the
   logger constructor (`this.isDebug = n?.debug ?? !1`), and the only
   instantiation is `getInstance("YouTube")` — one argument. The third is
   always `undefined`, so `isDebug` is always false.

Even wired, it would only gate `console.log` verbosity; it changes no
interception behavior. Upstream's own module has the same property, so this is
a deliberate divergence from `[Argument]` parity rather than an oversight.

Restore it only when a re-pin makes it real: check that the new bundles' defaults
literal contains `debug`, or that the logger is constructed with an options
argument. `scripts/validate.mjs` fails if the key reappears without that check.

## Persistent state

The extension uses two bounded storage values:

- `YouTubeAdvertiseInfo` contains the versioned feed field/EML allow and block
  lists.
- `YouTubeConfig` contains at most the `youtube` and `youtubeMusic` key pairs
  learned from complete config responses.

Malformed JSON, unknown platform keys, invalid base64, storage failure, and
oversized values are the bundle's own error paths, not a contract this
repository enforces. A mismatched or missing initplayback key returns its
pinned empty response; a mismatch also removes only the affected platform entry
so a later `config` or `log_event` response can repopulate it.

The storage API has no compare-and-swap transaction. Concurrent YouTube and
YouTube Music key updates, or an update racing an initplayback cache removal,
can overwrite the other platform slot after both actions read the same older
value. That is a property of the storage API rather than of the bundle. A later
complete config response repopulates the missing slot; clearing `YouTubeConfig`
forces both platforms to relearn their keys.

## Pinned upstream

The artifact set was fetched, and the reviewed branch head and immutable commit
were independently rechecked, on `2026-07-22`. All distributed provenance is
bound to immutable raw URLs:

| Artifact | Immutable source |
||
| YouTube module | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/YouTube.Enhance.sgmodule` |
| YouTube request transformer | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/Script/Youtube/youtube.request.js` |
| YouTube response transformer | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/Script/Youtube/youtube.response.js` |
| Upstream Apache license | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/LICENSE` |

The pinned module is metadata evidence, not a transitive immutable package:
its `script-path` values point to the mutable `master` branch. This port
separately pins and reviews both transformer files.

## Source and license boundary

The manifest and this documentation are distributed under Apache-2.0, retaining
Maasea attribution. The complete local license text is
[`LICENSES/Apache-2.0.txt`](../LICENSES/Apache-2.0.txt). The pinned commit has
no `NOTICE` file.

No upstream code is copied into this directory. The two transformers are
fetched by the gateway from the immutable raw URLs recorded above and pinned by
digest, so this repository references them rather than redistributing them.
They are generated bundles with no corresponding preferred source at that
commit: `Script/Youtube` contains only the two `.js` files, with no
TypeScript/protobuf source, package manifest, lockfile, build configuration, or
source map. They embed an Apache-2.0 `protobuf-ts` runtime and a CC0-1.0
TextEncoder/TextDecoder polyfill.

The external Worker is not a distributed artifact and no Worker-derived code is
included. Because its source and license are absent, it is documented as an
external service dependency rather than represented as rebuildable local source.

## Updating

1. Resolve and record a new immutable `Maasea/sgmodule` commit; do not trust the
   module's mutable `master` script URLs.
2. Fetch `YouTube.Enhance.sgmodule`, both `Script/Youtube` bundles, `LICENSE`,
   and any newly added `NOTICE` from commit-pinned raw URLs. Record raw byte
   fetch date, and the complete YouTube source tree.
3. Re-audit endpoint matchers, settings, storage keys, protobuf paths, request
   rewrite destinations, routing rules, generated dependency licenses, and all
   data disclosed to external services.
4. Do not copy generated dependency code or any artifact whose preferred
   source and license obligations cannot be satisfied. Keep every external
   service limitation explicit.
5. Update the pinned URLs, sizes, and digests, increment `metadata.version`,
   and review all changed capabilities while the extension remains disabled.
   The bundles are the runtime, so a new pin is a new implementation.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.youtube-cleaner`; bump `metadata.version` for every immutable manifest or runtime-script change. |
| Current manifest | `version=5.1.0`; `persistentStorage=true`; `settings=4`; `captureHosts=2`; `actions=3`; `routingRules=0`; `network=true`; `upstreamMappings=0`; `egressRequired=false`. |
| Settings | Preserve the four current keys and types when possible. `debug` was removed in `5.1.0`; see "Why there is no `debug` setting" before re-adding it. A normal update retains only values that remain valid under the candidate definitions. |
| State class | Stateful. Keep `persistentStorage: true` during normal migration and rollback. |
| Advertisement cache | `YouTubeAdvertiseInfo` is a non-authoritative version `1.0` cache. An incompatible schema may reset and relearn only when that behavior is documented and tested. |
| Key configuration | `YouTubeConfig` contains sensitive YouTube and YouTube Music `clientKey`/`encryptKey` pairs. Never copy values into migration records or logs. An incompatible format requires an additive versioned key and dual-read strategy. |
| Reviewed capability baseline | Two capture-host patterns, three proxy-compat actions, four settings, one exact Worker origin, no routing rules, and no required egress binding. |
| Operator state | A normal same-ID update retains valid settings, `capture_dns`, execution position, and the ID-scoped storage bucket while storage permission remains enabled. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. The baseline must remain able to read retained state or safely relearn it. |

### Repeatable migration

1. Complete the playbook record for both upstream bundles, all ten response
   endpoints, both request paths, four settings, two storage schemas, the
   Worker URL and disclosure, capture hosts, protobuf paths, and exclusions.
2. Keep `YouTubeAdvertiseInfo` schema-compatible, or write an additive new key
   while retaining the rollback-readable `1.0` value. If reset-and-relearn is
   chosen, test first-run, rollback, malformed, oversized, and concurrent
   cache-update behavior.
3. Do not repurpose `YouTubeConfig` in place. A format change must use a new
   versioned key, read the old key during the transition, validate complete key
   pairs, and leave the old value untouched for rollback. Never expose key
   material in fixtures, console output, or review evidence.
4. Re-audit the Worker origin, query data, forwarded headers, permission scope,
   failure response, and live-service limitation whenever request behavior
   changes. A JavaScript pin does not pin the external Worker deployment.
5. Synchronize all raw artifacts, sizes, digests, fetch date, licenses, notices,
   `REUSE.toml`, validator pins, storage documentation, fixtures, and version in
   the same change.
6. Apply the candidate while disabled without uninstalling the extension or
   removing storage permission. Confirm retained settings and state behavior,
   review the Worker permission again, then exercise cache learning and both
   platforms before enable.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the baseline request,
response, settings, storage-reader, Worker, and permission behavior with a new
version incremented above the failing candidate. Before rollout, prove that it
can read the candidate's retained state
or safely reset and relearn only the non-authoritative cache. Disable the
failing candidate, apply the exact rollback digest, verify both platform slots,
cache learning, mismatch failover, and Worker URL construction, then enable
only after focused tests pass. Do not use uninstall/reinstall as routine
rollback: it loses installed control-plane values and can make extension state
unavailable or prune it. If state loss is ever intended, review and test that
as a separate migration. A public-catalog operator has no immediate safe
rollback when no publisher candidate is available; disable the extension and
preserve its installation and storage permission until one is reviewed.

## Verification

Run the repository checks:

```powershell
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
```

Both transformer URLs name an immutable commit, which is what binds the bytes a
gateway fetches. Nothing re-downloads them to compare against a recorded
digest.

What this repository can no longer assert is what the bundles do. The previous
revision shipped synthetic protobuf fixtures over local code; that code is
gone, and running upstream's own bundle against fabricated bodies would test
upstream, not this manifest. What is tested here is the wiring: the manifest
shape, the pinned digests, and the routing projection. Behavior is upstream's
to test.

Before relying on the encrypted playback path, perform a device smoke test
while reviewing sidecar logs, capture-host and network-origin review, cache
regeneration, response-size failures, and the exact data sent to the Worker. A
JavaScript pin does not pin the external Worker deployment.
