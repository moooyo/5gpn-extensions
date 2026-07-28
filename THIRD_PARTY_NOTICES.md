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

`bilibili-cleaner` is derived from the GPL-3.0-only `kokoryh/Sparkle`
plugin, JSON, and JQ implementation. The KeleeOne snapshot was used to
discover a mirrored plugin version, but its CC BY-NC-SA root license does not
override Sparkle's original GPL license. The extension README pins the exact
Sparkle commits and identifies every mapped artifact and modification.

The native adapter, schema inputs, generated TypeScript, pinned Sparkle source
closure, and deterministic build inputs are distributed under GPL-3.0-only.
The final `protobuf.js` aggregate is mapped as
`GPL-3.0-only AND BSD-3-Clause` because it retains the Google component below.
The complete corresponding source is included under
`bilibili-cleaner/source/`; the exact file-level mapping is recorded in
`REUSE.toml`.

The rebuild also distributes these independently licensed components:

| Component | Distributed scope | License |
| --- | --- | --- |
| `fflate` 0.8.3 | Preferred TypeScript source, npm archive, license, and the code retained in the final bundle | MIT, Copyright (c) 2026 Arjun Barrett |
| `protobuf-ts` 2.11.1 | Preferred runtime TypeScript source, license, npm archive, and the Apache-licensed runtime code retained in the final bundle | Apache-2.0, except for the BSD files below |
| `protobufjs-utf8.ts` | Exact preferred source retained inside the `protobuf-ts` source snapshot and npm runtime archive | BSD-3-Clause, Copyright (c) 2016 Daniel Wirtz |
| `goog-varint.ts` | Exact preferred source, standalone notice, npm runtime archive, and code retained in the final bundle | BSD-3-Clause, Copyright 2008 Google Inc. |

The retained `protobuf-ts` runtime archive therefore has the package's
declared `Apache-2.0 AND BSD-3-Clause` license expression. The deterministic
`bundle-inputs.json` projection shows that esbuild tree-shakes
`protobufjs-utf8.ts` from the final `protobuf.js` bundle but retains
`goog-varint.js`. The raw bundle embeds Google's complete 2008 BSD notice in
its deterministic banner because it is independently installed and
distributed. Both standalone BSD notices remain in `source/licenses/`,
including the exact Google text at
[`bilibili-cleaner/source/licenses/goog-varint-BSD-3-Clause.txt`](bilibili-cleaner/source/licenses/goog-varint-BSD-3-Clause.txt).

The complete component terms are retained in
`bilibili-cleaner/source/licenses/` and the shared legal texts are available
as [`LICENSES/MIT.txt`](LICENSES/MIT.txt),
[`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt), and
[`LICENSES/BSD-3-Clause.txt`](LICENSES/BSD-3-Clause.txt). The GPL-3.0-only
text governing the combined Bilibili work is retained in
[`LICENSES/GPL-3.0-only.txt`](LICENSES/GPL-3.0-only.txt).

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
`immutable: false` for this release, so `npm run verify:upstreams` downloads
the asset on every run and enforces the recorded size and digest. That gate
proves the reviewed bytes are the ones that run; it is not a line-by-line
review of the bundle's contents, and the bundle carries whatever third-party
runtimes upstream chose to include.

An enabled provider receives the request's exact coordinates and the operator's
API token in the provider URL. The extension therefore declares the network
capability and persistent storage, and its README states this boundary before
enable. The cloud rewrite endpoints upstream ships remain unused: responses are
processed on the gateway.

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
