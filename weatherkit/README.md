# WeatherKit Native Enhancer

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This directory contains a bounded native `5gpn.io/v1` port of reviewed
`NSRingo/WeatherKit` behavior. It is not compiled into either 5gpn daemon, is
not installed or enabled automatically, and is intended only for authorized
device and network testing.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml
```

For a private fork, use the Console's local-add/upload flow or an
operator-controlled public HTTPS mirror. Never embed repository credentials in
an extension URL. Keep the extension disabled until its immutable snapshot,
settings, capture host, actions, and routing rule have been reviewed.

## Pinned upstream

Runtime behavior is pinned to `NSRingo/WeatherKit` release `v3.2.0-beta2`,
which resolves through annotated tag object
`ccad336e3c042dd90157eb79e759a920b466eace` to commit
[`1a2f64883d866a6974a9a5369a82191c49413617`](https://github.com/NSRingo/WeatherKit/tree/1a2f64883d866a6974a9a5369a82191c49413617),
reviewed on `2026-07-28`. The compatible public schema object is pinned
separately to historical commit
[`ecebd32432161571a39f2579ad3ab758f62e80de`](https://github.com/NSRingo/WeatherKit/tree/ecebd32432161571a39f2579ad3ab758f62e80de).
Every repository file, release asset, license, and npm archive recorded below
was fetched and verified on `2026-07-28`. All referenced repository files use
immutable raw URLs:

| Artifact and purpose | Immutable raw URL | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Main license | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/LICENSE` | 11,357 bytes | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| Main package metadata | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/package.json` | 2,904 bytes | `5bf7548975e1a211b94dcc955143eac43c2c1f0de74bd1a91e44ab7fd0677035` |
| Main dependency lock | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/package-lock.json` | 251,856 bytes | `5b7d84810afa77fea347a1923140d630bd49d3bbc447996886e4be3f65efb9c2` |
| Request processor | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/process/Request.mjs` | 5,517 bytes | `3dc641adfdcb74d0064405cc9f601923bbf8abf11a7d2431a08f09fab2f6d663` |
| Response processor | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/process/Response.mjs` | 30,881 bytes | `90d269084478f0b1a51b751e650c70e6d6e94c78ce333d4488f5a10c15c14d8c` |
| Request bundle entry | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/request.js` | 1,739 bytes | `e28ada4797e3b38c99886ff9e60c2fcc584a43a49fc2cea6f6ad8f5d915cc8eb` |
| Published hook configuration | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/sgmodule-tools.config.ts` | 1,295 bytes | `7a1760eb12b3f57b1b1d2f7f5a2026e122f4ccc0c61fafb97d712fb795aead26` |
| Surge routing and hook template | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/template/surge.handlebars` | 1,368 bytes | `f610ee11aae4835196521e3a5159d263a097053087d3b694c5a977ba988244b3` |
| Request/availability tests | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/tests/requestAvailabilityContracts.test.mjs` | 2,993 bytes | `7910a68b341f7502ddc3913a5d528b3d79fb77cc342b8f83d8bf6f9e375ecd91` |
| Defaults, availability list, and configurable root names | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/function/database.mjs` | 6,904 bytes | `5ada781ad6404974233e77da4381825f644e7b8a25a5efd491534fa2d17d97e3` |
| Availability union helper | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/function/mergeWeatherKitAvailability.mjs` | 347 bytes | `237189d9d7b421fd3d72db246c836dd93ef3975e6e36d51d77f767e2b6e3e823` |
| Air-quality implementation | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/class/AirQuality.mjs` | 107,716 bytes | `d612c7154290982900fbf525dea81f4888c3f823ded723c115255095a394e46a` |
| Precision helper | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/class/SimplePrecisionMath.mjs` | 2,687 bytes | `5a95761beaa6423f0925ad67d2dba9e5eb08ee03564f739b323686d22478284e` |
| WeatherKit root model and product codecs | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/src/class/WeatherKit2.mjs` | 63,108 bytes | `829ce76b07196c31726d75cf97a2c839cfafc50595962ff95ded280aef491b44` |
| Root-processor package metadata | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/packages/flatbuffer-root/package.json` | 816 bytes | `695e5fae70dadd38f51f7d425797f7611f8d1e6d7046558f683022e69a88e6db` |
| Root-processor package entry | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/packages/flatbuffer-root/src/index.mjs` | 82 bytes | `f5173ffc57b50b486a7ea7a880fb287525a5e3985021d5b6995309fc3f024967` |
| Generic FlatBuffer root processor | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/packages/flatbuffer-root/src/FlatBufferRootProcessor.mjs` | 25,129 bytes | `c1b7caaf5d968e5b43af4a6f48a09ce542ec245a826623f19509622415afa187` |
| Public schema object | `https://raw.githubusercontent.com/NSRingo/WeatherKit/ecebd32432161571a39f2579ad3ab758f62e80de/src/output/proto.bundle.js` | 79,169 bytes | `cfaac94a89d3b7b17e71e89ba3791e6149fa7e9beadf3b1bbe0b2a0b8b2f9818` |
| Schema-snapshot license | `https://raw.githubusercontent.com/NSRingo/WeatherKit/ecebd32432161571a39f2579ad3ab758f62e80de/LICENSE` | 11,357 bytes | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| Schema package metadata | `https://raw.githubusercontent.com/NSRingo/WeatherKit/ecebd32432161571a39f2579ad3ab758f62e80de/package.json` | 2,883 bytes | `686cd107cb3c9281df4e033dd366992fd8f625b497b268f23587c97739aeeca9` |
| Schema dependency lock | `https://raw.githubusercontent.com/NSRingo/WeatherKit/ecebd32432161571a39f2579ad3ab758f62e80de/package-lock.json` | 391,593 bytes | `e3c889874feaaad942f9a68c47003977df071cbefe9e95a09a8f63ecf010e9cf` |
| Schema build configuration | `https://raw.githubusercontent.com/NSRingo/WeatherKit/ecebd32432161571a39f2579ad3ab758f62e80de/rspack.proto.mjs` | 478 bytes | `02bb54920d00eb349f9c48334f4eb0f79cfdcede171e13366b27ae77cefc2867` |
| FlatBuffers license | `https://raw.githubusercontent.com/google/flatbuffers/a2cd1ea3b6d3fee220106b5fed3f7ce8da9eb757/LICENSE` | 11,358 bytes | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` |
| Rspack license | `https://raw.githubusercontent.com/web-infra-dev/rspack/1bc75a53234509c3fb44789b2c3ec04618a2aee5/LICENSE` | 1,098 bytes | `028c1a9c1fba0083da4728762412b7a41e100a0fad6ff94c895aa3ede94f2c63` |
| esbuild build-tool license | `https://raw.githubusercontent.com/evanw/esbuild/8c71947edbe5a158fec3a6d1cbfea1e8d5cdee70/LICENSE.md` | 1,069 bytes | `b40ec5baec7bb34fa5b1c09521fa3cd52d5fad7adafed74932a2010d3612a681` |

The nested lockfile pins `flatbuffers@24.12.23` and `esbuild@0.25.8`.
The schema compatibility review also used the hash-pinned
`v3.2.0-beta2/response.bundle.js` release asset at
`https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js`:
251,617 bytes, SHA-256
`4d368808a17c42eef18135f04d1bc9f01cbf7878d227006521ef0a6598941ff2`.
The tag resolves to commit
`1a2f64883d866a6974a9a5369a82191c49413617`. GitHub release assets are
publisher-replaceable rather than immutable; the repository verifier therefore
downloads this URL and enforces its recorded size and digest on every run.
GitHub identifies this as release `359700126`, asset `489254394`, and reports
`immutable: false` for the release.
The corresponding npm archives are:

- `https://registry.npmjs.org/flatbuffers/-/flatbuffers-24.12.23.tgz` —
  50,234 bytes — SHA-256
  `34365adda6849859c49f2336d6bb2bfdff25a48fd81d794ade1a4ace5f217457`.
- `https://registry.npmjs.org/esbuild/-/esbuild-0.25.8.tgz` — 30,946 bytes —
  SHA-256
  `f1314ad78bac568f99bc5fca3eaf4efcce5fc2b8d766c0b0576b776159d6e210`.

esbuild also executes one OS/CPU-specific optional `@esbuild/*@0.25.8`
binary. The nested lockfile enumerates every supported platform archive and
binds each to npm's SHA-512 integrity value; the reviewed local build used
`@esbuild/win32-x64` and CI uses `@esbuild/linux-x64`. Those build tools are
not included in the runtime bundle.

The pinned package metadata credits VirgilClyne, WordlessEcho, and 001ProMax.
The bundled source declares `AirQuality.Author = "Virgil Clyne & Wordless
Echo"`; source comments on the precision-related implementation state `Code
by Claude`. These are retained creator attributions, not additional copyright
or license assertions.

## Implemented behavior

The extension owns only `weatherkit.apple.com` and implements three local
actions plus one host-scoped transport rule:

1. `filter-weather-datasets` removes `If-None-Match`, filters only explicitly
   disabled values among `airQuality`, `currentWeather`, `forecastDaily`,
   `forecastHourly`, and `forecastNextHour`, preserves unknown Apple dataset
   names, and collapses duplicate `dataSets` parameters using the first value.
2. `merge-weather-availability` transforms status-200 `application/json` or
   `text/json` responses under `/api/v1/availability/`. It preserves Apple's
   first occurrence and ordering, then appends the missing reviewed v2
   capabilities: `airQuality`, `currentWeather`, `forecastDaily`,
   `forecastHourly`, `forecastPeriodic`, `historicalComparisons`,
   `weatherChanges`, `forecastNextHour`, `weatherAlerts`,
   `weatherAlertNotifications`, and `news`.
3. `transform-weather-air-quality` handles only status-200
   `application/vnd.apple.flatbuffer` responses under `/api/v2/weather/` when
   the request asks for `airQuality`. It selectively decodes root slot 0,
   fixes QWeather CO units, marks the provider metadata as normalized so the
   conversion is idempotent, and normalizes known versioned Apple AQ scale
   names.
   When an operator selects a local algorithm and the input scale is
   `HJ6332012`, it recalculates the existing pollutants without contacting an
   external provider. Original metadata and `previousDayComparison` are kept.
4. The generic FlatBuffer root processor decodes only the `airQuality` root
   slot, recompiles it into its own arena, and reassembles the root table with
   every other present slot carried over as raw bytes. Other known and future
   root product tables remain opaque and byte-preserved. A root slot that fails
   its boundary checks is isolated rather than failing the whole response, but
   it is dropped from the rewritten body; that path is reachable only for a
   response Apple already served malformed.
   Upstream `v3.2.0-beta2` dropped its own change detection and re-encodes every
   requested dataset; this port keeps a local projection comparison, so a
   repeated transform of an already canonical AQ table is still a no-op that
   returns the original bytes untouched.
5. The routing rule rejects UDP destination port 443 only for
   `weatherkit.apple.com`, encouraging fallback to interceptable TCP. It is a
   narrower approximation of the upstream ASN-plus-QUIC rule.

The request action intentionally activates reviewed `Request.mjs` behavior
that is present and tested at the pinned release but is not wired into the
published upstream templates. This repairs that wiring gap; it is not a claim
of byte-for-byte parity with the generated plugin. Upstream replaced its
standalone dataset-filter helper with `WeatherKit2.filterRootNames`, which
applies the same predicate against the same configurable dataset list, so this
port's request behavior is unchanged.

## Settings

| Key | Type and default | Effect |
| --- | --- | --- |
| `airQuality` | boolean, `true` | Keep `airQuality` in the request. |
| `currentWeather` | boolean, `true` | Keep `currentWeather` in the request. |
| `forecastDaily` | boolean, `true` | Keep `forecastDaily` in the request. |
| `forecastHourly` | boolean, `true` | Keep `forecastHourly` in the request. |
| `forecastNextHour` | boolean, `true` | Keep `forecastNextHour` in the request. |
| `airQualityAlgorithm` | select, `None` | `None` applies repairs and scale normalization only. Other values locally recalculate an existing HJ6332012 pollutant set with `UBA`, `EU_EAQI`, US/CN InstantCast, or the CN 2025 draft. |
| `forceCNPrimaryPollutant` | boolean, `true` | For Chinese calculations, keep the highest pollutant as primary even at AQI 50 or below. |
| `allowAirQualityOverRange` | boolean, `true` | Allow supported local algorithms to exceed their standard maximum. |
| `failClosed` | boolean, `true` | Block script-level validation failures. False passes through only exceptions caught by the scripts; body limits, VM timeouts, and result validation remain core fail-closed. |

The first five settings control request datasets only. Availability advertising
uses the fixed reviewed union. The local AQ algorithm never fetches missing
pollutants and runs only when the response already contains them. Upstream full
configuration defaults to `EU_EAQI` for replacement; this native port defaults
to `None` so an index is not silently recalculated until the operator makes an
explicit choice.

## Permissions and data boundary

- `weatherkit.apple.com` is the sole capture and action host.
- `persistentStorage` is false. No script reads or writes extension storage.
- No network origin, upstream mapping, or required egress binding is declared.
  Exact location, Apple authorization headers, response bytes, and API tokens
  are never sent to a third-party provider by this extension.
- The request and availability scripts use 500 ms timeouts with 1 KiB and
  64 KiB limits. The binary AQ action uses a 3-second timeout and a 16 MiB
  input limit. The generated script is below the core's 1 MiB script limit.
- `failClosed=false` affects only errors caught inside a script. Runtime body
  projection, size, timeout, and patch-validation failures always block.

## FlatBuffer and schema boundary

The pinned release imports private GitHub Package `@nsringo/weatherkit@1.1.2`.
The reviewed credentials cannot fetch that package, its package-internal
license is not independently auditable, and the former `NSRingo/proto`
submodule is inaccessible. The private package is not copied or treated as the
license source.

Instead, the build consumes the public Apache-2.0 schema object committed at
`ecebd324...`. Its 27 tables used by the `v3.2.0-beta2` response bundle have
the same field counts, wire operations, and enum values, and it supplies every
symbol referenced by the pinned runtime code: all 48 `WK2` symbols and all 21
enum lookups resolve, and of the 50 distinct generated-constructor call sites
only `Metadata.createMetadata` is narrower than the private schema. That
establishes tested historical wire compatibility and current API coverage, not
byte identity with private 1.1.2.

`v3.2.0-beta2` also introduces the in-repository workspace package
`@nsringo/flatbuffer-root`. That package is marked private and is not published
to the public npm registry, but its Apache-2.0 source is committed in the
upstream tree, so the build pins and compiles those files by immutable raw URL
rather than resolving the package.

The new root processor derives each root slot ID from the *position* of the
generated root class accessors rather than from a declared schema field ID.
The public schema object's `Weather` class exposes exactly the ten accessors
the pinned codec map registers, in the same order, and each has a matching
`add*` static, so slot identities line up with the private model: `airQuality`
is slot 0 through `locationInfo` at slot 9. Revalidate this ordering before any
future schema or upstream change.

Root reassembly preserves unknown root slots, including nested opaque tables.
When the `airQuality` slot is replaced, fields added inside a newer
`AirQuality` or `Metadata` table but unknown to the public schema can be lost.
The public `Metadata` class exposes 11 slots; the current static call site
passes extra arguments named `unknown11` through `unknown15`, which this public
class ignores. This gap is unchanged from the previously reviewed revision.

## License boundary

The current-main behavior, public schema object, and FlatBuffers runtime are
distributed under Apache-2.0. Neither WeatherKit commit nor FlatBuffers
24.12.23 contains a `NOTICE` file. The complete Apache text is available at
[`LICENSES/Apache-2.0.txt`](../LICENSES/Apache-2.0.txt).

The public schema object retains Rspack 1.7.7 bootstrap code under MIT,
Copyright (c) 2022-present Bytedance Inc and its affiliates. The full notice is
embedded in `weather.js` and copied to
[`source/licenses/rspack-MIT.txt`](source/licenses/rspack-MIT.txt). esbuild
0.25.8 emits bounded bundle helper code under MIT, Copyright (c) 2020 Evan
Wallace; its full notice is likewise embedded and copied to
[`source/licenses/esbuild-MIT.txt`](source/licenses/esbuild-MIT.txt).
Therefore the generated bundle is mapped as `Apache-2.0 AND MIT`; the rest of
this extension remains Apache-2.0. `REUSE.toml` and
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) are authoritative for the
file-level boundary.

## Deliberate exclusions and limitations

- ColorfulClouds, QWeather, WAQI, AQHI, provider logos, API tokens, remote
  weather replacement, next-hour injection, and yesterday comparison are not
  included. Current defaults can exceed the native four-request limit and
  disclose exact coordinates in provider URLs.
- Cloudflare, Vercel, Hono, BoxJS, cross-extension location caches, and all
  proxy-client compatibility globals are excluded. That includes every
  configurable upstream rewrite endpoint added in `v3.2.0-beta2`
  (`weatherkit.pages.dev`, `dev.weatherkit.pages.dev`, and
  `weather.nanocat.cloud`).
- Current weather, daily/hourly forecasts, next-hour precipitation, alerts,
  news, and future root products are never decoded or rewritten by the binary
  action.
- No server-side entitlement is created. Apple can still refuse or omit an
  advertised or requested dataset.
- Certificate pinning, independently provisioned ECH, unsupported protocols,
  direct traffic that bypasses the gateway, and root-schema changes remain
  outside this extension's control.

## Reproducible build

`weather.js` is generated; do not edit it directly. The build downloads the
seven fixed WeatherKit inputs above sequentially, verifies each byte length and
SHA-256, patches only the four module imports needed by the native adapter, and
bundles them with the locked FlatBuffers runtime. esbuild removes upstream
comments and module syntax, emits ASCII, injects lexical UTF-8 codecs required
by Goja, embeds the complete Rspack and esbuild notices, and adds one named
`transform(context)` wrapper. It does not add global compatibility APIs.

```powershell
npm ci --prefix weatherkit/source --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "WeatherKit source install failed with exit code $LASTEXITCODE" }
npm run build:check --prefix weatherkit/source
if ($LASTEXITCODE -ne 0) { throw "WeatherKit reproducibility check failed with exit code $LASTEXITCODE" }
```

The reviewed generated output is 186,621 bytes with SHA-256
`67cf617efa0caf1204af07b5922602fa0baefa3c8214ef247fc20c2420df4b17`.
The build rejects compatibility globals, ambient fetch, module loaders,
process access, timers, asynchronous runtime constructs, missing entrypoints,
and output above 1 MiB.

## Updating

1. Manually select and record a new immutable upstream commit. Do not discover
   or automatically follow a mutable branch.
2. Fetch every referenced source, schema object, license, dependency lock, and
   build configuration independently. Record raw URL, bytes, SHA-256, and
   fetch date before changing behavior.
3. Re-audit the private/public schema relationship. Do not replace the public
   schema baseline unless the candidate's object/source license and wire
   compatibility are independently established.
4. Diff request wiring, availability, AQ algorithms, FlatBuffer tables,
   dependencies, provider calls, cloud endpoints, and routing rules as
   separate surfaces. Keep all exclusions explicit.
5. Update source pins, build hashes, generated bundle, fixtures, notices,
   `REUSE.toml`, validator counts, marketplace metadata, README, and
   `metadata.version` in one reviewed change.
6. Run the reproducible build, focused fixtures, repository gates, and current
   core parser integration gate before applying the candidate while disabled.

## Migration and rollback

Follow [`MIGRATION.md`](../MIGRATION.md) for every selected upstream revision
and installed replacement. Upstream selection remains a manual review
decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.weatherkit`; bump `metadata.version` for every immutable manifest or runtime-script change. |
| Current manifest | `version=2.1.0`; `persistentStorage=false`; `settings=9`; `captureHosts=1`; `actions=3`; `routingRules=1`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateless. `persistentStorage` is false and the scripts retain no extension-owned cache. |
| Settings | Preserve the nine keys and types when possible. A normal same-ID update retains only values that remain valid under the candidate. |
| Binary schema | Keep the two upstream commits distinct. Revalidate public-object compatibility, including root accessor count and order, before any binary behavior change. |
| License review gate | Preserve Apache plus Rspack and esbuild MIT notices and the `Apache-2.0 AND MIT` generated-bundle mapping. Never infer a license for private 1.1.2. |
| Reviewed capability baseline | One capture host, three local actions, nine settings, one UDP/443 reject rule, no origins or mappings, and no required egress. |
| Operator state | A normal update retains valid settings, `capture_dns`, and execution order. Review all while disabled. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed URL. No extension-owned data conversion is required. |

### Repeatable migration

1. Complete every shared playbook row with both upstream commits, all pinned
   artifacts, three actions, nine settings, binary schema, build inputs,
   licenses, routing, exclusions, and exact capability diffs.
2. Run `npm ci` and `build:check` in `weatherkit/source`; review the generated
   size, digest, license banner, forbidden-pattern scan, and changed input
   projection.
3. Exercise every dataset toggle, duplicate and encoded queries, both JSON
   media types, AQ no-op/normalization/calculation paths, QWeather CO repair,
   unknown root-slot preservation, unreadable root-slot isolation, malformed
   FlatBuffers, and both `failClosed` modes.
4. Apply the same-ID candidate while disabled. Confirm settings, the one-host
   boundary, action order, empty origin list, absent egress requirement, and
   routing rule before authorized device testing.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the
reviewed request filter, availability union, AQ behavior, schema baseline,
settings, action matchers, and routing rule. It must use a new version higher
than the failing candidate, reproduce its generated bundle, and pass all
current gates. Apply it while disabled and confirm all retained settings and
execution order before enabling.

An emergency reinstall from an old immutable manifest is data-safe because
the extension is stateless, but it loses settings, `capture_dns`, execution
position, and installed source identity. An operator who does not control the
installed URL cannot publish an immediate rollback; disable the extension or
use a separately reviewed operator-controlled fork.

## Verification

```powershell
npm ci --prefix weatherkit/source --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "WeatherKit source install failed with exit code $LASTEXITCODE" }
npm run build:check --prefix weatherkit/source
if ($LASTEXITCODE -ne 0) { throw "WeatherKit reproducibility check failed with exit code $LASTEXITCODE" }
node tests/weatherkit-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "WeatherKit fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

The fixtures cover manifest/resource counts, request and availability
behavior, every dataset toggle, content-type boundaries, no-op and malformed
inputs, local HJ6332012 calculation, QWeather CO repair, metadata/comparison
preservation, synthetic unknown root slots, isolation of an unreadable root
slot, input immutability, script limits, forbidden globals, and both
`failClosed` paths. Runtime-facing changes must
also pass the current 5gpn core parser/marketplace integration gate from the
shared migration playbook. Finally, test authorized device traffic while the
candidate is disabled by default and verify that no external provider request
is emitted.
