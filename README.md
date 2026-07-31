# 5gpn extensions

English | [简体中文](README.zh-CN.md)

This repository is the first-party catalog for independently maintained native
5gpn extensions. The 5gpn core repository owns the runtime and strict
`5gpn.io/v1` contract; it does not vendor or mirror extension source code.

Every extension is disabled by default after import. Review its immutable
manifest, scripts, capture hosts, exact routing rules, the network permission, execution position, and
operator egress requirement before enabling it.

| Extension | Purpose | License |
| --- | --- | --- |
| `apple-wloc` | Rewrite Apple WLOC responses to an operator-selected point | MIT |
| `bilibili-cleaner` | Remove selected Bilibili ads and promotions | GPL-3.0-only |
| `testflight-region-unlock` | Rewrite TestFlight storefront with operator-selected egress | CC BY-NC-SA 4.0 |
| `weatherkit` | Run the reviewed WeatherKit bundle on the gateway, or send both captured paths to an upstream cloud endpoint | Apache-2.0 |
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

Every import starts disabled. Before enabling it, review the immutable
snapshot digest, capture hosts, actions, settings, exact routing rules, the network permission, execution
position, and any required operator egress binding. Installing an extension
does not enable the global interception master or trust its interception CA on
a device.

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
resulting immutable snapshot remains disabled until its capture hosts, permissions, settings, routing rules,
execution position, and egress binding are reviewed.

The marketplace is discovery metadata, not an executable trust boundary. Each
entry points to the normal `main` manifest and local script URLs so the existing
explicit update check can continue to refetch the installed source. The list
also records the exact SHA-256 and byte size produced from its 40-character
build commit. The gateway must verify the advertised manifest and script
digests against the fetched bytes and then apply the full strict `5gpn.io/v1`
parser; it must not trust the list's description or capability summary as
runtime authority.
Scripts are fetched, validated, and stored by the normal immutable snapshot
pipeline. A digest mismatch fails closed.

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
[`5gpn.io/v1` author guide](https://github.com/moooyo/5gpn/blob/beta/docs/native-extensions.md).
This section is a self-contained maintainer checklist for extensions in this
catalog. 5gpn accepts only the native format described here; do not ship Loon,
Surge, Quantumult X, Stash, or other compatibility globals or manifests.

### Directory layout

Keep one independently installable extension in each top-level directory:

```text
example-cleaner/
  extension.yaml
  clean-response.js
  README.md
```

`extension.yaml` and every script needed at runtime must be immutable local
files in the directory. The README must document the governing license,
creator attribution, every upstream source pinned to a commit, raw URLs,
SHA-256 digests, fetch dates, porting decisions, exclusions, limitations,
update procedure, and verification steps.

### Available capabilities

| Capability | Manifest declaration | Runtime effect and boundary |
| --- | --- | --- |
| Acquire traffic | `traffic.captureHosts` | Exact DNS names or constrained `*.example.com` wildcards. This is the only traffic-acquisition permission and publishes DNS, certificate, and mihomo rules for ports 80 and 443 when enabled. |
| Apply reviewed global routing | `traffic.routingRules` | Bounded typed selectors can only `REJECT` or `DIRECT` matching traffic already reaching the gateway. Exact rules share the single enable confirmation, cannot name a proxy group, and exist only while the extension and MITM master are enabled. |
| Transform requests or responses | `actions[]` | Ordered structured matchers select one action in the declared phase. Each action host must belong to the same extension's `captureHosts`. |
| Block a matched path | `script.reject` | Aborts the exchange before it is sent upstream. No code. |
| Answer with a fixed reply | `script.mock` | A declared status, headers, and `body` or `base64Body`. No code, and no request leaves the gateway. |
| Rewrite a JSON body | `script.jq` | An upstream module's own `response-body-json-jq` expression, run by gojq without entering the JavaScript runtime. Reads operator choices through `$settings`. |
| Edit headers on a real message | `script.headers` | `set` and `remove` fields without replacing the body. Removal runs first. |
| Send a request elsewhere | `script.rewrite` | Rewrites the URL in place, or answers 302/307. `to` may interpolate `{{settings.key}}`, which is how an upstream module's endpoint argument survives the port. An in-place rewrite forwards the captured request as it stands, so a cross-origin target needs the network permission. |
| Edit body bytes | `script.replaceBody` | A regular expression and a replacement that may read `{{settings.key}}`, optionally resolved through a declared `valueMap`. Unlike `jq` it does not parse the document, so unmatched bytes survive exactly. |
| Gate an action on a setting | `actions[].enabledWhen` | `{key, equals}` against a required setting of the same extension. When the comparison fails the action is not compiled, so it never matches. A select therefore drives several mutually exclusive action sets, which two booleans cannot: they have a fourth state where both are on. Upstream plugin formats switch an entry on and off from outside the script, which is why a bundle carrying such a switch never reads the key that controls it. |
| Run a published proxy-client bundle | `script.entry: proxy-compat` | Loads a pinned upstream script under a Loon persona. See [the contract below](#proxy-compat-contract). |
| Read a body | `script.bodyMode` | `none`, UTF-8 `text`, or `binary` as `Uint8Array`, bounded by `maxBodyBytes`. |
| Typed operator configuration | `settings[]` | `text`, `select`, `boolean`, `number`, and `location`; required values must be complete before enable. |
| Persistent state | `permissions.persistentStorage: true` | Adds extension-scoped, quota-bound `context.storage`; scripts never choose a path or access the filesystem. |
| Outbound HTTP | `permissions.network: true` | Adds `context.network.request`, the concurrent `context.network.requestAsync`, and cross-origin request rewriting. It names no host: an extension holding it may reach anywhere it can resolve. There is no ambient `fetch`, redirect following, cookie jar, or socket access, and URL canonicalization plus IP-literal and private-host refusal still apply. The operator confirms that visible decrypted data, and any captured request, could be sent anywhere. |
| Override where a name resolves | `traffic.upstreamMappings` | Loon's `[Host]`. A target is an address (`1.2.3.4`), an alias (`origin.example.net`), or a resolver (`server:1.1.1.1`). The name keeps its Host header and TLS SNI: only the address changes, and it changes in the gateway's resolver, so both the client's answer and the upstream leg of a captured host follow the same table. A mapping supplies an address and never a routing decision — a domestic name mapped to a domestic address still goes direct, and one mapped to a foreign address is still steered. Address targets are SSRF-checked. A mapping cannot reach an outbound that resolves remotely, because a proxy node is handed the name rather than the address. |
| Require a regional/operator exit | `requirements.egressGroup.required: true` | Forces the operator to bind an existing mihomo group or `DIRECT` before enable. The extension cannot name, inspect, select, or change an arbitrary group; a separately reviewed routing rule may select only `DIRECT`. |
| Compose several extensions | Console execution order | Request and response actions run top-to-bottom. For overlapping destinations, the first bound extension and first global routing rule in that same order win. Reordering requires a before/after confirmation. |

Scripts never receive filesystem, process, timer, module-loader, raw socket,
ambient DNS, ambient Go object, or unrestricted network access. All upstream
TCP and UDP return through authenticated mihomo `intercept-egress`; an
extension cannot opt into direct sidecar egress.

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

An action declares exactly one of seven kinds. Six are declarative and never
reach the JavaScript runtime: `reject`, `mock`, `jq`, `headers`, `rewrite`, and
`replaceBody`. Prefer them — every extension in this repository is built from
those plus `proxy-compat`, and none ships JavaScript.

```yaml
script: { reject: true, bodyMode: none, timeoutMs: 500, maxBodyBytes: 1024 }
script: { mock: { status: 200, headers: { Content-Type: application/json }, body: '{}' }, bodyMode: none, ... }
script: { jq: 'del(.data.ad_info)', bodyMode: text, ... }
script: { source: https://…/pinned.js, entry: proxy-compat, bodyMode: text, ... }
```

### Script contract

The seventh kind is a local script. It is still supported and still reviewed
the same way, but nothing in this repository uses it. A script defines exactly
one global entry point:

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
```

Request actions may return a request patch, a synthetic response, `{abort:
true}`, `null`, or `undefined`. Response actions may return only a response
patch, an abort, or no change. A rewritten URL must remain inside the owning
extension's capture-host boundary. Unknown result fields and uncaught script
errors fail the matched flow closed.

Response actions and synthetic responses may include a bounded `trailers`
patch. Request patches cannot create trailers. Names, values, field counts,
single-value size, and total bytes are validated; framing and other forbidden
trailer fields fail closed. Valid HTTP/gRPC trailers are preserved across
HTTP/1.1, HTTP/2, and HTTP/3.

`context.storage` exists only when persistent storage was declared.
`context.network.request` exists only when the network permission was declared
and confirmed. Network responses contain `url`, `status`, `headers`, `trailers`, binary
`body`, and `text` when the body is valid UTF-8. Redirects and non-2xx
responses are returned to the script rather than silently followed.

### Proxy-compat contract

`script.entry: proxy-compat` runs a published proxy-client bundle unmodified.
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

Network origins contain only a canonical scheme, hostname, and effective port;
wildcards, paths, queries, fragments, userinfo, IP literals, localhost, and
private names are rejected. Upstream mappings apply only to a host already
owned by the same extension and cannot target private, loopback, link-local,
carrier-grade NAT, or otherwise unsafe addresses. That refusal is not defence
in depth: the gateway's rendered private-range denies are all `no-resolve`, so
they stop an IP-form routing target and nothing else, and the egress anchor
resolves ahead of the rule list entirely. A static mapping is the one case
where the address is known before any traffic flows, which is why it can be
checked at all.

### Development and review workflow

1. Choose the authoritative upstream repository and immutable commit. Do not
   treat an extension store or mirror's root license as authority over a more
   specific original file license.
2. Record and verify every source and license file's raw URL, size, SHA-256,
   fetch date, creator attribution, and license before porting behavior.
3. Translate only reviewed behavior into the strict native manifest and
   declarative action kinds, or a pinned upstream bundle. Narrow capture hosts and matchers instead of
   preserving broad client-specific patterns.
4. Declare storage, the network permission, upstream mappings, and required egress
   only when used. Document what decrypted data a permitted network call could
   disclose.
5. Add positive, no-op, malformed-input, and boundary fixtures. Preserve
   unrelated fields and fail closed where a partial transformation is unsafe.
6. Run the catalog validators and the current core parser gate:

   ```powershell
   npm ci
   if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
   npm test
   if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
   ```

   Then run the current core parser integration command in
   [`MIGRATION.md`](MIGRATION.md).

7. Install the candidate disabled, inspect its snapshot digest and permission
   summary, configure required settings and egress, then enable it only on an
   authorized test device with the shared interception root trusted.

An update must keep `metadata.id`, bump `metadata.version` when immutable
runtime bytes change, refresh provenance and fixtures, and remain disabled
after replacement. Do not introduce automatic updates, mutable runtime script
fetches, or compatibility shims.

Upstream selection is deliberately manual. Every source migration, installed
rollout, and rollback must follow the reusable
[`MIGRATION.md`](MIGRATION.md) playbook. It requires a baseline/candidate
record, a capability and license diff, an explicit state strategy, disabled
application, focused and core verification, and a rehearsable revert-forward
rollback managed by the installed source's publisher. It also documents the
limited emergency options available to operators who do not control that URL.
The playbook does not discover or automatically select upstream revisions.

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
npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --profile v1 --output marketplace.json
if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --profile v1 --check marketplace.json
if ($LASTEXITCODE -ne 0) { throw "marketplace check failed with exit code $LASTEXITCODE" }
```

The validation gate checks manifest structure, local script references,
capture-host ownership, JavaScript syntax, forbidden compatibility globals,
upstream provenance documentation, and per-extension behavior fixtures.

Marketplace generation reads only reviewed market metadata from
`marketplace/metadata.json`; names, versions, descriptions, resources,
digests, sizes, and capability summaries are derived from the strict extension
manifests and local files. Generation is deterministic for a given revision.
The generator creates a missing `--output` parent directory and `--check`
requires an exact byte-for-byte match. The fixture suite compiles the published
Draft 2020-12 schema and validates the real generated catalog against it.
The Pages workflow reruns all validation and upstream checks, generates from
the checked-out `GITHUB_SHA`, verifies the generated bytes, and deploys only the
static marketplace and schema.

That build emits one document describing one wire contract, published at
`marketplace/v2/`. It was several: the core parses the index with
`DisallowUnknownFields`, so a field added to it is not additive — a core that
does not know it refuses the whole document and loses its extension catalogue —
and a frozen profile existed to keep serving the older shape. Those cores are
gone, every extension needs the current contract, and the frozen profile had
become an empty catalogue that failed by producing nothing rather than by
saying so. The contract version lives in the published path, which is where a
reader can act on it; when it next changes, that is a new path and a deliberate
decision rather than a build flag.

The validation workflow hands the index to both core channels, `main` and
`beta`. Checking only the channel a field lands on first is exactly what would
let it through and then break every gateway on the other.
