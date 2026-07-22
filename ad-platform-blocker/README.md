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

Enabling it requests interception for the 183 hosts in `traffic.captureHosts`
and activates 201 reviewed typed routing rules. It has no settings, persistent
storage, network origins, upstream mappings, or egress-group requirement. The
request actions return `{ abort: true }` without reading a body; routing rules
apply before capture and may `REJECT` or use the one pinned narrow `DIRECT`
exception.

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
| Port snapshot date | `2026-07-20` |

The upstream is a Loon LPX profile. 5gpn does not parse or emulate LPX at
runtime; this directory records a reviewed native translation of that exact
snapshot.

## License and attribution

This native extension is adapted material from the pinned
`mihoyo-typ/KeleeOne` `Plugin/BlockAdvertisers.lpx` snapshot. The adaptation
changes the Loon LPX rules into a strict `5gpn.io/v1` manifest and native
request-abort script, applies the documented host-boundary exclusions, and
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
and was verified on `2026-07-20`.

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
| `DOMAIN-SUFFIX,suffix,REJECT` | Typed `domainSuffix` routing rule that covers the apex and children exactly as mihomo does. |
| Keyword, CIDR, composite, and `DIRECT` forms | Bounded typed keyword/IP selectors with the pinned action; no raw mihomo string or proxy-group name is accepted. |
| Pinduoduo `[Rewrite]` reject URL | Exact capture host and a separate HTTPS request action with an equivalent anchored `pathRegex`. |

The conversion uses 88 exact hosts, 92 constrained subdomain wildcards, and
three URL-only Pinduoduo hosts: 183 capture hosts in total, below the native
limit of 256. Wildcards are intentionally child-only: `*.example.com` does
not capture `example.com`. This avoids intercepting a registrable-domain apex
when the LPX suffix rule was intended for an advertising endpoint.

## Typed routing parity

All 201 unique effects from the pinned `[Rule]` section are represented as
reviewed typed routing rules, including exact domains, suffixes, keywords,
composite keyword/suffix conditions, the IPv4 CIDR reject, and the narrowly
scoped `DIRECT` exception. They are not raw mihomo strings and cannot name an
operator proxy group. They activate only after the extension enable review and
are removed transactionally when the extension or MITM master is disabled.

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
4. Run `node scripts/sync-routing-rules.mjs` after updating its immutable URL
   and digest, then review every normalized exact, suffix, keyword, composite,
   CIDR, and `DIRECT` result. Keep every action matcher within its own
   `captureHosts` list.
5. Translate a URL reject only when its host is explicit and its URL predicate
   can be represented safely by an anchored RE2 `pathRegex`. Do not turn a
   URL path into a host-wide block.
6. Exclude only behavior that cannot be expressed faithfully, retain both the
   `<=256` capture-host and routing-rule limits, and update the coverage text
   when the review changes.
7. Test the manifest locally and install the reviewed raw manifest as disabled
   before enabling it on production traffic.

## Verification

From the repository root, validate the native manifest and script through the
existing Go tests:

```bash
(cd cmd/5gpn-dns && go test ./...)
(cd cmd/5gpn-intercept && go test ./...)
```

For a focused review, confirm that `extension.yaml` has 183 capture-host
entries and 201 typed routing rules, every `actions[].match.hosts` entry is covered by
`traffic.captureHosts`, `block.js` contains only the native `transform(context)`
entry point, and the three Pinduoduo actions retain their host-specific,
anchored path predicates. Then import the manifest disabled in the Console,
review the capture-host transaction, and enable it only on a test device first.
