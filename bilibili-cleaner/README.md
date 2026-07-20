# Bilibili Cleaner

License: [`GPL-3.0-only`](../LICENSES/GPL-3.0-only.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of the
GPL-licensed `kokoryh/Sparkle` Bilibili extension. It is not compiled into
either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml
```

This raw URL is usable only when the repository or an operator-controlled
mirror is reachable without credentials. While the catalog is private, use
the Console's local-add/upload flow; never embed a GitHub token in an extension
URL.

The extension captures five exact Bilibili API hosts and requests no settings,
persistent storage, network origin, upstream mapping, or required egress
binding.

## Pinned upstream

The authoritative source is `kokoryh/Sparkle` at commit
`70a4914d7189e0a1da4b5839ba5f60d0206edf11`. All files were fetched on
`2026-07-20`.

| Artifact | Immutable source | Size | SHA-256 | Local disposition |
| --- | --- | ---: | --- | --- |
| Loon plugin | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/release/loon/plugin/bilibili.lpx` | 6,157 bytes | `037ee4c9701f8fb7ac851d7cab817d2ba7a682bcafd0585be19ceaf09f364d74` | Native manifest, matchers, settings, and request mocks |
| JSON transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/bilibili.json.js` | 14,229 bytes | `42360d99c512032f312b33427178e1af3fb6d0714e2a756e2838bcdda6189dfa` | Selected behavior reimplemented in `clean-json.js` |
| Protobuf request transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/bilibili.protobuf.request.js` | 43,725 bytes | `b08e1c3cdd174cd75623d5c71014c13bb358d11dc1ba841a22291036fc35f5e7` | Audited; airborne network behavior excluded |
| Protobuf response transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/bilibili.protobuf.response.js` | 91,570 bytes | `c876c2f9272100ecec7d0df2da7a10fee327f923a856e5010ffc775548783d5d` | Audited generated output; deliberately not distributed |
| Live-page transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/webpage.bilibili.js` | 5,608 bytes | `c42938164e4c61fcdcb0c3f25829546a98ee3bc1e60e3a7784c1862536951082` | Audited; DOM behavior excluded |
| Account JQ program | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/jq/bilibili.mine.jq` | 7,636 bytes | `10ca10375b19193fd280deedb7f6219cdce804ea3813ab5fa4f692d02a3238e5` | Bounded subset in `clean-json.js` |
| Tab JQ program | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/jq/bilibili.tab.jq` | 2,091 bytes | `820ef567586a069375f2853db70973a212f391ff0d9008d00fc3b06166bfde26` | Native constant data in `clean-json.js` |
| Sparkle package metadata | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/package.json` | 733 bytes | `318e223146983263a47023435ebe85ebb4c667a14061adf8bc2e6990360d2958` | Confirms author and protobuf-ts 2.11.1 toolchain |
| Sparkle GPL license | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/LICENSE` | 35,148 bytes | `8b1ba204bb69a0ade2bfcf65ef294a920f6bb361b317dba43c7ef29d96332b9b` | Governing upstream license |

The excluded generated Protobuf artifact also contains Apache-2.0
`protobuf-ts` 2.11.1 runtime code. Its pinned license is
`https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/LICENSE`
(10,140 bytes, SHA-256
`5e3400b93bbb099e83e52bab885e7441750673c21f97988ca3f1240639b63283`).

KeleeOne mirrors several of these files and was the discovery catalog for the
initial port. Its repository-level CC license cannot replace Sparkle's
original GPL license, so no KeleeOne CC claim is applied to this directory.

## License and attribution

Sparkle's `package.json` identifies `kokoryh` as author, and the repository is
licensed under GNU GPL version 3. No “or later” grant is supplied, so this
extension uses the conservative SPDX identifier `GPL-3.0-only`. The complete
corresponding source is included in this directory, all native-port changes are
documented here, and the legal text is retained in
[`LICENSES/GPL-3.0-only.txt`](../LICENSES/GPL-3.0-only.txt).

No `protobuf-ts` code is distributed in this directory. Its provenance is
recorded only to explain why the generated response transformer was excluded.

## Port mapping

| GPL upstream item | Native 5gpn mapping |
| --- | --- |
| Loon MITM hosts used by retained behavior | Five exact `traffic.captureHosts`; every action repeats only hosts it owns. |
| `/pgc/page/channel` header rewrite | `rewrite-channel.js` changes only `mobi_app=iphone` to `iphone_i`. |
| Three base64 gRPC mocks | `mock-grpc.js` returns the pinned binary frames for the three exact RPC paths. |
| Game live-card and live-shopping rejects | Separate request actions return `{}` without creating a cross-product host permission. |
| JSON and JQ response operations | `clean-json.js` implements selected deletes, filters, mocks, and the pinned Sparkle tab layout without a JQ runtime. |
| Proxy-client globals | Removed in favor of native request, response, console, and return values. |

The generated Protobuf response implementation is not distributed. Shipping
only its modified minified build would not provide GPL's preferred form for
modification, while vendoring Sparkle's complete build and schema tree is
outside this extension's narrow maintenance boundary.

## Deliberately excluded behavior and limitations

- The source domain reject rules are routing policy and are not copied into an
  extension capture-host list.
- Protobuf response cleaning is not ported. A future implementation must either
  carry Sparkle's complete corresponding source and build inputs or be based on
  a separately reviewed implementation with an independently valid license.
- The airborne request transformer is not executed. It exports video
  identifiers to `bsbsb.top`, replays a captured request, and requires mutable
  third-party segment data; this port declares no outbound network origin.
- The live-page transformer requires `DOMParser`, which the native sandbox
  does not expose. `live.bilibili.com` is not captured.
- The account JQ program is only partially mapped. The native transform removes
  promotional fields but does not spoof paid VIP status or expiry.
- The JSON feed allowlist is intentionally aggressive and can remove non-ad
  cards outside its accepted card types.
- Invalid JSON is logged and left unchanged. Malformed Protobuf, oversized
  bodies, and runtime failures follow the native fail-closed limits.

## Updating from upstream

1. Select a new `kokoryh/Sparkle` commit intentionally.
2. Fetch the plugin, every retained or audited script/JQ file, `package.json`,
   and `LICENSE` from commit-pinned raw URLs. Record sizes, SHA-256 digests, and
   the fetch date.
3. Recheck the original repository license and every generated dependency;
   never use a mirror's repository-level license to relabel original code.
4. Diff matchers, settings, generated schemas, endpoint mutations, JQ data,
   and outbound behavior independently.
5. Map accepted changes to strict native fields and `transform(context)`.
   Keep action hosts inside `captureHosts` and declare any newly accepted
   network origin explicitly.
6. Update fixtures, provenance, limitations, notices, and `metadata.version`
   in the same change.

One PowerShell verification pattern is:

```powershell
$commit = '70a4914d7189e0a1da4b5839ba5f60d0206edf11'
$base = "https://raw.githubusercontent.com/kokoryh/Sparkle/$commit"
$paths = @(
  'release/loon/plugin/bilibili.lpx',
  'dist/bilibili.json.js',
  'dist/bilibili.protobuf.request.js',
  'dist/bilibili.protobuf.response.js',
  'dist/webpage.bilibili.js',
  'jq/bilibili.mine.jq',
  'jq/bilibili.tab.jq',
  'package.json',
  'LICENSE'
)
foreach ($path in $paths) {
  $content = (Invoke-WebRequest -UseBasicParsing -Uri "$base/$path").Content
  $data = [Text.Encoding]::UTF8.GetBytes($content)
  $hash = [Convert]::ToHexString(
    [Security.Cryptography.SHA256]::HashData($data)
  ).ToLowerInvariant()
  "$path`t$($data.Length)`t$hash"
}
```

## Validation

1. Run `npm test` and `npm run verify:upstreams`.
2. Confirm five capture hosts, seven actions, no settings, and no network or
   storage permission.
3. Exercise all JSON, synthetic response, and channel rewrite fixtures,
   including malformed data.
4. Confirm no proxy-client compatibility global or ambient network API exists.
5. Enable interception only on an authorized device and review the exact host
   audit and sidecar logs.
