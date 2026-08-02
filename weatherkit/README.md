# WeatherKit Enhancer

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This extension carries both WeatherKit modules upstream publishes for the same
three paths. **Gateway script mode** runs the published `NSRingo/WeatherKit`
release bundles against Apple WeatherKit traffic through the `5gpn.io/v1`
proxy-compat script contract. **Cloud endpoint mode** instead rewrites those
three requests to upstream's `weatherkit.pages.dev` service, which fetches from
Apple and transforms the response there. Neither is compiled into either 5gpn
daemon, neither is installed or enabled automatically, and both are intended
only for authorized device and network testing.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml
```

Keep the extension disabled until its snapshot, settings, capture host,
actions, network permission, and routing rule have been reviewed. Cloud endpoint
mode is off by default and sends captured requests to a third party; read
[Permissions and data boundary](#permissions-and-data-boundary) before enabling
it.

## What changed, and why

Earlier revisions hand-ported a slice of upstream behavior into native
`transform(context)` scripts. That port covered request-dataset filtering,
availability merging, and bounded local air-quality work — roughly 5% of what
the upstream bundle does — and every upstream release needed a full manual
review cycle to track. The port was five days and fifteen commits behind
upstream within a week of being written.

The runtime now supports the upstream contract directly: an async script
engine and the proxy-client globals a published bundle expects. So this
extension loads that bundle instead of reimplementing it. Every upstream
feature — provider-backed weather replacement, next-hour precipitation,
yesterday comparison, and the complete air-quality pipeline — comes from the
same code upstream ships, and tracking a release means changing a URL and its
recorded digest.

The trade is explicit and is the operator's to accept: the bundle is a remote
asset that reaches third-party provider APIs with the request's coordinates,
so this extension declares the network capability and persistent storage. The
previous revision declared neither.

Revision 4.0.0 adds the second module upstream publishes for the same paths.
`modules/iRingo.WeatherKit.Rewrite.lpx` ships no script at all: it
rewrites the WeatherKit paths to a hosted endpoint that does the work
server-side. Carrying it means an operator can choose where the transformation
happens without installing a different extension, and the two modes are gated
so that choice is a reviewed setting rather than a reinstall.

They are not equivalent, and the manifest does not pretend they are. Cloud mode
sends the captured request — Apple's authorization header and the exact
coordinates in the path included — to a host this repository does not control,
receives whatever that host returns, and reads none of the settings below,
because the upstream service has no channel for them. Gateway script mode keeps
every byte on the gateway and is the default.

Revision 7.0.0 tracks upstream `v3.2.0-beta5`, which is the first release whose
published module declares a **request** script. Both modules gained a third
path, `/api/v1/weatherAlerts`, and the release module answers it locally instead
of forwarding it: it reads the coordinates out of the query, fetches severe
weather alerts from QWeather, and returns a synthesized Apple-compatible 200.
That is a capability this extension did not have — a script that terminates an
exchange rather than editing one, and a third-party lookup that no provider
setting gates. [Permissions and data boundary](#permissions-and-data-boundary)
states the consequence; the exclusions record what bounds it.

## Pinned upstream

The runtime assets are the two `v3.2.0-beta5` release bundles:

- `https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta5/response.bundle.js`
  (267,124 bytes), loaded by the two response actions; and
- `https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta5/request.bundle.js`
  (236,646 bytes), loaded by the one request action.

The tag resolves through annotated tag object
`902d1646f9f8bbc7fddd6da7747f30aa897fe2fc` to commit
[`33ec3297387e7444fec65bb48a0a042969b97167`](https://github.com/NSRingo/WeatherKit/tree/33ec3297387e7444fec65bb48a0a042969b97167),
reviewed on `2026-08-03`.

| Artifact and purpose | Immutable raw URL |
| --- | --- |
| Upstream license | `https://raw.githubusercontent.com/NSRingo/WeatherKit/33ec3297387e7444fec65bb48a0a042969b97167/LICENSE` |
| Package metadata and credits | `https://raw.githubusercontent.com/NSRingo/WeatherKit/33ec3297387e7444fec65bb48a0a042969b97167/package.json` |
| Published module arguments | `https://raw.githubusercontent.com/NSRingo/WeatherKit/33ec3297387e7444fec65bb48a0a042969b97167/arguments-builder-full.config.ts` |
| Cloud rewrite module, ported by cloud endpoint mode | `https://raw.githubusercontent.com/NSRingo/WeatherKit/33ec3297387e7444fec65bb48a0a042969b97167/modules/iRingo.WeatherKit.Rewrite.lpx` |
| Request-script behavior, read to review the alerts action | `https://raw.githubusercontent.com/NSRingo/WeatherKit/33ec3297387e7444fec65bb48a0a042969b97167/src/process/Request.mjs` |

The release module itself — the source of the three matchers and the nine
arguments transcribed below — is the release asset
`https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta5/iRingo.WeatherKit.plugin`.
It is read as the Loon plugin rather than as any of the four other client
formats published beside it, because `entry: proxy-compat` presents itself to a
bundle as Loon, so Loon's argument encoding is the one that has to match.

GitHub release assets are publisher-replaceable rather than immutable; GitHub
reports `immutable: false` for this release. Nothing in this repository re-checks
those bytes, so upstream replacing an asset changes what runs here without a
review. The marketplace index records the digest it computed at publish time,
which is what a gateway compares at install; a replaced asset makes that install
fail rather than silently adopting new bytes, and republishing the index adopts
them deliberately.

That is not a hypothetical here. During this review, on `2026-08-03`, upstream
moved the `v3.2.0-beta5` tag and replaced both assets: tag object
`7a3f5fbef111c873e2e4c306a5f003b83d17c2c7` at commit
`428fc8e2c68a2513a5db41ddd466e58c917a98c3` became the tag object and commit
recorded above, and both bundles grew by roughly 1.3 to 1.9 KB, about ten
minutes apart. The three added commits complete alert fields on the response
side; the published module's arguments, matchers, rules, and MITM host, the
rewrite module, and `src/process/Request.mjs` are byte-identical across the two
commits, so nothing this manifest transcribes changed. A candidate that only
matched on the tag name would not have noticed either way, which is why the
commit is what is recorded.

The upstream package metadata credits VirgilClyne, WordlessEcho, and
001ProMax. Those are retained creator attributions, not additional copyright
or license assertions.

## Implemented behavior

The extension owns only `weatherkit.apple.com` and declares six actions -- three
per mode, over the same three paths -- plus one host-scoped transport rule:

1. `weather-availability` runs the response bundle against status-200 responses
   under `/api/v1/availability/` with a text body.
2. `weather-data` runs the response bundle against status-200 GET responses
   under `/api/v2/weather/` with a binary body.
3. `weather-alerts` runs the request bundle against requests for
   `/api/v1/weatherAlerts` whose query carries `&ids=<latitude>,<longitude>`.
   Upstream declares no body for it, so none is delivered. It does not edit the
   request and forward it: it fetches the alerts from QWeather itself and
   answers with a synthesized `200 application/json`, so Apple never sees the
   request. [Permissions and data boundary](#permissions-and-data-boundary)
   states what that discloses and to whom.
4. `weather-availability-cloud`, `weather-data-cloud`, and `weather-alerts-cloud`
   rewrite the same three requests, before they are sent, to the matching path
   on the host the `Endpoint` setting names. The rest of the URL, and the whole
   request, carry through unchanged. They declare no script, so no code runs on
   the gateway for them.
5. Four routing rules. Three are upstream's exact-name rejects for
   `weather-analytics-events.apple.com`, `tthr.apple.com`, and
   `tether.edge.apple`; revisions before 3.2.0 simply omitted them. The fourth
   rejects UDP destination port 443 for `weatherkit.apple.com`, encouraging
   fallback to interceptable TCP.

   That fourth rule remains a narrower approximation of upstream's
   `AND,((OR,((IP-ASN,714),(IP-ASN,6185))),(PROTOCOL,QUIC))`. The ASN half is
   not expressible at all: `ipASN` was accepted by the gateway's manifest parser
   for a while, but nothing downstream could carry it — not the sidecar's
   decoder, not the typed overlay, not this repository's validator — so a rule
   using it would have been rendered in the enable review as an enforced deny
   and then dropped from the published generation. The selector has since been
   removed. Even if it returned, adopting it would be declined on purpose: it
   would reject traffic to every address in two Apple autonomous systems, far
   outside the one host this extension captures, and mihomo has no
   `PROTOCOL,QUIC` matcher to narrow it back down with. Widening one extension's
   reach that far is not a change to make silently.

### The alerts path, and why it matches so narrowly

`/api/v1/weatherAlerts` is Apple's own endpoint, and Apple's own alerts are
addressed there by UUID. The matcher this manifest transcribes selects only the
coordinate form, `&ids=<latitude>,<longitude>`, which Apple never sends: it
exists solely because the response bundle rewrote an alert collection's
`detailsUrl` to point at `alertDetails/index.html?ids=<latitude>,<longitude>`,
and the page Apple then loads asks for that identifier. So the request action
answers only requests the response action caused, and a native UUID alert passes
through to Apple untouched.

Two consequences follow from transcribing upstream's matcher exactly rather than
normalizing it:

- The constraint is `&ids=`, with a leading ampersand. A request whose `ids` is
  the *first* query parameter is not selected, in this port and in upstream's
  own plugin alike. That is upstream's regex, kept as written.
- Nothing about the coordinate form is gated on `Weather.Provider`. The response
  bundle rewrites the `detailsUrl` whenever Apple's alert collection reports
  `国家预警信息发布中心` as its provider, which is a property of Apple's data
  and not of any setting on this page.

### Choosing a mode

`Mode` selects which of upstream's two published modules runs. `Script` compiles
the three bundle actions and nothing else; `Cloud` compiles the three rewrites
and nothing else. One select rather than two switches is deliberate: two booleans
have a fourth state where both are on, and a manifest then has to describe what
that means. Here it is unrepresentable.

| `Mode` | Result |
| --- | --- |
| `Script` | The default. The bundles run on this gateway; nothing but provider lookups leaves it. |
| `Cloud` | All three paths go to the selected endpoint. No local code runs, and no setting below `Endpoint` applies. |

Both modes select exactly the same paths and methods, so `Mode` changes how an
exchange is handled and never which exchanges are touched.

`Endpoint` is upstream's own argument, carried the same way: its Surge, Egern,
and Shadowrocket modules interpolate `{{{endpoint}}}` into the rewrite line, and
the manifest interpolates `{{settings.Endpoint}}` into the rewrite target. Two of
upstream's three endpoints are offered. `weatherkit.pages.dev` is the default
because upstream describes it as directly reachable. Upstream's third,
`weather.nanocat.cloud`, is not offered: it no longer resolves, so selecting it
could only fail. The exclusions below record what was checked. The setting does
nothing in `Script` mode.

All three script actions use `entry: proxy-compat`. The runtime presents itself as Loon,
supplies `$request`, `$response`, `$argument`, `$done`, `$persistentStore`,
`$httpClient`, `$notification`, `$utils`, `$environment`, and `$script`, and
completes the action when the bundle calls `$done`. Settings reach the bundles as the decoded object Loon supplies. The bundles'
own parser expands dotted keys, so `Weather.Provider` arrives flat and is read as
`Settings.Weather.Provider`.

`weather-alerts` depends on one further part of that contract that the two
response actions do not: the request bundle finishes by calling
`$done({ response })`, and the exchange is expected to end there with the
synthesized body rather than continue to Apple. A runtime that ignored the
`response` key would forward the original request instead, which fails safe —
the client would get Apple's own answer — but it would also mean the action does
nothing. Confirm it from the log line the [Verification](#verification) section
names rather than from the absence of errors.

The `Storage` setting is not a preference either. The bundles switch on
`$argument.Storage` to decide where to read settings from, and the default
branch reads persistent storage and discards `$argument` entirely. Revisions
before 3.1.0 set no `Storage` key, so **every other setting on this page was
silently ignored** -- the bundle ran on its own defaults and the console gave no
indication. It is declared as a select with one option, because the other
branches would discard them again. Upstream's own option list spells that branch
`Argument`; `$argument` is the documented alias for the same case, and both
reach it.

The request bundle's other two behaviors are not wired, matching the published
upstream module: its `/api/v2/weather/` branch filters the requested `dataSets`
and patches a missing `country` for macOS, and the release module declares no
request script for that path. Wiring it would be a separate reviewed decision,
not a refresh — and the `country` patch reads a cross-extension location cache
this runtime does not expose in any case.

## Settings

This page declares every argument both published upstream modules expose: the
nine the release plugin passes to the bundles, and the one the rewrite module
declares, which is `Endpoint`. The twelve further keys in upstream's full
argument config are deliberately not declared; the exclusions below say why.
The keys below `Endpoint` are upstream's own argument names, so their meaning is
exactly what the upstream documentation describes. `Mode` is this manifest's own
and selects which upstream module runs; `Endpoint` is upstream's own argument
from its rewrite module.

| Key | Type and default | Effect |
| --- | --- | --- |
| `Mode` | select, `Script` | `Script` runs the bundles on this gateway; `Cloud` sends all three matched paths to the selected endpoint instead, and every setting below `Endpoint` stops applying. |
| `Endpoint` | select, `weatherkit.pages.dev` | The host `Cloud` mode sends captured requests to. Two of upstream's three: `weatherkit.pages.dev` and `dev.weatherkit.pages.dev`. |
| `Weather.Provider` | select, `WeatherKit` | Replaces weather data with the selected provider. `WeatherKit` leaves Apple's data alone. |
| `NextHour.Provider` | select, `WeatherKit` | Fills next-hour precipitation from the selected provider. |
| `AirQuality.Calculate.Algorithm` | select, `None` | Calculates the air-quality index locally from reported pollutants. |
| `API.ColorfulClouds.Token` | text, empty | ColorfulClouds API token. |
| `API.QWeather.Host` | text, `devapi.qweather.com` | QWeather API host. Upstream's own argument default, carried rather than left blank; see below. |
| `API.QWeather.Token` | text, empty | QWeather API token. |
| `API.WAQI.Token` | text, empty | WAQI API token; selects the premium API when set. |
| `LogLevel` | select, `WARN` | Bundle log verbosity. |

Only `Mode`, `Endpoint`, and `Storage` apply outside gateway script mode. Everything
else is read by the bundles, and no bundle runs in cloud endpoint mode.
Upstream's hosted service reads its own defaults: in a Worker runtime the
bundle's settings loader has no `$argument` and its persistent store is
per-request memory, so nothing an operator types here reaches it. Upstream's own
rewrite module declares exactly one argument, the endpoint, for the same reason.

`API.QWeather.Host` carries a default because a blank one is not neutral.
`$argument` is merged *over* the bundle's own database defaults, so an empty
string overwrites upstream's `devapi.qweather.com` with `""` and every QWeather
URL is then built against a hostless `https://`. Revisions before 7.0.0 left it
blank, which put the air-quality comparison lookups at the mercy of how the
console renders an unset text setting; from 7.0.0 the alerts action answers from
that host too, so a blank value would be the difference between an alert list
and an empty one.

Weather and next-hour replacement are provider-gated. `Weather.Provider` and
`NextHour.Provider` both default to `WeatherKit`, and the bundle's switch on
each takes an empty branch for that value, so neither path calls a third party
until an operator selects one.

Air quality is not gated that way, and a freshly enabled extension can reach a
third party on its own. When the captured response carries no `pollutants`
array, or an empty one, the bundle always fetches pollutants from a provider:
QWeather when `AirQuality.Current.Pollutants.Provider` is `QWeather`, and
ColorfulClouds in every other case, including the `ColorfulClouds` default this
port leaves in place. An empty `API.ColorfulClouds.Token` does not prevent that
call either, because the bundle substitutes a built-in token when the setting is
empty. So the first `/api/v2/weather/` response whose air-quality dataset
arrives without pollutants can reach ColorfulClouds, carrying the exact
coordinates described below, and no setting this manifest declares turns that
off. See the exclusions below for why declaring more of them would not.

Severe weather alerts are not gated that way either, and from 7.0.0 that is a
second ungated third-party path. `weather-alerts` reaches
`API.QWeather.Host` on every request it selects, whatever `Weather.Provider`
says, and an empty `API.QWeather.Token` does not prevent it: the bundle
substitutes a built-in token exactly as the ColorfulClouds path does. What
bounds it is the matcher, not a setting — see
[The alerts path](#the-alerts-path-and-why-it-matches-so-narrowly).

## Permissions and data boundary

- `weatherkit.apple.com` is the sole capture and action host.
- `permissions.network` is declared. It is one grant with no origin list: the
  bundles' reachable hosts depend on `API.QWeather.Host` and on which providers
  an operator selects, and cloud mode's target depends on `Endpoint`, so nothing
  here could have been enumerated in a manifest anyway.
- **A selected provider receives the request's exact coordinates.** Upstream
  builds provider URLs such as
  `https://api.caiyunapp.com/v2.6/{token}/{longitude},{latitude}`, so both the
  API token and the precise location appear in the request path. Treat every
  enabled provider as having that data.
- **`weather-alerts` discloses the exact coordinates to QWeather with no
  provider selected.** It builds
  `https://{API.QWeather.Host}/weatheralert/v1/current/{latitude}/{longitude}`
  and sends the API key as a header, using a built-in token when
  `API.QWeather.Token` is empty. No setting on this page turns that off; what
  bounds it is the matcher described above, which fires only for identifiers the
  response bundle itself wrote.
- **`weather-alerts` answers the client itself.** The alert list the Weather app
  shows for a matched request is built by this extension from QWeather's data,
  not returned by Apple, and Apple never sees the request. When the lookup fails
  the bundle answers `200` with an empty array, so a failure reads to the client
  as "no alerts" rather than as an error. Treat a silent alerts pane as
  something to check in the log, not as a quiet day.
- `persistentStorage` is true. The bundles cache provider lookups under the
  extension-scoped store.
- Granting the network capability exposes the synchronous request capability to
  every script in this extension and lets it send any request, response,
  setting, or storage data visible to it to any permitted host. The enable
  confirmation states this.
- **An enabled cloud endpoint mode discloses the whole captured request to the
  selected endpoint.** A rewritten request carries its method, decoded body, and
  end-to-end headers, so Apple's `Authorization` header and the exact coordinates
  in `/api/v2/weather/{locale}/{latitude}/{longitude}` — and, since 7.0.0, in the
  `ids` parameter of `/api/v1/weatherAlerts` — both reach that host. It answers
  with whatever it chooses, and the client sees that as
  Apple's response. Upstream's service reuses those headers to fetch from Apple
  on the operator's behalf.
- The grant names no host, so the enable confirmation cannot tell an operator
  where captured data may go — only that it may. What bounds the endpoint is the
  `Endpoint` setting's option list, this README, and the validator, all of which
  are part of the reviewed snapshot.
- Request URL canonicalization, IP-literal and private-host refusal, per-action
  call and concurrency budgets, body limits, and authenticated mihomo SOCKS5
  egress all still apply.

## Deliberate exclusions and limitations

- The services behind both endpoints are not distributed artifacts of this
  repository, and their deployments are not pinned by anything here. What this
  port transcribes is upstream's rewrite module — the paths and the endpoint
  list — and that says nothing about what those hosts run today. Treat cloud
  endpoint mode as trusting their operator, not as running reviewed code.
- Upstream's third endpoint, `weather.nanocat.cloud`, is not offered. It stopped
  resolving: re-checked on `2026-08-03`, it still returned no address and no
  connection could be opened, while `weatherkit.pages.dev` and
  `dev.weatherkit.pages.dev` both answered. Revision 6.0.0 removed the option; an
  install that had selected it does not retain the value, because the shared
  playbook retains a value only while it stays valid under the candidate, so the
  required select applies its default, `weatherkit.pages.dev`. Re-confirm the
  endpoint while disabled.
- Upstream has *not* dropped that module's `endpoint` argument, and an earlier
  revision of this README said it had. What is true is narrower: at
  `33ec3297387e7444fec65bb48a0a042969b97167` the Loon and Stash forms of the
  rewrite module hard-code `https://weatherkit.pages.dev`, while the Surge,
  Shadowrocket, and Egern forms still interpolate `{{{endpoint}}}` and
  `arguments-builder.rewrite.config.ts` still declares all three options. The
  option list here follows the argument config and the reachability check above,
  not any one client's template.
- Cloud endpoint mode reads none of the bundle settings, and no channel exists
  to pass them: upstream's service takes its configuration from its own
  defaults. Enabling it silently discards every provider, token, and algorithm
  choice on the settings page.
- Upstream's cloud entry point now runs its request stage. `src/Hono.js` calls
  `Request($request)` before fetching from Apple and returns a locally
  constructed response when that stage produces one, so the endpoint serves
  `/api/v1/weatherAlerts` the same way the request bundle does. An earlier
  revision of this README said that stage was commented out; it was, at
  `v3.2.0-beta2`, and it no longer is.
- BoxJS and cross-extension location caches are not exposed. The upstream
  `Storage` key is declared, but pinned to its `$argument` branch and nothing
  else, so settings come from the manifest rather than from a BoxJS-backed
  configuration source. See the settings note above for why it has to be
  declared at all.
- The request bundle's `/api/v2/weather/` branch is not wired, and neither is
  its page-identifier alerts branch. The first filters `dataSets` and patches a
  missing macOS `country` from a cross-extension location cache; the published
  release module declares no request script for that path, and the cache is not
  exposed here. The second fetches and scrapes a `www.qweather.com` severe
  weather page when `ids` is a page token rather than a coordinate pair; the
  matcher this manifest transcribes — upstream's own — selects only the
  coordinate form, so that branch is present in the pinned bundle but
  unreachable through this extension.
- Twelve of upstream's twenty-one argument keys are not declared: `DataSets`,
  `Weather.Replace`, `AirQuality.Current.Pollutants.Provider`,
  `AirQuality.Current.Pollutants.Units.Replace`,
  `AirQuality.Current.Pollutants.Units.Mode`,
  `AirQuality.Current.Index.Replace`, `AirQuality.Current.Index.Provider`,
  `AirQuality.Current.Index.ForceCNPrimaryPollutants`,
  `AirQuality.Comparison.ReplaceWhenCurrentChange`,
  `AirQuality.Comparison.Yesterday.PollutantsProvider`,
  `AirQuality.Comparison.Yesterday.IndexProvider`, and
  `AirQuality.Calculate.AllowOverRange`. Each keeps the bundle's own default, so
  the comparison paths that use them reach QWeather and ColorfulCloudsUS, and
  the pollutants path reaches ColorfulClouds, as the settings section describes.
- Declaring those keys would not give an operator a way to keep air quality on
  the gateway, which is why the omission is recorded rather than fixed by adding
  them. `AirQuality.Current.Pollutants.Provider` selects only between QWeather
  and ColorfulClouds; the branch has no non-replacing value, unlike
  `Weather.Provider`. `DataSets` cannot gate it either, because the bundle
  dispatches on the `dataSets` query parameter of the captured request and reads
  its `DataSets` setting only as a static flatbuffer root name. Keeping
  air-quality traffic local would mean narrowing what the actions match, which is
  a capability change and a separate reviewed decision.
- The same is true of the alerts lookup, and more sharply: upstream declares no
  argument for it at all. Keeping it off means not declaring `weather-alerts`,
  which is a capability reduction against the published upstream module rather
  than a setting.
- No server-side entitlement is created. Apple can still refuse or omit a
  requested dataset.
- The bundles are remote assets. Their behavior can change with a new release,
  their internals are not reviewed line by line here, and nothing in this
  repository re-checks their bytes: the release URLs name a tag, and GitHub lets
  a publisher replace what a tag serves.
- Certificate pinning, independently provisioned ECH, unsupported protocols,
  and direct traffic that bypasses the gateway remain outside this extension's
  control.

## Verification

```powershell
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
```

Runtime-facing changes must also pass the current 5gpn core parser/marketplace
integration gate. Revision 7.0.0 adds the first request-phase `proxy-compat`
action that terminates its exchange, so that gate is what establishes the
sidecar honors `$done({ response })` from a request script; nothing in this
repository exercises it.
Finally, exercise authorized device traffic with the candidate enabled and
confirm, from the plugin engine log stream:

1. with the default gates, which provider requests are emitted;
2. that a matched `/api/v1/weatherAlerts` request runs `weather-alerts`, emits
   the QWeather `weatheralert/v1/current` lookup, and is answered locally --
   Apple must show no corresponding upstream request -- while an alert addressed
   by UUID is not selected at all; and
3. with `Mode` set to `Cloud`, that all three paths leave for
   `weatherkit.pages.dev`, that the rewrite is accepted under the extension's
   single `permissions.network` grant rather than refused for want of a
   declared origin, and that the client still renders the response.

## Updating

1. Manually select a new upstream release and record both asset URLs, the
   annotated tag object, and the commit before changing behavior.
2. Re-read the upstream release notes for new settings, new endpoints, changed
   provider hosts, and new script lines. Argument keys are upstream's, so a
   renamed argument silently stops applying rather than failing. Read the
   release module as the Loon plugin asset, `iRingo.WeatherKit.plugin`: it is
   the form whose argument encoding `entry: proxy-compat` matches, and it is
   where a new `http-request` or `http-response` line appears -- `v3.2.0-beta5`
   added one, and a refresh that only bumped the URL would have shipped a
   two-thirds port of the module. Re-read the cloud rewrite module
   for changed rewrite targets in the same pass; a moved endpoint would leave
   this port sending captured requests to a host upstream has abandoned. Read it
   at `modules/iRingo.WeatherKit.Rewrite.lpx`: upstream renamed the original
   `.plugin` file and now publishes four other client formats beside it, and
   they do not agree on whether the endpoint is an argument, so read
   `arguments-builder.rewrite.config.ts` for the authoritative option list.
3. Update the manifest source URLs, settings, README record, `REUSE.toml`,
   notices, validator counts, marketplace metadata, and `metadata.version` in
   one reviewed change.
4. Run the gates above, then apply the candidate while disabled.

## Migration and rollback

Follow [`MIGRATION.md`](../MIGRATION.md) for every selected upstream revision
and installed replacement. Upstream selection remains a manual review
decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.weatherkit`; bump `metadata.version` for every manifest or pinned-bundle change. |
| Current manifest | `version=7.0.0`; `persistentStorage=true`; `settings=11`; `captureHosts=1`; `actions=6`; `routingRules=4`; `network=true`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateful. `persistentStorage` is true and the bundles cache provider lookups in the extension-scoped store. |
| Settings | Preserve the eight upstream argument keys, the `Storage` pin, and the two mode gates with their types. `API.QWeather.Host` must keep upstream's own default rather than being blanked, because `$argument` overrides the bundle's database default. A normal same-ID update retains only values that remain valid under the candidate; a candidate that drops a gate must state which mode an existing install lands in. |
| Script contract | The two response actions and the one request action use `entry: proxy-compat`; the three cloud actions are declarative rewrites and run no code. The request action terminates its exchange with a synthesized response rather than editing and forwarding one, so a candidate that moves it to the response phase, or drops the `&ids=` constraint from its matcher, is a capability change. Changing an action back to the native contract requires a new reviewed script, not a manifest edit. |
| Third-party endpoint | `https://weatherkit.pages.dev` and `https://dev.weatherkit.pages.dev` are the reviewed set. Changing one, adding an endpoint, or moving the choice out from behind the setting is a capability change and needs a disabled replacement. Removing one, as 6.0.0 did, is a capability reduction and needs the same review. |
| Permission review gate | The network capability and persistent storage are part of the reviewed baseline. Removing either is a capability reduction and still needs a disabled replacement. |
| Reviewed capability baseline | One capture host, two proxy-compat response actions and one proxy-compat request action gated on `Mode: Script`, three request rewrites to one third-party endpoint gated on `Mode: Cloud`, eleven settings, four reject routing rules, the network capability, persistent storage, and no required egress. The request action reaches QWeather with the request's coordinates under no provider gate, and answers the client itself. |
| Operator state | A normal update retains valid settings, `capture_dns`, and execution order. Review all while disabled, and re-confirm which mode gate is on. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed URL. The extension-owned store is a cache, so discarding it costs only a refetch. |

### Repeatable migration

1. Complete every shared playbook row with both pinned bundles, the pinned
   rewrite module, all six actions, eleven settings, the network capability,
   persistent storage, routing, and exact capability diffs.
2. Verify the recorded bundle and rewrite-module digests before review, and
   again after applying.
3. Exercise both response actions against authorized device traffic with the
   declared providers left at their defaults, then with one provider enabled,
   and confirm from the plugin engine log which external requests were made.
   Expect the air-quality lookup the exclusions describe in both runs.
4. Exercise the alerts action separately. Confirm from the same log that a
   coordinate-form `/api/v1/weatherAlerts` request is answered locally after a
   QWeather lookup, that no request for it reaches Apple, and that a UUID-form
   request is not selected. Do this with the providers at their defaults: the
   lookup is not provider-gated, and a run that only tests an enabled provider
   proves nothing about the default install.
5. Exercise cloud endpoint mode separately, with `Mode` set to `Cloud`, and
   confirm from the same log that all three paths leave for
   `weatherkit.pages.dev` and that no provider request is made.
6. Apply the same-ID candidate while disabled. Confirm settings, both mode
   gates, the one-host boundary, action order, the network capability, and the
   routing rule before authorized device testing.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the
reviewed bundle pins, the endpoint, settings, mode gates, action matchers,
permissions, and routing rule. It must use a version higher than the failing
candidate and pass all current gates. Apply it while disabled and confirm the
retained settings and execution order before enabling.

An emergency reinstall from an older manifest loses settings, `capture_dns`,
execution position, and installed source identity. An operator who does not
control the installed URL cannot publish an immediate rollback; disable the
extension or use a separately reviewed operator-controlled fork.
