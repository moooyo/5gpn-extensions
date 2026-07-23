# YouTube Application Cleaner

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This directory contains a bounded native `5gpn.io/v1` behavioral port of the
reviewed YouTube module at `Maasea/sgmodule` commit
`65075cdb388fc5e3094afd7e7314c67b243f3525`. It is not compiled into either
5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml
```

For a private fork, use the Console's local-add/upload flow or an
operator-controlled public HTTPS mirror. Never embed repository credentials in
an extension URL.

## Implemented behavior

The extension captures only `*.googlevideo.com` and
`youtubei.googleapis.com`. It separately declares the exact
`https://init-stream.maasea.workers.dev` network origin so the native runtime
can authorize and disclose the reviewed cross-origin request rewrite.

| Endpoint | Native behavior |
| --- | --- |
| `*.googlevideo.com/initplayback...&ack` request | Parses the bounded Onesie request, compares `encryptedClientKey` with the cached platform key, and either rewrites the request to the pinned bundle's Worker URL or clears that platform cache and returns an empty HTTP 200 response so the client can fall back to `v1/player`. |
| `/youtubei/v1/log_event` request | Removes `Content-Encoding`; before a platform key is known, also removes `x-youtube-hot-hash-data`. The sidecar normally removes content encoding while decoding the request before script execution, so the native action is often a no-op for that header. |
| `/youtubei/v1/browse`, `/next`, `/search` responses | Applies the learned bounded feed-advertisement classifier. |
| `/youtubei/v1/player` response | Removes player ad fields, enables picture-in-picture and background playback, and optionally rewrites caption tracks. |
| `/youtubei/v1/reel/reel_watch_sequence` response | Removes only entries whose `adClientParams.isAd` value is true. |
| `/youtubei/v1/guide` response | Removes the premium-upgrade entry and optional upload, immersive-music, and Shorts entries. |
| `/youtubei/v1/account/get_setting` response | Adds the upstream picture-in-picture toggle and background/download capability renderer. |
| `/youtubei/v1/get_watch` response | Applies player and nested-next cleanup to every returned content message. |
| `/youtubei/v1/config`, `/log_event` responses | Reads the pinned Onesie hot-config path and stores complete `clientKey`/`encryptKey` pairs separately for YouTube and YouTube Music. The response body is not rewritten. |

The player transformation removes repeated `adPlacements` field 7 and
`adSlots` field 68, removes
`playbackTracking.pageadViewthroughconversion` at field path `9/18`, and writes
the pinned picture-in-picture path `2/21/151635310` and background path
`2/11/64657230`. Caption behavior uses player field path `10/51621377`.

Feed cleanup examines the first unknown field in each `RichItemContent`, learns
its field number as allowed or blocked after a bounded `pagead` byte scan, and
otherwise examines the pinned EML and video-content paths. The initial blocked
EML is `inline_injection_entrypoint_layout.eml`; EML values matching
`shorts(?!_pivot_item)` are removed independently of the guide setting. This
state is stored under `YouTubeAdvertiseInfo`, schema version `1.0`.

The latest pinned module removed its former lyric-translation argument and
Google Translate behavior. This native version therefore has no lyric setting
and does not declare the former translation origin. Its sole network origin is
the Onesie Worker required by the cross-origin request rewrite.

## Onesie Worker and network permission

The pinned request bundle sends a matched encrypted playback request to:

```text
https://init-stream.maasea.workers.dev/
```

The native port reproduces that behavior with a request URL patch, not with
`context.network.request`. The rewritten query discloses the cached
`clientKey`, the complete original `initplayback` URL, the selected caption
language, and the pinned module's fixed boolean defaults to that service. The
original URL can contain playback tokens and other request metadata. The
`encryptKey` remains in extension-scoped storage and is used locally only to
decide whether the request key matches.

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
an external trust decision. Repository fixtures verify the URL construction,
cache transitions, protobuf paths, and failover response, but they do not prove
that the live Worker decrypts and cleans every real YouTube Onesie stream.

The manifest declares the Worker as an exact `permissions.network.origins`
entry. The native runtime requires that reviewed origin before allowing this
cross-origin request patch, and the single enable confirmation warns that all
data visible to the scripts could be sent there. This permission also exposes
the synchronous `context.network.request` capability for the Worker origin to
every script in this extension, although the current implementation never
calls it. That broader same-origin capability is part of the operator's trust
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
| `captionLang` | text | `off` | Uses a bounded language code such as `en` or `zh-Hans`, or disables caption rewriting. The value is also disclosed to the external Worker on matched Onesie requests. |
| `debug` | boolean | `false` | Logs bounded transformation counters without response or key content. |

The caption port preserves the pinned track-selection behavior, including its
observable English-priority behavior, and replaces the advertised translation
language list with the pinned eleven entries.

## Persistent state

The extension uses two bounded storage values:

- `YouTubeAdvertiseInfo` contains the versioned feed field/EML allow and block
  lists.
- `YouTubeConfig` contains at most the `youtube` and `youtubeMusic` key pairs
  learned from complete config responses.

Malformed JSON, unknown platform keys, invalid base64, storage failure, and
oversized values fail closed. A mismatched or missing initplayback key returns
the pinned empty response; a mismatch also removes only the affected platform
entry so a later `config` or `log_event` response can repopulate it.

The storage API has no compare-and-swap transaction. Concurrent YouTube and
YouTube Music key updates, or an update racing an initplayback cache removal,
can overwrite the other platform slot after both actions read the same older
value. A later complete config response repopulates the missing slot; clearing
`YouTubeConfig` forces both platforms to relearn their keys.

## Deliberate native boundaries

- Response bodies are limited to 16 MiB, initplayback request bodies to 4 MiB,
  transformed output to 32 MiB, response execution to 10 seconds,
  initplayback execution to 1 second, log-event request execution to 250 ms,
  message nesting to 64 levels, and decoded fields to 250,000. The request
  envelope is separately limited to 16 levels and 4,096 fields. The rewritten
  Worker URL is limited to 16,384 characters and each decoded key to 4,096
  bytes.
- Ad scanning, cache entries, cached strings, persistent data, merge work, and
  serialization work have additional explicit bounds. The upstream module's
  unlimited `max-size=-1` behavior cannot be represented by a bounded native
  extension.
- The pinned module removed its former UDP reject rules. This manifest follows
  that capability set and does not add native routing rules.
- Proxy-client globals, notifications, timers, ambient fetch, filesystem,
  processes, sockets, cryptographic globals, and module loaders are absent.
- Debug output deliberately reports only bounded counters; it does not reproduce
  the upstream wrapper's saved-key JSON log.
- The request script parses the minimum Onesie envelope path `3/5`; the
  response script parses the key path
  `1/16/7/138536474/146311580/{1,2}`. Unknown wire fields are preserved in
  response bodies and skipped in requests within parser bounds.
- Although the manifest must express the CDN boundary as
  `*.googlevideo.com`, the request script rechecks the pinned single-label
  hostname and `&ack` URL pattern before applying the Onesie rewrite.
- A player response without `playabilityStatus` still receives ad cleanup, but
  no synthetic playability container is invented. An empty caption-track
  collection remains empty.
- Duplicate singular embedded messages use a deferred protobuf merge view. A
  no-op response retains its original wire occurrences; once a decoded value is
  modified, duplicate occurrences collapse to one merged message. Untouched
  duplicate groups retain their original bytes.
- The native classifier persists discoveries made inside `get_watch`; an older
  upstream client wrapper did not persist those nested discoveries.

Certificate pinning, independently provisioned ECH, unsupported protocols,
live Worker behavior, and traffic that bypasses the gateway remain outside the
extension boundary.

## Pinned upstream

The artifact set was fetched, and the reviewed branch head and immutable commit
were independently rechecked, on `2026-07-22`. All distributed provenance is
bound to immutable raw URLs:

| Artifact | Immutable source | Size | SHA-256 |
| --- | --- | ---: | --- |
| YouTube module | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/YouTube.Enhance.sgmodule` | 1,665 bytes | `9c7464733c54417da36aff09482d1287cee5ecd531ad856842912704b5b3f64d` |
| YouTube request transformer | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/Script/Youtube/youtube.request.js` | 44,024 bytes | `3ecca15e06e76a31720092c581180f648ef2c45e494644941ba985c878efbb26` |
| YouTube response transformer | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/Script/Youtube/youtube.response.js` | 132,973 bytes | `f98483d5f5017514f82502253c0db5ce2d4ffb7839887aa2cadc22666f5a7f12` |
| Upstream Apache license | `https://raw.githubusercontent.com/Maasea/sgmodule/65075cdb388fc5e3094afd7e7314c67b243f3525/LICENSE` | 11,357 bytes | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |

The pinned module is metadata evidence, not a transitive immutable package:
its `script-path` values point to the mutable `master` branch. This port
separately pins and reviews both transformer files.

## Source and license boundary

The local manifest, request parser, response wire parser, schema facts, and
native transformations are distributed under Apache-2.0. They retain Maasea
attribution and identify the material changes. The complete local license text
is [`LICENSES/Apache-2.0.txt`](../LICENSES/Apache-2.0.txt). The pinned commit has
no `NOTICE` file.

The two pinned transformers are generated bundles, not reproducible preferred
source. At this commit `Script/Youtube` contains only `youtube.request.js` and
`youtube.response.js`: there is no corresponding TypeScript/protobuf source,
package manifest, lockfile, build configuration, or source map. The bundles
include an Apache-2.0 `protobuf-ts` runtime and a CC0-1.0
TextEncoder/TextDecoder polyfill. None of those generated runtimes, polyfills,
or proxy-client adapters is copied into this directory; the native code is a
hand-written behavioral port.

The external Worker is not a distributed artifact and no Worker-derived code
is included. Because its source and license are absent, it is documented as an
external service dependency rather than represented as rebuildable local
source.

## Conversion method

`request-handler.js` implements bounded protobuf envelope parsing, platform key
selection, header removal, cache transition, and a permission-gated
cross-origin URL patch.
`clean-player.js` contains a standalone wire parser and the minimum reviewed
schema graph required to distinguish known and unknown response fields. It
supports wire types 0 through 5, uses BigInt-safe field tags, rejects malformed
length and group framing, and rebuilds only changed ancestors.

The upstream asynchronous wrappers and these globals were removed:
`$request`, `$response`, `$done`, `$argument`, `$persistentStore`, `$prefs`,
`$httpClient`, `$task.fetch`, `$notification`, and `$notify`. Typed settings and
`context.storage` replace the relevant local behavior. The declared Worker
origin provides both the cross-origin rewrite authorization and a synchronous
network capability; these scripts use only the rewrite path.

## Updating

1. Resolve and record a new immutable `Maasea/sgmodule` commit; do not trust the
   module's mutable `master` script URLs.
2. Fetch `YouTube.Enhance.sgmodule`, both `Script/Youtube` bundles, `LICENSE`,
   and any newly added `NOTICE` from commit-pinned raw URLs. Record raw byte
   sizes, SHA-256 digests, fetch date, and the complete YouTube source tree.
3. Re-audit endpoint matchers, settings, storage keys, protobuf paths, request
   rewrite destinations, routing rules, generated dependency licenses, and all
   data disclosed to external services.
4. Do not copy generated dependency code or any artifact whose preferred
   source and license obligations cannot be satisfied. Keep every external
   service limitation explicit.
5. Update the bounded native behavior and fixtures, increment
   `metadata.version`, and review all changed capabilities while the extension
   remains disabled.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.youtube-cleaner`; bump `metadata.version` for every immutable manifest or runtime-script change. |
| Current manifest | `version=3.0.0`; `persistentStorage=true`; `settings=5`; `captureHosts=2`; `actions=3`; `routingRules=0`; `networkOrigins=1`; `upstreamMappings=0`; `egressRequired=false`. |
| Settings | Preserve the five current keys and types when possible. A normal update retains only values that remain valid under the candidate definitions. |
| State class | Stateful. Keep `persistentStorage: true` during normal migration and rollback. |
| Advertisement cache | `YouTubeAdvertiseInfo` is a non-authoritative version `1.0` cache. An incompatible schema may reset and relearn only when that behavior is documented and tested. |
| Key configuration | `YouTubeConfig` contains sensitive YouTube and YouTube Music `clientKey`/`encryptKey` pairs. Never copy values into migration records or logs. An incompatible format requires an additive versioned key and dual-read strategy. |
| Reviewed capability baseline | Two capture-host patterns, three actions, five settings, one exact Worker origin, no routing rules, and no required egress binding. |
| Operator state | A normal same-ID update retains valid settings, `capture_dns`, execution position, and the ID-scoped storage bucket while storage permission remains enabled. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. The baseline must remain able to read retained state or safely relearn it. |

### Repeatable migration

1. Complete the playbook record for both upstream bundles, all ten response
   endpoints, both request paths, five settings, two storage schemas, the
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

Run the repository checks and the dedicated behavior suite:

```powershell
node tests/youtube-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "YouTube fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

Validate runtime-facing changes with the current 5gpn core parser integration
gate in the shared migration playbook.

The dedicated fixtures cover all ten response endpoints, both request actions,
platform key learning, cache match/mismatch behavior, Worker URL encoding,
Shorts `isAd`, nested `get_watch`, field preservation, parser failures,
settings, captions, and feed learning. These are synthetic protobuf fixtures,
not an authorized-device or live-Worker integration test. Before relying on
the encrypted playback path, perform a device smoke test while reviewing
sidecar logs, capture-host and network-origin review, cache regeneration,
response-size failures, and the exact data sent to the Worker.
