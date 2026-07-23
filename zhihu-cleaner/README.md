# Zhihu Cleaner

License: [`CC-BY-NC-SA-4.0`](../LICENSES/CC-BY-NC-SA-4.0.txt)

This directory contains an authorized native `5gpn.io/v1` port of the reviewed
Zhihu Loon plugin. It removes selected transport configuration, advertising,
promotion, navigation, membership, and recommendation fields. It is not
compiled into either 5gpn daemon and is not installed or enabled automatically.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/zhihu-cleaner/extension.yaml
```

This public raw URL is directly installable. For a private fork, use the
Console's local-add/upload flow or an operator-controlled public HTTPS mirror;
never embed repository credentials in an extension URL. Review the immutable
snapshot digest, five capture hosts, six actions, and interception boundary
before enabling it.

## Pinned upstream

The authoritative distribution URL is the mutable upstream file
`https://kelee.one/Tool/Loon/Lpx/Zhihu_remove_ads.lpx`. The upstream does not
publish this exact 2026 snapshot from a stable public Git ref. The reviewed
immutable source is therefore the earliest byte-identical synchronized Git
snapshot found during the manual source review:

| Field | Value |
| --- | --- |
| Upstream creator metadata | 可莉🅥 (`iKeLee`), linked to `luestr/ProxyResource` |
| Snapshot repository | `ifflagged/Romeo` synchronized Kelee mirror |
| Pinned commit | `8d0e2791f531d4a02e1bd00d0f64427984bc999a` |
| Commit timestamp | `2026-06-23T16:04:03Z` (`2026-06-24 00:04:03+08:00`) |
| Original path | `Modules/Loon/Kelee/Official/Zhihu_remove_ads.lpx` |
| Upstream metadata date | `2026-06-01 17:11:35`; this metadata predates the final mirrored bytes and is not used as the immutable revision |
| Fetched and reviewed | `2026-07-23` |

Every upstream artifact used for behavior or licensing is pinned below. Each
row binds exactly one immutable raw URL to its byte length and SHA-256 digest.

| Artifact and purpose | Immutable raw URL | Bytes | SHA-256 | Fetched on |
| --- | --- | ---: | --- | --- |
| Reviewed Loon plugin | `https://raw.githubusercontent.com/ifflagged/Romeo/8d0e2791f531d4a02e1bd00d0f64427984bc999a/Modules/Loon/Kelee/Official/Zhihu_remove_ads.lpx` | 4,300 bytes | `8bd1ee2062bc6a04bbbfa742c352e072b82c5cc061d9440cdfeab3fd82523e3d` | `2026-07-23` |
| Upstream CC BY-NC-SA 4.0 legal text | `https://raw.githubusercontent.com/luestr/ProxyResource/d6d0c513ae27495645dde8cfa467804d6e363b8d/LICENSE` | 19,018 bytes | `600ca4e25fe11762b75a97e714707fab48bb778374e92d24c6ca068791661c11` | `2026-07-23` |

The synchronized source snapshot is byte-identical to the canonical upstream
file retrieved during review: 4,300 bytes with the same SHA-256 digest. The
mirror is used only to make the selected bytes immutable; it is not treated as
the creator or licensing authority.

The reviewed native snapshot is:

| Item | Canonical value |
| --- | --- |
| Manifest | `zhihu-cleaner/extension.yaml` — SHA-256 `e4a27aeaed3477dab4f930322a65fdbb0704a6474a48c086d5071f57aacca0df` |
| JSON response transform | `zhihu-cleaner/clean-json.js` — SHA-256 `af001245eae104d16cb29c034d13b6710cbeaa5156fd4ddb4d02639b09f096f6` |
| Synthetic JSON response transform | `zhihu-cleaner/mock-json.js` — SHA-256 `5726d785e4e3eb4b5af29a42d5bc108b1f9d34f561c0cb328d3b746907451cb5` |
| Authorization record | `zhihu-cleaner/AUTHORIZATION.md` — SHA-256 `e1d5d51f898539dfcc96b698adebbf84efbdf7d584b6cf3e1a3e26dd6ff2dc22` |

## Authorization, license, and attribution

The repository maintainer confirmed that explicit permission was obtained from
the upstream rights holder to modify the selected plugin and publicly
redistribute this native port. The durable project-side record is
[`AUTHORIZATION.md`](AUTHORIZATION.md). Publication is conditioned on the
retained authorization evidence permitting modification, public
redistribution, and the license stated here.

This native adaptation is distributed under Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International (`CC BY-NC-SA 4.0`). It
retains the source file's creator identification, remains non-commercial,
marks the native changes, and applies the same license to the adaptation. No
endorsement by the creator, the source host, or any mirror is implied.

See the repository's [Kelee-derived license boundary](../KELEEONE-LICENSE.md)
and [local legal text](../LICENSES/CC-BY-NC-SA-4.0.txt). The pinned upstream
license is 19,018 bytes with SHA-256
`600ca4e25fe11762b75a97e714707fab48bb778374e92d24c6ca068791661c11`.

## Port mapping

The upstream contains 26 rewrite directives: 11 synthetic empty-object
responses and 15 JSON response transformations. The native port consolidates
them into six structured actions without expanding the capture boundary.

| Upstream behavior | Native 5gpn mapping |
| --- | --- |
| `[MitM]` hosts `api.zhihu.com`, `m-cloud.zhihu.com`, `page-info.zhihu.com`, `www.zhihu.com`, and `zhida.zhihu.com` | The same five exact names are the complete `traffic.captureHosts` list. No wildcard or accidental `api.com`/`page-info.com` alternative is acquired. |
| Eleven `reject-dict` directives | Three request actions group the exact API, web, and Zhida path sets. `mock-json.js` verifies the host and path again, then returns status 200, `Content-Type: application/json`, and body `{}`. The duplicated token on the upstream `commercial_api` line is normalized to one synthetic response. |
| `m-cloud` configuration `drop_keys` JQ program | `clean-m-cloud-config` removes the same 17 HTTPDNS/QUIC config keys and removes `delayHttpdns`, `dnsParser`, and `HTTPDNS` only from retained object-valued configs. Arrays, scalars, and unrelated fields remain unchanged. |
| Root-tab whitelist | `clean-json.js` keeps only `follow`, `recommend`, `hot`, and `ring_tab`, preserving their order and unrelated response fields. |
| Two `topstory/recommend` JQ directives | One ordered native branch first keeps only `ComponentCard` entries, then removes `children` entries whose `id` is `ring`. |
| Question feeds and comment roots | Exact response branches remove root-level `ad_info` or `atmosphere_voting_config`; identically named nested fields are preserved. |
| Answer detail directives on API and page-info hosts | `clean-answer-responses` removes `third_business` and `float_search_word`, then removes `card` segments. API answer URLs with a query also receive the generic content-field removals, preserving the upstream overlap. |
| Queried article/answer/pin detail directive | The API branch removes root-level `third_business`, `ring_info`, and `interaction_bar_plugins`; answer handling is combined with the answer-specific directives above. |
| Comment header and podcast directives | Exact response branches remove `continuous_consumption_module` or `banners`. |
| Search recommendation, result, and tab directives | The native response branch keeps only `normal` recommended queries, removes root-level `pendant`, and keeps the same 11 reviewed tab identifiers. |
| `people/self` directive | The native response branch removes only `vip_info.entrance_new.right_button` and `vip_info.entrance_v2`, preserving sibling values. |
| Loon metadata | Name and purpose become native metadata. Creator, version-date caveat, immutable bytes, authorization, and update provenance remain in this README. |

The upstream has no external `[Script]` dependency. Both native transforms are
immutable local files and expose only `transform(context)`.

## Deliberately not ported and limitations

- Loon-only presentation fields such as `openUrl`, tag, icon, homepage, minimum
  Loon version, and empty system constraints have no native runtime effect.
- The upstream URL alternation can spell `api.com` and `page-info.com`, but
  those names are outside its `[MitM]` list. This port intentionally acquires
  only the five declared Zhihu hosts.
- The literal `%7D`, one-digit version matchers, query delimiters, parameter
  order, and end anchors are preserved even where they appear unusual. Future
  upstream API changes can therefore stop a rule from matching.
- A matched malformed JSON response is logged without body content and left
  unchanged. Structural mismatches and already-clean responses are no-ops.
- Text response actions accept at most 8 MiB. Larger bodies fail the native
  body limit before script execution.
- Synthetic responses always return an empty JSON object. Clients that require
  a different status or response schema may behave differently after an API
  change.
- The extension requests no storage, origin-scoped network access, upstream
  mapping, routing rule, setting, or operator egress binding.
- Interception still requires the global MITM master and an authorized test
  device that trusts the interception root. Certificate pinning, encrypted
  application payloads, protocol changes, or traffic outside ports 80 and 443
  can prevent transformation.

## Updating from upstream

1. Select one upstream version manually. Do not poll the plugin store or bind
   the manifest to a mutable runtime script.
2. Retrieve only the reviewed canonical `Zhihu_remove_ads.lpx`, record its byte
   length and SHA-256, and locate or create an authorized immutable Git
   snapshot of exactly those bytes.
3. Confirm that the retained authorization covers the selected replacement
   and still permits modification, public redistribution, and the documented
   license.
4. Diff metadata, every rewrite directive, and `[MitM]` independently. Record
   exact added, removed, and changed directive counts.
5. Map every accepted behavior into bounded native matchers and local
   `transform(context)` code. Document exclusions instead of adding Loon or
   other proxy-client compatibility globals.
6. Recheck all capture hosts, permissions, action counts, path boundaries,
   overlap behavior, fixtures, notices, `REUSE.toml`, and marketplace metadata.
7. Bump `metadata.version` whenever immutable manifest or script bytes change,
   then refresh all source and local digests in the same change.

To verify the selected upstream bytes with PowerShell:

```powershell
$sourceUrl = 'https://raw.githubusercontent.com/ifflagged/Romeo/8d0e2791f531d4a02e1bd00d0f64427984bc999a/Modules/Loon/Kelee/Official/Zhihu_remove_ads.lpx'
$sourcePath = Join-Path $env:TEMP ("Zhihu_remove_ads-" + [guid]::NewGuid().ToString('N') + '.lpx')
try {
  Invoke-WebRequest -UseBasicParsing -ErrorAction Stop -Uri $sourceUrl -OutFile $sourcePath
  $sourceInfo = Get-Item -LiteralPath $sourcePath
  $sourceHash = Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256
  if ($sourceInfo.Length -ne 4300 -or $sourceHash.Hash -ne '8BD1EE2062BC6A04BBBFA742C352E072B82C5CC061D9440CDFEAB3FD82523E3D') {
    throw 'Zhihu_remove_ads.lpx size or SHA-256 mismatch'
  }
  $sourceInfo | Select-Object Length
  $sourceHash
} finally {
  [System.IO.File]::Delete($sourcePath)
}
```

Refresh local artifact digests with:

```powershell
Get-FileHash zhihu-cleaner/extension.yaml -Algorithm SHA256
Get-FileHash zhihu-cleaner/clean-json.js -Algorithm SHA256
Get-FileHash zhihu-cleaner/mock-json.js -Algorithm SHA256
```

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection and authorization remain a manual review
decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.zhihu-cleaner`; bump `metadata.version` for every immutable manifest or script change. |
| Current manifest | `version=1.0.0`; `persistentStorage=false`; `settings=0`; `captureHosts=5`; `actions=6`; `routingRules=0`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateless. `persistentStorage` is false. |
| Settings | None. A same-ID update has no extension setting values to migrate. |
| Reviewed capability baseline | Five exact capture hosts, three request actions, three response actions, two local scripts, and no network origins, mappings, routing rules, or egress requirement. |
| Operator state | A normal update retains `capture_dns` and execution position; both still require review before enable. |
| Ordering | Review every other extension that captures a listed Zhihu host. Request and response actions execute in configured extension order. |
| Authorization gate | Confirm the retained upstream permission covers the candidate bytes and documented public redistribution terms before implementation or publication. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No extension data conversion is required. |

### Repeatable migration

1. Complete the shared playbook record with the exact LPX bytes, authorization,
   rewrite counts, five capture hosts, six actions, and stateless contract.
2. Diff every synthetic response, matcher, JQ expression, deletion path, and
   MITM hostname. Treat removals as explicit decisions.
3. Synchronize immutable source and local digests, authorization scope,
   attribution, license mapping, notices, fixtures, limitations, marketplace
   metadata, and `metadata.version` in one change.
4. Run the focused fixtures, full repository gates, upstream verification, and
   current core parser integration gate.
5. Apply the candidate while disabled, inspect the complete host and action
   summary, review extension ordering, and enable only on an authorized test
   device.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the
reviewed five-host, six-action baseline with a version incremented above the
failing candidate. Apply it while disabled, review ordering and `capture_dns`,
then rerun every synthetic-response and JSON fixture before enable. Emergency
reinstall from an old immutable manifest is data-safe because the extension is
stateless, but it loses execution position, `capture_dns`, and installed source
identity.

## Verification

For each update:

1. Verify both upstream raw artifacts against the documented byte lengths and
   SHA-256 digests.
2. Import the candidate through **Install from URL** or the explicit update
   flow and confirm it remains disabled.
3. Confirm exactly five capture hosts, six actions, zero settings, zero network
   origins, zero mappings, zero routing rules, and no egress requirement.
4. Exercise all 11 synthetic response endpoints and all 15 JSON directives,
   including the overlapping answer and topstory cases.
5. Exercise wrong hosts, version-width mismatches, query-order changes,
   lowercase `%7d`, malformed JSON, absent fields, non-object values, and a
   large bounded response.
6. Run the repository and current core parser gates before publication.

The repository-local gates are:

```powershell
node tests/zhihu-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "Zhihu fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

Run the current 5gpn core parser integration command from
[`MIGRATION.md`](../MIGRATION.md) after the local gates pass.
