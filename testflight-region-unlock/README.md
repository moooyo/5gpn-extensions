# TestFlight Region Unlock

License: [`CC-BY-NC-SA-4.0`](../LICENSES/CC-BY-NC-SA-4.0.txt)

This directory contains a native `5gpn.io/v1` port of the upstream Loon
plugin. It is not compiled into either 5gpn daemon and is not installed
automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/testflight-region-unlock/extension.yaml
```

This public raw URL is installable directly. For a private fork, use the Console's local-add/upload flow or an operator-controlled public HTTPS mirror; never embed repository credentials in an extension URL.

Before enabling the extension, select the target storefront. The manifest no
longer requires an egress binding, so the extension installs and runs with
defaults; the storefront rewrite, however, only achieves a region unlock when
the connection also leaves through a region compatible with that storefront.
Bind an operator-owned mihomo egress group in a matching region, or route
`testflight.apple.com` there by your own rules. Without one the rewrite still
applies and Apple still sees your real exit region, so the unlock silently does
nothing. The extension cannot name or change the selected group.

## Pinned upstream

| Field | Value |
| --- | --- |
| Repository | `mihoyo-typ/KeleeOne` |
| Upstream name | `TestFlightRegionUnlock.lpx` (`TestFlight Region Unlock`) |
| Pinned commit | `ab6c3182fb2b09bcc34456f496282ec0b8e9217b` |
| Source file last changed | `c8112507802d0690d8b94d4110945e9c782df40e` |
| Latest branch audit | The pinned commit remained the latest `Loon` head on `2026-07-22`; all later commits after the file-level commit left this LPX unchanged. |
| Original file | `Plugin/TestFlightRegionUnlock.lpx` |
| Pinned source URL | `https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/TestFlightRegionUnlock.lpx` |
| Upstream-declared reference URL | `https://kelee.one/Tool/Loon/Lpx/TestFlightRegionUnlock.lpx` |
| Fetched on | `2026-07-22` |

The pinned source is 778 bytes. Its upstream metadata reports version date
`2025-09-02 23:42:06` and Loon version `3.2.1(749)`.

The reviewed native snapshot is:

| Item | Canonical value |
| --- | --- |
| Manifest | `testflight-region-unlock/extension.yaml` |

## License and attribution

This native port is adapted material based on `mihoyo-typ/KeleeOne` and is
provided under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International license (`CC BY-NC-SA 4.0`). It has been modified from the
pinned Loon plugin to use the strict 5gpn manifest, typed settings, an
operator-owned egress binding, and a declarative `script.jq` rewrite.

The source file's `#!author` metadata credits 可莉🅥 (`iKeLee`) and links to
<https://github.com/luestr/ProxyResource/blob/main/README.md>. That supplied
creator identification is retained here and in the repository notices.

Reuse must preserve attribution, remain non-commercial, and distribute
adaptations under the same license. See the repository's
[local license copy](../KELEEONE-LICENSE.md) and the
[pinned upstream LICENSE](https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/LICENSE).
The pinned license was reviewed on `2026-07-22`.

## Port mapping

| Upstream item | Native 5gpn mapping |
| --- | --- |
| `DOMAIN, testflight.apple.com, PROXY` | `traffic.captureHosts` contains only `testflight.apple.com`. The native manifest cannot name `PROXY`, and as of revision 2.2.0 it no longer forces a binding either: the operator routes the host to a compatible region by binding a group or by their own rules. An unrouted install rewrites the storefront and exits from the real region, which is a silent no-op rather than a blocked one. |
| Rewrite URL `^https?://testflight.apple.com/v\d/accounts/.+?/install$` | One request action matches only `testflight.apple.com`, HTTP or HTTPS, exactly one version digit, a non-empty account path, and no query string. Host and scheme are native matcher fields while the path expression preserves the pinned URL boundary. |
| Exact `request-body-replace-regex` for `"storefrontId" : "dddddd-dd,dd",` | A `script.replaceBody` action applies the same kind of regular expression upstream does, so everything it does not match survives byte for byte, including key order and whitespace. The replacement reads the `storefront` setting through `{{settings.storefront}}` and resolves it through the action's `valueMap`, which is how a module that hard-codes one storefront becomes an extension whose operator chooses among ten. A body with no `storefrontId`, or a region absent from the map, is left untouched rather than having a value invented. Revision 2.0.0 substituted a jq program here, which parsed and re-serialized the body and normalized key order as a side effect. |
| Hard-coded `143441-19,29` | The required typed `storefront` select defaults to `US`, preserving upstream behavior, and exposes a finite reviewed region map. |
| `[MitM] hostname=testflight.apple.com` | The exact host is the sole capture permission and therefore the sole interception certificate and traffic-rule host. |
| Loon metadata | Name and purpose become native metadata; attribution and update provenance remain in this README. |

## Storefront mapping

| Setting | Apple storefront ID |
| --- | --- |
| `US` | `143441-19,29` |
| `GB` | `143444-19,29` |
| `CA` | `143455-19,29` |
| `AU` | `143460-19,29` |
| `JP` | `143462-19,29` |
| `HK` | `143463-19,29` |
| `SG` | `143464-19,29` |
| `CN` | `143465-19,29` |
| `KR` | `143466-19,29` |
| `TW` | `143470-19,29` |

Only the `US` value is present in the pinned upstream plugin. The other
storefront values are an explicit native-port extension of that behavior and
must be rechecked independently during future updates.

## Upstream parity and native extensions

Upstream is a single `request-body-replace-regex` directive: it matches
`"storefrontId"\x20:\x20"\d{6}-\d{2},\d{2}",` and rewrites it to
`"storefrontId":"143441-19,29",`. That pattern accepts exactly one spelling —
a single space either side of the colon, and a trailing comma. The native
action carries the same kind of expression,
`"storefrontId"\s*:\s*"[0-9]{6}-[0-9]{2},[0-9]{2}"`, and replaces it with
`"storefrontId":"{{settings.storefront}}"`. On an upstream-formatted body the
two produce the same bytes, and everything the pattern does not match survives
byte for byte, including key order and whitespace.

The following native extensions are deliberate:

- The selected storefront replaces the pinned hard-coded US value. US remains
  the default and the only value sourced from the pinned LPX.
- The native pattern is a superset of upstream's: it accepts arbitrary
  whitespace around the colon and does not require the trailing comma that
  upstream's fixed `\x20` spelling demands. It stops at the closing quote, so
  the comma or whitespace that follows is left alone rather than rewritten.
  Earlier revisions ran a local script that tried the exact upstream syntax
  first and a documented fallback second; this is those two folded into one
  expression.
- A body with no `storefrontId`, or a region absent from the action's
  `valueMap`, is left untouched rather than having a value invented. Nothing is
  reported when that happens: earlier revisions logged an already-correct value
  as an informational no-op, and a declarative action has no script to log
  from.
- The upstream `PROXY` name becomes an optional operator-owned egress binding;
  neither the manifest nor an action can select the group.

## Deliberately not ported and limitations

- Loon-only fields such as `openUrl`, `tag`, `homepage`, icon, minimum Loon
  version, and empty system constraints have no native runtime equivalent.
- The upstream `PROXY` policy is not copied. Native extensions cannot select an
  egress group. The manifest no longer requires one either, so an install with
  no matching regional exit fails open: the rewrite applies, Apple sees the real
  region, and the unlock quietly has no effect.
- Only traffic for `testflight.apple.com` on the native interception ports 80
  and 443 is acquired. The extension does not alter DNS policy for other Apple
  hosts.
- The action changes only the first recognized `storefrontId`. An absent or
  changed field is left untouched, and a missing field is never synthesized.
- Storefront selection and network exit selection are independent operator
  choices. A mismatched, unavailable, or Apple-rejected egress can still make
  installation fail.
- The additional non-US storefront values do not come from the pinned upstream
  file. Apple can change or reject storefront identifiers independently of
  this extension, so maintainers must verify them against live behavior.
- The upstream description claims tvOS support. This port preserves the same
  request matcher but has not independently verified every TestFlight or tvOS
  release. Certificate pinning, protocol changes, or traffic outside the
  native interception boundary can prevent transformation.

This extension requests no persistent storage and no origin-scoped network
permission, and it runs no code: the substitution is declared in the manifest,
so there is no script with a view of the request at all.

## Updating from upstream

1. Choose a new upstream commit intentionally. Never follow the branch head in
   the manifest or this provenance record.
2. Download the exact `Plugin/TestFlightRegionUnlock.lpx` file from the raw
   commit URL and record its fetch date.
3. Diff the new file against the pinned source. Review metadata, `[Rule]`,
   `[Rewrite]`, and `[MitM]` independently.
4. Map every behavioral change to strict native fields or to the jq program.
   Keep every action host within `captureHosts`, keep the egress choice
   operator-owned, and document anything intentionally omitted.
5. Recheck the storefront table if the replacement value or format changed.
   Bump `metadata.version` for any immutable manifest or script change.
6. Update this
   section's commit, URL, digest, date, mapping, limitations, and validation
   evidence in the same change.



## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.testflight-region-unlock`; bump `metadata.version` for every immutable manifest or script change. |
| Current manifest | `version=2.2.0`; `persistentStorage=false`; `settings=1`; `captureHosts=1`; `actions=1`; `routingRules=0`; `network=false`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateless. `persistentStorage` is false. |
| Settings | Preserve `storefront` as a `select` setting. A same-ID update retains its value only while the selected option remains valid. |
| Reviewed capability baseline | One capture host, one request action, no network permission, upstream mappings, or routing rules, and no required operator egress binding. |
| Operator state | A normal update retains the valid storefront, egress binding, `capture_dns`, and execution position; all must still be reviewed before enable. |
| Ordering | Review every other extension that captures `testflight.apple.com`; the first bound extension owns egress and request actions execute in configured order. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No extension data conversion is required. |

### Repeatable migration

1. Complete the playbook record with the LPX matcher, exact replacement syntax,
   storefront options, capture host, action, and egress requirement.
2. Diff `[Rule]`, `[Rewrite]`, and `[MitM]` separately. Recheck every non-US
   storefront value because those values are native extensions rather than LPX
   provenance.
3. Keep the `storefront` key and type stable when possible. If an option is
   removed or renamed, record that the old value will not be retained, verify
   the candidate default, and require explicit reselection when needed.
4. Synchronize the upstream and local digests, provenance, fixtures, notices,
   `REUSE.toml`, limitations, and `metadata.version` in the same change.
5. Apply the candidate while disabled, confirm the retained setting and egress
   binding, review the exact matcher, and exercise every storefront before
   enabling on an authorized test device.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the baseline matcher,
replacement syntax, storefront options, and egress requirement with a new
version incremented above the failing candidate. Apply it while disabled,
confirm that the selected storefront is still
valid, verify the egress binding and execution position, and rerun the exact and
fallback body fixtures before enable. Emergency reinstall from an old
immutable manifest is data-safe because this extension is stateless, but it
loses the storefront value, egress binding, `capture_dns`, execution position,
and installed source identity.

## Verification

For each update:

1. For a fresh installation, import `extension.yaml` through **Install from
   URL**. For an installed extension, use update check/apply with the exact
   reviewed digest. Confirm that either path finishes disabled.
2. Confirm the normalized capture-host list contains exactly
   `testflight.apple.com`, the network-origin list is empty, and the extension
   enables without an egress binding while producing a real unlock only when
   the host leaves through a storefront-compatible region.
3. Exercise every storefront option with both the exact upstream body syntax
   and the documented native fallback, verifying that only the first value and
   the upstream-specified whitespace normalization change.
4. Exercise missing, malformed, already-correct, and direct non-text fixture
   bodies and confirm the documented no-op or fail-closed behavior.
5. Enable the global MITM master only on an authorized test device with the
   interception root trusted, then verify both the transformed request and the
   selected mihomo egress.
6. Run the repository Go and shell verification gates appropriate to native
   extension parsing and interception before publication.

The repository-local independent gates are:

```powershell
node tests/apple-testflight-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "Apple and TestFlight fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
```
