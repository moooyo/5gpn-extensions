# Ad Platform Blocker

License: [`CC-BY-NC-SA-4.0`](../LICENSES/CC-BY-NC-SA-4.0.txt)

This is a normal, disabled-by-default `5gpn.io/v1` native extension. It blocks
selected advertising-platform requests at the request phase. It is a narrow
foundation for application-specific ad-removal extensions, not a claim to block
every advertisement.

Install it from the Console with **Install from URL**:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/ad-platform-blocker/extension.yaml
```

This public raw URL is installable directly. For a private fork, use the Console's local-add/upload flow or an operator-controlled public HTTPS mirror; never embed repository credentials in an extension URL.

Enabling it requests interception for the 277 hosts in `traffic.captureHosts`
and activates 201 reviewed typed routing rules. It has no settings, persistent
storage, network origins, upstream mappings, or egress-group requirement. The
three Pinduoduo path actions return `{ abort: true }` without reading a body.
Host-wide blocking is owned exclusively by the typed routing rules, which run
before capture and may `REJECT` or use the pinned narrow `DIRECT` exceptions.

## Pinned upstream

The port is based on the following immutable upstream snapshot:

| Field | Value |
| --- | --- |
| Repository | `mihoyo-typ/KeleeOne` |
| Upstream name | `Plugin/BlockAdvertisers.lpx` (Ad Platform Blocker) |
| Commit | `ab6c3182fb2b09bcc34456f496282ec0b8e9217b` |
| Raw URL | `https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/BlockAdvertisers.lpx` |
| Size | 9,494 bytes |
| SHA-256 | `3974936ec21be3675db2496bdcbf05fa20af8f0be8c105e61bbada9b86e01c3e` |
| Upstream file date | `2025-09-16 13:41:39` |
| Fetch and port review date | `2026-07-22` |

The upstream is a Loon LPX profile. 5gpn does not parse or emulate LPX at
runtime; this directory records a reviewed native translation of that exact
snapshot.

The upstream `Loon` branch HEAD was rechecked on `2026-07-22` and remains the
pinned `ab6c3182fb2b09bcc34456f496282ec0b8e9217b` commit. The most recent
commit that changed `Plugin/BlockAdvertisers.lpx` is
`d218662ec4d85d6578fa30a2df8bbf167b5d9823`; its file bytes are identical to
the pinned HEAD artifact above. The native version changed because the capture
translation was corrected, not because the upstream LPX bytes changed.

## License and attribution

This native extension is adapted material from the pinned
`mihoyo-typ/KeleeOne` `Plugin/BlockAdvertisers.lpx` snapshot. The adaptation
changes the Loon LPX rules into a strict `5gpn.io/v1` manifest and native
request-abort script, explicitly acquires every bounded domain selector, and
splits the Pinduoduo URL rejects into host-specific RE2 actions.

The upstream is licensed under
[CC BY-NC-SA 4.0](../KELEEONE-LICENSE.md). This port is therefore provided
under CC BY-NC-SA 4.0: attribution to the upstream must be retained, use must
be non-commercial, and adapted material must be shared under the same license.
The source file's `#!author` metadata credits 可莉🅥 (`iKeLee`) and links to
<https://github.com/luestr/ProxyResource/blob/main/README.md>; that supplied
creator identification is retained here and in the repository notices.

The pinned upstream license is
`https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/LICENSE`.
It is 21,286 bytes with SHA-256
`047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98`
and was verified on `2026-07-22`.

## Coverage and translation

The selected rules cover the advertising-delivery portions of Tencent GDT and
Tencent Music, ByteDance/Pangle, Kuaishou, Baidu Union/MobAds, Alibaba/Tanx,
JD, Meituan, Xiaomi, NetEase, Pinduoduo, and smaller domestic platforms. It
also includes AppLovin, Unity Ads, Tapjoy, Vungle, Moloco, InMobi, Adjust,
Sigmob, TradPlus, Supersonic, and other dedicated ad-platform domains from the
same source.

| Upstream LPX form | Native 5gpn translation |
| --- | --- |
| `DOMAIN,host,REJECT` | Exact typed `domain` routing rule with `action: reject`. |
| `DOMAIN-SUFFIX,suffix,REJECT` | Typed `domainSuffix` routing rule plus both `suffix` and `*.suffix` capture entries, covering the apex and children exactly as mihomo does. |
| Keyword, CIDR, composite, and `DIRECT` forms | Bounded typed keyword/IP selectors with the pinned action; no raw mihomo string or proxy-group name is accepted. |
| Pinduoduo `[Rewrite]` reject URL | Exact capture host and a separate HTTPS request action with an equivalent anchored `pathRegex`. |

The 201 normalized routing effects contain 88 exact-domain rules and 102
suffix-rule effects over 101 distinct suffixes. Each suffix now contributes
both an exact apex and a child-only wildcard. Exact routing hosts already
covered by one of those wildcards are not duplicated. Together with the three
Pinduoduo path-only hosts, this produces 277 unique capture hosts. Exact hosts
already covered by a retained wildcard are not duplicated solely for a
redundant request action. The native port does not duplicate unconditional
domain and suffix rejects as request
scripts: those effects are already guaranteed by the same enabled transaction's
typed routing rules.

## Typed routing parity

All 201 unique effects from the pinned `[Rule]` section are represented as
reviewed typed routing rules, including exact domains, suffixes, keywords,
composite keyword/suffix conditions, the IPv4 CIDR reject, and the narrowly
scoped `DIRECT` exceptions. They are not raw mihomo strings and cannot name an
operator proxy group. They activate only after the extension enable review and
are removed transactionally when the extension or MITM master is disabled.

Every exact `domain` selector and both the apex and child wildcard of every
bounded `domainSuffix` selector are now present in `traffic.captureHosts`.
This fixes the earlier translation in which suffix apexes and the bounded
suffixes used by composite rules could be absent from DNS steering. Ten
keyword-only rules have no safe finite DNS host set to declare, so they still
apply only when matching traffic already reaches the gateway through another
route. The `47.110.187.87/32` rule is retained for routing parity, but a capture
host is a DNS name: this extension does not acquire hard-coded IP traffic.
Clients that connect directly to that address without otherwise traversing the
gateway remain outside the extension's reach.

The LPX `[MitM]` stanza remains metadata rather than an imported configuration;
`traffic.captureHosts` is its native replacement for the three path-specific
Pinduoduo request actions.
The pinned upstream intentionally includes push, crash-reporting, attribution,
installation, monitoring, location, and telemetry endpoints where it provides
exact domain rules. They are ported unchanged when native host matching can
express them, including Bugly, Getui, JPush, Umeng, OpenInstall, and Adjust.
Operators should expect those blocks to affect crash reporting, push delivery,
attribution, telemetry, or application behaviour.

## Updating the port

1. Fetch `Plugin/BlockAdvertisers.lpx` from a specific new upstream commit;
   never update from a moving branch URL.
2. Record its commit, raw URL, SHA-256, upstream file date, and review date in
   the **Pinned upstream** table.
3. Diff `[Rule]`, `[Rewrite]`, and `[MitM]` against the pinned snapshot.
4. Update the `ad-platform-blocker` URL, digest, and version in
   `scripts/sync-routing-rules.mjs`, run that generator, then review every
   normalized exact, suffix, keyword, composite, CIDR, and `DIRECT` result.
   Keep every action matcher within its own `captureHosts` list.
5. Translate a URL reject only when its host is explicit and its URL predicate
   can be represented safely by an anchored RE2 `pathRegex`. Do not turn a
   URL path into a host-wide block.
6. Exclude only behavior that cannot be expressed faithfully, retain the
   `<=512` capture-host and `<=256` routing-rule limits, and update the coverage
   text when the review changes.
7. Run the migration and verification commands below, then install the reviewed
   raw manifest as disabled before enabling it on production traffic.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.ad-platform-blocker`; bump `metadata.version` for every immutable manifest or script change. |
| Current manifest | `version=2.1.0`; `persistentStorage=false`; `settings=0`; `captureHosts=277`; `actions=3`; `routingRules=201`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateless. `persistentStorage` is false and there are no extension settings. |
| Reviewed capability baseline | 277 capture hosts, 201 typed routing rules (194 `REJECT` and seven `DIRECT`), three request actions, no network origins or upstream mappings, and no required egress binding. The `DIRECT` rules deliberately bypass the ordinary operator target and capture path for their narrow matches. |
| Operator state | A normal same-ID update retains `capture_dns` and execution position. Record both before rollout. |
| Ordering | The upstream profile requires this blocker to run first. Confirm the first Console execution position before every enable and review every overlap with its domains or `DIRECT` exceptions. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No data conversion is required. |

### Repeatable migration

1. Complete the playbook's baseline/candidate record, including the exact rule,
   capture-host, and action additions and removals.
2. Update the generator's immutable URL, SHA-256, and version together. Run the
   generator without `--check`, inspect the manifest diff, then run
   `npm run routing:check`.
3. Re-audit `[Rule]`, `[Rewrite]`, `[MitM]`, the top-of-order requirement,
   capture acquisition, all `DIRECT` exceptions, and every excluded selector.
4. Synchronize this README, `scripts/validate.mjs`, licenses, notices,
   `REUSE.toml`, fixtures, and `metadata.version` in the same change.
5. Apply the candidate only while the installed extension is disabled. Confirm
   the retained `capture_dns`, move it to the first execution position if
   necessary, review the expanded or reduced routing transaction, and enable
   first on an authorized test device.

### Rollback

The publisher prepares a revert-forward manifest before rollout. It must retain the same ID,
restore the reviewed routing, capture-host, and action sets, use a new version
incremented above the failing candidate, and pass the same generator and fixture
gates. Disable the failing candidate, apply the exact rollback digest through
the normal update path, confirm its first execution position, and enable it
only after the baseline counts and focused blocking checks pass. Emergency
reinstall from an old immutable manifest is
safe for extension data because this extension is stateless, but it loses
operator state such as `capture_dns` and execution position.

## Verification

From the repository root, run:

```powershell
node tests/ad-platform-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "ad-platform fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

For runtime-facing changes, also run the current core parser gate from the
shared migration playbook.

For a focused review, confirm that `extension.yaml` has 277 capture-host
entries, 201 typed routing rules, and three path-specific request actions. Every
bounded suffix must have both its apex and `*.suffix` capture entries, every
`actions[].match.hosts` entry must be covered by `traffic.captureHosts`,
`block.js` must contain only the native `transform(context)` entry point, and
the three Pinduoduo actions must retain their host-specific anchored path
predicates. Also verify that the ten keyword-only selectors and the hard-coded
IPv4 rule are documented as routing-only for traffic already reaching the
gateway. Then import the manifest disabled in the Console, review the
capture-host transaction, and enable it only on a test device first.
