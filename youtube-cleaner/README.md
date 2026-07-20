# YouTube Player Ad Cleaner

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This directory contains a manually converted `5gpn.io/v1` extension derived
from Maasea's Apache-2.0 YouTube module and response transformer. It is not
compiled into either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml
```

This raw URL is usable only when the repository or an operator-controlled
mirror is reachable without credentials. While the catalog is private, use
the Console's local-add/upload flow; never embed a GitHub token in an extension
URL.

## Supported scope

The port intentionally implements only behavior that can be expressed and
reviewed reliably in the native extension boundary:

- return an empty HTTP 200 response for `*.googlevideo.com/initplayback`
  requests whose path and query contain `&oad`;
- remove repeated `adPlacements` field 7 and `adSlots` field 68 from binary
  `/youtubei/v1/player` protobuf responses;
- remove `pageadViewthroughconversion` field 18 from the embedded
  `playbackTracking` field 9; and
- apply the same cleanup to player field 2 inside each content field 1 of
  `/youtubei/v1/get_watch` responses.

All unrecognized protobuf fields are retained byte-for-byte. A malformed wire
message fails closed. A valid response with none of the known fields is left
unchanged. The extension declares no persistent storage, network origin,
setting, upstream mapping, or required egress binding.

The broad `*.googlevideo.com` capture permission follows the authoritative
module's dynamic media-host matcher. The request action itself remains limited
to the `initplayback` path signature.

## Pinned upstream

All source and license files were fetched from the same immutable
`Maasea/sgmodule` commit on `2026-07-20`.

| Artifact | Immutable source | Size | SHA-256 |
| --- | --- | ---: | --- |
| YouTube module | `https://raw.githubusercontent.com/Maasea/sgmodule/26871a1f7b984fa1df39a05b5037898035987239/YouTube.Enhance.sgmodule` | 1,531 bytes | `d7c8ef0a80caaf0ee484cb9350751a3793937e11e073b8100a1002735db1dba0` |
| YouTube response transformer | `https://raw.githubusercontent.com/Maasea/sgmodule/26871a1f7b984fa1df39a05b5037898035987239/Script/Youtube/youtube.response.js` | 123,602 bytes | `750016b75afee112ee5b5e1494982dd1f594996e2ee059b670e9e6c842b0b6a3` |
| Upstream Apache license | `https://raw.githubusercontent.com/Maasea/sgmodule/26871a1f7b984fa1df39a05b5037898035987239/LICENSE` | 11,357 bytes | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |

KeleeOne contains a mirror of the same generated script with an added
attribution header. The body matches the pinned Maasea source, so Maasea's
original Apache-2.0 license is the licensing authority for this port; a mirror
repository's root license cannot replace it.

## License and attribution

The upstream module and transformer are Apache-2.0 licensed. This modified
native port is distributed under Apache-2.0, retains attribution to Maasea,
identifies all material changes below, and includes the complete license in
[`LICENSES/Apache-2.0.txt`](../LICENSES/Apache-2.0.txt). The pinned upstream
commit has no `NOTICE` file, so there is no additional upstream NOTICE text to
reproduce.

The changes are substantial: Surge metadata and proxy-client globals were
removed, unsupported features were omitted, and the retained map-local and
protobuf operations were manually reimplemented as bounded
`transform(context)` actions. No generated upstream runtime or client adapter
is copied into this directory.

## Conversion method

`block-initplayback.js` returns a native synthetic response directly.
`clean-player.js` parses only protobuf wire framing and applies these fixed
field paths from the pinned Apache source:

```text
Player.adPlacements                          field 7  -> remove
Player.playbackTracking                      field 9  -> inspect
PlaybackTracking.pageadViewthroughconversion field 18 -> remove
Player.adSlots                               field 68 -> remove
Watch.contents                               field 1  -> inspect each Content
Content.player                               field 2  -> apply Player cleanup
```

The local implementation preserves unknown fields instead of embedding the
upstream generated schema, translator, or compatibility wrapper.

## Capabilities not ported

The following upstream features are deliberately absent:

- heuristic removal from browse, next, search, Shorts, and music responses;
- guide and settings mutations that hide upload, Shorts, immersive, or upgrade
  controls;
- picture-in-picture, background playback, caption, lyric, or premium-feature
  mutations;
- Google Translate requests and all other ambient network behavior; and
- the module's QUIC reject rules. A native extension cannot install global
  routing rules; QUIC controls remain an operator decision.

This extension is not a promise to remove every YouTube promotion or unlock
paid features. YouTube can change its private protobuf schema at any time.
Certificate pinning, independently provisioned ECH, unsupported protocols, and
traffic that bypasses the gateway remain outside the extension boundary.

## Updating

1. Select a new immutable `Maasea/sgmodule` commit.
2. Fetch `YouTube.Enhance.sgmodule`, `Script/Youtube/youtube.response.js`, and
   `LICENSE` from commit-pinned raw URLs. Record sizes, SHA-256 digests, and the
   fetch date; also check whether a `NOTICE` file has appeared.
3. Review module rules, host matchers, protobuf schema, and response behavior
   independently. Do not import proxy-client globals or generated adapters.
4. Update only field paths supported by clear schema evidence, document newly
   omitted or supported behavior, and increment `metadata.version`.
5. Install the candidate while disabled and review all immutable digests,
   capture hosts, and trust changes before enabling it.

One PowerShell verification pattern is:

```powershell
$commit = '26871a1f7b984fa1df39a05b5037898035987239'
$base = "https://raw.githubusercontent.com/Maasea/sgmodule/$commit"
foreach ($path in @('YouTube.Enhance.sgmodule', 'Script/Youtube/youtube.response.js', 'LICENSE')) {
  $content = (Invoke-WebRequest -UseBasicParsing -Uri "$base/$path").Content
  $data = [Text.Encoding]::UTF8.GetBytes($content)
  $hash = [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData($data)
  ).ToLowerInvariant()
  "$path`t$($data.Length)`t$hash"
}
```

## Verification

- Run `npm test` and `npm run verify:upstreams`.
- Verify `/player` fixtures containing fields 7, 9/18, and 68 while unrelated
  fields remain byte-identical.
- Verify `/get_watch` fixtures with multiple content messages and ensure only
  nested player messages change.
- Verify malformed and truncated protobuf bodies fail closed and an ad-free
  response returns no patch.
- Perform an authorized-device smoke test while reviewing sidecar logs and the
  exact capture-host audit.
