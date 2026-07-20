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

Before enabling the extension, select the target storefront and bind an
operator-owned mihomo egress group whose exit region is compatible with that
storefront. The extension cannot name or change the selected group.

## Pinned upstream

| Field | Value |
| --- | --- |
| Repository | `mihoyo-typ/KeleeOne` |
| Upstream name | `TestFlightRegionUnlock.lpx` (`TestFlight Region Unlock`) |
| Pinned commit | `ab6c3182fb2b09bcc34456f496282ec0b8e9217b` |
| Original file | `Plugin/TestFlightRegionUnlock.lpx` |
| Pinned source URL | `https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/TestFlightRegionUnlock.lpx` |
| Upstream-declared reference URL | `https://kelee.one/Tool/Loon/Lpx/TestFlightRegionUnlock.lpx` |
| SHA-256 | `a49e5a186a95eef966d9b127eec663eef3fd196beaaeadd32b9302f5e3540c1e` |
| Fetched on | `2026-07-20` |

The pinned source is 778 bytes. Its upstream metadata reports version date
`2025-09-02 23:42:06` and Loon version `3.2.1(749)`.

## License and attribution

This native port is adapted material based on `mihoyo-typ/KeleeOne` and is
provided under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International license (`CC BY-NC-SA 4.0`). It has been modified from the
pinned Loon plugin to use the strict 5gpn manifest, typed settings,
operator-owned egress binding, and the native `transform(context)` runtime.

The source file's `#!author` metadata credits 可莉🅥 (`iKeLee`) and links to
<https://github.com/luestr/ProxyResource/blob/main/README.md>. That supplied
creator identification is retained here and in the repository notices.

Reuse must preserve attribution, remain non-commercial, and distribute
adaptations under the same license. See the repository's
[local license copy](../KELEEONE-LICENSE.md) and the
[pinned upstream LICENSE](https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/LICENSE).
The pinned license is 21,286 bytes with SHA-256
`047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98`
and was verified on `2026-07-20`.

## Port mapping

| Upstream item | Native 5gpn mapping |
| --- | --- |
| `DOMAIN, testflight.apple.com, PROXY` | `traffic.captureHosts` contains only `testflight.apple.com`; `requirements.egressGroup.required` forces an explicit operator binding instead of naming `PROXY`. |
| Rewrite URL `^https?://testflight.apple.com/v\d/accounts/.+?/install$` | One request action matches only `testflight.apple.com`, HTTP or HTTPS, and versioned account install paths. Query strings are accepted because 5gpn matches path plus query. |
| `request-body-replace-regex` for `storefrontId` | `rewrite-storefront.js` performs the same bounded textual replacement through `transform(context)` with `bodyMode: text`. |
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

## Deliberately not ported and limitations

- Loon-only fields such as `openUrl`, `tag`, `homepage`, icon, minimum Loon
  version, and empty system constraints have no native runtime equivalent.
- The upstream `PROXY` policy is not copied. Native extensions cannot select an
  egress group; the operator must bind one before enable, and a missing binding
  fails closed.
- Only traffic for `testflight.apple.com` on the native interception ports 80
  and 443 is acquired. The extension does not alter DNS policy for other Apple
  hosts.
- The transform replaces the first JSON-style `storefrontId` string whose
  value has the upstream `dddddd-dd,dd` shape. An absent or changed field is
  logged and left untouched. It does not synthesize a missing field.
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

The script requests no persistent storage and no origin-scoped network
permission. It can see only the matched request projection supplied by the
standard extension sandbox.

## Updating from upstream

1. Choose a new upstream commit intentionally. Never follow the branch head in
   the manifest or this provenance record.
2. Download the exact `Plugin/TestFlightRegionUnlock.lpx` file from the raw
   commit URL and record its byte length, SHA-256, and fetch date.
3. Diff the new file against the pinned source. Review metadata, `[Rule]`,
   `[Rewrite]`, and `[MitM]` independently.
4. Map every behavioral change to strict native fields or to
   `rewrite-storefront.js`. Keep every action host within `captureHosts`, keep
   the egress requirement operator-owned, and document anything intentionally
   omitted.
5. Recheck the storefront table if the replacement value or format changed.
   Bump `metadata.version` for any immutable manifest or script change.
6. Update this section's commit, URL, digest, date, mapping, limitations, and
   validation evidence in the same change.

To verify the upstream bytes on a POSIX host:

```sh
url='https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/TestFlightRegionUnlock.lpx'
curl -fsSL "$url" | sha256sum
```

The expected digest is:

```text
a49e5a186a95eef966d9b127eec663eef3fd196beaaeadd32b9302f5e3540c1e  -
```

## Validation

For each update:

1. Import `extension.yaml` through **Install from URL** and confirm it is
   accepted as a disabled native extension.
2. Confirm the normalized capture-host list contains exactly
   `testflight.apple.com`, the network-origin list is empty, and the extension
   is not ready until an egress group is bound.
3. Exercise every storefront option with a representative request body such as
   `{"storefrontId": "143441-19,29"}` and verify that only the value changes.
4. Exercise missing, malformed, and non-text bodies and confirm the documented
   no-op or fail-closed behavior.
5. Enable the global MITM master only on an authorized test device with the
   interception root trusted, then verify both the transformed request and the
   selected mihomo egress.
6. Run the repository Go and shell verification gates appropriate to native
   extension parsing and interception before publication.
