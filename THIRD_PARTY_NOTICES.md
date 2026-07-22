# Third-party notices

This repository contains independently maintained native extensions. Each
extension README records immutable upstream files, SHA-256 digests, fetch
dates, modifications, deliberate exclusions, and verification steps.

## KeleeOne-derived CC BY-NC-SA ports

Only these directories use adapted material under the pinned KeleeOne
repository's CC BY-NC-SA 4.0 license:

| Extension | Creator metadata retained from the source file |
| --- | --- |
| `ad-platform-blocker` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |
| `httpdns-interceptor` | 可莉🅥 (`iKeLee`) and VirgilClyne |
| `testflight-region-unlock` | 可莉🅥 (`iKeLee`, linked to `luestr/ProxyResource`) |

The distribution snapshot is
`mihoyo-typ/KeleeOne@ab6c3182fb2b09bcc34456f496282ec0b8e9217b`.
The `Loon` branch HEAD was revalidated on `2026-07-22`. For
`Plugin/BlockAdvertisers.lpx`, the most recent file-changing commit is
`d218662ec4d85d6578fa30a2df8bbf167b5d9823`, whose artifact is byte-identical
to the distribution snapshot.
Its root license is CC BY-NC-SA 4.0. The local legal text is
[`LICENSES/CC-BY-NC-SA-4.0.txt`](LICENSES/CC-BY-NC-SA-4.0.txt), and the exact
scope and attribution requirements are described in
[`KELEEONE-LICENSE.md`](KELEEONE-LICENSE.md).

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

`youtube-cleaner` is derived from the Apache-2.0 `Maasea/sgmodule` YouTube
module, request script, and response script at commit
`65075cdb388fc5e3094afd7e7314c67b243f3525`. No upstream `NOTICE` file exists
at that commit. The local implementation is a bounded native rewrite and does
not embed the upstream generated runtimes. The external
`init-stream.maasea.workers.dev` service is not distributed by this repository
and its implementation is not present in the pinned upstream tree. The port
retains Maasea attribution and the Apache-2.0 license.

## Apple WLOC response transformer

The bounded JavaScript WLOC protobuf transformation in `apple-wloc/wloc.js`
is derived from the MIT-licensed `FFF686868/proxypin-wloc-spoofer` project at
commit `edee9b955f673cc8c4a52eb0a9c687a2e25dde4a`.

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
