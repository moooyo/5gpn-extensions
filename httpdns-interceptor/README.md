# HTTPDNS Interceptor

License: [`CC-BY-NC-SA-4.0`](../LICENSES/CC-BY-NC-SA-4.0.txt)

This directory contains a normal 5gpn.io/v1 extension. It blocks 117 reviewed
HTTPDNS domain/IP routes and seven hostname-based HTTP request paths from the
pinned upstream rule set. It is not compiled into either 5gpn daemon and is
not installed or enabled automatically.

Install extension.yaml from the Console's Install from URL action:

~~~
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/httpdns-interceptor/extension.yaml
~~~

This public raw URL is installable directly. For a private fork, use the Console's local-add/upload flow or an operator-controlled public HTTPS mirror; never embed repository credentials in an extension URL.

The extension has no settings, persistent storage, network permission, upstream
mapping, or required egress-group binding. When enabled with the global
interception master, it captures exactly six hosts for the documented request
paths and also activates 117 global typed `REJECT` rules. Traffic not matched
by either capability keeps the normal mihomo egress path.

## Pinned upstream

| Field | Value |
| --- | --- |
| Upstream repository | mihoyo-typ/KeleeOne |
| Upstream display name | HTTPDNS Interceptor |
| Upstream file | Plugin/Block_HTTPDNS.lpx |
| Pinned commit | ab6c3182fb2b09bcc34456f496282ec0b8e9217b |
| Raw URL | https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx |
| Raw file size | 9,257 bytes |
| Raw file SHA-256 | 08429c4f1c677d79e87eb3cd41e880868f7a71381dc1d6c81b393734fd5df21a |
| Upstream-declared date | 2025-08-20 00:30:31 |
| Snapshot verified | 2026-07-20 |

The commit, raw URL, and digest are intentionally fixed. They make a later
review independent of mutable branches, tags, or the KeleeOne distribution
site.

## License and attribution

This native extension port is adapted material from KeleeOne's
Block_HTTPDNS.lpx at the pinned commit above. The original Loon rule format was
changed into a strict 5gpn.io/v1 manifest and a native transform(context)
request-abort script. Its canonical domain, IPv4, and IPv6 rules are retained
as typed routing declarations. Only IP-literal URL rewrites and traffic that
cannot physically reach a DNS-steering gateway remain outside the port, as
documented below.

The upstream root license is
[CC BY-NC-SA 4.0](../KELEEONE-LICENSE.md). This adapted material is provided
under the same CC BY-NC-SA 4.0 terms: attribution is required, commercial use
is not permitted, and adaptations must be shared under the same license.

The source file's `#!author` metadata credits 可莉🅥 (`iKeLee`, linked to
<https://github.com/luestr/ProxyResource/blob/main/README.md>) and VirgilClyne
(<https://github.com/VirgilClyne>). Those supplied creator identifications are
retained here and in the repository notices.

The pinned upstream license is
`https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/LICENSE`.
It is 21,286 bytes with SHA-256
`047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98`
and was verified on `2026-07-20`.

## Rule conversion

The original .lpx file is a Loon rule list. 5gpn does not parse or emulate that
format. This extension expresses the supported residual rules as a strict
native manifest and one transform(context) script. Every action is a request
action with bodyMode none; block.js returns { abort: true }, so a matched
request fails closed before it is sent upstream.

| Native action | Upstream rule | Native matcher |
| --- | --- | --- |
| block-huya-httpdns-launch | URL-REGEX for http cdn.wup.huya.com launch/queryHttpDns | http, cdn.wup.huya.com, ^/launch/queryHttpDns |
| block-huya-httpdns-monitor | https? cdn.wup.huya.com monitor/monitor.jsp reject | http or https, cdn.wup.huya.com, ^/monitor/monitor\.jsp |
| block-ximalaya-httpdns-login | URL-REGEX for http xmc.ximalaya.com xmlymain-login-web/login | http, xmc.ximalaya.com, ^/xmlymain-login-web/login/ |
| block-weibo-httpdns-config | the two URL-REGEX rules for api.weibo.cn [/2]/httpdns/config | http, api.weibo.cn, ^/(?:2/)?httpdns/config(?:\?.*)?$ |
| block-mail-httpdns-config | https? appconf.mail.163.com mailmaster/api/http/urlConfig.do reject-dict | http or https, appconf.mail.163.com, ^/mailmaster/api/http/urlConfig\.do$ |
| block-91160-httpdns-broker | https msglb.91160.com msg/outer/broker/get reject-dict | https, msglb.91160.com, ^/msg/outer/broker/get$ |
| block-ximalaya-httpdns-linkeye | https gslbali.ximalaya.com linkeye-cloud/httpdns reject | https, gslbali.ximalaya.com, ^/linkeye-cloud/httpdns/ |

The upstream reject-dict action has no native compatibility mode. It is
deliberately converted to the same fail-closed request abort as reject, avoiding
an invented response schema for an undocumented third-party client format.

## Typed routing parity and remaining limitation

All 117 unique canonical `DOMAIN`, `IP-CIDR`, and `IP-CIDR6` effects from the
pinned `[Rule]` section are represented as typed, reviewed `REJECT` rules. They
activate only with the extension and MITM master and are removed transactionally.

IP-literal `URL-REGEX` and rewrite rules remain physically unreachable on a
DNS-steering-only gateway when the client connects directly to the hard-coded
address. The project does not install a transparent proxy, firewall rule, or
policy-routing table, so it cannot truthfully claim those requests are blocked.
Hostname-based URL rules remain implemented as bounded request actions.

The source's incomplete `amdc.alipay.com/query` rewrite has no terminal Loon
action and therefore has no behavior to reproduce.

### General interception limits

The extension handles only visible hostname-based HTTP or HTTPS traffic on the
supported interception ports after the client resolves a captured hostname
through 5gpn. It cannot block raw DNS, UDP-only or non-HTTP protocols,
certificate-pinned clients, independently provisioned ECH, arbitrary ports, or
traffic using a hard-coded resolver IP that bypasses DNS steering. A client may
therefore fail closed or continue to bypass this extension, depending on its
connection behavior.

## Updating the port

1. Fetch the fixed source and verify its bytes before reviewing a change:

   ~~~bash
   curl -fsSLo Block_HTTPDNS.lpx \
     https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx
   sha256sum Block_HTTPDNS.lpx
   ~~~

2. If updating to another upstream commit, record its immutable commit, raw
   URL, SHA-256, upstream-declared date, and review date in this README before
   changing the manifest.
3. Run `node scripts/sync-routing-rules.mjs` after updating its immutable URL
   and digest. Review every normalized domain, IPv4, and IPv6 routing rule;
   translate hostname-based HTTP or HTTPS path rejects to bounded actions, and
   record only physically unreachable IP-literal URL behavior as a limitation.
4. Preserve the source scheme and path scope. Do not turn a path-specific rule
   into a host-wide capture action. Keep captureHosts at or below 256 entries.
5. Bump metadata.version, validate the strict manifest, and review the snapshot
   digest in the Console before applying the disabled update.

## Verification

1. Confirm that the upstream file SHA-256 matches the pinned value above.
2. Install the manifest URL in the Console. Confirm that the reviewed manifest
   has six capture hosts, seven request actions, 117 typed routing rules, no
   network origins, and no required egress binding.
3. Enable the extension and the global interception master, then verify in
   /extensions/hosts that only the six declared hosts are active.
4. Send a request that matches each table row and verify that it fails closed;
   send a nearby nonmatching path on the same host and verify that the extension
   does not abort it.
5. Disable the extension and verify that both its capture-host overlay and all
   117 routing rules disappear transactionally.
