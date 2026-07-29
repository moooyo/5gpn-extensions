# WeatherKit Enhancer

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This extension carries both WeatherKit modules upstream publishes for the same
two paths. **Gateway script mode** runs the published `NSRingo/WeatherKit`
release bundle against Apple WeatherKit responses through the `5gpn.io/v1`
proxy-compat script contract. **Cloud endpoint mode** instead rewrites those two
requests to upstream's `weatherkit.pages.dev` service, which fetches from Apple
and transforms the response there. Neither is compiled into either 5gpn daemon,
neither is installed or enabled automatically, and both are intended only for
authorized device and network testing.

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

Revision 4.0.0 adds the second module upstream publishes for the same two
paths. `modules/iRingo.WeatherKit.Rewrite.plugin` ships no script at all: it
rewrites both WeatherKit paths to a hosted endpoint that does the work
server-side. Carrying it means an operator can choose where the transformation
happens without installing a different extension, and the two modes are gated
so that choice is a reviewed setting rather than a reinstall.

They are not equivalent, and the manifest does not pretend they are. Cloud mode
sends the captured request — Apple's authorization header and the exact
coordinates in the path included — to a host this repository does not control,
receives whatever that host returns, and reads none of the settings below,
because the upstream service has no channel for them. Gateway script mode keeps
every byte on the gateway and is the default.

## Pinned upstream

The runtime asset is the `v3.2.0-beta2` release bundle at
`https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js`:
251,617 bytes, SHA-256
`4d368808a17c42eef18135f04d1bc9f01cbf7878d227006521ef0a6598941ff2`.
The tag resolves through annotated tag object
`ccad336e3c042dd90157eb79e759a920b466eace` to commit
[`1a2f64883d866a6974a9a5369a82191c49413617`](https://github.com/NSRingo/WeatherKit/tree/1a2f64883d866a6974a9a5369a82191c49413617),
reviewed on `2026-07-28`.

| Artifact and purpose | Immutable raw URL | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Upstream license | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/LICENSE` | 11,357 bytes | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| Package metadata and credits | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/package.json` | 2,904 bytes | `5bf7548975e1a211b94dcc955143eac43c2c1f0de74bd1a91e44ab7fd0677035` |
| Published module arguments | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/arguments-builder-full.config.ts` | 13,535 bytes | `1e7dc7debfa6e119247d8e92846a9c7a2ad4f2d90a37a2d91a11490456e1dc4d` |
| Cloud rewrite module, ported by cloud endpoint mode | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/modules/iRingo.WeatherKit.Rewrite.plugin` | 1,551 bytes | `9841b8934024b6f60cea5e31afbf1aa5f421f92008f292fb3c1998942b9472b9` |

GitHub release assets are publisher-replaceable rather than immutable; GitHub
reports `immutable: false` for this release. `npm run verify:upstreams`
therefore downloads the bundle on every run and enforces the size and digest
recorded above. A changed asset fails the gate rather than being adopted
silently.

The upstream package metadata credits VirgilClyne, WordlessEcho, and
001ProMax. Those are retained creator attributions, not additional copyright
or license assertions.

## Implemented behavior

The extension owns only `weatherkit.apple.com` and declares four actions -- two
per mode, over the same two paths -- plus one host-scoped transport rule:

1. `weather-availability` runs the bundle against status-200 responses under
   `/api/v1/availability/` with a text body.
2. `weather-data` runs the bundle against status-200 GET responses under
   `/api/v2/weather/` with a binary body.
3. `weather-availability-cloud` and `weather-data-cloud` rewrite the same two
   requests, before they are sent, to
   `https://weatherkit.pages.dev/api/v1/availability/` and
   `https://weatherkit.pages.dev/api/v2/weather/`. The rest of the URL, and the
   whole request, carry through unchanged. They declare no script, so no code
   runs on the gateway for them.
4. Four routing rules. Three are upstream's exact-name rejects for
   `weather-analytics-events.apple.com`, `tthr.apple.com`, and
   `tether.edge.apple`; revisions before 3.2.0 simply omitted them. The fourth
   rejects UDP destination port 443 for `weatherkit.apple.com`, encouraging
   fallback to interceptable TCP.

   That fourth rule remains a narrower approximation of upstream's
   `AND,((OR,((IP-ASN,714),(IP-ASN,6185))),(PROTOCOL,QUIC))`. Routing rules can
   now select on `ipASN`, so the ASN half is expressible, but adopting it is
   declined on purpose: it would reject traffic to every address in two Apple
   autonomous systems, far outside the one host this extension captures, and
   mihomo has no `PROTOCOL,QUIC` matcher to narrow it back down with. Widening
   one extension's reach that far is not a change to make silently.

### Choosing a mode

`Script.Enabled` gates the two bundle actions and `Worker.Enabled` gates the two
rewrites. Each mode needs its own gate because `enabledWhen` can only switch an
action on; there is no negative form, and a `select` cannot gate an action at
all. **Enable exactly one.** The other three combinations are defined but are
not the reviewed configuration:

| `Script.Enabled` | `Worker.Enabled` | Result |
| --- | --- | --- |
| on | off | The default. The bundle runs here; nothing but provider lookups leaves the gateway. |
| off | on | Both paths go to `weatherkit.pages.dev`. No local code runs and no setting below applies. |
| on | on | The request is rewritten first, so the response arrives from `weatherkit.pages.dev`. The response actions match `weatherkit.apple.com`, which a rewritten exchange is no longer on, so cloud mode wins -- but confirm this on your own build before relying on it. |
| off | off | Only the four routing rules remain in effect. |

Both modes select exactly the same paths and methods, so a gate changes how an
exchange is handled and never which exchanges are touched.

The endpoint is pinned in the manifest. Upstream offers three
(`weatherkit.pages.dev`, `dev.weatherkit.pages.dev`, `weather.nanocat.cloud`)
and this port carries the first, which upstream describes as directly reachable
and needing no proxy; the third is upstream's Worker deployment and is
documented as requiring one. A `rewrite` target is a static string, so selecting
another endpoint is a reviewed manifest change rather than a setting.

Both script actions use `entry: proxy-compat`. The runtime presents itself as Loon,
supplies `$request`, `$response`, `$argument`, `$done`, `$persistentStore`,
`$httpClient`, `$notification`, `$utils`, `$environment`, and `$script`, and
completes the action when the bundle calls `$done`. Settings reach the bundle as the decoded object Loon supplies. The bundle's own
parser expands dotted keys, so `Weather.Provider` arrives flat and is read as
`Settings.Weather.Provider`.

The `Storage` setting is not a preference. The bundle switches on
`$argument.Storage` to decide where to read settings from, and its default
branch reads persistent storage and discards `$argument` entirely. Revisions
before 3.1.0 set no `Storage` key, so **every other setting on this page was
silently ignored** -- the bundle ran on its own defaults and the console gave no
indication. It is declared as a select with one option, because the other
branches would discard them again.

The upstream request-phase dataset filter is not wired, matching the published
upstream module, which also declares only the two response scripts. Upstream's
own cloud entry point (`src/Hono.js`) has its request stage commented out too.

## Settings

The keys below `Worker.Enabled` are upstream's own argument names, so their
meaning is exactly what the upstream documentation describes. The two gates are
this manifest's own and select which upstream module runs.

| Key | Type and default | Effect |
| --- | --- | --- |
| `Script.Enabled` | boolean, `true` | Runs the pinned bundle against matched responses on this gateway. |
| `Worker.Enabled` | boolean, `false` | Sends both matched paths to `weatherkit.pages.dev` instead. Every setting below stops applying. |
| `Weather.Provider` | select, `WeatherKit` | Replaces weather data with the selected provider. `WeatherKit` leaves Apple's data alone. |
| `NextHour.Provider` | select, `WeatherKit` | Fills next-hour precipitation from the selected provider. |
| `AirQuality.Calculate.Algorithm` | select, `None` | Calculates the air-quality index locally from reported pollutants. |
| `API.ColorfulClouds.Token` | text, empty | ColorfulClouds API token. |
| `API.QWeather.Host` | text, empty | QWeather API host. |
| `API.QWeather.Token` | text, empty | QWeather API token. |
| `API.WAQI.Token` | text, empty | WAQI API token; selects the premium API when set. |
| `LogLevel` | select, `WARN` | Bundle log verbosity. |

Only the two gates and `Storage` apply outside gateway script mode. Everything
else is read by the bundle, and the bundle does not run in cloud endpoint mode.
Upstream's hosted service reads its own defaults: in a Worker runtime the
bundle's settings loader has no `$argument` and its persistent store is
per-request memory, so nothing an operator types here reaches it. Upstream's own
rewrite module declares exactly one argument, the endpoint, for the same reason.

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

## Permissions and data boundary

- `weatherkit.apple.com` is the sole capture and action host.
- `permissions.network.any` is declared. The bundle's reachable hosts depend on
  `API.QWeather.Host` and on which providers an operator selects, so they
  cannot be enumerated in a manifest.
- **A selected provider receives the request's exact coordinates.** Upstream
  builds provider URLs such as
  `https://api.caiyunapp.com/v2.6/{token}/{longitude},{latitude}`, so both the
  API token and the precise location appear in the request path. Treat every
  enabled provider as having that data.
- `persistentStorage` is true. The bundle caches provider lookups under the
  extension-scoped store.
- Granting the network capability exposes the synchronous request capability to
  every script in this extension and lets it send any request, response,
  setting, or storage data visible to it to any permitted host. The enable
  confirmation states this.
- **An enabled cloud endpoint mode discloses the whole captured request to
  `weatherkit.pages.dev`.** A rewritten request carries its method, decoded
  body, and end-to-end headers, so Apple's `Authorization` header and the exact
  coordinates in `/api/v2/weather/{locale}/{latitude}/{longitude}` both reach
  that host. It answers with whatever it chooses, and the client sees that as
  Apple's response. Upstream's service reuses those headers to fetch from Apple
  on the operator's behalf.
- The endpoint is not declared as an exact `permissions.network.origins` entry,
  because gateway script mode needs `network.any` and the two forms are
  alternatives. `any` is the broader grant and covers the rewrite; the exact
  target is instead bound by the manifest, this README, and the validator.
- Request URL canonicalization, IP-literal and private-host refusal, per-action
  call and concurrency budgets, body limits, and authenticated mihomo SOCKS5
  egress all still apply.

## Deliberate exclusions and limitations

- Cloud endpoint mode carries one of upstream's three endpoints. The development
  endpoint (`dev.weatherkit.pages.dev`) and the Worker deployment
  (`weather.nanocat.cloud`, which upstream documents as requiring a proxy) are
  not used. Adopting either is a reviewed manifest change.
- The service behind `weatherkit.pages.dev` is not a distributed artifact of
  this repository, and its deployment is not pinned by anything here. The digest
  above pins upstream's rewrite module — the URLs this port transcribes — and
  says nothing about what the live host runs today. Treat cloud endpoint mode as
  trusting that operator, not as running reviewed code.
- Cloud endpoint mode reads none of the bundle settings, and no channel exists
  to pass them: upstream's service takes its configuration from its own
  defaults. Enabling it silently discards every provider, token, and algorithm
  choice on the settings page.
- BoxJS and cross-extension location caches are not exposed. The upstream
  `Storage` key is declared, but pinned to its `$argument` branch and nothing
  else, so settings come from the manifest rather than from a BoxJS-backed
  configuration source. See the settings note above for why it has to be
  declared at all.
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
- No server-side entitlement is created. Apple can still refuse or omit a
  requested dataset.
- The bundle is a remote asset. Its behavior can change with a new release, and
  its internals are not reviewed line by line here — the digest gate proves
  only that the reviewed bytes are the ones that run.
- Certificate pinning, independently provisioned ECH, unsupported protocols,
  and direct traffic that bypasses the gateway remain outside this extension's
  control.

## Verification

```powershell
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
```

`verify:upstreams` downloads the release bundle and the upstream rewrite module
and enforces their recorded sizes and SHA-256 digests. Runtime-facing changes
must also pass the current 5gpn core parser/marketplace integration gate.
Finally, exercise authorized device traffic with the candidate enabled and
confirm, from the plugin engine log stream:

1. with the default gates, which provider requests are emitted; and
2. with `Script.Enabled` off and `Worker.Enabled` on, that both paths leave for
   `weatherkit.pages.dev`, that the rewrite is accepted under `network.any`
   rather than refused for want of a declared origin, and that the client still
   renders the response.

## Updating

1. Manually select a new upstream release and record its asset URL, byte
   length, SHA-256, tag object, and commit before changing behavior.
2. Re-read the upstream release notes for new settings, new endpoints, and
   changed provider hosts. Argument keys are upstream's, so a renamed argument
   silently stops applying rather than failing. Re-read
   `modules/iRingo.WeatherKit.Rewrite.plugin` for changed rewrite targets in the
   same pass; a moved endpoint would leave this port sending captured requests
   to a host upstream has abandoned.
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
| Current manifest | `version=4.0.0`; `persistentStorage=true`; `settings=11`; `captureHosts=1`; `actions=4`; `routingRules=4`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateful. `persistentStorage` is true and the bundle caches provider lookups in the extension-scoped store. |
| Settings | Preserve the eight upstream argument keys, the `Storage` pin, and the two mode gates with their types. A normal same-ID update retains only values that remain valid under the candidate; a candidate that drops a gate must state which mode an existing install lands in. |
| Script contract | The two response actions use `entry: proxy-compat`; the two request actions are declarative rewrites and run no code. Changing an action back to the native contract requires a new reviewed script, not a manifest edit. |
| Third-party endpoint | `https://weatherkit.pages.dev` is part of the reviewed snapshot. Changing it, adding a second endpoint, or moving it behind a setting is a capability change and needs a disabled replacement. |
| Permission review gate | The network capability and persistent storage are part of the reviewed baseline. Removing either is a capability reduction and still needs a disabled replacement. |
| Reviewed capability baseline | One capture host, two proxy-compat response actions gated on `Script.Enabled`, two request rewrites to one third-party endpoint gated on `Worker.Enabled`, eleven settings, four reject routing rules, the network capability, persistent storage, and no required egress. |
| Operator state | A normal update retains valid settings, `capture_dns`, and execution order. Review all while disabled, and re-confirm which mode gate is on. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed URL. The extension-owned store is a cache, so discarding it costs only a refetch. |

### Repeatable migration

1. Complete every shared playbook row with the pinned bundle, the pinned rewrite
   module, all four actions, eleven settings, the network capability, persistent
   storage, routing, and exact capability diffs.
2. Verify the recorded bundle and rewrite-module digests before review, and
   again after applying.
3. Exercise both bundle actions against authorized device traffic with the
   declared providers left at their defaults, then with one provider enabled,
   and confirm from the plugin engine log which external requests were made.
   Expect the air-quality lookup the exclusions describe in both runs.
4. Exercise cloud endpoint mode separately, with `Script.Enabled` off, and
   confirm from the same log that both paths leave for `weatherkit.pages.dev`
   and that no provider request is made.
5. Apply the same-ID candidate while disabled. Confirm settings, both mode
   gates, the one-host boundary, action order, the network capability, and the
   routing rule before authorized device testing.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the
reviewed bundle pin, the endpoint, settings, mode gates, action matchers,
permissions, and routing rule. It must use a version higher than the failing
candidate and pass all current gates. Apply it while disabled and confirm the
retained settings and execution order before enabling.

An emergency reinstall from an older manifest loses settings, `capture_dns`,
execution position, and installed source identity. An operator who does not
control the installed URL cannot publish an immediate rollback; disable the
extension or use a separately reviewed operator-controlled fork.
