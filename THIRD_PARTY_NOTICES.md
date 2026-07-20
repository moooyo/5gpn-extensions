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

Sparkle's generated Protobuf output incorporates Apache-2.0 `protobuf-ts`
2.11.1 material. That generated output was audited but is not distributed by
this extension because the complete preferred source and build inputs are not
vendored. The Apache-2.0 text remains present for the independently licensed
YouTube extension.

## Reddit Cleaner

`reddit-cleaner` ports the GPL-3.0-only JQ program from
`mist-whisper/JQLang@00944babf9ef1b5e55e87b48df71bd1fc2c855d6`.
The KeleeOne LPX metadata credits `xream`; that creator credit is retained in
the extension README, but KeleeOne's repository-level CC license is not used
to relicense the GPL JQ implementation.

The GPL-3.0-only legal text used by both GPL extensions is retained in
[`LICENSES/GPL-3.0-only.txt`](LICENSES/GPL-3.0-only.txt).

## YouTube Cleaner

`youtube-cleaner` is derived from the Apache-2.0 `Maasea/sgmodule` YouTube
module and response script at commit
`26871a1f7b984fa1df39a05b5037898035987239`. No upstream `NOTICE` file exists
at that commit. The local implementation is a bounded native rewrite and does
not embed the upstream generated runtime, but it retains Maasea attribution
and the Apache-2.0 license.

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

## Spotify Cleaner

`spotify-cleaner` is derived from the MIT-licensed Spotify transformer in
`sve1r/Rules-For-Quantumult-X` at commit
`692aec6a28c0d7c1d44d69febb581632a8175e9f`. The extension deliberately omits
features found only in an unlicensed `001ProMax/Surge` source snapshot.

MIT License

Copyright (c) 2020 SVE1R

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
