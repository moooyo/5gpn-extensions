# Reddit Cleaner

License: [`GPL-3.0-only`](../LICENSES/GPL-3.0-only.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of a
GPL-licensed Reddit JQ response filter. It is not compiled into either 5gpn
daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/reddit-cleaner/extension.yaml
```

This raw URL is usable only when the repository or an operator-controlled
mirror is reachable without credentials. While the catalog is private, use
the Console's local-add/upload flow; never embed a GitHub token in an extension
URL.

The extension captures only Reddit's two GraphQL hosts. It removes the
promoted-object shapes selected by the pinned JQ program, empties
`commentsPageAds`, and updates three NSFW prompt fields.

## Pinned upstream

The executable behavior is derived from the original GPL-3.0-only JQ source,
not from KeleeOne's repository-level CC license. All files were fetched on
`2026-07-20`.

| Artifact | Immutable source | Size | SHA-256 |
| --- | --- | ---: | --- |
| Reddit JQ program | `https://raw.githubusercontent.com/mist-whisper/JQLang/00944babf9ef1b5e55e87b48df71bd1fc2c855d6/Reddit/Reddit_remove_ads.jq` | 937 bytes | `0c1bbd6a6d21d2558ef64d255608dd288fec46cf82b1645571b82d3b415a8854` |
| Upstream GPL license | `https://raw.githubusercontent.com/mist-whisper/JQLang/00944babf9ef1b5e55e87b48df71bd1fc2c855d6/LICENSE` | 35,149 bytes | `3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986` |
| KeleeOne discovery metadata | `https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Reddit_remove_ads.lpx` | 649 bytes | `ad43525e7d21e6c31c32a704fc1219d0404d31a744c5c8aac960af385a97f4a0` |

The KeleeOne LPX file credits `xream` and identifies the two Reddit GraphQL
hosts and the JQ deployment URL. That metadata is retained for attribution and
discovery provenance. The JQ body in KeleeOne is the same implementation as
the pinned `mist-whisper/JQLang` file after its two distribution-header lines;
the original GPL license therefore controls the ported implementation.

## License and attribution

`clean-response.js` is a JavaScript adaptation of the pinned GPL JQ program.
The complete source for the adaptation is included in this directory, changes
are documented below, and the directory is distributed under GPL-3.0-only.
The complete legal text is in
[`LICENSES/GPL-3.0-only.txt`](../LICENSES/GPL-3.0-only.txt).

Attribution is retained to the `mist-whisper/JQLang` contributors and to
`xream`, who is credited by the LPX metadata. The JQ file itself supplies no
separate personal author line. KeleeOne's CC BY-NC-SA root license is not used
to relicense this GPL implementation.

## Port mapping

| GPL upstream behavior | Native 5gpn mapping |
| --- | --- |
| Operate on Reddit GraphQL JSON | One response action captures only `gql.reddit.com` and `gql-fed.reddit.com`. |
| JQ `walk(...)` | `clean-response.js` traverses arrays and objects bottom-up. |
| `isNsfw == true` | Set `isNsfw` to `false`. |
| `isNsfwMediaBlocked == true` | Set `isNsfwMediaBlocked` to `false`. |
| `isNsfwContentShown == false` | Set `isNsfwContentShown` to `true`. |
| Array-valued `commentsPageAds` | Replace the array with an empty array. |
| `node.cells` contains an ad marker | Remove the containing value. |
| Object-valued `node.adPayload` | Remove the containing value. |
| `__typename == "AdPost"` | Remove the current value. |

The original JQ syntax and proxy runtime are not embedded. The implementation
uses only the native `transform(context)` contract and makes no network or
storage request.

## Deliberately excluded behavior and limitations

- The mutable `kelee.one` URL is never fetched at installation or execution
  time. All executable behavior is part of the immutable extension snapshot.
- The port does not include a general JQ interpreter; it implements only the
  operations used by the pinned Reddit program.
- When a removal predicate selects the document root, the native port returns
  JSON `null` instead of JQ's zero-output `empty`. Nested removals retain the
  intended array-filter and object-delete behavior.
- Malformed, empty, oversized, or newly encoded bodies fail closed under the
  native response-action limits.
- The selectors are structural heuristics. Reddit can change fields, paths,
  hosts, certificate behavior, or response encoding at any time.
- NSFW field changes make content appear acknowledged; they do not perform age
  verification and can expose content hidden behind the original prompt.

## Updating from upstream

1. Select a new `mist-whisper/JQLang` commit intentionally.
2. Fetch `Reddit/Reddit_remove_ads.jq` and `LICENSE` from immutable raw URLs;
   record their sizes, SHA-256 digests, and fetch date.
3. Confirm the GPL license and inspect file-level notices before changing the
   native implementation.
4. Diff every JQ predicate and mutation, map accepted changes manually to
   `clean-response.js`, and document semantic differences.
5. Treat KeleeOne or other plugin catalogs only as discovery metadata. Never
   allow a mirror's root license to override the original GPL source.
6. Update fixtures, provenance, and `metadata.version` in the same change.

One verification pattern is:

```powershell
$commit = '00944babf9ef1b5e55e87b48df71bd1fc2c855d6'
$base = "https://raw.githubusercontent.com/mist-whisper/JQLang/$commit"
foreach ($path in @('Reddit/Reddit_remove_ads.jq', 'LICENSE')) {
  $content = (Invoke-WebRequest -UseBasicParsing -Uri "$base/$path").Content
  $data = [Text.Encoding]::UTF8.GetBytes($content)
  $hash = [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData($data)
  ).ToLowerInvariant()
  "$path`t$($data.Length)`t$hash"
}
```

## Verification

1. Run `npm test` and `npm run verify:upstreams` from the repository root.
2. Confirm the manifest has exactly two capture hosts, one response action,
   and no storage, network, upstream-mapping, or egress permission.
3. Exercise nested objects, arrays, all three ad predicates, all NSFW fields,
   a clean document, malformed JSON, and a selected document root.
4. Enable interception only on an authorized device and confirm unrelated
   Reddit hosts never enter the sidecar.
