# Third-party notices

This repository contains independently maintained native extensions. Each
extension README records immutable upstream files, SHA-256 digests, fetch
dates, modifications, deliberate exclusions, and verification steps.

## KeleeOne-derived CC BY-NC-SA ports

These directories use authorized Kelee-derived adapted material under
CC BY-NC-SA 4.0:

| Extension | Creator metadata retained from the source file |
| --- | --- |
| `ad-platform-blocker` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |
| `httpdns-interceptor` | 可莉🅥 (`iKeLee`) and VirgilClyne |
| `testflight-region-unlock` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |
| `zhihu-cleaner` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |

The distribution snapshot for the first three directories is
`mihoyo-typ/KeleeOne@ab6c3182fb2b09bcc34456f496282ec0b8e9217b`.
The `Loon` branch HEAD was revalidated on `2026-07-22`. For
`Plugin/BlockAdvertisers.lpx`, the most recent file-changing commit is
`d218662ec4d85d6578fa30a2df8bbf167b5d9823`, whose artifact is byte-identical
to the distribution snapshot.
Its root license is CC BY-NC-SA 4.0. The local legal text is
[`LICENSES/CC-BY-NC-SA-4.0.txt`](LICENSES/CC-BY-NC-SA-4.0.txt), and the exact
scope and attribution requirements are described in
[`KELEEONE-LICENSE.md`](KELEEONE-LICENSE.md).

`zhihu-cleaner` uses the byte-identical immutable snapshot
`ifflagged/Romeo@8d0e2791f531d4a02e1bd00d0f64427984bc999a`, path
`Modules/Loon/Kelee/Official/Zhihu_remove_ads.lpx`. The selected source is
4,300 bytes with SHA-256
`8bd1ee2062bc6a04bbbfa742c352e072b82c5cc061d9440cdfeab3fd82523e3d`.
The repository maintainer confirmed explicit authorization to adapt and
publicly redistribute this snapshot; the extension's `AUTHORIZATION.md` and
README record the authorization boundary and material changes. The mirror is
used only as an immutable byte source and is not treated as the creator or
licensing authority.

## Bilibili Cleaner

`bilibili-cleaner` does not vendor upstream source. It loads four scripts from
the GPL-3.0-only `kokoryh/Sparkle` project at runtime under the `5gpn.io/v1`
proxy-compat contract, and carries that project's own rewrite expressions as jq
actions. Every artifact is pinned at commit
`12e89d6d93d72d39eb283ef81d2b58eb204cdb58` in the extension README, which is the
immutable revision a gateway fetches from.

Because the scripts are fetched by the gateway rather than shipped here, this
repository distributes none of their bytes and the corresponding-source
obligation does not attach to it. `extension.yaml` and `README.md` are original
works under GPL-3.0-only so the aggregate stays consistent with the module they
accompany, and they retain Sparkle attribution. The two inlined jq programs are verbatim upstream text
under the same license.

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
`Script/Youtube/youtube.request.js`, 44,024 bytes, SHA-256
`3ecca15e06e76a31720092c581180f648ef2c45e494644941ba985c878efbb26`, and
`Script/Youtube/youtube.response.js`, 132,973 bytes, SHA-256
`f98483d5f5017514f82502253c0db5ce2d4ffb7839887aa2cadc22666f5a7f12`. No upstream
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

## WeatherKit release bundle

`weatherkit` does not vendor upstream source. It loads the Apache-2.0
`NSRingo/WeatherKit` published release bundle at runtime and executes it under
the `5gpn.io/v1` proxy-compat script contract. The reviewed asset is
`v3.2.0-beta2/response.bundle.js`, 251,617 bytes, SHA-256
`4d368808a17c42eef18135f04d1bc9f01cbf7878d227006521ef0a6598941ff2`, built from
commit `1a2f64883d866a6974a9a5369a82191c49413617`. The upstream tree contains
no `NOTICE` file.

Because the bundle is fetched rather than copied, this repository distributes
none of its bytes and adds no derived work of it. `weatherkit/extension.yaml`
and `weatherkit/README.md` are original and Apache-2.0. The upstream package
metadata credits VirgilClyne, WordlessEcho, and 001ProMax; those are retained
creator attributions, not copyright assertions by this repository.

GitHub release assets are publisher-replaceable, and GitHub reports
`immutable: false` for this release. Nothing here re-checks those bytes, so
upstream replacing that asset changes what runs without a review. No statement
in this file is a line-by-line review of the bundle's contents either, and the
bundle carries whatever third-party runtimes upstream chose to include.

An enabled provider receives the request's exact coordinates and the operator's
API token in the provider URL. The extension therefore declares the network
capability and persistent storage, and its README states this boundary before
enable.

The same extension also ports upstream's cloud rewrite module,
`modules/iRingo.WeatherKit.Rewrite.plugin` at the same commit. Its two rewrite
targets and all three of the endpoints it offers are transcribed. Those services
are not distributed by this repository and their deployments are pinned by
nothing here; the mode that uses them is off by default, and an operator who
turns it on sends the captured request, including Apple's authorization header
and the coordinates in its path, to the selected third party.

## Apple WLOC response transformer

`apple-wloc` does not vendor upstream source. It loads two scripts from
`Yu9191/wloc` at runtime under the `5gpn.io/v1` proxy-compat contract, pinned at
commit `eec07a8dc8de6dbaee8eac1fb376e4d03020154a`: `dist/wloc.js`, 40,414 bytes,
SHA-256 `d385c624efd59bdd2cff56bf819a770b40c4abf0f970818877f1dca4174f256a`, and
`dist/wloc-settings.js`, 12,892 bytes, SHA-256
`b4e9d69e69c703b3fab485a559825aaedc9e3a1fd9c06e81cb35d10bbdcd13d2`.

That repository publishes no `LICENSE` file, so no license grant is asserted
here. This repository distributes none of its bytes; the gateway fetches them
from the immutable URLs above, which is how their author publishes them for
proxy clients to load.

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
