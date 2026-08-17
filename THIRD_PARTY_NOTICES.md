# Third-party notices

This repository contains independently maintained native extensions. Each
extension README records commit-pinned raw URLs where upstream publishes them,
fetch dates, mutable runtime dependencies, modifications, deliberate
exclusions, and verification steps. The Marketplace records only the manifest
digest; live script bytes enter the runtime's immutable review snapshot and are
not manually maintained provenance records.

## KeleeOne-derived CC BY-NC-SA ports

These directories use authorized Kelee-derived adapted material under
CC BY-NC-SA 4.0:

| Extension | Creator metadata retained from the source file |
| --- | --- |
| `testflight-region-unlock` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |
| `zhihu-cleaner` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |

The distribution snapshot for `testflight-region-unlock` is
`mihoyo-typ/KeleeOne@ab6c3182fb2b09bcc34456f496282ec0b8e9217b`.
The `Loon` branch HEAD was revalidated on `2026-08-05`.
Its root license is CC BY-NC-SA 4.0. The local legal text is
[`LICENSES/CC-BY-NC-SA-4.0.txt`](LICENSES/CC-BY-NC-SA-4.0.txt), and the exact
scope and attribution requirements are described in
[`KELEEONE-LICENSE.md`](KELEEONE-LICENSE.md).

`zhihu-cleaner` uses the immutable Git snapshot
`ifflagged/Romeo@8d0e2791f531d4a02e1bd00d0f64427984bc999a`, path
`Modules/Loon/Kelee/Official/Zhihu_remove_ads.lpx`. At review time that snapshot
matched the canonical distribution file; the commit-pinned raw URL is the
stable provenance reference.
The repository maintainer confirmed explicit authorization to adapt and
publicly redistribute this snapshot; the extension's `AUTHORIZATION.md` and
README record the authorization boundary and material changes. The mirror is
used only to make the selected source addressable by an immutable commit and is
not treated as the creator or licensing authority.

## Bilibili Cleaner

`bilibili-cleaner` does not vendor upstream source. It loads four scripts from
the GPL-3.0-only `kokoryh/Sparkle` project at runtime under the `5gpn.io/v1`
proxy-compat contract, and carries that project's own rewrite expressions as jq
actions. Every artifact is pinned at commit
`110029696d66a3f3aef8f6546de9d494513c2901` in the extension README, which is the
immutable revision a gateway fetches from.

Because the four generated JavaScript bundles are fetched by the gateway rather
than shipped here, this repository does not distribute those bundles. It does
distribute adapted source from two jq programs inside `extension.yaml`; the
local forms retain the upstream operations while adding type guards for missing
or non-object response data. Those adapted programs are their own preferred
source, retain Sparkle attribution, and remain GPL-3.0-only. `extension.yaml`
and `README.md` are also distributed under GPL-3.0-only so the extension's
license boundary is consistent.

The pinned response bundle can direct supported clients to six archives under
the mutable `kokoryh/chronos` `master` branch. Those names and the Chronos
license were reviewed at commit
`69a8996b1f1311b606021e3f194b0390280ab618` on `2026-08-16`; that commit remains
the Chronos default-branch HEAD, and the extension README records every
commit-pinned raw URL. The client still follows the mutable branch at runtime,
and this repository neither copies the archives nor claims that Chronos
contains their complete corresponding preferred source.

The KeleeOne snapshot was used to discover a mirrored plugin version, but its
CC BY-NC-SA root license does not override Sparkle's original GPL license.

Revisions through 2.1.0 shipped a native port with its complete corresponding
source under `bilibili-cleaner/source/`: a generated protobuf runtime, an
Apache-2.0 `protobuf-ts` snapshot, an MIT `fflate` archive, and BSD-3-Clause
code from Google (`goog-varint`) and Daniel Wirtz (`protobufjs-utf8`). None of
that is present any more, and no file in this repository is BSD-3-Clause.

## YouTube Cleaner

`youtube-cleaner` does not vendor upstream source. It loads the two Apache-2.0
`Maasea/sgmodule` YouTube transformers at runtime and executes them under the
`5gpn.io/v1` proxy-compat script contract. The reviewed artifacts are pinned at
commit `65075cdb388fc5e3094afd7e7314c67b243f3525`:
`Script/Youtube/youtube.request.js` and
`Script/Youtube/youtube.response.js`. No upstream
`NOTICE` file exists at that commit.

Because the bundles are fetched rather than copied, this repository distributes
none of their bytes and adds no derived work of them. The bundles embed an
Apache-2.0 `protobuf-ts` runtime and a CC0-1.0 TextEncoder/TextDecoder
polyfill; neither is present here. `youtube-cleaner/extension.yaml` and
`youtube-cleaner/README.md` are original and Apache-2.0, and retain Maasea
attribution.

Earlier revisions shipped a bounded native rewrite of these transformers under
this heading. That code has been removed; the pinned bundles are now the
implementation.

The external `init-stream.maasea.workers.dev` service is not distributed by this
repository and its implementation is not present in the pinned upstream tree.
The extension's `permissions.network: true` capability is not scoped to that
origin: it permits the reviewed bundles to reach any allowed public destination
and to rewrite a captured request across origins. The README discloses that
boundary before enable.

## WeatherKit release bundles

`weatherkit` does not vendor upstream source. Revision `10.0.0` loads the two
Apache-2.0 `NSRingo/WeatherKit` `v3.3.0` release assets,
`response.bundle.js` and `request.bundle.js`, at runtime and executes them under
the `5gpn.io/v1` proxy-compat script contract. The unsigned annotated tag object
`305032889bc471e13a81ee0fa53ed5b9aa3acca6` resolves to source commit
`d9e89db7783d23f8bcb1a967af85394ac24b30e3`. The upstream tree contains no
`NOTICE` file.

Because the bundles are fetched rather than copied, this repository distributes
none of their bytes and adds no derived work of them. `weatherkit/extension.yaml`
and `weatherkit/README.md` are original and Apache-2.0. The upstream package
metadata credits VirgilClyne, WordlessEcho, 001ProMax, and hhh2210; those are
retained creator attributions, not copyright assertions by this repository.
The reviewed lockfile pins Apache-2.0 `@nsnanocat/util` `2.7.4`; its published
npm metadata reports git head `720261e4e7c0e4c27d32d10238880e991b1e74ec`,
whose commit-pinned `getStorage.mjs` source is recorded in the extension README
because it defines the database-versus-argument merge used by the bundles.

Both runtime bundles are mutable release assets: GitHub reports
`immutable: false`, and upstream publishes no commit-pinned URLs for the
generated files. Runtime review includes the fetched bytes in the immutable
snapshot digest, and apply refetches them and fails if those bytes changed. That
review-to-apply fence does not prove that a later publisher replacement still
corresponds to the recorded tag object and source commit. The extension README
records the review date and the commit-pinned source files used for comparison.

The manifest exposes fourteen typed settings and nine actions. Script mode runs
five bundle actions over four pathnames, including local AQHI scale handling and
two distinct weather-alert identifier forms. Stable `v3.3.0` always sends a
matched page token and selected browser headers to `www.qweather.com`, regardless
of `WeatherAlerts.Provider`, parses the returned HTML, and answers locally
without forwarding Apple's `Authorization` or `Cookie` header. Coordinate
requests use ColorfulClouds for `ColorfulClouds`, the QWeather API for both
`QWeather` and `QWeatherWeb`, and a local `200 []` response for `WeatherKit`.
Provider requests can disclose exact coordinates and use built-in upstream
service tokens when no override is supplied; an explicitly saved empty string
suppresses that database default. The newly published
`AirQuality.Current.Pollutants.Provider` setting exposes the previous hidden
ColorfulClouds fallback and also offers QWeather; neither option is neutral. The
separate hidden previous-day comparison defaults can still make additional
QWeather or ColorfulClouds requests when Apple's comparison value is unknown. The
published `DataSets` setting remains present even though no official release
action currently reads it. The extension therefore declares the network
capability and persistent storage, and its README states these boundaries before
enable.

The same extension also ports upstream's cloud rewrite module,
`modules/iRingo.WeatherKit.Rewrite.lpx` at the same commit. Its four rewrite
rules cover availability, weather data, coordinate-form alerts, and page-token
alerts. Two of the three configured endpoints are offered; the third no longer
resolves and the extension README records the check. Those services are not
distributed by this repository and their deployments are pinned by nothing
here. Cloud mode is off by default; enabling it sends the complete captured
request, potentially including Apple's authorization header, decoded body, and
exact coordinates or page token, to the selected third party.

Known limitations include a `CA_AQHI` path with an upstream unit inconsistency,
provider failures that can become a successful `200` with an empty alert list,
and no cloud rewrite for `airQualityScale`. The README records the fuller
behavior, exclusions, and smoke-test expectations.

## Apple WLOC response transformer

`apple-wloc` does not vendor upstream source. It loads two scripts from
`Yu9191/wloc` at runtime under the `5gpn.io/v1` proxy-compat contract, pinned at
commit `782e9c5cadf215263d9d168314113e47baaa302c`: `dist/wloc.js` and
`dist/wloc-settings.js`. Their commit-pinned raw URLs are recorded in the
extension README. This revision was reviewed on `2026-08-16`.

The selected tree carries upstream's standard
[`AGPL-3.0`](https://github.com/Yu9191/wloc/blob/782e9c5cadf215263d9d168314113e47baaa302c/LICENSE)
text. Its
[`README`](https://github.com/Yu9191/wloc/blob/782e9c5cadf215263d9d168314113e47baaa302c/README.md#L285-L287)
separately states that, without authorization, the project code may not be used
in commercial products or published in application stores. This repository
records both statements without interpreting the licensing ambiguity. The
operator selected this candidate for non-commercial use.

The local manifest and documentation remain MIT. This repository distributes
none of the upstream script bytes and does not relicense them; the gateway
fetches them from the immutable commit URLs recorded in the extension README,
which is how their author publishes them for proxy clients to load.

Revisions through 1.1.1 shipped a bounded JavaScript port derived from the
MIT-licensed `FFF686868/proxypin-wloc-spoofer` project at commit
`edee9b955f673cc8c4a52eb0a9c687a2e25dde4a`. That code has been removed; its
attribution and license text are retained below for the revisions that carried
it.

MIT License

Copyright (c) 2026 WLOC ProxyPin Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
