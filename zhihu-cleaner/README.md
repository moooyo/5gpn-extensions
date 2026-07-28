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
snapshot digest, five capture hosts, six actions, five UDP/443 fallback rules,
and interception boundary before enabling it.

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
| Manifest | `zhihu-cleaner/extension.yaml` — SHA-256 `9cd01abfefd0d494385f95cd424ac66eab0b05b26e4f6b1ea671377a557aad87` |
| Synthetic JSON response transform | `zhihu-cleaner/mock-json.js` — SHA-256 `ee60aea99548c5b466cbe0beaeaac554284082503239e3890d8d66c81095b352` |
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
responses and 15 JSON response transformations. The synthetic responses become
three request actions backed by `mock-json.js`. Each JSON transformation becomes
its own `script.jq` action carrying the expression directly, so where this port
agrees with upstream the published program is what runs, and where it diverges
the divergence is visible as one readable expression rather than buried in a
dispatch table. Nothing here expands the capture boundary.

| Upstream behavior | Native 5gpn mapping |
| --- | --- |
| `[MitM]` hosts `api.zhihu.com`, `m-cloud.zhihu.com`, `page-info.zhihu.com`, `www.zhihu.com`, and `zhida.zhihu.com` | The same five exact names are the complete `traffic.captureHosts` list. No wildcard or accidental `api.com`/`page-info.com` alternative is acquired. Five host-scoped UDP/443 reject rules additionally force QUIC fallback on preserved/custom gateway configurations. |
| Eleven upstream `reject-dict` directives plus the current `/root/window` navigation entry | Three request actions group the API, web, and Zhida path sets. `mock-json.js` verifies the host, normalized path, multi-digit versions, and order-independent query values before returning status 200, `Content-Type: application/json`, and body `{}`. The duplicated token on the upstream `commercial_api` line is normalized to one synthetic response; `/root/window` is an explicit compatibility addition requested to remove the Kanshan entry. |
| `m-cloud` configuration `drop_keys` JQ program | `clean-m-cloud-config` removes the same 17 HTTPDNS/QUIC config keys and removes `delayHttpdns`, `dnsParser`, and `HTTPDNS` only from retained object-valued configs. Arrays, scalars, and unrelated fields remain unchanged. |
| Root-tab whitelist | The pinned upstream whitelist retained `ring_tab`. As a deliberate compatibility change, `clean-root-tab` handles both current `/root/tab` and versioned `/root/tab/vN` paths, keeps only `follow`, `recommend`, and `hot`, clears `ring_list`, and sets an existing `tab_ext.is_show_ring` flag to `false`. This removes the top Rings entry while preserving tab order and unrelated response fields. |
| Two `topstory/recommend` JQ directives | The current API returns normal `type=feed` objects rather than only `ComponentCard`. The hardened branch therefore preserves unknown/normal items, removes only explicit ad/commercial markers, and still removes `children` entries whose `id` is `ring`. |
| Question feeds and comment roots | Exact response branches remove root-level `ad_info` or `atmosphere_voting_config`; identically named nested fields are preserved. |
| Answer detail directives on API and page-info hosts | `clean-answer-responses` removes `third_business` and `float_search_word`, then removes `card` segments. API answer URLs with or without a query also receive the generic content-field removals; page-info remains limited to the answer-specific fields. |
| Article/answer/pin detail directive | The API branch accepts queryless and queried multi-digit versions, then removes root-level `third_business`, `ring_info`, and `interaction_bar_plugins`; answer handling is combined with the answer-specific directives above. |
| Comment header and podcast directives | Exact response branches remove `continuous_consumption_module` or `banners`. |
| Search recommendation, result, and tab directives | The native response branch keeps only `normal` recommended queries, removes root-level `pendant`, and uses a deliberate compatibility allowlist that adds `km_general`, `scholar`, and `publication` to the reviewed identifiers. |
| `people/self` directive | The native response branch removes only `vip_info.entrance_new.right_button` and `vip_info.entrance_v2`, preserving sibling values. |
| Loon metadata | Name and purpose become native metadata. Creator, version-date caveat, immutable bytes, authorization, and update provenance remain in this README. |

The upstream has no external `[Script]` dependency, and neither does this port.
`mock-json.js` is the only JavaScript left; every response transform is a jq
expression the sidecar runs without entering the JavaScript runtime at all.

Those expressions are verified against gojq -- the engine that runs them -- in
the sidecar's own jq suite. This repository checks their structure and their
path patterns; it cannot execute them, because Node has no jq.

## Current API compatibility hardening

The original `1.0.0` port proved semantic parity only against synthetic URL
and JSON fixtures. It did not establish live-app parity. A direct public API
review on `2026-07-24` found current API drifts and navigation surfaces:

- `https://api.zhihu.com/root/tab` returns the active root tabs without a
  `/vN` suffix, while the pinned LPX matcher required `/root/tab/v\d`.
- `https://api.zhihu.com/topstory/recommend?limit=20` returns normal
  `type=feed` entries, while the pinned JQ whitelist expected
  `ComponentCard`. Reusing that whitelist would remove the complete current
  feed rather than only advertisements.
- `https://api.zhihu.com/root/window` returns an OGV guide with
  `module_id=homepage_ogv_entry`, icon assets, and a long-content route. The
  native synthetic response removes this remotely configured Kanshan entry.
- Current root-tab responses can expose Rings through `ring_tab`,
  `ring_list`, and `tab_ext.is_show_ring`. The native response transform
  removes or disables all three surfaces without deleting unrelated tabs.

Version `1.2.0` accepts unversioned or multi-digit current paths, optional and
reordered query parameters, lowercase encoded braces, and queryless variants
where the script can still verify semantics. Topstory cleanup is deliberately
conservative: it removes only explicit ad/commercial fields and type markers,
preserving unknown feed structures. Five UDP/443 rules address the bootstrap
case where cached QUIC configuration can bypass the response action that would
otherwise disable QUIC/HTTPDNS.

These observations are compatibility evidence, not an authenticated iOS app
capture. A future change must still record actual device host/path/body shapes
before adding a new destructive response filter.

## Deliberately not ported and limitations

- Loon-only presentation fields such as `openUrl`, tag, icon, homepage, minimum
  Loon version, and empty system constraints have no native runtime effect.
- The upstream URL alternation can spell `api.com` and `page-info.com`, but
  those names are outside its `[MitM]` list. This port intentionally acquires
  only the five declared Zhihu hosts.
- Matchers accept current unversioned/multi-digit paths and common query
  variation, but they remain bounded to reviewed endpoint families. New hosts,
  renamed paths, encrypted payloads, and moved response fields remain no-ops.
- A matched malformed JSON response is logged without body content and left
  unchanged. Structural mismatches and already-clean responses are no-ops.
- Text response actions accept at most 8 MiB. Larger bodies fail the native
  body limit before script execution.
- Synthetic responses always return an empty JSON object. Clients that require
  a different status or response schema may behave differently after an API
  change.
- The extension requests no storage, origin-scoped network access, upstream
  mapping, setting, or operator egress binding. Its only routing effects are
  five exact-domain UDP/443 rejects. They cannot acquire a direct connection
  to a hard-coded HTTPDNS address that never carries a domain association.
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
| Current manifest | `version=2.0.0`; `persistentStorage=false`; `settings=0`; `captureHosts=5`; `actions=18`; `routingRules=5`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateless. `persistentStorage` is false. |
| Settings | None. A same-ID update has no extension setting values to migrate. |
| Reviewed capability baseline | Five exact capture hosts, three request actions, three response actions, five host-scoped UDP/443 reject rules, two local scripts, and no network origins, mappings, or egress requirement. |
| Operator state | A normal update retains `capture_dns` and execution position; both still require review before enable. |
| Ordering | Review every other extension that captures a listed Zhihu host. Request and response actions execute in configured extension order. |
| Authorization gate | Confirm the retained upstream permission covers the candidate bytes and documented public redistribution terms before implementation or publication. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No extension data conversion is required. |

### Repeatable migration

1. Complete the shared playbook record with the exact LPX bytes, authorization,
   rewrite counts, five capture hosts, six actions, five routing rules, and
   stateless contract.
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
reviewed five-host, six-action, five-routing-rule baseline with a version incremented above the
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
3. Confirm exactly five capture hosts, six actions, five routing rules, zero
   settings, zero network origins, zero mappings, and no egress requirement.
4. Exercise all 11 upstream synthetic-response directives, the additional
   `/root/window` response, and all 15 upstream JSON directives, including
   unversioned root tabs, multi-digit versions, reordered queries, overlapping
   answers, current `type=feed`, explicit ad markers, and the separate removal
   of root-tab `ring_tab`, `ring_list`, and `tab_ext.is_show_ring` surfaces.
5. Exercise wrong hosts, invalid query semantics, malformed JSON, absent
   fields, non-object values, repeated transforms, and a large bounded
   response.
6. On the authorized device, request
   `https://api.zhihu.com/commercial_api/5gpn-probe`; a working interception
   chain returns the synthetic body `{}` from `mock-api-json`.
7. Confirm the five UDP/443 rules are active, clear cached Zhihu HTTPDNS/QUIC
   state, and verify at least one real `action completed` log.
8. Run the repository and current core parser gates before publication.

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
