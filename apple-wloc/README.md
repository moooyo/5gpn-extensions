# Apple WLOC Location Override

License: [`MIT`](../LICENSES/MIT.txt)

This is a normal URL-installable `5gpn.io/v1` extension. It is not compiled
into either 5gpn daemon and is not installed or enabled automatically. It is
intended only for authorised device, application, and network testing.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/apple-wloc/extension.yaml
```

This raw URL is usable only when the repository or an operator-controlled mirror is reachable without credentials. While the catalog is private, use the Console's local-add/upload flow; never embed a GitHub token in an extension URL.

## Source and provenance

`wloc.js` is a 5gpn port derived from the WLOC protobuf-response transformer
in [`FFF686868/proxypin-wloc-spoofer`][upstream] at the immutable commit
[`edee9b955f673cc8c4a52eb0a9c687a2e25dde4a`][upstream-commit]. The upstream
project is MIT licensed; its attribution and license text are retained in this
repository's [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).

The provenance is supported by all of the following repository records:

- `wloc.js` identifies that project in its source header.
- `THIRD_PARTY_NOTICES.md` records the same repository and commit.
- 5gpn commit `9449c54d6e1bb0a50e27cb13694775f83b661fa8` introduced this
  extension and its JavaScript port.

This is not a byte-for-byte copy of the upstream ProxyPin script. 5gpn keeps
the bounded binary parsing and field-rewrite approach, but replaces the
ProxyPin-specific runtime, picker, session storage, bundled `pako`, response
headers, and gzip handling with the native extension contract and the
interception runtime's bounded decoded `Uint8Array` response body.

At the time this document was written, the canonical 5gpn source record was:

| Item | Canonical value |
| --- | --- |
| Core migration baseline | `moooyo/5gpn@7ca3eb93b7cd552ff3f32adfd9eca4b177d772db` |
| Manifest | `apple-wloc/extension.yaml` — SHA-256 `92b2ac5bfd594ec947eb06dc88df37b8227ecdf2e67f7f5e7ecd20085eeb3572` |
| Script | `apple-wloc/wloc.js` — SHA-256 `5d7c096228960be2b77b8e1d28173d16c6b8e285855a63fc035a6a0cbd16d36f` |
| Upstream script URL | `https://raw.githubusercontent.com/FFF686868/proxypin-wloc-spoofer/edee9b955f673cc8c4a52eb0a9c687a2e25dde4a/proxypin_wloc_compat_v2.js` |
| Upstream script | `proxypin_wloc_compat_v2.js` at the pinned commit — SHA-256 `d8ae57eb8696af05413e3fbbf0bd57513a4f649407a1d0a7bb891916482fca70` |
| Upstream license URL | `https://raw.githubusercontent.com/FFF686868/proxypin-wloc-spoofer/edee9b955f673cc8c4a52eb0a9c687a2e25dde4a/LICENSE` |
| Upstream license | MIT, 1,083 bytes, SHA-256 `e4a68eac74fbad2e6be287c43b836d21723280eaa6203df65dd23a5f377417fa` |
| Upstream copyright | `Copyright (c) 2026 WLOC ProxyPin Contributors` |
| Upstream fetch date | `2026-07-20` |

The recorded 5gpn revision is provenance, not a release pin. For an installed
extension, the Console's reviewed immutable snapshot digest is the authority.

## License and attribution

The upstream transformer and this adapted port are distributed under the MIT
License. The upstream copyright and permission notice are retained verbatim in
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md). The project MIT text for
new repository material is in [`LICENSES/MIT.txt`](../LICENSES/MIT.txt), and
the file-level mapping is in [`REUSE.toml`](../REUSE.toml).

The upstream script embeds pako, but this native port does not copy or bundle
pako. HTTP content decoding is performed by the 5gpn interception runtime, so
the upstream pako and zlib notices do not apply to files distributed in this
extension.

## Algorithm and format boundary

The extension intercepts successful HTTPS responses from only
`gs-loc.apple.com` and `gs-loc-cn.apple.com` at `/clls/wloc`. It treats the
response as an observed WLOC binary framing followed by protobuf wire-format
messages; Apple has not provided a public schema or stability contract for
this response.

The port performs the following bounded transformation:

1. It searches a small, bounded prefix for the observed frame layout: an
   eight-byte prefix, a two-byte big-endian payload length, and the protobuf
   payload. If no framed payload is found, it tries a bounded prefix offset as
   a protobuf root.
2. It parses only protobuf wire types 0, 1, 2, and 5, preserving every raw
   field it does not change.
3. In a candidate location message, varint fields 1 and 2 are latitude and
   longitude scaled by `1e8`; optional field 3 is accuracy. It replaces those
   values with the configured `location` setting.
4. It reaches candidate locations through the observed root-field mapping:
   Wi-Fi entries at field 2 (identified by a MAC-address field) and cellular
   entries at fields 22 and 24, with nested location field 2 or 5 respectively.
5. It rewrites the framing length when needed, rejects malformed or unpatchable
   data, and never invents a success response.

This mapping is an implementation observation inherited from the cited
upstream transformer, not an Apple protocol specification. Treat a changed
Apple response as incompatible until captured authorised test traffic and the
tests below validate a deliberate update.

## Port mapping

| Upstream ProxyPin capability | 5gpn equivalent |
| --- | --- |
| URL matching for the two Apple WLOC endpoints | `traffic.captureHosts` plus the response action's HTTPS host and path matcher |
| ProxyPin response hook and raw body | Native `transform(context)` with `bodyMode: binary` and `context.response.body` |
| ProxyPin picker/session target | Required generic `location` setting, rendered by the Console map picker |
| ProxyPin gzip decoding via bundled `pako` | 5gpn interception runtime's bounded content-decoding pipeline; no bundled script library |
| ProxyPin diagnostic response headers | Sandboxed `console.info` / `console.warn` output |
| ProxyPin permissive error return | `failClosed` setting: enabled by default, or return the original response only when explicitly disabled |

The manifest declares no network origins, no persistent storage, no upstream
mapping, and no required egress-group binding. Captured upstream traffic still
returns through the authenticated mihomo interception egress path.

## Maintenance and updates

1. Review the upstream repository and its license before taking any change.
   Use the pinned commit as the baseline; do not silently track its branch
   head.
2. Compare an upstream candidate against the 5gpn port. Port only relevant
   binary-format logic; do not import ProxyPin runtime APIs, picker pages,
   session state, network access, or bundled dependencies.
3. Preserve the native manifest contract: capture hosts are explicit, scripts
   receive no ambient network access, and the `location` setting remains the
   only source of target coordinates.
4. Update provenance here and in `THIRD_PARTY_NOTICES.md` if the source
   project or pinned commit changes. Keep the source header in `wloc.js`
   accurate.
5. Refresh the canonical source record after every manifest or script change,
   then review the diff and run the verification commands below.

Refresh the revision and SHA-256 values with PowerShell:

```powershell
git rev-parse HEAD
Get-FileHash apple-wloc/extension.yaml -Algorithm SHA256
Get-FileHash apple-wloc/wloc.js -Algorithm SHA256
```

On systems with GNU coreutils, the equivalent is:

```sh
git rev-parse HEAD
sha256sum apple-wloc/extension.yaml apple-wloc/wloc.js
```

To independently refresh the pinned upstream-script digest without checking
out its repository:

```powershell
$ref = 'edee9b955f673cc8c4a52eb0a9c687a2e25dde4a'
$url = "https://raw.githubusercontent.com/FFF686868/proxypin-wloc-spoofer/$ref/proxypin_wloc_compat_v2.js"
$bytes = (Invoke-WebRequest -UseBasicParsing -Uri $url).Content
$hash = [Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($bytes))
-join ($hash | ForEach-Object { $_.ToString('x2') })
```

## Verification

Run the focused native-extension checks after a documentation or implementation
update:

```sh
(cd cmd/5gpn-dns && go test ./... -run 'TestRepositoryWLOCManifestIsInstallableFromURL')
(cd cmd/5gpn-intercept && go test ./... -run 'TestRepositoryWLOCExtensionScriptPatchesBinaryResponse')
bash tests/test_intercept_policy.sh
```

For a runtime change, also run the complete repository gates required by
`AGENTS.md` and perform authorised end-to-end validation following the Apple
WLOC checklist in [`tests/integration-smoke.md`](../../tests/integration-smoke.md).
Confirm both the transformed result and failure behaviour with `failClosed`
enabled and disabled.

## Limitations

- This modifies only eligible network-location responses; it does not modify
  GPS hardware readings. A device can prefer a real location source.
- Apple can change endpoint behaviour, compression, framing, protobuf field
  layout, or server-side validation without notice. The extension then fails
  closed by default rather than claiming compatibility.
- Only the two declared hosts and the action's exact path are in scope. It
  does not intercept other Apple services or change general DNS policy.
- HTTPS interception requires an operator-installed and trusted interception
  certificate, global interception enabled, and device traffic that actually
  reaches the gateway. It cannot affect traffic that bypasses the gateway.
- All authorised devices using one enabled extension receive the same configured
  target. The extension has no per-device identity, GPS simulation, or account
  bypass capability.

[upstream]: https://github.com/FFF686868/proxypin-wloc-spoofer
[upstream-commit]: https://github.com/FFF686868/proxypin-wloc-spoofer/tree/edee9b955f673cc8c4a52eb0a9c687a2e25dde4a
