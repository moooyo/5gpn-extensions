# Spotify Cleaner

License: [`MIT`](../LICENSES/MIT.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of a
reviewed Spotify account-attribute transformer. It is not compiled into either
5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/spotify-cleaner/extension.yaml
```

This public raw URL is installable directly. For a private fork, use the
Console's local-add/upload flow or an operator-controlled public HTTPS mirror;
never embed repository credentials in an extension URL.

The extension captures only `spclient.wg.spotify.com`, declares no setting,
persistent storage, network origin, upstream mapping, or required egress
group, and modifies only successful binary responses on two path families.

## Pinned upstream

The authoritative source is the MIT-licensed `sve1r/Rules-For-Quantumult-X`
repository. All files were fetched on `2026-07-20`.

| Artifact | Immutable source | Size | SHA-256 |
| --- | --- | ---: | --- |
| Spotify transformer | `https://raw.githubusercontent.com/sve1r/Rules-For-Quantumult-X/692aec6a28c0d7c1d44d69febb581632a8175e9f/Scripts/Unlock/Spotify.js` | 110,782 bytes | `627c2ebbaa013b3ff1c511d72ca802f6ddb341ad22521b07aba16fd2977144c4` |
| Upstream MIT license | `https://raw.githubusercontent.com/sve1r/Rules-For-Quantumult-X/692aec6a28c0d7c1d44d69febb581632a8175e9f/LICENSE` | 1,062 bytes | `63814d59a40b61e1090074dac3bbda145d4c0f6a37486b2ef225075880ea2bac` |

The fixed source decodes Spotify's bootstrap and user-customization protobuf
responses and updates account attributes. This native port implements only a
small reviewed subset through a bounded wire-format parser; it does not copy
the upstream protobuf runtime or proxy-client adapter.

## License and attribution

The upstream work is MIT licensed with `Copyright (c) 2020 SVE1R`. The exact
copyright and permission notice is retained in
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md). This native adaptation
and new repository material are also provided under MIT, with the file mapping
recorded in [`REUSE.toml`](../REUSE.toml).

An earlier candidate discovered through KeleeOne pointed to
`001ProMax/Surge@089b43e35a96c6e994e42133ada6067259fdb777/Script/Spotify.Crack.Dev.js`.
That 9,390-byte file has SHA-256
`2599c977bc0799e3177fffee961d46886d75f330a05153e9063fa5746743cc92`,
but the repository has no public license at that revision. It is therefore not
a licensing source for this extension, and features found only in that file
are deliberately absent.

## Port mapping

| MIT upstream behavior | Native 5gpn mapping |
| --- | --- |
| Decode `/bootstrap/v1/bootstrap` protobuf responses | `clean-bootstrap-response` invokes the local bounded binary transformer. |
| Decode `/user-customization-service/v1/customize` responses | `clean-user-customization-response` invokes the same local transformer. |
| Replace account-attribute map entries | `clean-response.js` replaces nine reviewed boolean or string entries: `ads`, `com.spotify.madprops.use.ucs.product.state`, `nft-disabled`, `offline`, `player-license`, `streaming-rules`, `type`, `name`, and `financial-product`. |
| Proxy-client globals and bundled protobuf runtime | Replaced by `transform(context)` and a narrow parser that preserves unrelated fields byte-for-byte. |

The output changes client-observed configuration only. It does not grant,
purchase, or guarantee any server-side subscription, playback right, offline
license, account benefit, or catalog entitlement.

## Deliberately excluded behavior and limitations

- The unlicensed candidate's Pendragon synthetic response, artist-platform URL
  rewrite, Create-tab setting, Handoff setting, side-drawer assignment, and
  `publish-playlist` mutation are not distributed.
- The MIT source contains more account mutations than this port. Only the nine
  entries listed above were retained; future additions require an explicit
  review and fixture.
- The native host permission is the exact `spclient.wg.spotify.com` name.
  Regional `*-spclient.spotify.com` hosts are not widened to `*.spotify.com`.
- A missing required protobuf envelope, malformed wire data, unsupported value
  wrapper, empty body, oversized body, or runtime timeout fails closed.
- Unknown protobuf fields are preserved, but map-entry order can change.
- Spotify can change message schemas, paths, hostnames, certificate behavior,
  or server-side interpretation at any time.

## Updating from upstream

1. Select a new `sve1r/Rules-For-Quantumult-X` commit intentionally; never use
   a branch URL in the manifest or provenance record.
2. Fetch `Scripts/Unlock/Spotify.js` and `LICENSE` from raw URLs pinned to that
   commit. Record byte lengths, SHA-256 digests, and the fetch date.
3. Reconfirm the MIT copyright notice and check for a newly added `NOTICE` or
   file-level license before changing any local code.
4. Diff the bootstrap, customization, schema, and attribute mutations. Port
   only reviewed behavior to the native bounded parser; do not import a proxy
   compatibility runtime or ambient network API.
5. Update the mapping, exclusions, fixtures, and `metadata.version` together.

One PowerShell verification pattern is:

```powershell
$commit = '692aec6a28c0d7c1d44d69febb581632a8175e9f'
$base = "https://raw.githubusercontent.com/sve1r/Rules-For-Quantumult-X/$commit"
foreach ($path in @('Scripts/Unlock/Spotify.js', 'LICENSE')) {
  $bytes = (Invoke-WebRequest -UseBasicParsing -Uri "$base/$path").Content
  $data = [Text.Encoding]::UTF8.GetBytes($bytes)
  $hash = [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData($data)
  ).ToLowerInvariant()
  "$path`t$($data.Length)`t$hash"
}
```

## Verification

1. Run `npm test` and `npm run verify:upstreams` from the repository root.
2. Confirm the manifest has one capture host, two response actions, no
   settings, and no network or storage permission.
3. Exercise both envelope layouts with binary fixtures. Verify all nine values
   and unrelated-field preservation, then test malformed and truncated bodies.
4. Enable interception only on an authorized device and confirm unrelated
   Spotify hosts never enter the sidecar.
