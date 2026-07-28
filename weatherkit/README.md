# WeatherKit Enhancer

License: [`Apache-2.0`](../LICENSES/Apache-2.0.txt)

This extension runs the published `NSRingo/WeatherKit` release bundle against
Apple WeatherKit responses through the `5gpn.io/v1` proxy-compat script
contract. It is not compiled into either 5gpn daemon, is not installed or
enabled automatically, and is intended only for authorized device and network
testing.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml
```

Keep the extension disabled until its snapshot, settings, capture host,
actions, network permission, and routing rule have been reviewed.

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

GitHub release assets are publisher-replaceable rather than immutable; GitHub
reports `immutable: false` for this release. `npm run verify:upstreams`
therefore downloads the bundle on every run and enforces the size and digest
recorded above. A changed asset fails the gate rather than being adopted
silently.

The upstream package metadata credits VirgilClyne, WordlessEcho, and
001ProMax. Those are retained creator attributions, not additional copyright
or license assertions.

## Implemented behavior

The extension owns only `weatherkit.apple.com` and declares two response
actions plus one host-scoped transport rule:

1. `weather-availability` runs the bundle against status-200 responses under
   `/api/v1/availability/` with a text body.
2. `weather-data` runs the bundle against status-200 GET responses under
   `/api/v2/weather/` with a binary body.
3. The routing rule rejects UDP destination port 443 only for
   `weatherkit.apple.com`, encouraging fallback to interceptable TCP. It is a
   narrower approximation of the upstream ASN-plus-QUIC rule.

Both actions use `entry: proxy-compat`. The runtime presents itself as Surge,
supplies `$request`, `$response`, `$argument`, `$done`, `$persistentStore`,
`$httpClient`, `$environment`, and `$script`, and completes the action when the
bundle calls `$done`. Settings reach the bundle as the decoded object Loon supplies. The bundle's own
parser expands dotted keys, so `Weather.Provider` arrives flat and is read as
`Settings.Weather.Provider`.

The first setting, `Storage`, is not a preference. The bundle switches on
`$argument.Storage` to decide where to read settings from, and its default
branch reads persistent storage and discards `$argument` entirely. Revisions
before 3.1.0 set no `Storage` key, so **every other setting on this page was
silently ignored** -- the bundle ran on its own defaults and the console gave no
indication. It is declared as a select with one option, because the other
branches would discard them again.

The upstream request-phase dataset filter is not wired, matching the published
upstream module, which also declares only the two response scripts.

## Settings

The keys are upstream's own argument names, so their meaning is exactly what
the upstream documentation describes.

| Key | Type and default | Effect |
| --- | --- | --- |
| `Weather.Provider` | select, `WeatherKit` | Replaces weather data with the selected provider. `WeatherKit` leaves Apple's data alone. |
| `NextHour.Provider` | select, `WeatherKit` | Fills next-hour precipitation from the selected provider. |
| `AirQuality.Calculate.Algorithm` | select, `None` | Calculates the air-quality index locally from reported pollutants. |
| `API.ColorfulClouds.Token` | text, empty | ColorfulClouds API token. |
| `API.QWeather.Host` | text, empty | QWeather API host. |
| `API.QWeather.Token` | text, empty | QWeather API token. |
| `API.WAQI.Token` | text, empty | WAQI API token; selects the premium API when set. |
| `LogLevel` | select, `WARN` | Bundle log verbosity. |

Every provider default is the non-replacing value, so a freshly enabled
extension makes no third-party request until an operator selects a source and
supplies its token.

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
- Request URL canonicalization, IP-literal and private-host refusal, per-action
  call and concurrency budgets, body limits, and authenticated mihomo SOCKS5
  egress all still apply.

## Deliberate exclusions and limitations

- The cloud rewrite endpoints upstream added in `v3.2.0-beta2`
  (`weatherkit.pages.dev`, `dev.weatherkit.pages.dev`, `weather.nanocat.cloud`)
  are not used. Responses are processed on the gateway, not by a third-party
  server.
- BoxJS, cross-extension location caches, and the upstream `Storage` setting
  that selects a BoxJS-backed configuration source are not exposed; settings
  come from the manifest.
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

`verify:upstreams` downloads the release bundle and enforces its recorded size
and SHA-256. Runtime-facing changes must also pass the current 5gpn core
parser/marketplace integration gate. Finally, exercise authorized device
traffic with the candidate enabled and confirm which provider requests are
emitted, using the plugin engine log stream.

## Updating

1. Manually select a new upstream release and record its asset URL, byte
   length, SHA-256, tag object, and commit before changing behavior.
2. Re-read the upstream release notes for new settings, new endpoints, and
   changed provider hosts. Argument keys are upstream's, so a renamed argument
   silently stops applying rather than failing.
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
| Current manifest | `version=3.1.0`; `persistentStorage=true`; `settings=9`; `captureHosts=1`; `actions=2`; `routingRules=1`; `networkOrigins=0`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateful. `persistentStorage` is true and the bundle caches provider lookups in the extension-scoped store. |
| Settings | Preserve the eight upstream argument keys and types when possible. A normal same-ID update retains only values that remain valid under the candidate. |
| Script contract | Both actions use `entry: proxy-compat`. Changing an action back to the native contract requires a new reviewed script, not a manifest edit. |
| Permission review gate | The network capability and persistent storage are part of the reviewed baseline. Removing either is a capability reduction and still needs a disabled replacement. |
| Reviewed capability baseline | One capture host, two proxy-compat response actions, eight settings, one UDP/443 reject rule, the network capability, persistent storage, and no required egress. |
| Operator state | A normal update retains valid settings, `capture_dns`, and execution order. Review all while disabled. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed URL. The extension-owned store is a cache, so discarding it costs only a refetch. |

### Repeatable migration

1. Complete every shared playbook row with the pinned bundle, both actions,
   eight settings, the network capability, persistent storage, routing, and
   exact capability diffs.
2. Verify the recorded bundle digest before review, and again after applying.
3. Exercise both actions against authorized device traffic with every provider
   left at its non-replacing default, then with one provider enabled, and
   confirm from the plugin engine log which external requests were made.
4. Apply the same-ID candidate while disabled. Confirm settings, the one-host
   boundary, action order, the network capability, and the routing rule before
   authorized device testing.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the
reviewed bundle pin, settings, action matchers, permissions, and routing rule.
It must use a version higher than the failing candidate and pass all current
gates. Apply it while disabled and confirm the retained settings and execution
order before enabling.

An emergency reinstall from an older manifest loses settings, `capture_dns`,
execution position, and installed source identity. An operator who does not
control the installed URL cannot publish an immediate rollback; disable the
extension or use a separately reviewed operator-controlled fork.
