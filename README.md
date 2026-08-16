# 5gpn extensions

English | [简体中文](README.zh-CN.md)

This repository is the first-party catalog for independently maintained native
5gpn extensions. The 5gpn core repository owns the runtime and strict
`5gpn.io/v1` contract; it does not vendor or mirror extension source code.

Every extension is disabled by default after import. Every installed extension
also has exactly one explicit operator egress binding, and a fresh import starts
at `DIRECT`. Review its immutable manifest, scripts, capture hosts, exact routing
rules, network permission, execution position, current egress binding, and any
`requirements.egressGroup.required` review marker before enabling it.

| Extension | Purpose | License |
| --- | --- | --- |
| `apple-wloc` | Rewrite Apple WLOC responses to an operator-selected point | MIT |
| `bilibili-cleaner` | Remove selected Bilibili ads and promotions | GPL-3.0-only |
| `testflight-region-unlock` | Rewrite TestFlight storefront with operator-selected egress | CC BY-NC-SA 4.0 |
| `weatherkit` | Run reviewed WeatherKit bundles in Script mode, or apply reviewed upstream rewrites in Cloud mode | Apache-2.0 |
| `youtube-cleaner` | Clean YouTube responses and prepare the reviewed external Onesie playback path | Apache-2.0 |
| `zhihu-cleaner` | Remove selected Zhihu transport configuration, advertisements, promotions, and navigation entries | CC BY-NC-SA 4.0 |

## Installation

Use the 5gpn Console **Install from URL** action with the raw
`extension.yaml` URL for the desired directory. This public catalog is
gateway-reachable without credentials. For a private fork, use the Console's
local-add/upload flow or publish reviewed files through an operator-controlled
public HTTPS origin; never embed repository credentials in an extension URL.

| Extension | Manifest URL |
| --- | --- |
| `apple-wloc` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/apple-wloc/extension.yaml> |
| `bilibili-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml> |
| `testflight-region-unlock` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/testflight-region-unlock/extension.yaml> |
| `weatherkit` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml> |
| `youtube-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml> |
| `zhihu-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/zhihu-cleaner/extension.yaml> |

Every import starts disabled and receives an explicit `DIRECT` egress binding.
Before enabling it, review the immutable snapshot, capture hosts, actions,
settings, exact routing rules, network permission, execution position, and
current operator egress binding. `requirements.egressGroup.required` is review
metadata only and never creates an unbound state. Installing an extension does
not enable the global interception master or trust its interception CA on a
device.

## Marketplace

The first-party marketplace is published as strict JSON at:

```text
https://moooyo.github.io/5gpn-extensions/marketplace/v2/index.json
```

5gpn does not preconfigure this or any other marketplace. Review this repository
first, then copy the URL above into **Marketplace → Add marketplace** only if you
choose to trust it; operators may add a different compatible source instead.

After it is explicitly added, the Console can browse the reviewed
extensions. Browsing never installs or enables an extension. Choosing an entry
starts the normal native manifest parser and snapshot pipeline, and the
review covers its capture hosts, permissions, settings, routing rules, execution
position, and egress binding. A fresh install starts disabled; an installed
Marketplace replacement preserves the prior enabled authorization.

The marketplace is discovery metadata, not an executable trust boundary. Each
entry points to a manifest, documentation, and license at the exact 40-character
repository commit that produced the index. The generator records only the
manifest SHA-256 and byte size plus the human-facing capability summary the
gateway verifies during review. It publishes no parallel script-resource or
compiled-policy contract: scripts and routing rules are fetched, parsed, and
compiled by the normal immutable snapshot pipeline. Review returns the complete
snapshot digest; apply refetches and rejects any different snapshot. The list's
description and capability summary never become runtime authority.

GitHub Pages exposes the current list at the stable URL above. The public JSON
Schema is available at
<https://moooyo.github.io/5gpn-extensions/marketplace/v2/schema.json>.
The pinned Pages action attempts first-time enablement when a
`PAGES_ENABLEMENT_TOKEN` repository secret with Pages write access is present.
If organization policy prohibits that token or automatic enablement, the only
manual prerequisite is to open **Settings → Pages** once and select
**GitHub Actions** as the source; no branch or generated site needs to be
maintained manually.

## Developing an extension

The normative runtime contract is the core project's
[`5gpn.io/v1` author guide](https://github.com/moooyo/5gpn/blob/main/docs/native-extensions.md).
This section is a self-contained maintainer checklist for extensions in this
catalog. 5gpn accepts only the native manifest format described here; do not
ship Loon, Surge, Quantumult X, or Stash manifests. `proxy-compat` remains part
of that native format: it uses the core-provided sandbox rather than an
extension-supplied compatibility runtime or globals.

### Directory layout

Keep one independently installable extension in each top-level directory:

```text
example-cleaner/
  extension.yaml
  clean-response.js
  README.md
```

`extension.yaml` and every repository-local script must be immutable files in
the directory. A reviewed remote script source should use an immutable commit
URL. When upstream publishes a generated bundle only as an official release
asset, the direct asset URL is also supported; record its tag object, source
commit, and replaceability. The README must document the governing license,
creator attribution, every upstream source binding, URLs, fetch dates, porting
decisions, exclusions, limitations, update procedure, and verification steps.
Do not maintain a second byte-size or digest pin in the README.

### Available capabilities

| Capability | Manifest declaration | Runtime effect and boundary |
| --- | --- | --- |
| Acquire traffic | `traffic.captureHosts` | Exact DNS names or constrained `*.example.com` wildcards. This is the only traffic-acquisition permission and publishes DNS, certificate, and mihomo rules for plain HTTP and TLS/H1/H2 on ports 80 and 443 when enabled. HTTP/3 interception is unsupported. |
| Apply reviewed global routing | `traffic.routingRules` | Bounded typed selectors can only `REJECT` or `DIRECT` matching traffic already reaching the gateway. Exact rules share the single enable confirmation, cannot name a proxy group, and exist only while the extension and MITM master are enabled. |
| Transform requests or responses | `actions[]` | Ordered structured matchers select one action in the declared phase. Each action host must belong to the same extension's `captureHosts`. |
| Block a matched path | `script.reject` | Aborts the exchange before it is sent upstream. No code. |
| Answer with a fixed reply | `script.mock` | A declared status, headers, and `body` or `base64Body`. No code, and no request leaves the gateway. |
| Rewrite a JSON body | `script.jq` | An upstream module's own `response-body-json-jq` expression, run by gojq without entering the JavaScript runtime. Reads operator choices through `$settings`. |
| Edit headers on a real message | `script.headers` | `set` and `remove` fields without replacing the body. Removal runs first. |
| Send a request elsewhere | `script.rewrite` | Rewrites the URL in place, or answers 302/307. `to` may interpolate `{{settings.key}}`, which is how an upstream module's endpoint argument survives the port. A same-origin rewrite inside the capture-host boundary needs no network grant. A cross-origin rewrite requires it and forwards the complete method, decoded body, and end-to-end headers, potentially including `Cookie` or `Authorization`. |
| Edit body bytes | `script.replaceBody` | A regular expression and a replacement that may read `{{settings.key}}`, optionally resolved through a declared `valueMap`. Unlike `jq` it does not parse the document, so unmatched bytes survive exactly. |
| Gate an action on a setting | `actions[].enabledWhen` | `{key, equals}` against a required setting of the same extension. When the comparison fails the action is not compiled, so it never matches. A select therefore drives several mutually exclusive action sets, which two booleans cannot: they have a fourth state where both are on. Upstream plugin formats switch an entry on and off from outside the script, which is why a bundle carrying such a switch never reads the key that controls it. |
| Run a published proxy-client bundle | `script.entry: proxy-compat` | Loads a pinned upstream script under a Loon persona. See [the contract below](#proxy-compat-contract). |
| Read a body | `script.bodyMode` | `none`, UTF-8 `text`, or `binary` as `Uint8Array`, bounded by `maxBodyBytes`. |
| Typed operator configuration | `settings[]` | `text`, `select`, `boolean`, `number`, and `location`; required values must be complete before enable. |
| Persistent state | `permissions.persistentStorage: true` | Adds extension-scoped, quota-bound `context.storage`; scripts never choose a path or access the filesystem. |
| Outbound HTTP | `permissions.network: true` | Adds `context.network.request`, the concurrent `context.network.requestAsync`, and the exception that permits cross-origin request rewriting. It names no host: an extension holding it may reach anywhere it can resolve and may send any request, response, setting, or storage data visible to it. There is no ambient `fetch`, redirect following, cookie jar, or socket access, and URL canonicalization plus IP-literal and unsafe-host refusal still apply. |
| Select an intercepted upstream or resolver | `traffic.upstreamMappings` | An address (`1.2.3.4`) or alias (`origin.example.net`) changes the interception engine's upstream target while preserving the original HTTP Host and TLS SNI; aliases are resolved, safety-checked, and pinned before rule selection. A `server:` target instead selects up to four monolith resolver upstream specs (`IP[:port]`, `name@IP[:port]` for DoT, or `https://host/path@IP[:port]` for DoH) and is never dialed as the origin. Every accepted connection still traverses the current protected rules and the extension's explicit egress binding; a mapping never selects egress. |
| Mark egress as review-relevant | `requirements.egressGroup.required: true` | Review metadata only. Every installed extension already has exactly one explicit binding, and new imports default to `DIRECT`; the marker records the dependency in the immutable manifest and snapshot but does not change that default or create a different binding state. The extension cannot name, inspect, select, or change a group. A selected group that disappears remains named and fails closed, while a separately reviewed routing rule may select only `DIRECT`. |
| Compose several extensions | Console execution order | Request and response actions run top-to-bottom. For overlapping destinations, the first matching extension's explicit egress binding and the first global routing rule in that same order win. Reordering requires a before/after confirmation. |

Native interception supports plain HTTP and TLS/H1/H2 only. A client that can
fall back from HTTP/3 may retry over TCP and enter the capture path; an H3-only
client fails. The core-owned UDP/443 guard is not an extension capability.

Scripts receive bounded action-scoped timers, but no filesystem, process,
module-loader, raw socket, ambient DNS, ambient Go object, or unrestricted
network access. All upstream TCP and UDP return through mihomo's in-process
inner dialer; an extension cannot bypass the operator-selected egress path.

### Minimal manifest

The document is strict YAML: unknown fields, duplicate keys, aliases, anchors,
merge keys, and multiple documents are rejected.

```yaml
apiVersion: 5gpn.io/v1
kind: Extension

metadata:
  id: io.example.response-cleaner
  name: Example Response Cleaner
  version: 1.0.0
  description: Removes one reviewed response field.

permissions:
  persistentStorage: false

traffic:
  captureHosts:
    - api.example.com

settings:
  - key: removePromotion
    type: boolean
    label: Remove promotion
    description: Removes the reviewed promotion field when enabled.
    required: true
    default: true

actions:
  - id: clean-items-response
    phase: response
    match:
      hosts:
        - api.example.com
      schemes:
        - https
      methods:
        - GET
      pathRegex: '^/v1/items(?:\?.*)?$'
      statusCodes:
        - 200
    script:
      source: ./clean-response.js
      bodyMode: text
      timeoutMs: 1000
      maxBodyBytes: 1048576
```

Metadata IDs are stable lowercase dotted identifiers from 3 to 40 bytes, and
versions use semantic version syntax. A wildcard capture host matches child
names only; `*.example.com` does not include the apex `example.com`.

Every action declares a request or response phase, a non-empty host subset,
one or both schemes, an anchored RE2 `pathRegex` matched against path plus
query, optional uppercase methods, and optional response status codes. A
script declares exactly one of `source` or `inline`, plus a timeout from 50 to
30000 milliseconds and a body limit from 1024 to 67108864 bytes.

URL-installed manifests may use relative HTTPS script sources. Locally pasted
or uploaded manifests must use inline scripts or absolute HTTPS script URLs.

### Action kinds

An action uses exactly one execution form. Six are declarative and never reach
the JavaScript runtime: `reject`, `mock`, `jq`, `headers`, `rewrite`, and
`replaceBody`. A scripted action instead declares exactly one of `source` or
`inline`; its `entry` is `native` by default or explicitly `proxy-compat` for a
reviewed upstream proxy-client bundle. `proxy-compat` is a supported execution
form, not a legacy exception; use it when a declarative action cannot faithfully
represent the published behavior. Prefer declarative forms when they are
equivalent. The catalog currently uses both and contains no repository-local
JavaScript or extension-supplied compatibility runtime.

```yaml
script: { reject: true, bodyMode: none, timeoutMs: 500, maxBodyBytes: 1024 }
script: { mock: { status: 200, headers: { Content-Type: application/json }, body: '{}' }, bodyMode: none, ... }
script: { jq: 'del(.data.ad_info)', bodyMode: text, ... }
script: { source: https://…/pinned.js, entry: proxy-compat, bodyMode: text, ... }
```

### Script contract

The native scripted form (`entry: native`, the default) is still supported and
reviewed the same way, but nothing in this repository uses it. Its source
defines exactly one global entry point:

```javascript
function transform(context) {
  const document = JSON.parse(context.response.body)
  if (context.settings.removePromotion) delete document.promotion
  return { response: { body: JSON.stringify(document) } }
}
```

The bounded context can expose:

```text
context.phase
context.request.url
context.request.method
context.request.headers
context.request.body
context.response.status
context.response.headers
context.response.trailers
context.response.body
context.settings
context.storage
context.network.request
context.network.requestAsync
```

Request actions may return a request patch, a synthetic response, `{abort:
true}`, `null`, or `undefined`. Response actions may return only a response
patch, an abort, or no change. A rewritten URL must remain inside the owning
extension's capture-host boundary unless its confirmed network grant authorizes
a cross-origin target; same-origin rewrites need no grant. Unknown result fields
and uncaught script errors fail the matched flow closed.

Response actions and synthetic responses may include a bounded `trailers`
patch. Request patches cannot create trailers. Names, values, field counts,
single-value size, and total bytes are validated; framing and other forbidden
trailer fields fail closed. The engine declares and publishes valid HTTP/gRPC
trailers over HTTP/1.1 and HTTP/2. HTTP/3 downstream interception is unsupported.

`context.storage` exists only when persistent storage was declared.
`context.network.request` and `context.network.requestAsync` exist only when the
network permission was declared and confirmed. Network responses contain `url`,
`status`, `headers`, `trailers`, binary `body`, and `text` when the body is valid
UTF-8. Redirects and non-2xx responses are returned to the script rather than
silently followed.

Both native and proxy-compat actions receive bounded, action-scoped
`setTimeout`, `setInterval`, `clearTimeout`, and `clearInterval`. Timers are
capped per action, and the action deadline ends the action; a timer longer than
that deadline is not fired early.

### Proxy-compat contract

`script.entry: proxy-compat` is the supported native-manifest form for running a
published proxy-client bundle unmodified. The compatibility surface belongs to
the core; an extension supplies only the reviewed source, phase, matchers,
settings, permissions, and execution bounds. It must not carry a compatibility
shim or define additional client globals.

Every use requires the same review discipline as a native port: record immutable
source provenance and the authoritative module, map every matcher and setting,
declare storage and the global network permission only when used, document data
disclosure and deliberate exclusions, preserve the upstream license boundary,
and fix the exact action-to-bundle wiring, `bodyMode`, timeout, and body limit in
fixtures.

The runtime presents itself as **Loon**: `$loon` is defined, and the bundles
that probe `$task`, `$loon`, `$rocket`, `Egern`, `$environment["surge-version"]`
in that fixed order therefore take their Loon branch. No Surge, Quantumult X,
or Egern global is defined, and `$environment` reports `loon-version` rather
than `surge-version`.

A bundle receives:

```text
$loon             the persona version string
$environment      { "loon-version": … }
$script           { startTime }
$request          { url, method, headers, body? }
$response         { status, headers, body }, undefined in the request phase
$argument         the manifest's typed settings, as a decoded object
$done(result)     completion; the first call wins
$persistentStore  read(key) / write(value, key), with the storage permission
$httpClient       get|post|put|delete|head|patch(options, cb), with network
$utils            ungzip only; anything else stays absent so a bundle reaching
                  for an unimplemented helper fails loudly
$notification     post(...), recorded in the action's log budget rather than
                  delivered, because the gateway has no channel for it
```

`$argument` is an **object**, not a serialized string, because that is what
Loon hands a bundle. This is why settings, their types, and their defaults are
derived from the upstream `[Argument]` block rather than from a Surge
`#!arguments` line: Loon's is typed, so a declared `number` arrives as a
number. A bundle that mis-parses `$argument` does not fail — it silently runs
on its own defaults.

An action completes when the bundle calls `$done`. One that never calls it runs
to the action deadline and then fails. There is no module loader; bundles reach
their `require` calls only on a Node.js branch this runtime never selects.

### Declaring optional permissions

Declare only capabilities the runtime implementation actually uses:

```yaml
permissions:
  persistentStorage: true
  network: true

requirements:
  egressGroup:
    required: true

traffic:
  captureHosts:
    - api.example.com
  upstreamMappings:
    - host: api.example.com
      target: origin.example.net
```

The network permission is one boolean and carries no origin list. Request URLs
are still canonicalized; userinfo, fragments, IP literals, localhost, private,
and otherwise unsafe targets are rejected. A same-origin rewrite inside the
capture-host boundary needs no grant. A cross-origin rewrite needs the grant
and sends the complete method, decoded body, and end-to-end headers, potentially
including `Cookie` or `Authorization`; framing and hop-by-hop fields remain
runtime-owned.

Upstream mappings apply only to a host already owned by the same extension. An
address or alias changes the engine upstream while preserving the original Host
and SNI; a `server:` target is parsed as resolver upstreams and is never used as
the origin destination. Unsafe addresses fail closed, and neither form chooses
egress. `requirements.egressGroup.required` only records review metadata:
every installation has an explicit binding and a fresh import starts at
`DIRECT`.

### Development and review workflow

1. Choose the authoritative upstream repository and immutable commit. Do not
   treat an extension store or mirror's root license as authority over a more
   specific original file license.
2. Record and verify every source and license file's immutable raw URL, fetch
   date, creator attribution, and license before porting behavior. For a
   generated bundle available only as an official release asset, record the
   direct asset URL, tag object, source commit, and mutable-release status.
   Do not add a manually maintained byte-size or digest pin.
3. Translate only reviewed behavior into the strict native manifest. Prefer a
   declarative action when it is faithful; otherwise use a reviewed upstream
   bundle through `entry: proxy-compat`, bound either to an immutable commit or
   to a documented official release asset. Narrow capture hosts and matchers
   instead of preserving broad client-specific patterns.
4. Declare storage, the network permission, upstream mappings, and required
   egress review metadata only when used. Document what decrypted data a
   permitted network call or cross-origin rewrite could disclose, including the
   complete method, decoded body, and end-to-end headers.
5. Add positive, no-op, malformed-input, and boundary fixtures. Preserve
   unrelated fields and fail closed where a partial transformation is unsafe.
6. Run the catalog validators and marketplace reproducibility gate:

   ```powershell
   npm ci
   if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
   npm test
   if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
   ```

   Runtime-facing changes also require the installer-pinned mihomo full-review
   corpus described in [`MIGRATION.md`](MIGRATION.md). It reviews every entry,
   fetches its real script resources, and compiles the complete candidate with
   the monolith source operators currently receive.

7. Install the candidate disabled, inspect its source revision and permission
   summary, configure required settings, review the explicit egress binding
   (`DIRECT` on a fresh install), then enable it only on an authorized test
   device with the shared interception root trusted.

An update must keep `metadata.id`, bump `metadata.version` when a runtime source
or reviewed asset selection changes, and refresh provenance and fixtures. A
fresh install starts disabled; an installed Marketplace replacement needs no
disable-first step and preserves the prior enabled authorization. Do not
introduce automatic updates, unreviewed mutable branch fetches, or
extension-supplied compatibility shims.

Upstream selection is deliberately manual. Every source migration, installed
rollout, and rollback must follow the reusable
[`MIGRATION.md`](MIGRATION.md) playbook. It requires a baseline/candidate
record, a capability and license diff, an explicit state strategy, the
Marketplace review/apply boundary, focused verification, explicit monolith
contract evidence, and a rehearsable publisher-managed revert-forward rollback.
It also documents the limited emergency options available to operators who do
not control a compatible Marketplace source. The playbook does not discover or
automatically select upstream revisions.

## Licenses

This is a multi-licensed repository. MIT, GPL-3.0-only, Apache-2.0, and
CC-BY-NC-SA-4.0 are applied at explicit file and directory boundaries. The
CC-BY-NC-SA material is source-available but is not Open Source under the OSI
definition because of its NonCommercial restriction. See the root
[`LICENSE`](LICENSE), the complete texts under [`LICENSES/`](LICENSES/), the
machine-readable mapping in [`REUSE.toml`](REUSE.toml),
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), and each extension README.

## Validation

```powershell
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
$marketplacePath = Join-Path $env:TEMP ("5gpn-extensions-marketplace-" + [guid]::NewGuid().ToString('N') + '.json')
try {
  npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --output $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
  npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --check $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace check failed with exit code $LASTEXITCODE" }
} finally {
  [System.IO.File]::Delete($marketplacePath)
}
```

The validation gate checks manifest structure, local script references,
capture-host ownership, JavaScript syntax, forbidden extension-defined
compatibility globals, upstream provenance documentation, and per-extension
behavior fixtures.

Marketplace generation reads only the local reviewed metadata, manifests,
license texts, and documentation. Names, versions, descriptions, manifest
SHA-256 digests and byte sizes, and capability summaries are derived locally;
the generator performs no network request. Every manifest, documentation, and
license URL is addressed by the supplied commit revision. Generation is
deterministic for that revision. The generator creates a missing `--output`
parent directory and `--check` requires an exact byte-for-byte match. The
fixture suite compiles the published Draft 2020-12 schema and validates the real
generated catalog against it.

CI separately checks out the exact mihomo source commit behind the installer
pin and runs every generated entry through Marketplace review, snapshot
construction, complete config validation, and the real goja/gojq compilers.
That integration gate deliberately fetches absolute third-party script URLs;
it is non-hermetic and fails publication if a reviewed live dependency cannot
be fetched or compiled. Pages publishes only a successfully validated current
`main` commit. A newer `main` revision cancels or fences an older artifact before
deployment.

That build emits one document describing one wire contract, published at
`marketplace/v2/`. The monolith decodes unknown catalog fields leniently, but
this publisher emits only fields the runtime consumes: manifest identity,
display metadata, and the capability summary checked during review. The
retired resource list and typed-policy projection are not retained as decorative
or competing contracts. A future change to fields the runtime consumes must use
a new published path rather than a build profile.

The current integration pin is
`moooyo/mihomo@5798f177fbe0ef209d50e39204c16b21e53194ee`, the source commit behind
the installer's `v1.19.28-monolith.29` artifact. When the installer advances,
update this exact commit and the workflow in the same change. Never replace it
with a branch or movable tag, and never describe `npm test` or marketplace
reproducibility alone as runtime validation.
