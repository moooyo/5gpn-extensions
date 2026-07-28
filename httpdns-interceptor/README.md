# HTTPDNS Interceptor

License: [`CC-BY-NC-SA-4.0`](../LICENSES/CC-BY-NC-SA-4.0.txt)

This directory contains a normal 5gpn.io/v1 extension. It acquires every
name-addressable target from the pinned HTTPDNS rule set and then blocks 117
reviewed domain/IP routes plus seven hostname-based HTTP request paths. It is
not compiled into either 5gpn daemon and is not installed or enabled
automatically.

Install extension.yaml from the Console's Install from URL action:

~~~
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/httpdns-interceptor/extension.yaml
~~~

This public raw URL is installable directly. For a private fork, use the Console's local-add/upload flow or an operator-controlled public HTTPS mirror; never embed repository credentials in an extension URL.

The extension has no settings, persistent storage, network permission, upstream
mapping, or required egress-group binding. When enabled with the global
interception master, it publishes exactly 64 capture hosts: all 58 exact-domain
routing targets and six additional action-only hosts. It also activates 117
global typed `REJECT` rules. Traffic not matched by either capability keeps the
normal mihomo egress path.

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
| Source fetched and verified | 2026-07-22 |
| Latest branch-head check | `Loon` resolved to the pinned commit on 2026-07-22 |

The commit, raw URL, and digest are intentionally fixed. They make a later
review independent of mutable branches, tags, or the KeleeOne distribution
site. The pin was already the current immutable `Loon` branch head during this
review, so no newer source commit was substituted.

## License and attribution

This native extension port is adapted material from KeleeOne's
Block_HTTPDNS.lpx at the pinned commit above. The original Loon rule format was
changed into a strict 5gpn.io/v1 manifest whose path actions declare
`reject: true` and carry no code. Its 58 canonical domain rules and 59 canonical IPv4/IPv6
rules are retained as typed routing declarations. Every exact-domain routing
target is also declared as a capture host so that the rule can acquire supported
traffic instead of merely waiting for traffic already present in mihomo. The
remaining source exclusions are enumerated below.

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
and was verified on `2026-07-22`.

## Rule conversion

The original .lpx file is a Loon rule list. 5gpn does not parse or emulate that
format. This extension expresses the supported residual rules as a strict
native manifest and no code at all. Every action is a request action with
bodyMode none and `reject: true`, so a matched request fails closed before it
is sent upstream. Earlier revisions carried a 57-byte script whose whole body
was `return { abort: true }`.

| Native action | Upstream rule | Native matcher |
| --- | --- | --- |
| block-huya-httpdns-launch | URL-REGEX for http cdn.wup.huya.com launch/queryHttpDns | http, cdn.wup.huya.com, ^/launch/queryHttpDns |
| block-huya-httpdns-monitor | https? cdn.wup.huya.com monitor/monitor.jsp reject | http or https, cdn.wup.huya.com, ^/monitor/monitor\.jsp |
| block-ximalaya-httpdns-login | URL-REGEX for http xmc.ximalaya.com xmlymain-login-web/login | http, xmc.ximalaya.com, ^/xmlymain-login-web/login/ |
| block-weibo-httpdns-config | the two URL-REGEX prefix rules for api.weibo.cn [/2]/httpdns/config | http, api.weibo.cn, ^/(?:2/)?httpdns/config |
| block-mail-httpdns-config | https? appconf.mail.163.com mailmaster/api/http/urlConfig.do reject-dict | http or https, appconf.mail.163.com, ^/mailmaster/api/http/urlConfig\.do$ |
| block-91160-httpdns-broker | https msglb.91160.com msg/outer/broker/get reject-dict | https, msglb.91160.com, ^/msg/outer/broker/get$ |
| block-ximalaya-httpdns-linkeye | https gslbali.ximalaya.com linkeye-cloud/httpdns reject | https, gslbali.ximalaya.com, ^/linkeye-cloud/httpdns/ |

The upstream reject-dict action has no native compatibility mode. It is
deliberately converted to the same fail-closed request abort as reject, avoiding
an invented response schema for an undocumented third-party client format.

## Traffic acquisition, routing parity, and remaining limits

The pinned `[Rule]` section produces 117 unique typed effects: 58 exact
`DOMAIN` selectors and 59 canonical `IP-CIDR` or `IP-CIDR6` selectors. Every
one is represented as a reviewed `REJECT` rule. They activate only with the
extension and MITM master and are removed transactionally.

A typed routing rule is not a traffic-acquisition permission. To close that
gap, `captureHosts` contains all 58 exact-domain routing targets plus the six
unique hosts used only by request actions. When a client resolves one of those
names through 5gpn and connects on a supported interception port, the capture
overlay can steer the connection to the gateway and the matching domain rule
can reject it. The 64-entry list is deliberately exact; it does not widen an
upstream exact domain into a suffix wildcard. A capture declaration also does
not choose a DNS upstream; that remains a core/operator policy decision.

The 59 IP/CIDR rules can reject matching traffic that already reaches mihomo,
but they cannot acquire a client's direct connection to a hard-coded address.
The source additionally contains 48 active IP-address-form path patterns. Of
those, 47 use syntactically valid hard-coded IPv4 or IPv6 targets and one uses
the invalid numeric authority `182.256.116.116`. They are not converted into
host-wide IP rejects or native request actions: doing so would broaden
path-specific source behavior, while IP literals cannot be declared as native
capture hosts. Without TUN/TProxy, host firewall interception, or policy
routing, 5gpn cannot truthfully claim to acquire those direct connections.

Three other source lines have no enforceable terminal behavior to reproduce.
The bare `[Rule]` patterns for `203.107.1.33/\d+/ss` and
`203.107.1.34/\d+/ss` have neither a `URL-REGEX` wrapper nor an action, and the
`amdc.alipay.com/query` rewrite has no terminal Loon action. The port does not
invent behavior for any of them.

### General interception limits

The extension handles only visible hostname-based HTTP or HTTPS traffic on
ports 80 and 443 after the client resolves a captured hostname through 5gpn.
It cannot block raw DNS, UDP-only or non-HTTP protocols, certificate-pinned
clients, independently provisioned ECH, arbitrary ports, or traffic using a
hard-coded resolver IP that bypasses DNS steering. A client may therefore fail
closed or continue to bypass this extension, depending on its connection
behavior.

## Updating the port

1. Fetch the fixed source and verify its bytes before reviewing a change:

   ~~~powershell
   $sourceUrl = 'https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx'
   $sourcePath = Join-Path $env:TEMP ("Block_HTTPDNS-" + [guid]::NewGuid().ToString('N') + '.lpx')
   try {
     Invoke-WebRequest -UseBasicParsing -ErrorAction Stop -Uri $sourceUrl -OutFile $sourcePath
     $sourceInfo = Get-Item -LiteralPath $sourcePath
     $sourceHash = Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256
     if ($sourceInfo.Length -ne 9257 -or $sourceHash.Hash -ne '08429c4f1c677d79e87eb3cd41e880868f7a71381dc1d6c81b393734fd5df21a') {
       throw 'Block_HTTPDNS.lpx size or SHA-256 mismatch'
     }
     $sourceInfo | Select-Object Length
     $sourceHash
   } finally {
     [System.IO.File]::Delete($sourcePath)
   }
   ~~~

2. If updating to another upstream commit, record its immutable commit, raw
   URL, SHA-256, upstream-declared date, and review date in this README before
   changing the manifest.
3. Update the `httpdns-interceptor` URL, digest, version, and expected source
   counts in `scripts/sync-routing-rules.mjs`, then run that generator. It
   reviews every normalized domain, IPv4, and IPv6 routing rule; verifies each
   known hostname path source; counts excluded IP-address-form and inert path
   lines; and derives `captureHosts` from all exact-domain routes plus action
   hosts.
4. Review any newly rejected source line instead of weakening the generator.
   Preserve its scheme and path-prefix or end-anchor behavior. Do not turn a
   path-specific IP rule into a host-wide reject, and keep `captureHosts` at or
   below the current 512-entry native contract limit.
5. Validate the strict manifest and review the snapshot digest in the Console
   before applying the disabled update. The generator owns `metadata.version`,
   so do not edit only the generated manifest.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.httpdns-interceptor`; update the generator-owned `metadata.version` for every immutable manifest or script change. |
| Current manifest | `version=2.2.0`; `persistentStorage=false`; `settings=0`; `captureHosts=64`; `actions=7`; `routingRules=117`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateless. `persistentStorage` is false and there are no extension settings. |
| Reviewed capability baseline | 64 capture hosts, 117 typed routing rules, seven request actions, no network origins or upstream mappings, and no required egress binding. |
| Operator state | A normal same-ID update retains `capture_dns` and execution position. Record both before rollout. |
| Exclusion boundary | IP-address-form path rules and inert source lines remain excluded unless the native traffic-acquisition contract can represent them without widening behavior. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No data conversion is required. |

### Repeatable migration

1. Complete the playbook's record with exact domain, CIDR, hostname-path,
   excluded-IP-path, inert-line, capture-host, and action diffs.
2. Update every generator source field together, regenerate the manifest, and
   inspect all normalized CIDRs and merged path predicates before running
   `npm run routing:check`.
3. Synchronize this README, `scripts/validate.mjs`, licenses, notices,
   `REUSE.toml`, fixtures, and generator counts in the same change.
4. Run the common and focused gates, apply the exact candidate digest while
   disabled, confirm `capture_dns` and order, and review every route removal or
   addition before enabling on an authorized test device.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the reviewed 64-host,
117-rule, and seven-action behavior or the newly recorded baseline counts. It
must use a new version incremented above the failing candidate and pass
regeneration, `routing:check`, fixtures, and the core parser gate. Apply it
while disabled and confirm the old acquisition and
exclusion boundaries before enabling. Emergency reinstall from an old
immutable manifest is data-safe because this extension is stateless, but it
does not retain `capture_dns`, execution position, or installed source identity.

## Verification

1. Confirm that the upstream file SHA-256 matches the pinned value above.
2. Install the manifest URL in the Console. Confirm that the reviewed manifest
   has 64 capture hosts (58 route domains plus six action-only hosts), seven
   request actions, 117 typed routing rules (58 domains plus 59 CIDRs), no
   network origins, and no required egress binding.
3. Enable the extension and the global interception master, then verify in
   /extensions/hosts that exactly the 64 declared hosts are active.
4. Send a request that matches each table row and verify that it fails closed;
   send a nearby nonmatching path on the same host and verify that the extension
   does not abort it.
5. Resolve representative domain-rule hosts through 5gpn and verify their
   supported traffic is acquired before the typed `REJECT` rule runs. Do not
   report a direct hard-coded-IP connection as covered unless it independently
   traverses mihomo.
6. Disable the extension and verify that both its capture-host overlay and all
   117 routing rules disappear transactionally.

Run the repeatable local gates from the repository root:

```powershell
node tests/httpdns-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "HTTPDNS fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

For runtime-facing changes, also run the current core parser gate from the
shared migration playbook.
