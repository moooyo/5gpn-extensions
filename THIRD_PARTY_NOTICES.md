# Third-party notices

This repository contains independently maintained native extensions. Each
extension README records commit-pinned raw URLs where upstream publishes them,
fetch dates, mutable runtime dependencies, modifications, deliberate
exclusions, and verification steps. Resource digests in a generated marketplace
are derived installation-integrity fields; they are not manually maintained
provenance records.

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
`a26c3412a760fb8d7d4d1bcc124d126e19d630e5` in the extension README, which is the
immutable revision a gateway fetches from.

Because the four generated JavaScript bundles are fetched by the gateway rather
than shipped here, this repository does not distribute those bundles. It does
distribute two jq programs verbatim inside `extension.yaml`; those programs are
their own preferred source, retain Sparkle attribution, and remain
GPL-3.0-only. `extension.yaml` and `README.md` are also distributed under
GPL-3.0-only so the extension's license boundary is consistent.

The pinned response bundle can direct supported clients to six archives under
the mutable `kokoryh/chronos` `master` branch. Those names and the Chronos
license were reviewed at commit
`69a8996b1f1311b606021e3f194b0390280ab618` on `2026-08-05`; the extension
README records every commit-pinned raw URL. The client still follows the
mutable branch at runtime, and this repository neither copies the archives nor
claims that Chronos contains their complete corresponding preferred source.

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

`weatherkit` does not vendor upstream source. It loads two Apache-2.0
`NSRingo/WeatherKit` published release bundles at runtime and executes them under
the `5gpn.io/v1` proxy-compat script contract. The reviewed assets are
`v3.2.0/response.bundle.js` and `v3.2.0/request.bundle.js`, both built from
commit `c66350d91457f9a1b8a6c5e6aba46370fa6da254`. The upstream tree
contains no `NOTICE` file.

Because the bundles are fetched rather than copied, this repository distributes
none of their bytes and adds no derived work of them. `weatherkit/extension.yaml`
and `weatherkit/README.md` are original and Apache-2.0. The upstream package
metadata credits VirgilClyne, WordlessEcho, and 001ProMax; those are retained
creator attributions, not copyright assertions by this repository.

GitHub release assets are publisher-replaceable, and GitHub reports
`immutable: false` for this release. No manually maintained provenance field
re-checks those assets, and no statement in this file is a line-by-line review
of the bundles' contents; they carry whatever third-party runtimes upstream
chose to include. The marketplace generator derives resource digests when it
publishes an index so an already reviewed index does not silently accept
replacement bytes. Those generated digests do not make the release URL
immutable provenance. The catalog deliberately accepts these direct official
release assets because upstream does not publish the generated bundles in Git;
the extension README records the tag object, source commit, replaceability, and
review date.

An enabled provider receives the request's exact coordinates and the operator's
API token in the provider URL. Since `v3.2.0-beta5` the request bundle also
reaches QWeather with those coordinates under no provider gate, and answers the
client from what it returns rather than forwarding the request to Apple. Since
`v3.2.0` the response bundle does the same on `/api/v2/weather/` whenever the
captured alert collection names the National Early Warning Center, which no
setting gates either. The extension therefore declares the network capability
and persistent storage, and its README states this boundary before enable.

The same extension also ports upstream's cloud rewrite module,
`modules/iRingo.WeatherKit.Rewrite.lpx` at the same commit. Its three rewrite
targets are transcribed, and two of the three endpoints its argument config
offers; the third no longer resolves and the extension README records the check.
Those services
are not distributed by this repository and their deployments are pinned by
nothing here; the mode that uses them is off by default, and an operator who
turns it on sends the captured request, including Apple's authorization header
and the coordinates in its path, to the selected third party.

Upstream moved the `v3.2.0-beta5` tag three times on `2026-08-03` and replaced
both assets each time, so the assets an earlier revision reviewed are no longer
what that tag serves. The stable `v3.2.0` tag above superseded it the same day;
the extension README records all three beta commits and what each changed.

## Apple WLOC response transformer

`apple-wloc` does not vendor upstream source. It loads two scripts from
`Yu9191/wloc` at runtime under the `5gpn.io/v1` proxy-compat contract, pinned at
commit `eec07a8dc8de6dbaee8eac1fb376e4d03020154a`: `dist/wloc.js` and
`dist/wloc-settings.js`. Their commit-pinned raw URLs are recorded in the
extension README.

That repository publishes no `LICENSE` file, so no license grant is asserted
here. This repository distributes none of its bytes; the gateway fetches them
from the immutable commit URLs recorded in the extension README, which is how
their author publishes them for proxy clients to load.

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
