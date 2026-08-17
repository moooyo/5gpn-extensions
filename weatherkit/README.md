# WeatherKit Enhancer

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This extension tracks the official `NSRingo/WeatherKit` `v3.3.0`
release. **Script mode** runs the reviewed request and response bundles on the
gateway through the `5gpn.io/v1` proxy-compat contract. **Cloud mode** applies
the separate upstream rewrite module and sends selected WeatherKit requests to
an upstream-hosted service. Neither mode is installed or enabled automatically.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml
```

Keep the extension disabled until its snapshot, fourteen settings, one capture
host, nine actions, network permission, persistent storage, three routing
rules, and explicit egress binding have been reviewed. Cloud mode sends complete
captured requests to a third party. Script mode can send exact coordinates to
selected providers.

## Current upstream refresh

Revision `10.0.0` replaces the `v3.3.0-beta2` runtime assets with stable
`v3.3.0`. Relative to revision `9.0.0`, the material port changes are:

- the official release now exposes `AirQuality.Current.Pollutants.Provider`,
  selecting ColorfulClouds or QWeather when Apple's current air-quality response
  has no pollutant list;
- page-token alert requests now always fetch QWeather Web, while coordinate
  requests use ColorfulClouds for `ColorfulClouds`, the QWeather API for either
  `QWeather` or `QWeatherWeb`, and a local empty list for `WeatherKit`;
- built-in ColorfulClouds and QWeather service tokens now live in the bundle
  database and both request and response paths read the same setting values; an
  explicitly saved empty string now suppresses the built-in value instead of
  activating the old inline fallback;
- the generic `zh` AQHI-scale fallback now selects Traditional Chinese for
  Taiwan instead of the mainland Traditional-Chinese variant; and
- the five Script actions and four Cloud rewrites remain unchanged.

Upstream declares no breaking change. This port uses a major version bump
because an existing `WeatherAlerts.Provider=WeatherKit` installation no longer
forwards a matched coordinate request to Apple, a page-token request now reaches
QWeather regardless of that setting, and the reviewed manifest grows from
thirteen to fourteen settings.

The new pollutant-provider setting defaults to `ColorfulClouds`, matching the
previous hidden database default and preserving the prior provider selection.
Token behavior is separate: a carried explicit empty value now suppresses the
built-in token. The visible weather, alert, and next-hour provider defaults
remain `WeatherKit`; the alert default still preserves Apple's response dataset,
but it no longer means that every matched alert-detail request continues to
Apple.

## Reviewed upstream and runtime assets

The two runtime assets are official GitHub release files:

- `https://github.com/NSRingo/WeatherKit/releases/download/v3.3.0/response.bundle.js`;
- `https://github.com/NSRingo/WeatherKit/releases/download/v3.3.0/request.bundle.js`.

The release module used to transcribe the argument list and five script lines is:

```text
https://github.com/NSRingo/WeatherKit/releases/download/v3.3.0/iRingo.WeatherKit.lpx
```

The annotated tag object
`305032889bc471e13a81ee0fa53ed5b9aa3acca6` resolves to source commit
[`d9e89db7783d23f8bcb1a967af85394ac24b30e3`](https://github.com/NSRingo/WeatherKit/tree/d9e89db7783d23f8bcb1a967af85394ac24b30e3).
The tag is unsigned. The release and its assets were fetched and reviewed on
`2026-08-17`.

GitHub reports the release as published at `2026-08-17T08:19:25Z`, while the
current annotated tag object was created at `2026-08-17T08:35:01Z` and the
reviewed assets were created seconds later. The object and commit above are the
refs observed during this review, not a claim that the tag or assets never move.

| Artifact and purpose | Immutable raw URL |
| --- | --- |
| Upstream license | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/LICENSE` |
| Package metadata, license declaration, and credits | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/package.json` |
| Release changelog and declared breaking-change status | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/CHANGELOG.md` |
| Locked dependency versions | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/package-lock.json` |
| Official release argument composition | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/arguments-builder.release.config.ts` |
| Argument definitions and option values | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/arguments-builder.full.config.ts` |
| Cloud endpoint options | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/arguments-builder.rewrite.config.ts` |
| Cloud rewrite module ported by Cloud mode | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/modules/iRingo.WeatherKit.Rewrite.lpx` |
| Request action behavior | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/process/Request.mjs` |
| Response action behavior | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/process/Response.mjs` |
| QWeather page and API behavior | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/class/QWeather.mjs` |
| AQHI calculations and scale mappings | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/class/AirQuality.mjs` |
| Local AQHI scale responses | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/class/AirQualityScale.mjs` |
| URL and identifier parsing | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/function/parseWeatherKitURL.mjs` |
| Storage selection before settings merge | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/function/setENV.mjs` |
| Bundle defaults and hidden full settings | `https://raw.githubusercontent.com/NSRingo/WeatherKit/d9e89db7783d23f8bcb1a967af85394ac24b30e3/src/function/database.mjs` |
| `@nsnanocat/util` settings merge used by the bundle | `https://raw.githubusercontent.com/NSNanoCat/util/720261e4e7c0e4c27d32d10238880e991b1e74ec/getStorage.mjs` |

The lockfile pins `@nsnanocat/util` `2.7.4`. Its published npm metadata reports
git head `720261e4e7c0e4c27d32d10238880e991b1e74ec`, and the annotated `v2.7.4`
tag resolves to that commit. The reviewed merge applies the database before
`$argument`: a missing token key retains the database token, while an explicit
empty string overwrites it.

GitHub reports `immutable: false` for this release. The generated bundles do
not exist at commit-pinned raw URLs in the upstream tree. This catalog accepts
each direct official release asset because upstream publishes no immutable
bundle URL. Runtime review fetches the live bytes into the complete snapshot
digest, and apply refetches them and fails if the reviewed snapshot changed.
That protects review-to-apply integrity, but it cannot prove that a later asset
replacement still corresponds to the source commit recorded above.

The upstream package metadata credits VirgilClyne, WordlessEcho, 001ProMax, and
hhh2210. These are creator attributions, not additional copyright assertions.
The upstream tree contains no `NOTICE` file.

## Port mapping

The extension captures only `weatherkit.apple.com`. Script mode carries five
bundle actions over four pathnames. Cloud mode carries four rewrite rules over
three pathnames. The difference is intentional: upstream's cloud module has no
`airQualityScale` rewrite.

| Action | Mode and phase | Matcher | Result |
| --- | --- | --- | --- |
| `weather-availability` | Script response | status `200`, `/api/v1/availability/` | Runs `response.bundle.js` with a text body and merges WeatherKit capabilities. |
| `air-quality-scale` | Script request | `/api/v1/airQualityScale/` | Runs `request.bundle.js`, removes a trailing numeric scale version, locally answers `HK.AQHI` and `CN.AQHI`, and forwards other normalized scale requests to Apple. |
| `weather-alerts-page` | Script request | `/api/v1/weatherAlerts` with `&ids=<page-token>-<nine digits>` | Runs `request.bundle.js`, always fetches the corresponding QWeather page, and answers locally. |
| `weather-alerts` | Script request | `/api/v1/weatherAlerts` with `&ids=<latitude>,<longitude>` | Runs `request.bundle.js`. ColorfulClouds uses its API, `QWeather` and `QWeatherWeb` use the QWeather API, and `WeatherKit` returns a local empty list. |
| `weather-data` | Script response | status `200` GET under `/api/v2/weather/` | Runs `response.bundle.js` with a binary body and applies the selected weather, alert, next-hour, pollutant, and air-quality behavior. |
| four `*-cloud` actions | Cloud request | availability, weather, and both alert identifier rules | Rewrites the complete request to the selected endpoint. No bundle runs on the gateway. |

Three typed routing rules preserve upstream's exact-name rejects for
`weather-analytics-events.apple.com`, `tthr.apple.com`, and
`tether.edge.apple`. The core seed owns the fixed global UDP/443 guard, so this
extension does not duplicate it with a host-scoped rule.

### Air-quality scale requests

The scale matcher is deliberately broad:

```text
^/api/v1/airQualityScale/
```

The request bundle parses `/api/v1/airQualityScale/<language>/<scale>`, removes
a final numeric version such as `.1`, and writes the normalized URL back to the
request. Supported `HK.AQHI` and `CN.AQHI` language variants return a local
WeatherKit-compatible `200` JSON scale with names, risk levels, colors, and
health advice. Other valid scale names continue to Apple after normalization.

Cloud mode does not intercept this path because the reviewed upstream rewrite
module does not declare it. A cloud-processed response can therefore reference
a custom AQHI scale that the Cloud action set does not serve. This is an
upstream module asymmetry, not a missing local rewrite.

### Weather-alert identifier rules

Upstream publishes two separate alert matchers, and this port keeps them
separate:

```text
^/api/v1/weatherAlerts\?[^#]*&ids=[^&#]*-[0-9]{9}(?:&|$)
^/api/v1/weatherAlerts\?[^#]*&ids=-?[0-9]+(?:\.[0-9]+)?,-?[0-9]+(?:\.[0-9]+)?(?:&|$)
```

Both require a leading `&ids=`. An identifier used as the first query parameter
does not match. The coordinate form requires a digit before a decimal point, so
`.5,.5` does not match. Encoded commas and Apple's native UUID identifiers do
not match either.

Stable `v3.3.0` handles the two forms as follows:

- A page-token identifier always fetches `www.qweather.com`, regardless of
  `WeatherAlerts.Provider`. The bundle forwards a small browser-header subset
  such as `Accept-Language` and `User-Agent`, parses the HTML, and returns a
  synthesized `200 application/json` response. It does not forward Apple's
  `Authorization` or `Cookie` header to QWeather.
- A coordinate identifier uses the ColorfulClouds API when the setting is
  `ColorfulClouds`, and the QWeather API when it is either `QWeather` or
  `QWeatherWeb`. These branches disclose the exact coordinates and language and
  return a synthesized `200 application/json` response.
- With `WeatherAlerts.Provider=WeatherKit`, a matched coordinate identifier is
  answered locally with `200 []`. It does not continue to Apple. The same
  `WeatherKit` setting still preserves the alert dataset carried inside the
  `/api/v2/weather/` response.

Requests that do not match either manifest expression, including native UUID
identifiers, an `ids` first query parameter, or an encoded comma, never enter
the request bundle and continue to Apple.

The `/api/v2/weather/` response action uses the same setting independently:

- `WeatherKit` leaves the response's existing alert dataset unchanged.
- `ColorfulClouds` and `QWeather` fetch and merge provider alerts only when the
  existing provider is Apple's National Early Warning Center. Those requests
  can disclose the exact coordinates.
- `QWeatherWeb` fetches and merges a page only when the response's alert
  `detailsUrl` is a supported QWeather severe-weather URL; other URLs remain
  unchanged and cause no page request.

## Settings

`Mode` and `Endpoint` belong to this port. The remaining keys use upstream's
published argument names. Dotted keys reach the bundle as a decoded Loon-style
`$argument` object.

| Key | Type and default | Effect |
| --- | --- | --- |
| `Mode` | select, `Script` | Selects the five local bundle actions or the four cloud rewrite rules. |
| `Endpoint` | select, `weatherkit.pages.dev` | Selects `weatherkit.pages.dev` or `dev.weatherkit.pages.dev` for Cloud mode. |
| `Storage` | select, `$argument` | Pins the bundle to the manifest settings branch. The bundle also accepts the upstream spelling `Argument`; the existing value is retained to avoid needless installed-state churn. |
| `DataSets` | text, `airQuality,currentWeather,forecastDaily,forecastHourly,forecastNextHour,weatherAlerts` | Carries the official release input exactly. It currently has no effect because the release module does not attach its request bundle to `/api/v2/weather/`, the only branch that reads this key. |
| `Weather.Provider` | select, `WeatherKit` | Selects `WeatherKit`, `ColorfulClouds`, or `QWeather` for weather replacement. |
| `WeatherAlerts.Provider` | select, `WeatherKit` | Selects response-dataset completion and coordinate-form alert handling. Page-token requests always use QWeather Web; matched coordinates return an empty list under `WeatherKit`. |
| `NextHour.Provider` | select, `WeatherKit` | Selects the next-hour precipitation source. |
| `AirQuality.Current.Pollutants.Provider` | select, `ColorfulClouds` | Selects ColorfulClouds or QWeather when Apple's current air-quality response has no pollutant list. |
| `AirQuality.Calculate.Algorithm` | select, `None` | Selects one of the twelve reviewed algorithm values, including the six new AQHI choices. |
| `API.ColorfulClouds.Token` | text, unset | Optionally overrides the upstream database's built-in ColorfulClouds service token. |
| `API.QWeather.Host` | text, `devapi.qweather.com` | QWeather API host. A blank declared value is not neutral because `$argument` overrides the bundle database default. |
| `API.QWeather.Token` | text, unset | Optionally overrides the upstream database's built-in QWeather service token. |
| `API.WAQI.Token` | text, unset | WAQI API token; selects the premium API when set. |
| `LogLevel` | select, `WARN` | Bundle log verbosity. |

The official Loon argument block renders all three token inputs with empty-string
defaults. This port deliberately declares no manifest default for them. On a
fresh install the ColorfulClouds and QWeather keys therefore remain absent and
the stable bundle's database tokens survive; an explicitly persisted `""`
overwrites those values instead. To restore the built-in token, remove or unset
the saved value rather than saving a blank string. WAQI remains unset unless the
operator supplies a token.

The provider and algorithm defaults intentionally differ from upstream where a
neutral choice exists. The published release defaults weather and next-hour
data to `ColorfulClouds`, alerts to `QWeatherWeb`, and the algorithm to
`EU_EAQI`; this manifest uses `WeatherKit`, `WeatherKit`, and `None`. The new
pollutant selector has no `WeatherKit` or `None` option upstream, so this port
uses upstream's `ColorfulClouds` default to preserve the behavior previously
hidden in the database. A fresh enable can therefore still contact
ColorfulClouds when Apple's air-quality response has no pollutant list, and a
matched page-token alert request can contact QWeather regardless of the alert
provider setting.

`Storage` is load-bearing. Without the `Argument` or `$argument` branch, the
upstream storage loader can ignore every typed manifest setting and read its
database or a BoxJS-compatible store instead. This extension exposes neither
of those configuration sources.

## Permissions and data boundary

- `permissions.network: true` is required. It is one boolean grant and names no
  destination. Any bundle action can send any request, response, setting, or
  storage data visible to it to any public host it can reach.
- `egressRequired=false` is review metadata only. Every installation still has
  one explicit operator binding, and a fresh installation starts at `DIRECT`.
- `permissions.persistentStorage: true` is retained. The bundle stores provider
  caches in the extension-scoped store. This release adds no new persistent
  schema and remains compatible with the existing cache bucket.
- Weather, next-hour, coordinate-alert, and air-quality provider requests can
  disclose the exact coordinates. Provider URLs commonly include latitude and
  longitude directly in the path.
- When custom provider-token settings are omitted, stable `v3.3.0` uses the
  built-in ColorfulClouds and QWeather service tokens stored in its database.
  An explicitly saved empty string overrides that database value and can make
  the corresponding provider lookup fail.
- `AirQuality.Current.Pollutants.Provider` can fetch ColorfulClouds or QWeather
  pollutant data when Apple's air-quality response has no pollutant list. The
  official release offers no `WeatherKit` or `None` choice for that fallback.
- If Apple's `previousDayComparison` is unknown, hidden full-config comparison
  defaults can independently fetch QWeather and ColorfulClouds data. Those
  requests are not selected by `AirQuality.Current.Pollutants.Provider`.
- Every matched page-token request discloses the identifier and selected browser
  headers to `www.qweather.com`, even when `WeatherAlerts.Provider=WeatherKit`.
  It does not forward Apple's end-to-end authorization or cookie headers.
- `QWeather`, `QWeatherWeb`, and `ColorfulClouds` coordinate-alert handling
  discloses the exact coordinate pair and language to the selected API. With
  `WeatherKit`, the bundle makes no provider request but returns a local empty
  list instead of allowing Apple to answer.
- Cloud mode sends the complete captured request to the selected endpoint. The
  rewritten request retains its method, decoded body, and end-to-end headers,
  potentially including Apple's `Authorization` header, plus exact coordinates
  or the QWeather page identifier in the URL. The endpoint's deployment is not
  pinned by this repository.
- Cloud mode does not receive the manifest's provider, token, algorithm, or
  `DataSets` settings. The hosted code uses its own deployment and defaults.
- URL canonicalization, IP-literal and unsafe-host refusals, action timeouts,
  body limits, concurrency limits, and the operator's selected egress binding
  still apply inside mihomo.

## Deliberate exclusions and limitations

- The repository ships no local JavaScript and no compatibility shim. Both
  bundles remain live release dependencies executed by the core-provided Loon
  persona.
- `DataSets` is present for published argument parity but is currently not read
  by any official release action. The dev module attaches a request action to
  `/api/v2/weather/`; the release module does not. This port does not add that
  dev-only action merely to make the setting active.
- The full argument file contains ten settings not exported by the official
  release module: `Weather.Replace`,
  `AirQuality.Current.Pollutants.Units.Replace`,
  `AirQuality.Current.Pollutants.Units.Mode`,
  `AirQuality.Current.Index.Replace`,
  `AirQuality.Current.Index.Provider`,
  `AirQuality.Current.Index.ForceCNPrimaryPollutants`,
  `AirQuality.Comparison.ReplaceWhenCurrentChange`,
  `AirQuality.Comparison.Yesterday.PollutantsProvider`,
  `AirQuality.Comparison.Yesterday.IndexProvider`, and
  `AirQuality.Calculate.AllowOverRange`. They keep the bundle database defaults.
- The full `DataSets` editor additionally offers `locationInfo`, `news`,
  `historicalComparisons`, and `weatherChanges`. The release variant does not,
  so they are not added to this manifest's default.
- The QWeather previous-day comparison path can fetch its cacheable location
  grid from `NSRingo/QWeather-Location-Grid`'s mutable `main` branch, and
  provider-logo values can point at mutable `NSRingo/WeatherKit` `main` assets.
  Neither live resource is bound by the reviewed release tag.
- The dev-only `/api/v2/weather/` request action and
  `weather-map2.apple.com` action are excluded. The sole capture host remains
  `weatherkit.apple.com`.
- BoxJS, `PersistentStore`, and `database` storage modes are excluded. The
  manifest's typed settings are the only supported configuration source.
- Upstream's third cloud endpoint, `weather.nanocat.cloud`, remains excluded.
  It returned no A record and no HTTPS connection during the `2026-08-17`
  review. `weatherkit.pages.dev` and `dev.weatherkit.pages.dev` remain the two
  reviewed selectable hosts.
- Upstream's ASN-plus-QUIC rule is excluded. The manifest cannot faithfully
  represent the combined matcher, and the core seed already owns the fixed
  global UDP/443 rejection required for interception fallback.
- Cloud mode has no `airQualityScale` rewrite because upstream's rewrite module
  has none. This can make the new custom scale behavior incomplete in Cloud
  mode.
- `CA_AQHI` retains an upstream unit inconsistency in stable `v3.3.0`. Source
  review found that its NO2 and O3 configuration targets ppb while the AQHI
  calculation path consumes µg/m³. Depending on the incoming unit, a value can
  be used without the intended conversion or skipped. Keep the default `None`
  unless that upstream behavior has been independently validated for the input
  data in use.
- The hidden full-only pollutant unit-replacement path also references a
  `CN_AQHI` scale key that is not present in the reviewed scale table. This
  manifest does not expose the setting that reaches that path, and its default
  is empty, so the reviewed typed configuration does not trigger it.
- A failed provider lookup can be converted by upstream into a successful
  `200` response with an empty alert list. Treat an unexpectedly quiet alert
  panel as a log-check condition rather than proof that no alert exists.
- No server-side Apple entitlement is created. Apple can still reject or omit a
  requested dataset.
- Certificate pinning, independently provisioned ECH, unsupported protocols,
  and traffic that bypasses the gateway remain outside this extension's control.

## Verification

Run the repository gates from the repository root:

```powershell
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
```

Generate and re-check a deterministic local Marketplace index:

```powershell
$marketplacePath = Join-Path $env:TEMP ("5gpn-weatherkit-" + [guid]::NewGuid().ToString('N') + '.json')
try {
  npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --output $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
  npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --check $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace check failed with exit code $LASTEXITCODE" }
} finally {
  [System.IO.File]::Delete($marketplacePath)
}
```

Runtime-facing changes must also pass the installer-pinned mihomo full-review
corpus in [`MIGRATION.md`](../MIGRATION.md). That gate fetches both live release
assets, builds the immutable snapshot, validates the complete configuration, and
compiles every proxy-compat program with the exact mihomo source operators
receive.

Authorized device smoke testing should confirm:

1. The fourteen settings compile, Script mode compiles five actions, and Cloud
   mode compiles four rewrites.
2. `HK.AQHI.1` and `CN.AQHI.1` scale requests are normalized and answered
   locally in Script mode, while a standard Apple scale continues upstream.
3. With `WeatherAlerts.Provider=WeatherKit`, a page-token request still reaches
   `www.qweather.com`, a matched coordinate request returns local `200 []`, and
   the alert dataset inside the weather response remains unchanged.
4. With `QWeatherWeb` or `QWeather`, a coordinate request reaches the QWeather
   API; with `ColorfulClouds`, it reaches that provider with the exact
   coordinates.
5. With Apple's pollutant list absent and `previousDayComparison` already
   resolved, verify that pollutant injection uses the selected
   `AirQuality.Current.Pollutants.Provider`. Test omitted, non-empty override,
   and explicit-empty token states: only the omitted state uses the built-in
   token.
6. With `previousDayComparison` unknown, account separately for the hidden
   comparison providers and their additional network requests.
7. Cloud mode rewrites availability, weather, and both alert rules to the
   selected endpoint, but leaves `/api/v1/airQualityScale/` with Apple.

## Updating

1. Manually select one upstream release. Record its release URL, annotated tag
   object, source commit, `immutable` status, and UTC review date.
2. Read the Loon release asset. It is authoritative for the proxy-compat
   argument encoding and every `http-request` and `http-response` line.
3. Read the commit-pinned cloud rewrite module separately. Do not infer that it
   carries every release action; `v3.3.0` does not carry
   `airQualityScale` there.
4. Diff the request process, response process, database defaults, URL parser,
   AQHI implementation, and scale implementation. Classify provider hosts,
   data disclosure, local responses, storage, and failure behavior separately.
5. Update the manifest, README, provenance pin, notices, fixtures, validator
   counts, and Marketplace expectations in one change.
6. Run the repository, Marketplace, and installer-pinned mihomo gates before
   publishing a commit-addressed catalog entry.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every candidate.
Upstream selection is manual review only; this extension does not discover or
poll releases automatically.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.weatherkit`; bump `metadata.version` whenever manifest bytes, bundle URLs, or reviewed release assets change. |
| Current manifest | `version=10.0.0`; `persistentStorage=true`; `settings=14`; `captureHosts=1`; `actions=9`; `routingRules=3`; `network=true`; `upstreamMappings=0`; `egressRequired=false`. |
| Enablement | A fresh install starts disabled. An installed Marketplace replacement preserves the prior enabled authorization and does not require a disable-first step. |
| State class | Stateful. `persistentStorage` remains true and provider caches stay in the same extension-scoped bucket. |
| Settings | Retain every existing key and type. `AirQuality.Current.Pollutants.Provider` is additive and defaults to the previous hidden `ColorfulClouds` behavior. |
| Script contract | Five Script actions run the two reviewed bundles through `entry: proxy-compat`; four Cloud actions are declarative rewrites and run no gateway code. |
| Permission review gate | Network access and persistent storage remain reviewed capabilities. Removing either is still a separately reviewed change. |
| Operator state | Preserve valid settings, egress binding, capture-DNS choice, execution order, and prior enabled authorization. Review the new pollutant selector, changed alert-request behavior, and any explicitly empty provider-token value before apply. |
| Rollback | Use a verified publisher-managed revert-forward Marketplace entry with the same ID and a version higher than the failed candidate. |

The extension-specific `v3.3.0` migration summary is:

| Surface | Baseline `9.0.0` | Candidate `10.0.0` | Decision |
| --- | --- | --- | --- |
| Upstream | `v3.3.0-beta2`, commit `4ec00d076959defcda72bbe24ba83ae7a4d9c405` | `v3.3.0`, commit `d9e89db7783d23f8bcb1a967af85394ac24b30e3` | Replace both release bundles and every source reference together. |
| Settings | 13 | 14 | Add `AirQuality.Current.Pollutants.Provider`; default it to the previous hidden `ColorfulClouds` value. |
| Actions | 9 | unchanged | Preserve five Script actions and four Cloud rewrites. |
| Capture and routing | 1 host, 3 rejects | unchanged | Preserve the one-host boundary and core-owned UDP/443 guard. |
| Permissions | network and persistent storage | unchanged | No grant reduction or new storage schema. |
| Alert request behavior | Provider-gated page and coordinate handling; `WeatherKit` could fall through | Page tokens always use QWeather Web; `QWeatherWeb` coordinates use the QWeather API; `WeatherKit` coordinates return `200 []` | Treat the request behavior change as a major-version review boundary. |
| Provider tokens | Empty or missing values activate inline built-in fallbacks | Missing values inherit database tokens; a non-empty value overrides; an explicit empty string suppresses the database token | Preserve missing and non-empty states. An operator expecting the built-in token must remove an old empty value rather than save `""`. |
| State | extension-scoped provider caches | schema-compatible | Keep the same extension ID and storage permission; old caches remain disposable and readable. |
| Cloud mode | 4 rewrites | unchanged | Continue excluding `airQualityScale`. |

### Repeatable migration

1. Complete the shared migration record with the tag object, source commit,
   mutable asset record, fourteen settings, nine actions, permissions, routing,
   exclusions, and rollback candidate.
2. Run the repository and Marketplace gates, then the installer-pinned mihomo
   full-review corpus against both live bundles.
3. Exercise the five Script actions with authorized traffic. Test the stable
   page-token and coordinate-alert matrix under every alert-provider value.
4. Exercise both pollutant-provider values with an Apple response whose
   pollutant list is absent and whose previous-day comparison is already
   resolved. Test absent, non-empty, and explicit-empty token states separately;
   do not treat an empty string as equivalent to unset. Exercise the hidden
   comparison-provider path separately when that comparison is unknown.
5. Exercise Cloud mode separately and confirm its four rewrites while
   `/api/v1/airQualityScale/` remains with Apple.
6. Apply the reviewed Marketplace candidate without a disable-first step and
   verify retained operator state plus the new setting defaults.

### Rollback

If smoke testing fails, disable the extension while retaining its storage
bucket. Publish and review a same-ID publisher-managed revert-forward candidate
with a version higher than `10.0.0`, then apply it through the normal Marketplace
replacement flow. An emergency uninstall and reinstall loses settings, egress
binding, capture-DNS choice, execution position, and installed source identity.
