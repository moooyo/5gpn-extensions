# YouTube Application Cleaner

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This directory contains a bounded native `5gpn.io/v1` implementation of the
reviewed application-layer behavior in Maasea's YouTube module. It is not
compiled into either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml
```

For a private fork, use the Console's local-add/upload flow or an
operator-controlled public HTTPS mirror. Never embed repository credentials in
an extension URL.

## Implemented behavior

The extension captures only `*.googlevideo.com` and
`youtubei.googleapis.com`. It implements these request and response actions:

| Endpoint | Native behavior |
| --- | --- |
| `*.googlevideo.com/initplayback...&oad` | Returns an empty HTTP 200 response. |
| `/youtubei/v1/browse` | Removes learned feed advertisements and optionally translates eligible YouTube Music lyrics or descriptions. |
| `/youtubei/v1/next` | Applies the same bounded feed-advertisement classifier. |
| `/youtubei/v1/search` | Applies the same bounded feed-advertisement classifier. |
| `/youtubei/v1/player` | Removes player ad fields, enables picture-in-picture and background playback, and optionally rewrites caption tracks. |
| `/youtubei/v1/reel/reel_watch_sequence` | Removes entries that do not contain a reel overlay. |
| `/youtubei/v1/guide` | Removes the premium-upgrade entry and optional upload, immersive-music, and Shorts entries. |
| `/youtubei/v1/account/get_setting` | Adds the upstream picture-in-picture toggle and background/download capability renderer. |
| `/youtubei/v1/get_watch` | Applies complete player and nested-next cleanup to every returned content message. |

The player transformation removes repeated `adPlacements` field 7 and
`adSlots` field 68, and removes
`playbackTracking.pageadViewthroughconversion` at field path `9/18`. It writes
the pinned picture-in-picture path `2/21/151635310` and background path
`2/11/64657230`. Caption behavior uses player field path `10/51621377`.

Feed cleanup follows the pinned classifier rather than searching decoded text
globally. It examines the first unknown field in each `RichItemContent`, learns
its field number as allowed or blocked after a bounded `pagead` byte scan, and
otherwise examines the known EML and video-content paths. The initial blocked
EML is `inline_injection_entrypoint_layout.eml`; EML values matching
`shorts(?!_pivot_item)` are also removed independently of the guide setting.
The learned field-number and EML lists are stored under
`YouTubeAdvertiseInfo`, schema version `1.0`.

All untouched wire fields, including deprecated protobuf groups, retain their
original bytes. Modified ancestors receive new length framing. Malformed
framing on decoded paths, invalid typed settings, exhausted parser bounds,
storage failure, and requested translation failure are fail-closed. The
contents of `adPlacements` and `adSlots` are intentionally opaque because their
complete field occurrences are removed; malformed data inside those discarded
messages is not separately validated.

## Settings

| Setting | Type | Default | Effect |
| --- | --- | --- | --- |
| `blockUpload` | boolean | `true` | Removes `FEuploads` from the guide. |
| `blockImmersive` | boolean | `true` | Removes `FEmusic_immersive` from the guide. |
| `blockShorts` | boolean | `false` | Removes `FEshorts` from the guide. Feed EML classification is independent. |
| `captionLang` | text | `off` | Uses a bounded language code such as `en` or `zh-Hans`, or disables caption rewriting. |
| `lyricLang` | text | `off` | Translates eligible YouTube Music text through the declared origin. |
| `debug` | boolean | `false` | Logs bounded transformation counters without response content. |

The language settings accept `off` or a bounded language-code shape. The
caption port preserves the pinned track-selection behavior, including its
observable English-priority behavior, and replaces the advertised translation
language list with the pinned eleven entries.

## Network permission

The only script network origin is:

```text
https://translate.google.com
```

The native port sends a token-free HTTPS GET to the origin's
`/translate_a/single` endpoint. It deliberately does not copy the pinned
bundle's Google token generator because that code has unresolved copyleft
provenance. Requests are limited by the native 4,096-byte URL bound and return
through authenticated mihomo SOCKS5.

This token-free endpoint is not a stable public API contract. If Google rejects
or changes it, a requested translation fails closed instead of falling back to
the excluded token implementation.

Enabling this extension requires explicit review of this origin. Any request,
response, setting, or storage data visible to the script can technically be
sent to `https://translate.google.com`; the implementation sends only the
eligible lyric or description text and requested target language.

No operator egress group is required by the upstream behavior. An operator may
still select an egress binding. The manifest declares no upstream host mapping.

## Deliberate native boundaries

- The response body is limited to 16 MiB, transformed output to 32 MiB,
  execution to 10 seconds, message nesting to 64 levels, and decoded fields to
  250,000.
- Ad scanning, cache entries, cached strings, persistent data, strings, and
  translation URLs have additional explicit bounds in the script. Cumulative
  singular-message merge work is capped at 500,000 field references, and
  serialization work is capped at 128 MiB to bound deeply nested rewrites.
- The original module's unlimited `max-size=-1` behavior cannot be represented
  by a bounded native extension.
- The manifest declares the module's two UDP rejects as typed routing rules.
  They are inactive while the snapshot is disabled and become part of the
  reviewed mihomo transaction through the extension enable confirmation.
- Proxy-client globals, notifications, timers, ambient fetch, filesystem,
  processes, and module loaders are not present.
- The native classifier saves discoveries made inside `get_watch`; the pinned
  client wrapper accidentally failed to persist those nested discoveries.
- A player response without `playabilityStatus` still receives ad cleanup, but
  no synthetic playability container is invented.
- An empty caption-track collection is left empty instead of dereferencing a
  missing source track and abandoning the whole player response.
- Duplicate singular embedded messages use a deferred protobuf merge view.
  A no-op response retains its original wire occurrences; once an endpoint
  modifies that merged value, its duplicate occurrences collapse to one merged
  message. Duplicate groups untouched by the business transformation retain
  their original bytes even when a sibling field causes the containing message
  to be rebuilt. Candidate messages and repeated-array entries are visited with
  the pinned wrapper's last-in-first-out traversal order.

Certificate pinning, independently provisioned ECH, unsupported protocols, and
traffic that bypasses the gateway remain outside the extension boundary.

## Pinned upstream

All reviewed artifacts were fetched from the same immutable
`Maasea/sgmodule` commit on `2026-07-20`.

| Artifact | Immutable source | Size | SHA-256 |
| --- | --- | ---: | --- |
| YouTube module | `https://raw.githubusercontent.com/Maasea/sgmodule/26871a1f7b984fa1df39a05b5037898035987239/YouTube.Enhance.sgmodule` | 1,531 bytes | `d7c8ef0a80caaf0ee484cb9350751a3793937e11e073b8100a1002735db1dba0` |
| YouTube response transformer | `https://raw.githubusercontent.com/Maasea/sgmodule/26871a1f7b984fa1df39a05b5037898035987239/Script/Youtube/youtube.response.js` | 123,602 bytes | `750016b75afee112ee5b5e1494982dd1f594996e2ee059b670e9e6c842b0b6a3` |
| Upstream Apache license | `https://raw.githubusercontent.com/Maasea/sgmodule/26871a1f7b984fa1df39a05b5037898035987239/LICENSE` | 11,357 bytes | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |

The pinned module is metadata evidence, not a transitive immutable package: its
`script-path` points to the mutable `master` branch. This port separately pins
and reviews the transformer bytes above.

## Source and license boundary

The local manifest, request action, hand-written wire parser, schema facts, and
native transformations are distributed under Apache-2.0. They retain Maasea
attribution and identify the material changes. The complete local license text
is [`LICENSES/Apache-2.0.txt`](../LICENSES/Apache-2.0.txt). The pinned commit has
no `NOTICE` file.

The pinned transformer is a generated bundle, not reproducible source. At that
commit `Script/Youtube` contains only `youtube.response.js`: there is no current
TypeScript, protobuf source, package manifest, lockfile, build configuration, or
source map. An older, removed source tree used a different protobuf generator
and cannot reproduce this bundle.

The bundle contains an Apache-2.0 `protobuf-ts` runtime of indeterminate
version, a CC0-1.0 TextEncoder/TextDecoder polyfill, and a Google token
implementation traceable through the removed source to an AGPL-3.0-or-later
project. A repository-level Apache license cannot erase those component
boundaries. None of that runtime, polyfill, client adapter, or token code is
copied into this directory. The token-free translation request in the native
port was implemented independently.

## Conversion method

`block-initplayback.js` returns a native synthetic response. `clean-player.js`
contains a standalone wire parser and the minimum pinned schema graph required
to distinguish known and unknown fields. It supports wire types 0 through 5,
uses BigInt-safe field tags, rejects malformed lengths and group framing on
parsed paths, and rebuilds only changed ancestors.

The upstream asynchronous wrapper and these globals were removed:
`$request`, `$response`, `$done`, `$argument`, `$persistentStore`, `$prefs`,
`$httpClient`, `$task.fetch`, `$notification`, and `$notify`. Typed settings,
`context.storage`, and the synchronous origin-scoped
`context.network.request` capability replace the relevant behavior.

## Updating

1. Select a new immutable `Maasea/sgmodule` commit.
2. Fetch `YouTube.Enhance.sgmodule`, `Script/Youtube/youtube.response.js`, and
   `LICENSE` from commit-pinned raw URLs. Record sizes, SHA-256 digests, fetch
   date, tree contents, and any `NOTICE` file.
3. Treat the module's mutable script URL only as metadata. Independently audit
   the exact pinned transformer, dependency licenses, endpoint matcher, schema,
   settings, storage, network behavior, and routing rules.
4. Do not copy generated runtimes, proxy-client adapters, or code whose
   preferred source and license cannot be established.
5. Update bounded field facts and behavior only after independent evidence,
   increment `metadata.version`, and review all capability changes while the
   extension remains disabled.

## Verification

Run the repository checks and the dedicated behavior suite:

```powershell
npm test
node tests/youtube-fixtures.mjs
npm run verify:upstreams
```

Validate the manifest with the current 5gpn core parser integration gate:

```powershell
$env:FIVEGPN_EXTENSIONS_ROOT = 'D:\Code\5gpn-extensions'
Push-Location D:\Code\5gpn\cmd\5gpn-dns
try {
  go test ./... -run TestExternalMaintainedExtensionsAreInstallableFromURL -count=1
} finally {
  Pop-Location
}
```

The dedicated fixtures cover all eight response endpoints, nested `get_watch`
behavior, field preservation, parser failures, settings, storage learning,
caption construction, and the token-free exact-origin translation request.
Perform an authorized-device smoke test while reviewing sidecar logs, origin
permission, persistent state, response-size failures, and the exact
capture-host audit.
