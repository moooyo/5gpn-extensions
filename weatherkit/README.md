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
`https://github.com/NSRingo/WeatherKit/releases/download/v3.2.0-beta2/response.bundle.js`.
The tag resolves through annotated tag object
`ccad336e3c042dd90157eb79e759a920b466eace` to commit
[`1a2f64883d866a6974a9a5369a82191c49413617`](https://github.com/NSRingo/WeatherKit/tree/1a2f64883d866a6974a9a5369a82191c49413617),
reviewed on `2026-07-28`.

| Artifact and purpose | Immutable raw URL |
| --- | --- |
| Upstream license | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/LICENSE` |
| Package metadata and credits | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/package.json` |
| Published module arguments | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/arguments-builder-full.config.ts` |
| Cloud rewrite module, ported by cloud endpoint mode | `https://raw.githubusercontent.com/NSRingo/WeatherKit/1a2f64883d866a6974a9a5369a82191c49413617/modules/iRingo.WeatherKit.Rewrite.plugin` |

GitHub release assets are publisher-replaceable rather than immutable; GitHub
reports `immutable: false` for this release. Nothing in this repository re-checks
those bytes, so upstream replacing that asset changes what runs here without a
review. The marketplace index records the digest it computed at publish time,
which is what a gateway compares at install; a replaced asset makes that install
fail rather than silently adopting new bytes, and republishing the index adopts
them deliberately.

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
   requests, before they are sent, to `/api/v1/availability/` and
   `/api/v2/weather/` on the host the `Endpoint` setting names. The rest of the
   URL, and the whole request, carry through unchanged. They declare no script,
   so no code runs on the gateway for them.
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

`Mode` selects which of upstream's two published modules runs. `Script` compiles
the two bundle actions and nothing else; `Cloud` compiles the two rewrites and
nothing else. One select rather than two switches is deliberate: two booleans
have a fourth state where both are on, and a manifest then has to describe what
that means. Here it is unrepresentable.

| `Mode` | Result |
| --- | --- |
| `Script` | The default. The bundle runs on this gateway; nothing but provider lookups leaves it. |
| `Cloud` | Both paths go to the selected endpoint. No local code runs, and no setting below `Endpoint` applies. |

Both modes select exactly the same paths and methods, so `Mode` changes how an
exchange is handled and never which exchanges are touched.

`Endpoint` is upstream's own argument, carried the same way: its Loon module
interpolates `{endpoint}` into the rewrite line, and the manifest interpolates
`{{settings.Endpoint}}` into the rewrite target. All three of upstream's
endpoints are offered. `weatherkit.pages.dev` is the default because upstream
describes it as directly reachable; `weather.nanocat.cloud` is upstream's Worker
deployment and it documents that one as requiring a proxy, so an operator
selecting it should bind an egress group or route it themselves. The setting
does nothing in `Script` mode.

Both script actions use `entry: proxy-compat`. The runtime presents itself as Loon,
supplies `$request`, `$response`, `$argument`, `$done`, `$persistentStore`,
`$httpClient`, `$notification`, `$utils`, `$environment`, and `$script`, and
completes the action when the bundle calls `$done`. Settings reach the bundle as the decoded object Loon supplies. The bundle's own
parser expands dotted keys, so `Weather.Provider` arrives flat and is read as
`Settings.Weather.Provider`.

The `Storage` setting is not a preference either. The bundle switches on
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

The keys below `Endpoint` are upstream's own argument names, so their meaning is
exactly what the upstream documentation describes. `Mode` is this manifest's own
and selects which upstream module runs; `Endpoint` is upstream's own argument
from its rewrite module.

| Key | Type and default | Effect |
| --- | --- | --- |
| `Mode` | select, `Script` | `Script` runs the bundle on this gateway; `Cloud` sends both matched paths to the selected endpoint instead, and every setting below `Endpoint` stops applying. |
| `Endpoint` | select, `weatherkit.pages.dev` | The host `Cloud` mode sends captured requests to. Upstream's three: `weatherkit.pages.dev`, `dev.weatherkit.pages.dev`, `weather.nanocat.cloud`. |
| `Weather.Provider` | select, `WeatherKit` | Replaces weather data with the selected provider. `WeatherKit` leaves Apple's data alone. |
| `NextHour.Provider` | select, `WeatherKit` | Fills next-hour precipitation from the selected provider. |
| `AirQuality.Calculate.Algorithm` | select, `None` | Calculates the air-quality index locally from reported pollutants. |
| `API.ColorfulClouds.Token` | text, empty | ColorfulClouds API token. |
| `API.QWeather.Host` | text, empty | QWeather API host. |
| `API.QWeather.Token` | text, empty | QWeather API token. |
| `API.WAQI.Token` | text, empty | WAQI API token; selects the premium API when set. |
| `LogLevel` | select, `WARN` | Bundle log verbosity. |

Only `Mode`, `Endpoint`, and `Storage` apply outside gateway script mode. Everything
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
- `permissions.network` is declared. It is one grant with no origin list: the
  bundle's reachable hosts depend on `API.QWeather.Host` and on which providers
  an operator selects, and cloud mode's target depends on `Endpoint`, so nothing
  here could have been enumerated in a manifest anyway.
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
- **An enabled cloud endpoint mode discloses the whole captured request to the
  selected endpoint.** A rewritten request carries its method, decoded body, and
  end-to-end headers, so Apple's `Authorization` header and the exact coordinates
  in `/api/v2/weather/{locale}/{latitude}/{longitude}` both reach that host. It answers with whatever it chooses, and the client sees that as
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

- The services behind all three endpoints are not distributed artifacts of this
  repository, and their deployments are not pinned by anything here. What this
  port transcribes is upstream's rewrite module — the paths and the endpoint
  list — and that says nothing about what those hosts run today. Treat cloud
  endpoint mode as trusting their operator, not as running reviewed code.
- `weather.nanocat.cloud` is upstream's Worker deployment and upstream documents
  it as requiring a proxy. This extension requires no egress binding, so an
  operator selecting it has to route it themselves.
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
```

Runtime-facing changes must also pass the current 5gpn core parser/marketplace
integration gate.
Finally, exercise authorized device traffic with the candidate enabled and
confirm, from the plugin engine log stream:

1. with the default gates, which provider requests are emitted; and
2. with `Script.Enabled` off and `Worker.Enabled` on, that both paths leave for
   `weatherkit.pages.dev`, that the rewrite is accepted under `network.any`
   rather than refused for want of a declared origin, and that the client still
   renders the response.

## Updating

1. Manually select a new upstream release and record its asset URL, byte
   tag object, and commit before changing behavior.
2. Re-read the upstream release notes for new settings, new endpoints, and
   changed provider hosts. Argument keys are upstream's, so a renamed argument
   silently stops applying rather than failing. Re-read the cloud rewrite module
   for changed rewrite targets in the same pass; a moved endpoint would leave
   this port sending captured requests to a host upstream has abandoned. Read it
   at `modules/iRingo.WeatherKit.Rewrite.lpx`: upstream renamed the pinned
   `.plugin` file and now publishes four other client formats beside it, so the
   pinned path returns 404 on the default branch. Upstream also dropped that
   module's `endpoint` argument and hard-coded `https://weatherkit.pages.dev`,
   which is the target this manifest already transcribes, so a candidate that
   restores a choice of endpoint is a capability change rather than a refresh.
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
| Current manifest | `version=5.0.0`; `persistentStorage=true`; `settings=11`; `captureHosts=1`; `actions=4`; `routingRules=4`; `network=true`; `upstreamMappings=0`; `egressRequired=false`. |
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
